import { useNavigate } from 'react-router-dom'
import { IconAlert, IconChevronRight } from './Icons.jsx'
import { Chip } from './Primitives.jsx'
import { clientName, SEVERITY_TONE } from '../data/index.js'
import { relativeDays } from '../data/format.js'
import './AlertRow.css'

const SEVERITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

export default function AlertRow({ alert, showClient = true }) {
  const navigate = useNavigate()
  const tone = SEVERITY_TONE[alert.severity]
  return (
    <button className="alertrow" onClick={() => navigate(alert.link)}>
      <span className={`alertrow-icon is-${tone}`}><IconAlert size={15} /></span>
      <span className="alertrow-main">
        <span className="alertrow-top">
          <span className="alertrow-title">{alert.title}</span>
          <Chip tone={tone} size="sm">{SEVERITY_LABEL[alert.severity]}</Chip>
          <Chip tone="neutral" size="sm">{alert.category}</Chip>
        </span>
        <span className="alertrow-detail">{alert.detail}</span>
        <span className="alertrow-meta">
          {showClient && <><strong>{clientName(alert.clientId)}</strong><span className="alertrow-dot">·</span></>}
          {relativeDays(alert.at)}
        </span>
      </span>
      <span className="alertrow-chevron"><IconChevronRight size={16} /></span>
    </button>
  )
}
