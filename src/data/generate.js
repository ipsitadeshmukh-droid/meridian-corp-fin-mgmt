import { makeRng, hashSeed } from './random.js'
import {
  BANKERS, COMPANY_NAMES, SEGMENTS, COUNTERPARTIES,
  RISK_GRADES, FACILITY_TYPES, COVENANT_DEFS, NOTE_TEMPLATES,
} from './catalog.js'

const DAY = 86400000
const HISTORY_DAYS = 400

export const AS_OF = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

const dayKey = (t) => new Date(t).toISOString().slice(0, 10)
const monthKey = (t) => new Date(t).toISOString().slice(0, 7)
const round2 = (n) => Math.round(n * 100) / 100

/* ------------------------------------------------------------------ *
 * Transaction stream
 *
 * Built first, then the balance curve is integrated from it. Nothing is
 * generated twice, so the ledger, the chart and the totals always agree.
 * ------------------------------------------------------------------ */
function buildTransactions(client, rng) {
  const txns = []
  const start = AS_OF - HISTORY_DAYS * DAY
  const scale = client.scale

  const push = (t, direction, amount, counterparty, category, method, opts = {}) => {
    const daysAgo = Math.round((AS_OF - t) / DAY)
    const status =
      daysAgo < 0 ? 'scheduled'
        : daysAgo <= 2 && rng.chance(0.55) ? 'pending'
        : rng.chance(0.012) ? 'returned'
        : 'processed'
    txns.push({
      id: `tx-${client.id}-${txns.length.toString().padStart(4, '0')}`,
      clientId: client.id,
      date: t,
      direction,
      amount: round2(amount),
      counterparty,
      category,
      method,
      status,
      account: opts.account || 'Operating',
      memo: opts.memo || '',
      hasReceipt: opts.hasReceipt ?? rng.chance(0.62),
      reference: `MC${(hashSeed(client.id + txns.length) % 900000000 + 100000000)}`,
      recurring: !!opts.recurring,
    })
  }

  // --- recurring obligations: the spine of a corporate account ---
  const payroll = scale * rng.float(0.052, 0.078)
  const rent = scale * rng.float(0.012, 0.022)
  const utilities = scale * rng.float(0.002, 0.005)
  const insurance = scale * rng.float(0.003, 0.007)
  const cloud = scale * rng.float(0.004, 0.014)

  for (let d = 0; d <= HISTORY_DAYS + 6; d++) {
    const t = start + d * DAY
    const date = new Date(t)
    const dow = date.getDay()
    const dom = date.getDate()

    if (d % 14 === 3) {
      push(t, 'out', payroll * rng.float(0.97, 1.06), 'Cascade Payroll Services', 'Payroll', 'ACH', { recurring: true, hasReceipt: true })
    }
    if (dom === 1) {
      push(t, 'out', rent, 'Harborview Properties', 'Rent & facilities', 'ACH', { recurring: true, hasReceipt: true })
      push(t, 'out', cloud * rng.float(0.9, 1.2), 'Foundry Cloud Compute', 'Technology', 'Card', { recurring: true })
    }
    if (dom === 12) push(t, 'out', utilities * rng.float(0.8, 1.3), 'Riverbend Utilities', 'Utilities', 'ACH', { recurring: true })
    if (dom === 20) push(t, 'out', insurance, 'Sterling Insurance Group', 'Insurance', 'ACH', { recurring: true })
    if (dom === 15 && [0, 3, 6, 9].includes(date.getMonth() % 12 % 12) && date.getMonth() % 3 === 0) {
      push(t, 'out', scale * rng.float(0.03, 0.06), 'Department of Revenue', 'Tax', 'Domestic wire', { hasReceipt: true, memo: 'Quarterly estimated tax' })
    }

    // --- operating traffic, weekdays only ---
    if (dow !== 0 && dow !== 6) {
      const receipts = rng.weighted([[0, 42], [1, 38], [2, 15], [3, 5]])
      for (let i = 0; i < receipts; i++) {
        const [cp, cat] = rng.pick(COUNTERPARTIES.inflow)
        if (cat === 'Investment') continue
        push(t, 'in', scale * rng.float(0.006, 0.058), cp, cat,
          rng.weighted([['ACH', 50], ['Domestic wire', 28], ['Check', 12], ['International wire', 10]]))
      }
      const payments = rng.weighted([[0, 46], [1, 36], [2, 14], [3, 4]])
      for (let i = 0; i < payments; i++) {
        const [cp, cat] = rng.pick(COUNTERPARTIES.outflow)
        push(t, 'out', scale * rng.float(0.002, 0.03), cp, cat,
          rng.weighted([['ACH', 44], ['Card', 22], ['Domestic wire', 18], ['Check', 9], ['International wire', 7]]))
      }
    }
  }

  // --- one-off events: the things an RM actually notices ---
  const eventCount = rng.int(2, 4)
  for (let i = 0; i < eventCount; i++) {
    const t = start + rng.int(20, HISTORY_DAYS - 5) * DAY
    if (rng.chance(0.45)) {
      push(t, 'in', scale * rng.float(0.35, 1.4), rng.pick(['Highgate Ventures', 'Silverline Partners', 'Crestline Group']),
        'Investment', 'International wire', { hasReceipt: true, memo: 'Equity financing proceeds' })
    } else {
      push(t, 'out', scale * rng.float(0.12, 0.4), rng.pick(['Quarry Equipment Leasing', 'Apex Component Supply', 'Basalt Industrial']),
        'Capital expenditure', 'Domestic wire', { hasReceipt: true, memo: 'Capital equipment purchase' })
    }
  }

  txns.sort((a, b) => a.date - b.date)
  return txns
}

