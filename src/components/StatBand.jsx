import { Delta } from './Primitives.jsx'
import { Sparkline } from './Charts.jsx'
import { IconArrowRight } from './Icons.jsx'
import './StatBand.css'

/* The summary strip from the reference: one surface, cells separated by
   hairlines rather than gaps, so the figures read as one statement. */
export function StatBand({ stats }) {
  return (
    <div className="statband">
      {stats.map((s) => (
        <div className="statband-cell" key={s.label}>
          <div className="statband-label">{s.label}</div>
          <div className="statband-value">{s.value}</div>
          <div className="statband-foot">
            {s.delta !== undefined ? (
              <>
                <Delta pct={s.deltaPct} value={s.delta} compactValue={s.deltaLabel} invert={s.invert} />
                {s.deltaNote && <span className="statband-note">{s.deltaNote}</span>}
              </>
            ) : s.note ? (
              <span className="statband-note">{s.note}</span>
            ) : null}
            {s.href && (
              <a className="statband-link" href={s.href}>View details <IconArrowRight size={13} /></a>
            )}
          </div>
          {s.series && (
            <div className="statband-spark">
              <Sparkline data={s.series} tone={s.sparkTone} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* Compact single figure used inside cards and detail panels. */
export function Stat({ label, value, sub, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ' u-' + tone : ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
