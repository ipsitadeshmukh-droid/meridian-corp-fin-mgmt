import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconBuilding, IconArrowRight } from './Icons.jsx'
import { clients } from '../data/index.js'
import { compact } from '../data/format.js'
import './CommandPalette.css'

const PAGES = [
  { label: 'Portfolio overview', to: '/' },
  { label: 'Needs attention', to: '/attention' },
  { label: 'All clients', to: '/clients' },
  { label: 'Watchlist', to: '/clients?view=watchlist' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Payments & approvals', to: '/approvals' },
  { label: 'Facilities', to: '/credit/facilities' },
  { label: 'Alert queue', to: '/risk/alerts' },
  { label: 'Reference data', to: '/reference' },
]

export default function CommandPalette({ onClose }) {
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const clientHits = (needle
      ? clients.filter((c) => c.name.toLowerCase().includes(needle) || c.industry.toLowerCase().includes(needle))
      : clients.slice(0, 5)
    ).slice(0, 7).map((c) => ({
      id: c.id,
      kind: 'client',
      label: c.name,
      meta: `${c.industry} · ${compact(c.deposits)} on deposit`,
      to: `/clients/${c.id}`,
    }))

    const pageHits = (needle ? PAGES.filter((p) => p.label.toLowerCase().includes(needle)) : PAGES.slice(0, 4))
      .map((p) => ({ id: p.to, kind: 'page', label: p.label, to: p.to }))

    return [...clientHits, ...pageHits]
  }, [q])

  useEffect(() => { setCursor(0) }, [q])

  const go = (item) => { navigate(item.to); onClose() }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(results.length - 1, c + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)) }
    if (e.key === 'Enter' && results[cursor]) { e.preventDefault(); go(results[cursor]) }
  }

  const clientsFound = results.filter((r) => r.kind === 'client')
  const pagesFound = results.filter((r) => r.kind === 'page')

  return (
    <div className="palette-root" role="dialog" aria-modal="true" aria-label="Search">
      <div className="palette-scrim" onClick={onClose} />
      <div className="palette">
        <div className="palette-input">
          <IconSearch size={17} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search clients, accounts, payments…"
            aria-label="Search"
          />
          <kbd>esc</kbd>
        </div>

        <div className="palette-results">
          {results.length === 0 && (
            <div className="palette-empty">No matches for “{q}”.</div>
          )}

          {clientsFound.length > 0 && <div className="palette-group">Clients</div>}
          {clientsFound.map((r) => {
            const i = results.indexOf(r)
            return (
              <button
                key={r.id}
                className={`palette-row${cursor === i ? ' is-cursor' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
              >
                <span className="palette-row-icon"><IconBuilding size={16} /></span>
                <span className="palette-row-text">
                  <span className="palette-row-label">{r.label}</span>
                  <span className="palette-row-meta">{r.meta}</span>
                </span>
                <IconArrowRight size={15} />
              </button>
            )
          })}

          {pagesFound.length > 0 && <div className="palette-group">Go to</div>}
          {pagesFound.map((r) => {
            const i = results.indexOf(r)
            return (
              <button
                key={r.id}
                className={`palette-row${cursor === i ? ' is-cursor' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
              >
                <span className="palette-row-icon"><IconArrowRight size={15} /></span>
                <span className="palette-row-text">
                  <span className="palette-row-label">{r.label}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> dismiss</span>
        </div>
      </div>
    </div>
  )
}