/* Integrate the transaction stream into a daily balance curve. */
function buildBalanceSeries(txns, openingBalance) {
  const byDay = new Map()
  for (const tx of txns) {
    if (tx.status === 'returned' || tx.date > AS_OF) continue
    const k = dayKey(tx.date)
    byDay.set(k, (byDay.get(k) || 0) + (tx.direction === 'in' ? tx.amount : -tx.amount))
  }
  const series = []
  let bal = openingBalance
  for (let d = 0; d <= HISTORY_DAYS; d++) {
    const t = AS_OF - (HISTORY_DAYS - d) * DAY
    bal += byDay.get(dayKey(t)) || 0
    series.push({ t, v: round2(bal) })
  }
  return series
}

function buildMonthlyFlow(txns) {
  const map = new Map()
  for (const tx of txns) {
    if (tx.status === 'returned' || tx.date > AS_OF) continue
    const k = monthKey(tx.date)
    if (!map.has(k)) map.set(k, { month: k, inflow: 0, outflow: 0 })
    const row = map.get(k)
    if (tx.direction === 'in') row.inflow += tx.amount
    else row.outflow += tx.amount
  }
  return [...map.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({ ...r, inflow: round2(r.inflow), outflow: round2(r.outflow), net: round2(r.inflow - r.outflow) }))
}

/* ------------------------------------------------------------------ *
 * Credit facilities — covenants are tested against the real numbers
 * produced above, so a breach on the dashboard is genuinely derivable.
 * ------------------------------------------------------------------ */
