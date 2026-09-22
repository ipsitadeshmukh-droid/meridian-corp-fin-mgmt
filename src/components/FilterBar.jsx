import { IconSearch, IconChevronDown, IconDownload } from './Icons.jsx'
import './FilterBar.css'

/* The segmented filter row from the reference screens: one bordered strip,
   cells divided by hairlines, an action flush to the right edge. */
export function FilterBar({ children }) {
  return <div className="filterbar">{children}</div>
}

export function FilterSearch({ value, onChange, placeholder = 'Search', flex = 2 }) {
  return (
    <label className="fb-cell fb-search" style={{ flex }}>
      <IconSearch size={15} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}

export function FilterDateRange({ from, to, onFrom, onTo, flex = 1.6 }) {
  return (
    <div className="fb-cell fb-dates" style={{ flex }}>
      <span className="fb-legend">From</span>
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} aria-label="From date" />
      <span className="fb-legend">To</span>
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)} aria-label="To date" />
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options, flex = 1 }) {
  return (
    <label className="fb-cell fb-select" style={{ flex }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{label}</option>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value
          const text = typeof o === 'string' ? o : o.label
          return <option key={val} value={val}>{text}</option>
        })}
      </select>
      <IconChevronDown size={15} />
    </label>
  )
}

export function FilterAction({ children = 'Export', onClick, icon = true }) {
  return (
    <button className="fb-cell fb-action" onClick={onClick}>
      {icon && <IconDownload size={15} />}
      {children}
    </button>
  )
}

/* Saved views — the pill row that sits above a list. */
export function ViewTabs({ views, active, onChange }) {
  return (
    <div className="viewtabs">
      {views.map((v) => (
        <button
          key={v.id}
          className={`viewtab${active === v.id ? ' is-active' : ''}`}
          onClick={() => onChange(v.id)}
        >
          {v.label}
          {v.count != null && <span className="viewtab-count">{v.count}</span>}
        </button>
      ))}
    </div>
  )
}
