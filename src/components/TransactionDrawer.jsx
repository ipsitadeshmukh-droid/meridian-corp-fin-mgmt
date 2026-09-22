import { useNavigate } from 'react-router-dom'
import Drawer from './Drawer.jsx'
import { Chip, Field, Avatar } from './Primitives.jsx'
import { IconArrowRight, IconDownload, IconFlag } from './Icons.jsx'
import { getClient, APPROVAL_LIMIT } from '../data/index.js'
import { money, mediumDate, shortDate } from '../data/format.js'

const STATUS_TONE = { processed: 'pos', pending: 'warn', returned: 'neg', scheduled: 'info' }

/* The settlement trail is reconstructed from the transaction's own facts —
   method, amount and status — rather than stored, so it always agrees with the row. */
function trail(tx) {
  const steps = [
    { title: 'Initiated by client', at: tx.date - 3600000, done: true },
    { title: 'Sanctions and watchlist screening cleared', at: tx.date - 1800000, done: true },
  ]
  if (tx.amount >= APPROVAL_LIMIT && tx.direction === 'out') {
    steps.push({
      title: tx.status === 'pending' ? 'Awaiting second authorisation' : 'Dual authorisation complete',
      at: tx.date - 900000,
      done: tx.status !== 'pending',
      current: tx.status === 'pending',
    })
  }
  if (tx.status === 'processed') steps.push({ title: `Settled via ${tx.method.toLowerCase()}`, at: tx.date, done: true })
  if (tx.status === 'pending') steps.push({ title: 'Settlement pending', at: tx.date, current: true })
  if (tx.status === 'returned') steps.push({ title: 'Returned by beneficiary bank', at: tx.date, done: false })
  return steps
}

export default function TransactionDrawer({ tx, onClose }) {
  const navigate = useNavigate()
  if (!tx) return null
  const client = getClient(tx.clientId)
  const inbound = tx.direction === 'in'

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={`${tx.method} · ${tx.reference}`}
      title={tx.counterparty}
      subtitle={`${inbound ? 'Received by' : 'Paid by'} ${client?.name}`}
      actions={
        <>
          <button className="btn btn-secondary btn-sm"><IconFlag size={14} /> Flag for review</button>
          <button className="btn btn-secondary btn-sm"><IconDownload size={14} /> Advice</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigate(`/clients/${tx.clientId}?tab=transactions`) }}>
            Open client <IconArrowRight size={14} />
          </button>
        </>
      }
    >
      <div className="drawer-hero">
        <span className="drawer-hero-value" style={inbound ? { color: 'var(--pos)' } : undefined}>
          {inbound ? '+ ' : '− '}{money(tx.amount, { cents: true })}
        </span>
        <Chip tone={STATUS_TONE[tx.status]} dot>{tx.status}</Chip>
      </div>

      <section className="drawer-section">
        <div className="drawer-section-title">Payment</div>
        <div className="drawer-fields">
          <Field label="Value date">{mediumDate(tx.date)}</Field>
          <Field label="Method">{tx.method}</Field>
          <Field label="Debit account">{client?.accounts[0]?.name} {client?.accounts[0]?.number}</Field>
          <Field label="Category">{tx.category}</Field>
          <Field label="Reference">{tx.reference}</Field>
          <Field label="Receipt">{tx.hasReceipt ? <span className="u-pos">Attached</span> : <span className="u-subtle">Missing</span>}</Field>
          {tx.memo && <Field label="Memo" wide>{tx.memo}</Field>}
        </div>
      </section>

      <section className="drawer-section">
        <div className="drawer-section-title">Relationship</div>
        <div className="drawer-fields">
          <Field label="Client">{client?.name}</Field>
          <Field label="Segment">{client?.segment}</Field>
          <Field label="Internal grade">{client?.riskLabel}</Field>
          <Field label="Recurring">{tx.recurring ? 'Scheduled obligation' : 'One-off'}</Field>
        </div>
      </section>

      <section className="drawer-section">
        <div className="drawer-section-title">Settlement trail</div>
        <div className="timeline">
          {trail(tx).map((s, i) => (
            <div className="timeline-row" key={i}>
              <span className={`timeline-dot${s.current ? ' is-current' : s.done ? ' is-done' : ''}`} />
              <span className="timeline-text">
                <span className="timeline-title">{s.title}</span>
                <span className="timeline-meta">{shortDate(s.at)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </Drawer>
  )
}

export { STATUS_TONE }
