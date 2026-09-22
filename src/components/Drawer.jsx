import { useEffect } from 'react'
import { IconX } from './Icons.jsx'
import './Drawer.css'

export default function Drawer({ open, onClose, title, subtitle, eyebrow, actions, footer, width = 520, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" style={{ width }}>
        <header className="drawer-head">
          <div className="drawer-head-text">
            {eyebrow && <div className="drawer-eyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
            {subtitle && <div className="drawer-sub">{subtitle}</div>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close panel">
            <IconX size={18} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {actions && <footer className="drawer-foot">{actions}</footer>}
        {footer}
      </aside>
    </div>
  )
}