function buildFacilities(client, rng, liquidity) {
  const count = client.segment === 'Enterprise' ? rng.int(2, 3) : client.segment === 'Mid-market' ? rng.int(1, 2) : rng.int(0, 1)
  const types = rng.shuffle(FACILITY_TYPES).slice(0, count)
  const base = 4.85 // policy base rate

  return types.map((ft, i) => {
    const limit = Math.round((client.scale * rng.float(0.35, 1.6)) / 50000) * 50000
    const utilisation = rng.weighted([[rng.float(0, 0.25), 25], [rng.float(0.25, 0.6), 40], [rng.float(0.6, 0.85), 25], [rng.float(0.85, 1.0), 10]])
    const drawn = Math.round(limit * utilisation / 1000) * 1000
    const maturityMonths = rng.int(-2, 46)
    const maturity = AS_OF + maturityMonths * 30 * DAY

    const covenants = rng.shuffle(COVENANT_DEFS).slice(0, ft.type === 'Revolving credit' ? 3 : 2).map((def) => {
      let actual, threshold
      if (def.key === 'liquidity') {
        threshold = Math.round(client.scale * rng.float(0.25, 0.7) / 10000) * 10000
        actual = liquidity
      } else if (def.key === 'tangible') {
        threshold = Math.round(client.scale * rng.float(0.45, 1.15) / 10000) * 10000
        actual = Math.round(client.scale * rng.float(0.85, 2.4) / 10000) * 10000
      } else if (def.key === 'dscr') {
        threshold = 1.25
        actual = round2(rng.float(1.16, 2.9))
      } else {
        threshold = 3.5
        actual = round2(rng.float(1.0, 3.8))
      }
      const headroom = def.direction === 'min' ? actual / threshold - 1 : threshold / actual - 1
      const status = headroom < 0 ? 'breach' : headroom < 0.1 ? 'watch' : 'pass'
      return { ...def, threshold, actual, headroom: round2(headroom), status, testedAt: AS_OF - rng.int(3, 40) * DAY }
    })

    return {
      id: `fac-${client.id}-${i}`,
      clientId: client.id,
      type: ft.type,
      limit,
      drawn,
      available: limit - drawn,
      utilisation: round2(drawn / limit),
      rate: round2(base + ft.spread + rng.float(-0.4, 0.5)),
      maturity,
      originated: AS_OF - rng.int(200, 1600) * DAY,
      secured: ft.type !== 'Revolving credit' || rng.chance(0.5),
      covenants,
    }
  })
}

/* ------------------------------------------------------------------ *
 * Client assembly
 * ------------------------------------------------------------------ */
