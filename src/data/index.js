import { buildBook, AS_OF } from './generate.js'
import { BANKERS, CURRENT_USER } from './catalog.js'

/* Built once per session. Every screen reads from this single book, which is
   why the figures on the overview equal the sum of the client list. */
export const BOOK = buildBook()
export const { clients, alerts, approvals } = BOOK
export { AS_OF, BANKERS, CURRENT_USER }

const byId = new Map(clients.map((c) => [c.id, c]))
export const getClient = (id) => byId.get(id)
export const clientName = (id) => byId.get(id)?.name ?? 'Unknown'
export const bankerById = (id) => BANKERS.find((b) => b.id === id) ?? BANKERS[0]

const DAY = 86400000
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)

export const activeClients = clients.filter((c) => c.status === 'active')
export const onboardingClients = clients.filter((c) => c.status === 'onboarding')

/* ---------- portfolio rollups ---------- */

export const portfolio = (() => {
  const deposits = sum(activeClients, (c) => c.deposits)
  const credit = sum(activeClients, (c) => c.creditOutstanding)
  const limit = sum(activeClients, (c) => c.creditLimit)
  const revenue = sum(activeClients, (c) => c.revenueTTM)

  const deposits90 = sum(activeClients, (c) => c.deposits - c.depositsChange90d)
  const deposits7 = sum(activeClients, (c) => c.deposits - c.depositsChange7d)

  return {
    deposits,
    depositsChange90d: deposits - deposits90,
    depositsPct90d: deposits90 ? (deposits - deposits90) / deposits90 : 0,
    depositsChange7d: deposits - deposits7,
    depositsPct7d: deposits7 ? (deposits - deposits7) / deposits7 : 0,
    credit,
    creditLimit: limit,
    utilisation: limit ? credit / limit : 0,
    revenueTTM: revenue,
    revenueMTD: revenue / 12,
    clientCount: activeClients.length,
    health: Math.round(sum(activeClients, (c) => c.health) / activeClients.length),
    avgGrade: sum(activeClients, (c) => c.riskGrade) / activeClients.length,
    atRisk: activeClients.filter((c) => c.riskGrade >= 5).length,
  }
})()

/* Portfolio deposit curve: every client's daily balance, summed. */
export const portfolioBalances = (() => {
  const len = activeClients[0].balances.length
  const out = new Array(len)
  for (let i = 0; i < len; i++) {
    let v = 0
    for (const c of activeClients) v += c.balances[i].v
    out[i] = { t: activeClients[0].balances[i].t, v }
  }
  return out
})()

export const portfolioFlow = (() => {
  const map = new Map()
  for (const c of activeClients) {
    for (const m of c.flow) {
      if (!map.has(m.month)) map.set(m.month, { month: m.month, inflow: 0, outflow: 0 })
      const row = map.get(m.month)
      row.inflow += m.inflow
      row.outflow += m.outflow
    }
  }
  return [...map.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({ ...r, net: r.inflow - r.outflow }))
})()

/* ---------- transactions ---------- */

export const allTransactions = (() => {
  const out = []
  for (const c of clients) for (const t of c.transactions) out.push(t)
  return out.sort((a, b) => b.date - a.date)
})()

export const recentTransactions = allTransactions.filter((t) => t.date > AS_OF - 120 * DAY)

export function transactionById(id) {
  return allTransactions.find((t) => t.id === id)
}

/* ---------- concentration & rankings ---------- */

export function depositsBy(key) {
  const map = new Map()
  for (const c of activeClients) {
    const k = c[key]
    map.set(k, (map.get(k) || 0) + c.deposits)
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export const topMovers = (() => {
  const scored = activeClients.map((c) => ({
    client: c,
    delta: c.depositsChange7d,
    pct: c.deposits - c.depositsChange7d ? c.depositsChange7d / (c.deposits - c.depositsChange7d) : 0,
  }))
  return {
    up: scored.filter((s) => s.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5),
    down: scored.filter((s) => s.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5),
  }
})()

export const topCounterparties = (() => {
  const map = new Map()
  const cutoff = AS_OF - 30 * DAY
  const prevStart = AS_OF - 60 * DAY
  for (const t of allTransactions) {
    if (t.direction !== 'out' || t.status === 'returned') continue
    if (t.date < prevStart) continue
    if (!map.has(t.counterparty)) map.set(t.counterparty, { name: t.counterparty, category: t.category, current: 0, prior: 0 })
    const row = map.get(t.counterparty)
    if (t.date >= cutoff) row.current += t.amount
    else row.prior += t.amount
  }
  return [...map.values()]
    .map((r) => ({ ...r, change: r.prior ? (r.current - r.prior) / r.prior : 0 }))
    .sort((a, b) => b.current - a.current)
})()

export const upcomingMaturities = (() => {
  const out = []
  for (const c of activeClients) {
    for (const f of c.facilities) {
      if (f.maturity > AS_OF && f.maturity < AS_OF + 550 * DAY) out.push({ client: c, facility: f })
    }
  }
  return out.sort((a, b) => a.facility.maturity - b.facility.maturity)
})()

export const allFacilities = activeClients.flatMap((c) => c.facilities.map((f) => ({ ...f, client: c })))

export const covenantTests = allFacilities.flatMap((f) =>
  f.covenants.map((cv) => ({ ...cv, facility: f, client: f.client })))

/* ---------- alerts ---------- */

export const openAlerts = alerts.filter((a) => a.status === 'open')

/* Severity first, then round-robin across categories — otherwise the top of the
   queue fills with five copies of whichever check fired most, and an RM reading
   the first screen never sees the other kinds of problem waiting underneath. */
export const triagedAlerts = (() => {
  const rank = { critical: 0, high: 1, medium: 2, low: 3 }
  const out = []
  for (const sev of ['critical', 'high', 'medium', 'low']) {
    const bucket = openAlerts.filter((a) => a.severity === sev)
    const byCategory = new Map()
    for (const a of bucket) {
      if (!byCategory.has(a.category)) byCategory.set(a.category, [])
      byCategory.get(a.category).push(a)
    }
    const queues = [...byCategory.values()]
    let drained = false
    while (!drained) {
      drained = true
      for (const queue of queues) {
        const next = queue.shift()
        if (next) { out.push(next); drained = false }
      }
    }
  }
  return out
})()

export const alertCounts = openAlerts.reduce((acc, a) => {
  acc[a.severity] = (acc[a.severity] || 0) + 1
  acc.total++
  return acc
}, { total: 0 })

export function alertsForClient(id) {
  return openAlerts.filter((a) => a.clientId === id)
}

/* ---------- client-level derived views ---------- */

export function clientSeries(client, days) {
  return client.balances.slice(Math.max(0, client.balances.length - days))
}

export function categoryBreakdown(client, days = 90) {
  const cutoff = AS_OF - days * DAY
  const map = new Map()
  for (const t of client.transactions) {
    if (t.direction !== 'out' || t.status === 'returned' || t.date < cutoff || t.date > AS_OF) continue
    map.set(t.category, (map.get(t.category) || 0) + t.amount)
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export const SEVERITY_TONE = { critical: 'neg', high: 'neg', medium: 'warn', low: 'info' }
export const APPROVAL_LIMIT = 250000
