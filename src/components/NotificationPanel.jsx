import { useNavigate } from 'react-router-dom'
import { IconAlert, IconArrowRight } from './Icons.jsx'
import { Chip } from './Primitives.jsx'
import { openAlerts, clientName, SEVERITY_TONE } from '../data/index.js'
import { relativeDays } from '../data/format.js'
import './NotificationPanel.css'

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate()
  const top = openAlerts.slice(0, 7)

  const open = (a) => { navigate(a.link); onClose() }

  return (
    <>
      <div className="notif-scrim" onClick={onClose} />
      <div className="notif" role="dialog" aria-label="Notifications">
        <header className="notif-head">
          <h3>Alerts</h3>
          <span className="u-subtle">{openAlerts.length} open</span>
        </header>
        <div className="notif-list">
          {top.map((a) => (
            <button key={a.id} className="notif-row" onClick={() => open(a)}>
              <span className={`notif-icon notif-${SEVERITY_TONE[a.severity]}`}><IconAlert size={14} /></span>
              <span className="notif-text">
                <span className="notif-title">{a.title}</span>
                <span className="notif-meta">{clientName(a.clientId)} · {relativeDays(a.at)}</span>
              </span>
              <Chip tone={SEVERITY_TONE[a.severity]} size="sm">{a.severity}</Chip>
            </button>
          ))}
        </div>
        <button className="notif-foot" onClick={() => { navigate('/attention'); onClose() }}>
          View all alerts <IconArrowRight size={14} />
        </button>
      </div>
    </>
  )
}