function buildClient(name, industry, index) {
  const id = `c-${(index + 1).toString().padStart(3, '0')}`
  const rng = makeRng(hashSeed(id + name))

  const segment = rng.weighted([[SEGMENTS[0], 34], [SEGMENTS[1], 44], [SEGMENTS[2], 22]])
  const scale =
    segment === 'Enterprise' ? rng.float(14_000_000, 48_000_000)
      : segment === 'Mid-market' ? rng.float(3_500_000, 13_000_000)
      : rng.float(700_000, 3_400_000)

  const client = { id, name, industry, segment, scale }

  const txns = buildTransactions(client, rng)
  let balances = buildBalanceSeries(txns, scale * rng.float(0.5, 1.6))
  const trough = Math.min(...balances.map((p) => p.v))
  const floor = scale * rng.float(0.30, 0.70)
  if (trough < floor) {
    const shift = floor - trough
    balances = balances.map((p) => ({ t: p.t, v: round2(p.v + shift) }))
  }
  const flow = buildMonthlyFlow(txns)

  const operating = balances[balances.length - 1].v
  const accounts = [
    { id: `${id}-op`, name: 'Operating', type: 'Checking', currency: 'USD', balance: round2(operating), rate: 0.25, number: `••${rng.int(1000, 9999)}` },
  ]
  if (rng.chance(0.82)) {
    accounts.push({ id: `${id}-mm`, name: 'Money market reserve', type: 'Savings', currency: 'USD', balance: round2(scale * rng.float(0.15, 1.1)), rate: round2(rng.float(3.8, 4.6)), number: `••${rng.int(1000, 9999)}` })
  }
  if (rng.chance(0.3)) {
    const ccy = rng.pick(['EUR', 'GBP', 'CAD', 'SGD'])
    accounts.push({ id: `${id}-fx`, name: `${ccy} collections`, type: 'Foreign currency', currency: ccy, balance: round2(scale * rng.float(0.03, 0.25)), rate: 0, number: `••${rng.int(1000, 9999)}` })
  }
  if (rng.chance(0.14)) {
    accounts.push({ id: `${id}-esc`, name: 'Escrow', type: 'Escrow', currency: 'USD', balance: round2(scale * rng.float(0.05, 0.3)), rate: 1.2, number: `••${rng.int(1000, 9999)}` })
  }

  const deposits = round2(accounts.reduce((s, a) => s + a.balance, 0))
  const facilities = buildFacilities(client, rng, deposits)
  const creditOutstanding = round2(facilities.reduce((s, f) => s + f.drawn, 0))
  const creditLimit = round2(facilities.reduce((s, f) => s + f.limit, 0))

  // Revenue to the bank: deposit spread + loan spread + fee income.
  const depositNIM = deposits * 0.021
  const loanSpread = facilities.reduce((s, f) => s + f.drawn * (f.rate - 4.85) / 100, 0)
  const feeIncome = scale * rng.float(0.002, 0.009)
  const revenueTTM = round2(depositNIM + loanSpread + feeIncome)

  // Burn / runway off the trailing half-year of real flows. A three-month
  // window swung too hard on a single large receipt to grade a relationship on.
  const trailing = flow.slice(-7, -1)
  const avgNet = trailing.length ? trailing.reduce((s, m) => s + m.net, 0) / trailing.length : 0
  const runwayMonths = avgNet < 0 ? Math.max(0, deposits / Math.abs(avgNet)) : null

  const breaches = facilities.flatMap((f) => f.covenants).filter((c) => c.status === 'breach').length
  const watches = facilities.flatMap((f) => f.covenants).filter((c) => c.status === 'watch').length
  const utilisation = creditLimit ? creditOutstanding / creditLimit : 0

  // Grade is earned, not rolled: covenant state, leverage and runway drive it.
  let grade = 3
  grade += breaches * 2 + watches
  if (utilisation > 0.85) grade += 1
  if (runwayMonths !== null && runwayMonths < 9) grade += 1
  if (deposits > scale * 1.2) grade -= 1
  grade = Math.max(1, Math.min(7, Math.round(grade + rng.float(-0.4, 0.4))))

  const health = Math.max(4, Math.min(99, Math.round(
    100 - (grade - 1) * 9 - breaches * 12 - Math.max(0, utilisation - 0.7) * 60 + (runwayMonths === null ? 6 : Math.min(8, runwayMonths / 3))
  )))

  const ninetyAgo = balances[balances.length - 91]?.v ?? balances[0].v
  const weekAgo = balances[balances.length - 8]?.v ?? balances[0].v

  const notes = rng.shuffle(NOTE_TEMPLATES).slice(0, rng.int(2, 4)).map((body, i) => ({
    id: `note-${id}-${i}`,
    body,
    author: rng.pick(BANKERS).name,
    at: AS_OF - rng.int(4, 260) * DAY,
  })).sort((a, b) => b.at - a.at)

  return {
    ...client,
    legalName: `${name}${rng.chance(0.5) ? ', Inc.' : ' Holdings LLC'}`,
    relationshipSince: 2026 - rng.int(1, 16),
    banker: rng.pick(BANKERS).id,
    status: 'active',
    riskGrade: grade,
    riskLabel: RISK_GRADES[grade - 1].label,
    riskTone: RISK_GRADES[grade - 1].tone,
    health,
    employees: rng.int(12, 2400),
    hq: rng.pick(['Seattle, WA', 'Austin, TX', 'Chicago, IL', 'Boston, MA', 'Denver, CO', 'Atlanta, GA', 'Portland, OR', 'Raleigh, NC', 'Phoenix, AZ']),
    accounts,
    deposits,
    depositsChange90d: round2(deposits - ninetyAgo),
    depositsChange7d: round2(deposits - weekAgo),
    facilities,
    creditOutstanding,
    creditLimit,
    utilisation: round2(utilisation),
    revenueTTM,
    products: accounts.length + facilities.length + (rng.chance(0.5) ? 1 : 0),
    runwayMonths: runwayMonths === null ? null : round2(runwayMonths),
    avgMonthlyNet: round2(avgNet),
    kycRefreshDue: AS_OF + rng.int(-40, 420) * DAY,
    lastContact: AS_OF - rng.int(1, 120) * DAY,
    balances,
    flow,
    transactions: txns,
    notes,
  }
}

