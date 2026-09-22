import { IconArrowUp, IconArrowDown } from './Icons.jsx'
import { signedPct, money, initials as toInitials } from '../data/format.js'
import './Primitives.css'

/* --- status / severity pill --- */
export function Chip({ tone = 'neutral', children, dot = false, size = 'md' }) {
  return (
    <span className={`chip chip-${tone} chip-${size}`}>
      {dot && <span className="chip-dot" />}
      {children}
    </span>
  )
}

/* --- plain coloured status text, as used in the reference tables --- */
export function StatusText({ tone = 'neutral', children }) {
  return <span className={`status-text status-${tone}`}>{children}</span>
}

/* --- directional delta, colour + arrow --- */
export function Delta({ value, pct, compactValue, invert = false, showArrow = true }) {
  if (value == null && pct == null) return <span className="u-subtle">—</span>
  const basis = value ?? pct
  const good = invert ? basis < 0 : basis > 0
  const flat = basis === 0
  const tone = flat ? 'flat' : good ? 'pos' : 'neg'
  const Arrow = basis >= 0 ? IconArrowUp : IconArrowDown
  return (
    <span className={`delta delta-${tone}`}>
      {showArrow && !flat && <Arrow size={13} />}
      {pct != null ? signedPct(pct) : compactValue ?? money(value, { sign: true })}
    </span>
  )
}

/* --- avatar; tone index keeps a person the same colour everywhere --- */
export function Avatar({ name, tone = 1, size = 'md' }) {
  return <span className={`avatar avatar-${size} tone-${tone}`}>{toInitials(name)}</span>
}

/* --- horizontal utilisation / progress bar --- */
export function Meter({ value, tone, label, width }) {
  const pct = Math.max(0, Math.min(1, value))
  const auto = pct >= 0.9 ? 'neg' : pct >= 0.75 ? 'warn' : 'accent'
  return (
    <div className="meter" style={width ? { width } : undefined}>
      <div className="meter-track">
        <div className={`meter-fill meter-${tone || auto}`} style={{ width: `${pct * 100}%` }} />
      </div>
      {label !== false && <span className="meter-label">{(pct * 100).toFixed(0)}%</span>}
    </div>
  )
}

/* --- risk grade badge, 1–7 --- */
export function RiskBadge({ grade, label, compact = false }) {
  const tone = grade <= 3 ? 'pos' : grade <= 4 ? 'neutral' : grade <= 6 ? 'warn' : 'neg'
  return (
    <span className={`risk risk-${tone}`} title={label}>
      <span className="risk-grade">{grade}</span>
      {!compact && <span className="risk-label">{label?.split(' — ')[1] ?? label}</span>}
    </span>
  )
}

/* --- group header band above a table section --- */
export function GroupBand({ title, count, total, right }) {
  return (
    <div className="group-band">
      <div className="group-band-left">
        <strong>{title}</strong>
        {count != null && <span className="group-band-meta">{count}</span>}
        {total != null && (
          <>
            <span className="group-band-sep">•</span>
            <span className="group-band-meta">Total amount {money(total, { cents: true })}</span>
          </>
        )}
      </div>
      {right}
    </div>
  )
}

/* --- empty / not-yet-built state --- */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty">
      {Icon && <div className="empty-icon"><Icon size={22} /></div>}
      <h3>{title}</h3>
      {body && <p className="empty-body">{body}</p>}
      {action}
    </div>
  )
}

/* --- key/value pair used across detail panels --- */
export function Field({ label, children, wide = false }) {
  return (
    <div className={`field${wide ? ' field-wide' : ''}`}>
      <div className="field-label">{label}</div>
      <div className="field-value">{children}</div>
    </div>
  )
}

/* Small segmented control for range / mode switches above a chart. */
export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className={`seg seg-${size}`} role="group">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        return (
          <button
            key={val}
            className={`seg-btn${value === val ? ' is-active' : ''}`}
            aria-pressed={value === val}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tab${active === t.id ? ' is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
