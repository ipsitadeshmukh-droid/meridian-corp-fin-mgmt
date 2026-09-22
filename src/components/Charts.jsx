import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { compact, money, monthLabel, shortDate, pct as fmtPct } from '../data/format.js'
import './Charts.css'

/* ------------------------------------------------------------------ *
 * Charts are hand-built SVG so they inherit the theme tokens directly:
 * one palette definition, and dark mode needs no chart-side branching.
 * ------------------------------------------------------------------ */

function useSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) => (Math.abs(s.w - width) > 0.5 || Math.abs(s.h - height) > 0.5 ? { w: width, h: height } : s))
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}

/* Round a domain out to human tick values. */
function niceScale(min, max, ticks = 4) {
  if (min === max) { min -= 1; max += 1 }
  const span = max - min
  const raw = span / ticks
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const out = []
  for (let v = lo; v <= hi + step / 2; v += step) out.push(v)
  return { lo, hi, ticks: out }
}

const SERIES = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--viz-6)', 'var(--viz-7)', 'var(--viz-8)']
export const seriesColor = (i) => SERIES[i % SERIES.length]

/* ------------------------------------------------------------------ *
 * Sparkline — a trend cue, not a chart: no axes, no hover, no labels.
 * ------------------------------------------------------------------ */
export function Sparkline({ data, tone = 'auto', strokeWidth = 1.6 }) {
  const [ref, { w, h }] = useSize()
  const pts = data ?? []
  const path = useMemo(() => {
    if (!w || !h || pts.length < 2) return ''
    const vals = pts.map((p) => (typeof p === 'number' ? p : p.v))
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    const pad = 2
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w
      const y = h - pad - ((v - min) / span) * (h - pad * 2)
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [pts, w, h])

  const vals = pts.map((p) => (typeof p === 'number' ? p : p.v))
  const rising = vals.length > 1 && vals[vals.length - 1] >= vals[0]
  const stroke = tone === 'auto' ? (rising ? 'var(--pos)' : 'var(--neg)') : `var(--${tone})`

  return (
    <div className="spark" ref={ref}>
      {path && (
        <svg width={w} height={h} aria-hidden="true">
          <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * TrendChart — single measure over time, with an optional ghost series
 * for the prior period. Crosshair + tooltip ship by default.
 * ------------------------------------------------------------------ */
export function TrendChart({
  data,
  compare,
  height = 240,
  label = 'Value',
  compareLabel = 'Prior period',
  xFormat = (p) => shortDate(p.t),
  valueFormat = (v) => money(v),
  tickFormat = (v) => compact(v),
  tone = 'var(--viz-1)',
  area = true,
}) {
  const [ref, { w }] = useSize()
  const [hover, setHover] = useState(null)
  const pad = { t: 14, r: 16, b: 26, l: 58 }
  const h = height
  const iw = Math.max(0, w - pad.l - pad.r)
  const ih = h - pad.t - pad.b

  const all = useMemo(() => {
    const vals = data.map((p) => p.v)
    if (compare) for (const p of compare) vals.push(p.v)
    return vals
  }, [data, compare])

  const scale = useMemo(() => {
    const min = Math.min(...all)
    const max = Math.max(...all)
    const headroom = (max - min) * 0.12 || max * 0.1
    return niceScale(Math.max(0, min - headroom), max + headroom, 4)
  }, [all])

  const x = useCallback((i, n = data.length) => (n === 1 ? iw / 2 : (i / (n - 1)) * iw), [iw, data.length])
  const y = useCallback((v) => ih - ((v - scale.lo) / (scale.hi - scale.lo || 1)) * ih, [ih, scale])

  const line = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(i, arr.length).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const areaPath = (arr) => `${line(arr)} L${x(arr.length - 1, arr.length).toFixed(1)},${ih} L0,${ih} Z`

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left - pad.l
    if (px < -6 || px > iw + 6) return setHover(null)
    const i = Math.max(0, Math.min(data.length - 1, Math.round((px / iw) * (data.length - 1))))
    setHover(i)
  }

  const hi = hover != null ? data[hover] : null
  const hcx = hover != null ? pad.l + x(hover) : 0
  const tipRight = hcx > pad.l + iw * 0.62

  return (
    <div className="chart" style={{ height }} ref={ref}>
      {w > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${label} over time`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone} stopOpacity="0.16" />
              <stop offset="100%" stopColor={tone} stopOpacity="0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${pad.l},${pad.t})`}>
            {scale.ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth="1" />
                <text x={-10} y={y(t)} className="chart-tick" textAnchor="end" dominantBaseline="middle">
                  {tickFormat(t)}
                </text>
              </g>
            ))}

            {compare && (
              <path d={line(compare)} fill="none" stroke="var(--viz-ghost)" strokeWidth="1.6"
                strokeDasharray="4 4" strokeLinecap="round" />
            )}

            {area && <path d={areaPath(data)} fill="url(#trend-fill)" />}
            <path d={line(data)} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {hover != null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={ih} stroke="var(--border-strong)" strokeWidth="1" />
                <circle cx={x(hover)} cy={y(data[hover].v)} r="5" fill={tone} stroke="var(--surface)" strokeWidth="2" />
              </g>
            )}

            {[0, Math.floor(data.length / 2), data.length - 1].map((i, k) => (
              <text key={k} x={x(i)} y={ih + 17} className="chart-tick"
                textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}>
                {xFormat(data[i])}
              </text>
            ))}
          </g>
        </svg>
      )}

      {hi && (
        <div className={`chart-tip${tipRight ? ' is-right' : ''}`} style={{ left: hcx, top: pad.t + y(hi.v) - 14 }}>
          <div className="chart-tip-value">{valueFormat(hi.v)}</div>
          <div className="chart-tip-meta">{xFormat(hi)}</div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Donut — share of a whole, with the legend carrying label and value so
 * identity never rests on colour alone.
 * ------------------------------------------------------------------ */
export function Donut({ data, total, centerLabel, centerValue, height = 210, valueFormat = (v) => compact(v), maxSlices = 6 }) {
  const [hover, setHover] = useState(null)

  const slices = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value)
    if (sorted.length <= maxSlices) return sorted
    const head = sorted.slice(0, maxSlices - 1)
    const rest = sorted.slice(maxSlices - 1)
    return [...head, { label: 'Other', value: rest.reduce((s, r) => s + r.value, 0), other: rest.length }]
  }, [data, maxSlices])

  const sum = total ?? slices.reduce((s, d) => s + d.value, 0)
  const size = height
  const r = size / 2
  const thickness = 26
  const inner = r - thickness
  const GAP = 0.018 // ~2px of surface between segments

  let angle = -Math.PI / 2
  const arcs = slices.map((d, i) => {
    const frac = d.value / sum
    const sweep = frac * Math.PI * 2
    const a0 = angle + GAP / 2
    const a1 = angle + sweep - GAP / 2
    angle += sweep
    const large = sweep > Math.PI ? 1 : 0
    const p = (rad, a) => [r + rad * Math.cos(a), r + rad * Math.sin(a)]
    const [x0, y0] = p(r, a0)
    const [x1, y1] = p(r, a1)
    const [x2, y2] = p(inner, a1)
    const [x3, y3] = p(inner, a0)
    return {
      ...d, i, frac,
      d: a1 <= a0 ? '' : `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z`,
    }
  })

  return (
    <div className="donut">
      <div className="donut-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={centerLabel}>
          {arcs.map((a) => (
            <path
              key={a.label}
              d={a.d}
              fill={seriesColor(a.i)}
              opacity={hover == null || hover === a.i ? 1 : 0.32}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="donut-center">
          <div className="donut-center-value">
            {hover != null ? valueFormat(arcs[hover].value) : centerValue ?? valueFormat(sum)}
          </div>
          <div className="donut-center-label">
            {hover != null ? arcs[hover].label : centerLabel}
          </div>
        </div>
      </div>

      <ul className="donut-legend">
        {arcs.map((a) => (
          <li
            key={a.label}
            className={hover === a.i ? 'is-hover' : ''}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="legend-swatch" style={{ background: seriesColor(a.i) }} />
            <span className="legend-label">{a.label}{a.other ? ` (${a.other})` : ''}</span>
            <span className="legend-value">{valueFormat(a.value)}</span>
            <span className="legend-pct">{fmtPct(a.frac, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * GroupedBars — two comparable measures on one axis (never two scales).
 * ------------------------------------------------------------------ */
export function GroupedBars({ data, keys, height = 230, tickFormat = (v) => compact(v), valueFormat = (v) => money(v), xLabel = (d) => monthLabel(d.month) }) {
  const [ref, { w }] = useSize()
  const [hover, setHover] = useState(null)
  const pad = { t: 12, r: 8, b: 26, l: 58 }
  const iw = Math.max(0, w - pad.l - pad.r)
  const ih = height - pad.t - pad.b

  const max = Math.max(...data.flatMap((d) => keys.map((k) => d[k.key])))
  const scale = niceScale(0, max, 4)
  const y = (v) => ih - (v / (scale.hi || 1)) * ih

  const slot = iw / Math.max(1, data.length)
  const barW = Math.max(4, Math.min(16, (slot - 8) / keys.length))

  const barPath = (bx, by, bw, bh, r = 3) => {
    const rr = Math.min(r, bh, bw / 2)
    return `M${bx},${by + bh} L${bx},${by + rr} Q${bx},${by} ${bx + rr},${by} L${bx + bw - rr},${by} Q${bx + bw},${by} ${bx + bw},${by + rr} L${bx + bw},${by + bh} Z`
  }

  return (
    <div className="chart" style={{ height }} ref={ref}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={keys.map((k) => k.label).join(' and ')}>
          <g transform={`translate(${pad.l},${pad.t})`}>
            {scale.ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth="1" />
                <text x={-10} y={y(t)} className="chart-tick" textAnchor="end" dominantBaseline="middle">{tickFormat(t)}</text>
              </g>
            ))}

            {data.map((d, i) => {
              const groupX = i * slot + (slot - barW * keys.length - 2 * (keys.length - 1)) / 2
              return (
                <g key={d.month ?? i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}>
                  <rect x={i * slot} y={0} width={slot} height={ih} fill="transparent" />
                  {keys.map((k, ki) => {
                    const v = d[k.key]
                    const bh = Math.max(1, ih - y(v))
                    return (
                      <path
                        key={k.key}
                        d={barPath(groupX + ki * (barW + 2), y(v), barW, bh)}
                        fill={k.color ?? seriesColor(ki)}
                        opacity={hover == null || hover === i ? 1 : 0.35}
                      />
                    )
                  })}
                </g>
              )
            })}

            {data.map((d, i) => (
              (i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
                <text key={`l${i}`} x={i * slot + slot / 2} y={ih + 17} className="chart-tick" textAnchor="middle">
                  {xLabel(d)}
                </text>
              )
            ))}
          </g>
        </svg>
      )}

      {hover != null && (
        <div className="chart-tip is-static" style={{ left: pad.l + hover * slot + slot / 2, top: 4 }}>
          <div className="chart-tip-meta">{xLabel(data[hover])}</div>
          {keys.map((k, ki) => (
            <div key={k.key} className="chart-tip-row">
              <span className="legend-swatch" style={{ background: k.color ?? seriesColor(ki) }} />
              <span>{k.label}</span>
              <strong>{valueFormat(data[hover][k.key])}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Inline proportional bar for table cells. */
export function InlineBar({ value, max, color = 'var(--viz-1)' }) {
  const w = max ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="inlinebar">
      <div className="inlinebar-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  )
}

export function ChartLegend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((it, i) => (
        <span key={it.label} className="chart-legend-item">
          <span className={`legend-swatch${it.dashed ? ' is-dashed' : ''}`} style={{ background: it.dashed ? 'transparent' : it.color ?? seriesColor(i), borderColor: it.color ?? 'var(--viz-ghost)' }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}
