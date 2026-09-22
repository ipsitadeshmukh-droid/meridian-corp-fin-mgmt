import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataTable from '../components/DataTable.jsx'
import { FilterBar, FilterSearch, FilterSelect, FilterAction, ViewTabs } from '../components/FilterBar.jsx'
import { StatBand } from '../components/StatBand.jsx'
import { Delta, RiskBadge, Meter, Chip, EmptyState } from '../components/Primitives.jsx'
import { Sparkline } from '../components/Charts.jsx'
import { IconClients, IconPlus } from '../components/Icons.jsx'
import { clients, activeClients, onboardingClients, BANKERS } from '../data/index.js'
import { SEGMENTS, INDUSTRIES } from '../data/catalog.js'
import { money, compact } from '../data/format.js'

const VIEWS = [
  { id: 'all', label: 'My book' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'growth', label: 'Growth opportunities' },
  { id: 'onboarding', label: 'Onboarding pipeline' },
]

function DepositDelta({ client }) {
  const base = client.deposits - client.depositsChange90d
  const change = base ? client.depositsChange90d / base : 0
  return Math.abs(change) > 3
    ? <Delta value={client.depositsChange90d} compactValue={compact(client.depositsChange90d, {})} />
    : <Delta pct={change} />
}

export default function Clients() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') ?? 'all'

  const [q, setQ] = useState('')
  const [segment, setSegment] = useState('')
  const [industry, setIndustry] = useState('')
  const [banker, setBanker] = useState('')

  const base = useMemo(() => {
    if (view === 'onboarding') return onboardingClients
    if (view === 'watchlist') return activeClients.filter((c) => c.watchlist)
    /* "Growth" is a real screen, not a label: healthy grades, sizeable idle
       balances, and plenty of unused credit to lend against. */
    if (view === 'growth') {
      return activeClients.filter((c) => c.riskGrade <= 4 && c.depositsChange90d > 0 && c.utilisation < 0.5)
    }
    return activeClients
  }, [view])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return base.filter((c) => {
      if (needle && !c.name.toLowerCase().includes(needle) && !c.industry.toLowerCase().includes(needle)) return false
      if (segment && c.segment !== segment) return false
      if (industry && c.industry !== industry) return false
      if (banker && c.banker !== banker) return false
      return true
    })
  }, [base, q, segment, industry, banker])

  const totals = useMemo(() => ({
    deposits: rows.reduce((s, c) => s + c.deposits, 0),
    credit: rows.reduce((s, c) => s + c.creditOutstanding, 0),
    revenue: rows.reduce((s, c) => s + c.revenueTTM, 0),
    atRisk: rows.filter((c) => c.riskGrade >= 5).length,
  }), [rows])

  const views = VIEWS.map((v) => ({
    ...v,
    count: v.id === 'all' ? activeClients.length
      : v.id === 'watchlist' ? activeClients.filter((c) => c.watchlist).length
      : v.id === 'onboarding' ? onboardingClients.length
      : activeClients.filter((c) => c.riskGrade <= 4 && c.depositsChange90d > 0 && c.utilisation < 0.5).length,
  }))

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-title">
          <h1>Clients</h1>
          <p className="page-sub">{clients.length} relationships across the commercial book</p>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-secondary">Assign owner</button>
          <button className="btn btn-primary"><IconPlus size={15} /> Add client</button>
        </div>
      </header>

      <StatBand
        stats={[
          { label: 'Relationships in view', value: String(rows.length), note: `${totals.atRisk} graded 5 or worse` },
          { label: 'Deposits', value: money(totals.deposits) },
          { label: 'Credit outstanding', value: money(totals.credit) },
          { label: 'Revenue, trailing 12 months', value: money(totals.revenue) },
        ]}
      />

      <div className="page-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <ViewTabs
          views={views}
          active={view}
          onChange={(id) => setParams(id === 'all' ? {} : { view: id })}
        />
      </div>

      <FilterBar>
        <FilterSearch value={q} onChange={setQ} placeholder="Search clients or industries" />
        <FilterSelect label="Segment" value={segment} onChange={setSegment} options={SEGMENTS} />
        <FilterSelect label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} flex={1.3} />
        <FilterSelect
          label="Relationship manager"
          value={banker}
          onChange={setBanker}
          flex={1.4}
          options={BANKERS.map((b) => ({ value: b.id, label: b.name }))}
        />
        <FilterAction>Export</FilterAction>
      </FilterBar>

      <div style={{ marginTop: 14 }}>
        <DataTable
          chevron
          minWidth={980}
          rows={rows}
          initialSort={{ key: 'deposits', dir: 'desc' }}
          onRowClick={(c) => navigate(`/clients/${c.id}`)}
          empty={<EmptyState icon={IconClients} title="No clients match" body="Loosen the filters or clear the search to see the rest of the book." />}
          columns={[
            {
              key: 'name', label: 'Client', flex: 2.2, minWidth: 210, sortable: true, defaultDir: 'asc',
              sortValue: (c) => c.name,
              render: (c) => (
                <span className="cell-stack">
                  <span className="cell-primary">{c.name}</span>
                  <span className="cell-secondary">{c.industry} · since {c.relationshipSince}</span>
                </span>
              ),
            },
            {
              key: 'segment', label: 'Segment', width: 104, sortable: true, sortValue: (c) => c.segment,
              render: (c) => <Chip tone="neutral" size="sm">{c.segment}</Chip>,
            },
            {
              key: 'riskGrade', label: 'Grade', width: 112, sortable: true,
              render: (c) => <RiskBadge grade={c.riskGrade} label={c.riskLabel} />,
            },
            {
              key: 'trend', label: '90 days', width: 78,
              render: (c) => (
                <span style={{ width: 66, height: 22, display: 'block' }}>
                  <Sparkline data={c.balances.slice(-90)} />
                </span>
              ),
            },
            {
              key: 'deposits', label: 'Deposits', width: 138, align: 'right', sortable: true,
              render: (c) => (
                <span className="cell-stack" style={{ alignItems: 'flex-end' }}>
                  <span className="cell-amount">{money(c.deposits)}</span>
                  <DepositDelta client={c} />
                </span>
              ),
            },
            {
              key: 'creditOutstanding', label: 'Credit drawn', width: 148, align: 'right', sortable: true,
              render: (c) => (
                c.creditLimit === 0
                  ? <span className="u-subtle">No facility</span>
                  : (
                    <span className="cell-stack" style={{ alignItems: 'flex-end', width: '100%' }}>
                      <span className="cell-amount">{money(c.creditOutstanding)}</span>
                      <Meter value={c.utilisation} width={110} />
                    </span>
                  )
              ),
            },
            {
              key: 'revenueTTM', label: 'Revenue', width: 104, align: 'right', sortable: true,
              render: (c) => <span className="u-num">{compact(c.revenueTTM)}</span>,
            },
          ]}
        />
      </div>
    </div>
  )
}
