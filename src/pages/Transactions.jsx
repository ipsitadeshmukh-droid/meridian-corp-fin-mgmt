import { useMemo, useState } from 'react'
import DataTable from '../components/DataTable.jsx'
import { FilterBar, FilterSearch, FilterDateRange, FilterSelect, FilterAction } from '../components/FilterBar.jsx'
import { StatBand } from '../components/StatBand.jsx'
import { Chip, EmptyState } from '../components/Primitives.jsx'
import TransactionDrawer, { STATUS_TONE } from '../components/TransactionDrawer.jsx'
import { IconCash } from '../components/Icons.jsx'
import { recentTransactions, clientName, AS_OF } from '../data/index.js'
import { METHODS } from '../data/catalog.js'
import { money, shortDate, mediumDate } from '../data/format.js'

const DAY = 86400000
const iso = (t) => new Date(t).toISOString().slice(0, 10)

export default function Transactions() {
  const [q, setQ] = useState('')
  const [from, setFrom] = useState(iso(AS_OF - 30 * DAY))
  const [to, setTo] = useState(iso(AS_OF))
  const [method, setMethod] = useState('')
  const [direction, setDirection] = useState('')
  const [receipts, setReceipts] = useState('')
  const [open, setOpen] = useState(null)

  const filtered = useMemo(() => {
    const lo = from ? new Date(from).getTime() : -Infinity
    const hi = to ? new Date(to).getTime() + DAY - 1 : Infinity
    const needle = q.trim().toLowerCase()
    return recentTransactions.filter((t) => {
      if (t.date < lo || t.date > hi) return false
      if (method && t.method !== method) return false
      if (direction && t.direction !== direction) return false
      if (receipts === 'with' && !t.hasReceipt) return false
      if (receipts === 'without' && t.hasReceipt) return false
      if (needle) {
        const hay = `${t.counterparty} ${t.category} ${t.reference} ${clientName(t.clientId)}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [q, from, to, method, direction, receipts])

  const pending = filtered.filter((t) => t.status === 'pending')
  const settled = filtered.filter((t) => t.status !== 'pending')

  const totals = useMemo(() => {
    let inflow = 0, outflow = 0
    for (const t of filtered) {
      if (t.status === 'returned') continue
      if (t.direction === 'in') inflow += t.amount
      else outflow += t.amount
    }
    return { inflow, outflow, net: inflow - outflow }
  }, [filtered])

  const sumOf = (list) => list.reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0)

  const columns = [
    {
      key: 'date', label: 'Date', width: 96, sortable: true,
      render: (t) => <span className="u-nowrap">{shortDate(t.date)}</span>,
    },
    {
      key: 'counterparty', label: 'To / from', flex: 1.9, minWidth: 190, sortable: true, defaultDir: 'asc',
      render: (t) => (
        <span className="cell-stack">
          <span className="cell-primary">{t.counterparty}</span>
          <span className="cell-secondary">{t.category}</span>
        </span>
      ),
    },
    {
      key: 'client', label: 'Client', flex: 1.4, minWidth: 150, sortable: true, sortValue: (t) => clientName(t.clientId),
      render: (t) => <span className="u-truncate u-muted">{clientName(t.clientId)}</span>,
    },
    { key: 'method', label: 'Method', width: 152, sortable: true, render: (t) => t.method },
    {
      key: 'status', label: 'Status', width: 112,
      render: (t) => <Chip tone={STATUS_TONE[t.status]} size="sm" dot>{t.status}</Chip>,
    },
    {
      key: 'receipt', label: 'Receipt', width: 80,
      render: (t) => t.hasReceipt
        ? <span className="u-subtle" style={{ fontSize: 12.5 }}>Attached</span>
        : <span className="u-subtle" style={{ fontSize: 12.5 }}>—</span>,
    },
    {
      key: 'amount', label: 'Amount', width: 140, align: 'right', sortable: true,
      sortValue: (t) => (t.direction === 'in' ? t.amount : -t.amount),
      render: (t) => (
        <span className={`cell-amount${t.direction === 'in' ? ' is-in' : ''}`}>
          {t.direction === 'in' ? '+ ' : '− '}{money(t.amount, { cents: true })}
        </span>
      ),
    },
  ]

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-title">
          <h1>Transactions</h1>
          <p className="page-sub">
            Every movement across client accounts · {mediumDate(new Date(from).getTime())} to {mediumDate(new Date(to).getTime())}
          </p>
        </div>
      </header>

      <StatBand
        stats={[
          { label: 'Money in', value: money(totals.inflow) },
          { label: 'Money out', value: money(totals.outflow) },
          { label: 'Net movement', value: money(totals.net, { sign: true }) },
          { label: 'Awaiting settlement', value: String(pending.length), note: money(Math.abs(sumOf(pending))) + ' in flight' },
        ]}
      />

      <div className="page-block">
        <FilterBar>
          <FilterSearch value={q} onChange={setQ} placeholder="Search counterparty, client or reference" />
          <FilterDateRange from={from} to={to} onFrom={setFrom} onTo={setTo} flex={2} />
          <FilterSelect label="Method" value={method} onChange={setMethod} options={METHODS} />
          <FilterSelect
            label="Direction" value={direction} onChange={setDirection} flex={0.9}
            options={[{ value: 'in', label: 'Money in' }, { value: 'out', label: 'Money out' }]}
          />
          <FilterSelect
            label="Receipts" value={receipts} onChange={setReceipts} flex={0.9}
            options={[{ value: 'with', label: 'With receipt' }, { value: 'without', label: 'Missing receipt' }]}
          />
          <FilterAction>Export</FilterAction>
        </FilterBar>
      </div>

      <div style={{ marginTop: 14 }}>
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState icon={IconCash} title="No transactions in range" body="Widen the date range or clear a filter to see activity." />
          </div>
        ) : (
          <DataTable
            chevron
            minWidth={1080}
            columns={columns}
            rowKey={(t) => t.id}
            onRowClick={setOpen}
            groups={[
              ...(pending.length ? [{
                id: 'pending',
                title: 'Pending',
                count: `${Math.min(pending.length, 50)} of ${pending.length}`,
                total: Math.abs(sumOf(pending)),
                rows: pending,
                limit: 50,
              }] : []),
              {
                id: 'settled',
                title: 'Processed',
                count: `${Math.min(settled.length, 50)} of ${settled.length}`,
                total: Math.abs(sumOf(settled)),
                rows: settled,
                limit: 50,
              },
            ]}
          />
        )}
      </div>

      {open && <TransactionDrawer tx={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
