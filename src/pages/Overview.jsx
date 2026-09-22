import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatBand } from '../components/StatBand.jsx'
import { TrendChart, Donut, GroupedBars, ChartLegend, seriesColor } from '../components/Charts.jsx'
import DataTable from '../components/DataTable.jsx'
import AlertRow from '../components/AlertRow.jsx'
import { Segmented, Delta, RiskBadge, Chip, Meter } from '../components/Primitives.jsx'
import { IconArrowRight, IconDownload, IconCheck } from '../components/Icons.jsx'
import {
  portfolio, portfolioBalances, portfolioFlow, openAlerts, triagedAlerts, alertCounts,
  depositsBy, topMovers, upcomingMaturities, activeClients, CURRENT_USER, AS_OF,
} from '../data/index.js'
import { money, compact, mediumDate, monthLabel, relativeDays, signedPct } from '../data/format.js'
import './Overview.css'

const RANGES = [
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '180', label: '6M' },
  { value: '365', label: '12M' },
]

export default function Overview() {
  const navigate = useNavigate()
  const [range, setRange] = useState('180')
  const [cut, setCut] = useState('segment')

  const days = Number(range)

  /* The ghost line is the immediately preceding window of equal length, so the
     comparison is like-for-like rather than a calendar approximation. */
  const { series, ghost } = useMemo(() => {
    const all = portfolioBalances
    const end = all.length
    const start = Math.max(0, end - days)
    const current = all.slice(start, end)
    const prior = all.slice(Math.max(0, start - days), start)
    const aligned = prior.length === current.length
      ? prior.map((p, i) => ({ t: current[i].t, v: p.v }))
      : null
    return { series: current, ghost: aligned }
  }, [days])

  const windowDelta = series.length > 1 ? series[series.length - 1].v - series[0].v : 0
  const windowPct = series.length > 1 && series[0].v ? windowDelta / series[0].v : 0

  const concentration = useMemo(() => depositsBy(cut), [cut])
  const flows = portfolioFlow.slice(-12)
  const priority = triagedAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high')

  const movers = [
    ...topMovers.up.slice(0, 4).map((m) => ({ ...m, key: `u-${m.client.id}` })),
    ...topMovers.down.slice(0, 4).map((m) => ({ ...m, key: `d-${m.client.id}` })),
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const maturityRows = upcomingMaturities.slice(0, 6)

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-title">
          <h1>Portfolio</h1>
          <p className="page-sub">
            {CURRENT_USER.name}'s book · {portfolio.clientCount} active relationships · as of {mediumDate(AS_OF)}
          </p>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-secondary"><IconDownload size={15} /> Export</button>
          <button className="btn btn-primary" onClick={() => navigate('/attention')}>
            Review {priority.length} priority items
          </button>
        </div>
      </header>

      <StatBand
        stats={[
          {
            label: 'Deposits under management',
            value: money(portfolio.deposits),
            deltaPct: portfolio.depositsPct90d,
            deltaNote: 'vs 90 days ago',
            series: portfolioBalances.slice(-90),
            sparkTone: 'accent',
          },
          {
            label: 'Credit outstanding',
            value: money(portfolio.credit),
            note: `${compact(portfolio.creditLimit)} committed · ${(portfolio.utilisation * 100).toFixed(0)}% drawn`,
          },
          {
            label: 'Revenue, trailing 12 months',
            value: money(portfolio.revenueTTM),
            note: `${money(portfolio.revenueMTD)} monthly run rate`,
          },
          {
            label: 'Portfolio health',
            value: `${portfolio.health}`,
            note: `${portfolio.atRisk} relationships graded 5 or worse`,
          },
        ]}
      />

      {/* ---- work queue ---- */}
      <section className="page-block card">
        <div className="card-head">
          <div>
            <h3>Needs your attention</h3>
            <div className="sub">
              {alertCounts.critical ?? 0} critical · {alertCounts.high ?? 0} high · {alertCounts.medium ?? 0} medium
            </div>
          </div>
          <button className="btn-link" onClick={() => navigate('/attention')}>
            View all {openAlerts.length} <IconArrowRight size={14} />
          </button>
        </div>
        {priority.slice(0, 5).map((a) => <AlertRow key={a.id} alert={a} />)}
        {priority.length === 0 && (
          <div className="queue-clear">
            <span className="queue-clear-icon"><IconCheck size={18} /></span>
            Nothing critical open. The book is clear this morning.
          </div>
        )}
      </section>

      {/* ---- deposits trend + concentration ---- */}
      <div className="page-block grid-7-5">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Deposits under management</h3>
              <div className="sub">
                <Delta pct={windowPct} /> <span className="u-subtle">{money(windowDelta, { sign: true })} over the period</span>
              </div>
            </div>
            <Segmented options={RANGES} value={range} onChange={setRange} />
          </div>
          <div className="card-body">
            <TrendChart
              data={series}
              compare={ghost}
              height={248}
              label="Deposits under management"
              valueFormat={(v) => money(v)}
            />
            <div className="chart-foot">
              <ChartLegend items={[
                { label: 'Current period', color: 'var(--viz-1)' },
                { label: 'Prior period', dashed: true },
              ]} />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h3>Where the deposits sit</h3>
              <div className="sub">Concentration across the book</div>
            </div>
            <Segmented
              size="sm"
              options={[{ value: 'segment', label: 'Segment' }, { value: 'industry', label: 'Industry' }]}
              value={cut}
              onChange={setCut}
            />
          </div>
          <div className="card-body">
            <Donut
              data={concentration}
              centerLabel={cut === 'segment' ? 'Total deposits' : 'Across industries'}
              centerValue={compact(portfolio.deposits)}
              height={196}
            />
          </div>
        </section>
      </div>

      {/* ---- flows + movers ---- */}
      <div className="page-block grid-7-5">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Money in and out</h3>
              <div className="sub">Across every client account, by month</div>
            </div>
            <ChartLegend items={[
              { label: 'Inflow', color: seriesColor(2) },
              { label: 'Outflow', color: seriesColor(0) },
            ]} />
          </div>
          <div className="card-body">
            <GroupedBars
              data={flows}
              height={228}
              keys={[
                { key: 'inflow', label: 'Inflow', color: seriesColor(2) },
                { key: 'outflow', label: 'Outflow', color: seriesColor(0) },
              ]}
              xLabel={(d) => monthLabel(d.month)}
            />
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h3>Biggest movers</h3>
              <div className="sub">Balance change over seven days</div>
            </div>
          </div>
          <div className="mover-list">
            {movers.map((m) => (
              <button key={m.key} className="mover" onClick={() => navigate(`/clients/${m.client.id}`)}>
                <span className="mover-name">
                  <span className="cell-primary">{m.client.name}</span>
                  <span className="cell-secondary">{m.client.segment}</span>
                </span>
                <span className="mover-figures">
                  <span className="mover-amount">{money(m.delta, { sign: true })}</span>
                  <Delta pct={m.pct} showArrow={false} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ---- maturities ---- */}
      <section className="page-block">
        <div className="section-head">
          <h2>Facilities maturing soon</h2>
          <button className="btn-link" onClick={() => navigate('/credit/maturities')}>
            Full maturity ladder <IconArrowRight size={14} />
          </button>
        </div>
        <DataTable
          dense
          chevron
          rowKey={(r) => r.facility.id}
          onRowClick={(r) => navigate(`/clients/${r.client.id}?tab=credit`)}
          rows={maturityRows}
          columns={[
            {
              key: 'client', label: 'Client', flex: 2,
              render: (r) => (
                <span className="cell-stack">
                  <span className="cell-primary">{r.client.name}</span>
                  <span className="cell-secondary">{r.client.industry}</span>
                </span>
              ),
            },
            { key: 'type', label: 'Facility', flex: 1.4, render: (r) => r.facility.type },
            {
              key: 'risk', label: 'Grade', width: 132,
              render: (r) => <RiskBadge grade={r.client.riskGrade} label={r.client.riskLabel} />,
            },
            {
              key: 'util', label: 'Drawn', width: 180,
              render: (r) => <Meter value={r.facility.utilisation} />,
            },
            {
              key: 'outstanding', label: 'Outstanding', width: 130, align: 'right',
              render: (r) => <span className="cell-amount">{money(r.facility.drawn)}</span>,
            },
            {
              key: 'maturity', label: 'Matures', width: 150, align: 'right',
              render: (r) => {
                const d = Math.round((r.facility.maturity - AS_OF) / 86400000)
                return (
                  <span className="u-nowrap">
                    <Chip tone={d < 60 ? 'neg' : d < 180 ? 'warn' : 'neutral'} size="sm">
                      {relativeDays(r.facility.maturity, AS_OF)}
                    </Chip>
                  </span>
                )
              },
            },
          ]}
        />
      </section>
    </div>
  )
}