/* ------------------------------------------------------------------ *
 * Alerts — every one points at a fact in the ledger above.
 * ------------------------------------------------------------------ */
function buildAlerts(clients) {
  const alerts = []
  const add = (a) => alerts.push({ id: `al-${alerts.length.toString().padStart(3, '0')}`, status: 'open', ...a })

  for (const c of clients) {
    for (const f of c.facilities) {
      for (const cov of f.covenants) {
        if (cov.status === 'breach') {
          add({
            clientId: c.id, severity: cov.headroom < -0.15 ? 'critical' : 'high', category: 'Credit',
            title: `${cov.name} covenant breached`,
            detail: `${f.type} requires ${cov.direction === 'min' ? 'a minimum' : 'a maximum'} of ${cov.unit === '$' ? '$' + Math.round(cov.threshold).toLocaleString() : cov.threshold + cov.unit}; last test returned ${cov.unit === '$' ? '$' + Math.round(cov.actual).toLocaleString() : cov.actual + cov.unit}.`,
            at: cov.testedAt, link: `/clients/${c.id}?tab=credit`,
          })
        } else if (cov.status === 'watch') {
          add({
            clientId: c.id, severity: 'medium', category: 'Credit',
            title: `${cov.name} within 10% of trigger`,
            detail: `Headroom on the ${f.type} has narrowed to ${(cov.headroom * 100).toFixed(1)}%.`,
            at: cov.testedAt, link: `/clients/${c.id}?tab=credit`,
          })
        }
      }
      const daysToMaturity = Math.round((f.maturity - AS_OF) / DAY)
      if (daysToMaturity > 0 && daysToMaturity < 95) {
        add({
          clientId: c.id, severity: daysToMaturity < 45 ? 'high' : 'low', category: 'Credit',
          title: `${f.type} matures in ${daysToMaturity} days`,
          detail: `$${Math.round(f.drawn).toLocaleString()} outstanding against a $${Math.round(f.limit).toLocaleString()} limit. Renewal decision required.`,
          at: AS_OF - 2 * DAY, link: `/clients/${c.id}?tab=credit`,
        })
      }
      if (f.utilisation > 0.92) {
        add({
          clientId: c.id, severity: 'high', category: 'Credit',
          title: `${f.type} utilisation at ${(f.utilisation * 100).toFixed(0)}%`,
          detail: `Only $${Math.round(f.available).toLocaleString()} of headroom remains on the line.`,
          at: AS_OF - 1 * DAY, link: `/clients/${c.id}?tab=credit`,
        })
      }
    }

    const kycDays = Math.round((c.kycRefreshDue - AS_OF) / DAY)
    if (kycDays < 45) {
      add({
        clientId: c.id, severity: kycDays < 0 ? 'high' : 'medium', category: 'Compliance',
        title: kycDays < 0 ? `KYC refresh ${Math.abs(kycDays)} days overdue` : `KYC refresh due in ${kycDays} days`,
        detail: 'Beneficial ownership certification and refreshed financials outstanding.',
        at: AS_OF - 3 * DAY, link: `/clients/${c.id}?tab=risk`,
      })
    }

    // Outsized movement, measured against the client's own 90-day behaviour.
    const recent = c.transactions.filter((t) => t.date > AS_OF - 8 * DAY && t.status !== 'returned')
    const window = c.transactions.filter((t) => t.date > AS_OF - 95 * DAY && t.date <= AS_OF - 8 * DAY)
    const avg = window.length ? window.reduce((s, t) => s + t.amount, 0) / window.length : 0
    for (const t of recent) {
      if (avg > 0 && t.amount > avg * 9 && t.amount > 250000) {
        add({
          clientId: c.id, severity: 'high', category: 'Monitoring',
          title: `Unusual ${t.direction === 'out' ? 'outflow' : 'inflow'} — ${t.method.toLowerCase()}`,
          detail: `$${Math.round(t.amount).toLocaleString()} ${t.direction === 'out' ? 'to' : 'from'} ${t.counterparty}, roughly ${(t.amount / avg).toFixed(0)}× this client's 90-day average ticket.`,
          at: t.date, link: `/clients/${c.id}?tab=transactions`,
        })
      }
    }

    if (c.runwayMonths !== null && c.runwayMonths < 6) {
      add({
        clientId: c.id, severity: c.runwayMonths < 3 ? 'critical' : 'high', category: 'Monitoring',
        title: `Runway down to ${c.runwayMonths < 2 ? c.runwayMonths.toFixed(1) : Math.round(c.runwayMonths)} months`,
        detail: `Net burn is averaging $${Math.round(Math.abs(c.avgMonthlyNet)).toLocaleString()} per month against $${Math.round(c.deposits).toLocaleString()} on deposit.`,
        at: AS_OF - 1 * DAY, link: `/clients/${c.id}`,
      })
    }

    if (c.depositsChange90d < -c.deposits * 0.28) {
      add({
        clientId: c.id, severity: 'medium', category: 'Relationship',
        title: 'Deposits down sharply over 90 days',
        detail: `Balances have fallen $${Math.round(Math.abs(c.depositsChange90d)).toLocaleString()} since the start of the quarter. Possible wallet share loss.`,
        at: AS_OF - 4 * DAY, link: `/clients/${c.id}`,
      })
    }
  }

  const rank = { critical: 0, high: 1, medium: 2, low: 3 }
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || b.at - a.at)
}

