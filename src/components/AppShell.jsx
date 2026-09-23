import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  IconOverview, IconClients, IconCash, IconCredit, IconRisk, IconTreasury,
  IconReports, IconAdmin, IconSearch, IconBell, IconSun, IconMoon,
  IconChevronDown, IconHelp, IconBook, IconLogout, IconGear,
} from './Icons.jsx'
import CommandPalette from './CommandPalette.jsx'
import NotificationPanel from './NotificationPanel.jsx'
import { CURRENT_USER, alertCounts, approvals } from '../data/index.js'
import './AppShell.css'

export const SECTIONS = [
  {
    id: 'overview', label: 'Overview', icon: IconOverview, match: (p) => p === '/' || p.startsWith('/attention'),
    items: [
      { to: '/', label: 'Portfolio', end: true },
      { to: '/attention', label: 'Needs attention', badge: alertCounts.critical + (alertCounts.high || 0) },
    ],
  },
  {
    id: 'clients', label: 'Clients', icon: IconClients, match: (p) => p.startsWith('/clients'),
    items: [
      { to: '/clients', label: 'All clients', end: true },
      { to: '/clients?view=watchlist', label: 'Watchlist' },
      { to: '/clients?view=onboarding', label: 'Onboarding pipeline' },
    ],
  },
  {
    id: 'cash', label: 'Accounts & cash', icon: IconCash, match: (p) => ['/transactions', '/approvals', '/balances', '/statements'].some((x) => p.startsWith(x)),
    items: [
      { to: '/transactions', label: 'Transactions' },
      { to: '/approvals', label: 'Payments & approvals', badge: approvals.length },
      { to: '/balances', label: 'Balances' },
      { to: '/statements', label: 'Statements' },
    ],
  },
  {
    id: 'credit', label: 'Credit', icon: IconCredit, match: (p) => p.startsWith('/credit'),
    items: [
      { to: '/credit/facilities', label: 'Facilities' },
      { to: '/credit/covenants', label: 'Covenants' },
      { to: '/credit/maturities', label: 'Maturity ladder' },
    ],
  },
  {
    id: 'risk', label: 'Risk & compliance', icon: IconRisk, match: (p) => p.startsWith('/risk'),
    items: [
      { to: '/risk/alerts', label: 'Alert queue', badge: alertCounts.total },
      { to: '/risk/kyc', label: 'KYC refresh' },
      { to: '/risk/screening', label: 'Screening' },
    ],
  },
  {
    id: 'treasury', label: 'Treasury', icon: IconTreasury, match: (p) => p.startsWith('/treasury'),
    items: [
      { to: '/treasury/liquidity', label: 'Liquidity & sweeps' },
      { to: '/treasury/fx', label: 'FX exposure' },
    ],
  },
  {
    id: 'reports', label: 'Reports', icon: IconReports, match: (p) => p.startsWith('/reports'),
    items: [
      { to: '/reports', label: 'Reports', end: true },
    ],
  },
  {
    id: 'admin', label: 'Administration', icon: IconAdmin, match: (p) => ['/reference', '/team', '/settings'].some((x) => p.startsWith(x)),
    items: [
      { to: '/reference', label: 'Reference data' },
      { to: '/team', label: 'Team & limits' },
      { to: '/settings', label: 'Settings' },
    ],
  },
]

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('mc-theme') || 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mc-theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))]
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const section = useMemo(
    () => SECTIONS.find((s) => s.match(location.pathname)) ?? SECTIONS[0],
    [location.pathname],
  )

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (e.key === 'Escape') { setPaletteOpen(false); setNotifOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A new route means a new reading position; nothing is preserved across pages.
  useEffect(() => {
    document.querySelector('.shell-scroll')?.scrollTo({ top: 0 })
  }, [location.pathname])

  const search = location.search

  return (
    <div className="shell">
      <nav className="rail" aria-label="Sections">
        <NavLink to="/" className="rail-mark" aria-label="Meridian Commercial home">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="currentColor" />
            <path d="M8 22V10h3.4l4.6 7.2L20.6 10H24v12h-3.1v-6.9L16.6 21h-1.2l-4.3-5.9V22H8z" fill="var(--accent)" />
          </svg>
        </NavLink>
        <div className="rail-items">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const active = s.id === section.id
            return (
              <button
                key={s.id}
                className={`rail-item${active ? ' is-active' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => navigate(s.items[0].to)}
              >
                <Icon size={19} />
                <span className="rail-tip">{s.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <aside className="nav">
        <div className="nav-brand">
          <div className="nav-brand-name">Meridian</div>
          <div className="nav-brand-sub">Commercial Banking</div>
        </div>

        <div className="nav-section-label">{section.label}</div>
        <div className="nav-items">
          {section.items.map((item) => {
            const [path, query] = item.to.split('?')
            const isActive = item.end
              ? location.pathname === path && (!query ? !search : search.includes(query))
              : query
                ? location.pathname === path && search.includes(query)
                : location.pathname.startsWith(path) && (path !== '/clients' || !search)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`nav-item${isActive ? ' is-active' : ''}`}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </NavLink>
            )
          })}
        </div>

        <div className="nav-foot">
          <a className="nav-foot-item" href="#getting-started"><IconBook size={16} /> Getting started</a>
          <a className="nav-foot-item" href="#help"><IconHelp size={16} /> Help centre</a>
          <NavLink className="nav-foot-item" to="/settings"><IconGear size={16} /> Settings</NavLink>
          <a className="nav-foot-item" href="#logout"><IconLogout size={16} /> Log out</a>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-section">{section.label}</span>
          </div>

          <button className="topbar-search" onClick={() => setPaletteOpen(true)}>
            <IconSearch size={16} />
            <span>Search clients, accounts, payments…</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="topbar-right">
            <button
              className={`topbar-icon${notifOpen ? ' is-on' : ''}`}
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={`Notifications, ${alertCounts.total} open`}
            >
              <IconBell size={18} />
              {alertCounts.total > 0 && <span className="topbar-dot" />}
            </button>
            <button className="topbar-icon" onClick={toggleTheme} aria-label="Toggle colour theme">
              {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
            </button>
            <button className="topbar-user">
              <span className="avatar avatar-sm tone-1">{CURRENT_USER.initials}</span>
              <span className="topbar-user-name">{CURRENT_USER.name}</span>
              <IconChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="shell-scroll">
          <Outlet />
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
    </div>
  )
}
