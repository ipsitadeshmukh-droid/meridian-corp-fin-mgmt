const nf = (opts) => new Intl.NumberFormat('en-US', opts)

const usd0 = nf({ style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usd2 = nf({ style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num0 = nf({ maximumFractionDigits: 0 })

export function money(v, { cents = false, sign = false } = {}) {
  if (v == null || Number.isNaN(v)) return '—'
  const s = cents ? usd2.format(Math.abs(v)) : usd0.format(Math.abs(v))
  if (sign) return `${v < 0 ? '−' : '+'} ${s}`
  return v < 0 ? `−${s}` : s
}

/* Compact form for axes, tiles and anywhere a full figure would crowd out
   the label it sits next to. */
export function compact(v, { currency = true } = {}) {
  if (v == null || Number.isNaN(v)) return '—'
  const a = Math.abs(v)
  const p = currency ? '$' : ''
  const sign = v < 0 ? '−' : ''
  if (a >= 1e9) return `${sign}${p}${(a / 1e9).toFixed(a >= 1e10 ? 1 : 2)}B`
  if (a >= 1e6) return `${sign}${p}${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`
  if (a >= 1e3) return `${sign}${p}${(a / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`
  return `${sign}${p}${num0.format(Math.round(a))}`
}

export function pct(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

export function signedPct(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(digits)}%`
}

export function count(v) { return num0.format(v) }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function shortDate(t) {
  const d = new Date(t)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function mediumDate(t) {
  const d = new Date(t)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

export function relativeDays(t, now = Date.now()) {
  const days = Math.round((now - t) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days === -1) return 'Tomorrow'
  if (days < 0) return `In ${Math.abs(days)} days`
  if (days < 31) return `${days} days ago`
  if (days < 365) return `${Math.round(days / 30)} mo ago`
  return `${(days / 365).toFixed(1)} yr ago`
}

export function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