/* ------------------------------------------------------------------ *
 * Approval queue — pending outbound wires over the delegated limit.
 * ------------------------------------------------------------------ */
const APPROVAL_LIMIT = 250000

function buildApprovals(clients) {
  const out = []
  for (const c of clients) {
    for (const t of c.transactions) {
      if (t.status !== 'pending' || t.direction !== 'out') continue
      if (t.amount < APPROVAL_LIMIT) continue
      const rng = makeRng(hashSeed(t.id))
      out.push({
        id: `ap-${t.id}`,
        txnId: t.id,
        clientId: c.id,
        amount: t.amount,
        counterparty: t.counterparty,
        method: t.method,
        submittedAt: t.date,
        dueBy: t.date + (rng.chance(0.5) ? 1 : 2) * DAY,
        firstApprover: rng.chance(0.6) ? rng.pick(BANKERS).name : null,
        requires: t.amount > 1000000 ? 2 : 1,
        state: 'awaiting',
      })
    }
  }
  return out.sort((a, b) => b.amount - a.amount)
}

/* ------------------------------------------------------------------ */
export function buildBook() {
  const clients = COMPANY_NAMES.map(([name, industry], i) => buildClient(name, industry, i))

  // A handful of prospects sitting in onboarding, plus a watchlist.
  const rng = makeRng(90210)
  for (const c of rng.shuffle(clients).slice(0, 3)) c.status = 'onboarding'
  for (const c of clients) c.watchlist = c.riskGrade >= 5 || c.facilities.some((f) => f.covenants.some((cv) => cv.status !== 'pass'))

  const alerts = buildAlerts(clients)
  const approvals = buildApprovals(clients)
  return { clients, alerts, approvals, asOf: AS_OF }
}
