import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DataTable from '../components/DataTable.jsx'
import { TrendChart, Donut, GroupedBars, ChartLegend, seriesColor } from '../components/Charts.jsx'
import { Stat } from '../components/StatBand.jsx'
import {
  Tabs, Segmented, Chip, RiskBadge, Meter, Delta, Avatar, Field, EmptyState,
} from '../components/Primitives.jsx'
import AlertRow from '../components/AlertRow.jsx'
import TransactionDrawer, { STATUS_TONE } from '../components/TransactionDrawer.jsx'
import {
  IconChevronLeft, IconFlag, IconNote, IconDownload, IconCheck, IconAlert, IconCash,
} from '../components/Icons.jsx'
import {
  getClient, alertsForClient, bankerById, categoryBreakdown, AS_OF,
} from '../data/index.js'
import { money, compact, mediumDate, monthLabel, relativeDays, pct, shortDate } from '../data/format.js'
import './ClientDetail.css'

const DAY = 86400000
const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'credit', label: 'Credit' },
  { id: 'risk', label: 'Risk & compliance' },
  { id: 'notes', label: 'Notes' },
]

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const client = getClient(id)
  const tab = params.get('tab') ?? 'summary'
  const [openTx, setOpenTx] = useState(null)

  if (!client) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState title="Client not found" body="That relationship is not in this book." />
        </div>
      </div>
    )
  }

  const alerts = alertsForClient(client.id)
  const banker = bankerById(client.banker)
  const setTab = (t) => setParams(t === 'summary' ? {} : { tab: t })

  const tabsWithCounts = TABS.map((t) =>
    t.id === 'risk' && alerts.length ? { ...t, count: alerts.length } : t)

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate('/clients')}>
        <IconChevronLeft size={15} /> All clients
      </button>

      <header className="client-head">
        <div className="client-head-main">
          <Avatar name={client.name} tone={(client.riskGrade % 7) + 1} size="lg" />
          <div className="client-head-text">
            <div className="client-head-title">
              <h1>{client.name}</h1>
              {client.watchlist && <Chip tone="warn" size="sm" dot>Watchlist</Chip>}
            </div>
            <div className="client-head-meta">
              <span>{client.legalName}</span>
              <span className="sep">·</span>
              <span>{client.industry}</span>
              <span className="sep">·</span>
              <span>{client.hq}</span>
              <span className="sep">·</span>
              <span>Client since {client.relationshipSince}</span>
            </div>
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-secondary btn-sm"><IconNote size={14} /> Add note</button>
          <button className="btn btn-secondary btn-sm"><IconFlag size={14} /> Flag</button>
          <button className="btn btn-primary btn-sm"><IconDownload size={14} /> Relationship pack</button>
        </div>
      </header>

      <div className="client-strip">
        <Stat label="Total deposits" value={money(client.deposits)} sub={
          <Delta pct={client.deposits - client.depositsChange90d ? client.depositsChange90d / (client.deposits - client.depositsChange90d) : 0} />
        } />
        <Stat label="Credit drawn" value={client.creditLimit ? money(client.creditOutstanding) : '—'}
          sub={client.creditLimit ? `of ${compact(client.creditLimit)} committed` : 'No facility in place'} />
        <Stat label="Revenue TTM" value={money(client.revenueTTM)} sub={`${client.products} products held`} />
        <Stat label="Internal grade" value={String(client.riskGrade)} sub={client.riskLabel.split(' — ')[1]} />
        <Stat
          label={client.runwayMonths === null ? 'Net position' : 'Runway'}
          value={client.runwayMonths === null ? 'Cash generative' : `${client.runwayMonths.toFixed(1)} mo`}
          tone={client.runwayMonths !== null && client.runwayMonths < 7 ? 'neg' : undefined}
          sub={`${money(client.avgMonthlyNet, { sign: true })} per month`}
        />
        <Stat label="Relationship manager" value={banker.name.split(' ')[0]} sub={`Last contact ${relativeDays(client.lastContact).toLowerCase()}`} />
      </div>

      <div className="page-block">
        <Tabs tabs={tabsWithCounts} active={tab} onChange={setTab} />
      </div>

      {tab === 'summary' && <SummaryTab client={client} alerts={alerts} banker={banker} />}
      {tab === 'accounts' && <AccountsTab client={client} />}
      {tab === 'transactions' && <TransactionsTab client={client} onOpen={setOpenTx} />}
      {tab === 'credit' && <CreditTab client={client} />}
      {tab === 'risk' && <RiskTab client={client} alerts={alerts} />}
      {tab === 'notes' && <NotesTab client={client} />}

      {openTx && <TransactionDrawer tx={openTx} onClose={() => setOpenTx(null)} />}
    </div>
  )
}

/* ---------------------------------------------------------------- */

function SummaryTab({ client, alerts, banker }) {
  const [range, setRange] = useState('180')
  const days = Number(range)
  const series = client.balances.slice(-days)
  const spend = categoryBreakdown(client, 90)
  const flows = client.flow.slice(-12)

  return (
    <>
      <div className="page-block grid-7-5">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Cash position</h3>
              <div className="sub">Operating balance, integrated from posted transactions</div>
            </div>
            <Segmented
              options={[{ value: '30', label: '30D' }, { value: '90', label: '90D' }, { value: '180', label: '6M' }, { value: '365', label: '12M' }]}
              value={range}
              onChange={setRange}
            />
          </div>
          <div className="card-body">
            <TrendChart data={series} height={236} label="Cash position" />
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3>What to do next</h3></div>
          <div className="next-actions">
            {buildNextActions(client, alerts).map((a, i) => (
              <div className="next-action" key={i}>
                <span className={`next-action-icon is-${a.tone}`}>
                  {a.tone === 'pos' ? <IconCheck size={14} /> : <IconAlert size={14} />}
                </span>
                <span>
                  <span className="next-action-title">{a.title}</span>
                  <span className="next-action-body">{a.body}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="card-head" style={{ borderTop: '1px solid var(--border-soft)', borderBottom: 'none' }}>
            <div className="owner-row">
              <Avatar name={banker.name} tone={banker.tone} size="md" />
              <span>
                <span className="owner-name">{banker.name}</span>
                <span className="owner-title">{banker.title}</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="page-block grid-2">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Where the money goes</h3>
              <div className="sub">Outflows by category, last 90 days</div>
            </div>
          </div>
          <div className="card-body">
            <Donut data={spend} centerLabel="Total outflow, 90 days" height={192} />
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h3>Monthly flows</h3>
              <div className="sub">Receipts against payments</div>
            </div>
            <ChartLegend items={[
              { label: 'Inflow', color: seriesColor(2) },
              { label: 'Outflow', color: seriesColor(0) },
            ]} />
          </div>
          <div className="card-body">
            <GroupedBars
              data={flows}
              height={210}
              keys={[
                { key: 'inflow', label: 'Inflow', color: seriesColor(2) },
                { key: 'outflow', label: 'Outflow', color: seriesColor(0) },
              ]}
            />
          </div>
        </section>
      </div>

      {alerts.length > 0 && (
        <section className="page-block card">
          <div className="card-head">
            <h3>Open items on this relationship</h3>
          </div>
          {alerts.slice(0, 4).map((a) => <AlertRow key={a.id} alert={a} showClient={false} />)}
        </section>
      )}
    </>
  )
}

/* Next actions are read off the client's own state, so the panel never
   suggests something the numbers contradict. */
function buildNextActions(client, alerts) {
  const out = []
  const breach = alerts.find((a) => a.title.includes('covenant breached'))
  if (breach) out.push({ tone: 'neg', title: 'Escalate the covenant breach', body: 'Credit committee referral required before the next test date.' })

  const maturing = client.facilities.find((f) => f.maturity > AS_OF && f.maturity - AS_OF < 120 * DAY)
  if (maturing) out.push({ tone: 'warn', title: `Open renewal on the ${maturing.type.toLowerCase()}`, body: `Matures ${relativeDays(maturing.maturity, AS_OF).toLowerCase()} with ${compact(maturing.drawn)} outstanding.` })

  const idle = client.accounts.find((a) => a.type === 'Checking' && a.balance > client.scale * 0.8)
  if (idle) out.push({ tone: 'pos', title: 'Sweep idle operating cash', body: `${compact(idle.balance)} is sitting at ${idle.rate}%. A reserve sweep would earn materially more.` })

  if (client.runwayMonths !== null && client.runwayMonths < 9) {
    out.push({ tone: 'neg', title: 'Book a liquidity conversation', body: `Burn implies ${client.runwayMonths.toFixed(1)} months of runway at current balances.` })
  }
  if (client.utilisation > 0.85) out.push({ tone: 'warn', title: 'Review the line size', body: 'Utilisation is close to the limit ahead of the next drawdown.' })
  if (Math.round((client.kycRefreshDue - AS_OF) / DAY) < 60) out.push({ tone: 'warn', title: 'Chase the KYC refresh pack', body: `Refresh falls due ${relativeDays(client.kycRefreshDue, AS_OF).toLowerCase()}.` })
  if (client.lastContact < AS_OF - 75 * DAY) out.push({ tone: 'warn', title: 'Schedule a check-in', body: `No recorded contact in ${Math.round((AS_OF - client.lastContact) / DAY)} days.` })

  if (out.length === 0) out.push({ tone: 'pos', title: 'Nothing outstanding', body: 'Covenants pass, contact is current and the line has headroom.' })
  return out.slice(0, 4)
}

/* ---------------------------------------------------------------- */

function AccountsTab({ client }) {
  return (
    <div className="page-block">
      <DataTable
        rows={client.accounts}
        initialSort={{ key: 'balance', dir: 'desc' }}
        columns={[
          {
            key: 'name', label: 'Account', flex: 2,
            render: (a) => (
              <span className="cell-stack">
                <span className="cell-primary">{a.name}</span>
                <span className="cell-secondary">{a.type} {a.number}</span>
              </span>
            ),
          },
          { key: 'currency', label: 'Currency', width: 110 },
          {
            key: 'rate', label: 'Rate', width: 110, align: 'right',
            render: (a) => (a.rate ? `${a.rate.toFixed(2)}%` : <span className="u-subtle">Non-interest</span>),
          },
          {
            key: 'balance', label: 'Balance', width: 180, align: 'right', sortable: true,
            render: (a) => <span className="cell-amount">{money(a.balance, { cents: true })}</span>,
          },
        ]}
      />
      <div className="totals-row">
        <span>Total across {client.accounts.length} accounts</span>
        <strong>{money(client.deposits, { cents: true })}</strong>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

function TransactionsTab({ client, onOpen }) {
  const [dir, setDir] = useState('all')
  const txns = useMemo(() => {
    const recent = client.transactions.filter((t) => t.date > AS_OF - 120 * DAY).sort((a, b) => b.date - a.date)
    return dir === 'all' ? recent : recent.filter((t) => t.direction === dir)
  }, [client, dir])

  const pending = txns.filter((t) => t.status === 'pending')
  const settled = txns.filter((t) => t.status !== 'pending')
  const sumOf = (list) => Math.abs(list.reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0))

  const columns = [
    { key: 'date', label: 'Date', width: 96, sortable: true, render: (t) => shortDate(t.date) },
    {
      key: 'counterparty', label: 'To / from', flex: 2,
      render: (t) => (
        <span className="cell-stack">
          <span className="cell-primary">{t.counterparty}</span>
          <span className="cell-secondary">{t.category}</span>
        </span>
      ),
    },
    { key: 'method', label: 'Method', width: 152 },
    { key: 'status', label: 'Status', width: 112, render: (t) => <Chip tone={STATUS_TONE[t.status]} size="sm" dot>{t.status}</Chip> },
    {
      key: 'amount', label: 'Amount', width: 150, align: 'right', sortable: true,
      sortValue: (t) => (t.direction === 'in' ? t.amount : -t.amount),
      render: (t) => (
        <span className={`cell-amount${t.direction === 'in' ? ' is-in' : ''}`}>
          {t.direction === 'in' ? '+ ' : '− '}{money(t.amount, { cents: true })}
        </span>
      ),
    },
  ]

  return (
    <div className="page-block">
      <div className="tab-toolbar">
        <Segmented
          options={[{ value: 'all', label: 'All' }, { value: 'in', label: 'Money in' }, { value: 'out', label: 'Money out' }]}
          value={dir}
          onChange={setDir}
        />
        <span className="u-subtle">Last 120 days · {txns.length} movements</span>
      </div>
      {txns.length === 0 ? (
        <div className="card"><EmptyState icon={IconCash} title="No activity" body="No movements in this window." /></div>
      ) : (
        <DataTable
          chevron
          columns={columns}
          onRowClick={onOpen}
          groups={[
            ...(pending.length ? [{ id: 'p', title: 'Pending', count: `${pending.length} of ${pending.length}`, total: sumOf(pending), rows: pending }] : []),
            { id: 's', title: 'Processed', count: `${Math.min(settled.length, 50)} of ${settled.length}`, total: sumOf(settled), rows: settled, limit: 50 },
          ]}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */

const COV_TONE = { pass: 'pos', watch: 'warn', breach: 'neg' }

function CreditTab({ client }) {
  if (client.facilities.length === 0) {
    return (
      <div className="page-block card">
        <EmptyState
          icon={IconCash}
          title="No credit facilities"
          body="This relationship is deposit-only. Given the balance profile, it may be a candidate for a working-capital line."
        />
      </div>
    )
  }

  return (
    <div className="page-block facility-list">
      {client.facilities.map((f) => (
        <section className="card" key={f.id}>
          <div className="card-head">
            <div>
              <h3>{f.type}</h3>
              <div className="sub">
                Originated {mediumDate(f.originated)} · {f.secured ? 'Secured' : 'Unsecured'} · {f.rate.toFixed(2)}% all-in
              </div>
            </div>
            <Chip tone={f.maturity - AS_OF < 90 * DAY ? 'neg' : 'neutral'}>
              Matures {mediumDate(f.maturity)}
            </Chip>
          </div>

          <div className="facility-body">
            <div className="facility-figures">
              <Field label="Commitment">{money(f.limit)}</Field>
              <Field label="Drawn">{money(f.drawn)}</Field>
              <Field label="Available">{money(f.available)}</Field>
              <Field label="Utilisation"><Meter value={f.utilisation} width={150} /></Field>
            </div>

            <div className="covenant-table">
              <div className="covenant-head">
                <span>Covenant</span>
                <span>Required</span>
                <span>Latest test</span>
                <span>Headroom</span>
                <span>Status</span>
              </div>
              {f.covenants.map((c) => (
                <div className="covenant-row" key={c.key}>
                  <span>
                    <span className="covenant-name">{c.name}</span>
                    <span className="covenant-tested">Tested {relativeDays(c.testedAt, AS_OF).toLowerCase()}</span>
                  </span>
                  <span className="u-num">
                    {c.direction === 'min' ? '≥ ' : '≤ '}
                    {c.unit === '$' ? compact(c.threshold) : `${c.threshold}${c.unit}`}
                  </span>
                  <span className="u-num">{c.unit === '$' ? compact(c.actual) : `${c.actual}${c.unit}`}</span>
                  <span className={`u-num ${c.headroom < 0 ? 'u-neg' : ''}`}>{pct(c.headroom, 1)}</span>
                  <span><Chip tone={COV_TONE[c.status]} size="sm" dot>{c.status}</Chip></span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- */

function RiskTab({ client, alerts }) {
  const kycDays = Math.round((client.kycRefreshDue - AS_OF) / DAY)
  return (
    <div className="page-block grid-7-5">
      <section className="card">
        <div className="card-head"><h3>Open items</h3></div>
        {alerts.length === 0
          ? <EmptyState icon={IconCheck} title="Nothing open" body="No alerts are currently raised on this relationship." />
          : alerts.map((a) => <AlertRow key={a.id} alert={a} showClient={false} />)}
      </section>

      <div className="risk-side">
        <section className="card">
          <div className="card-head"><h3>Grading</h3></div>
          <div className="card-body">
            <div style={{ marginBottom: 14 }}>
              <RiskBadge grade={client.riskGrade} label={client.riskLabel} />
            </div>
            <p className="risk-note">
              The grade is derived from covenant status, facility utilisation and the trailing burn rate —
              {' '}{client.facilities.flatMap((f) => f.covenants).filter((c) => c.status !== 'pass').length} covenant
              {' '}test(s) outside tolerance, {pct(client.utilisation, 0)} of committed credit drawn
              {client.runwayMonths !== null && `, ${client.runwayMonths.toFixed(1)} months of runway`}.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3>Know your customer</h3></div>
          <div className="card-body">
            <div className="drawer-fields">
              <Field label="Refresh due">{mediumDate(client.kycRefreshDue)}</Field>
              <Field label="Status">
                <Chip tone={kycDays < 0 ? 'neg' : kycDays < 45 ? 'warn' : 'pos'} size="sm" dot>
                  {kycDays < 0 ? `${Math.abs(kycDays)} days overdue` : `Due in ${kycDays} days`}
                </Chip>
              </Field>
              <Field label="Entity">{client.legalName}</Field>
              <Field label="Headcount">{client.employees.toLocaleString()}</Field>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

function NotesTab({ client }) {
  return (
    <div className="page-block grid-7-5">
      <section className="card">
        <div className="card-head"><h3>Relationship notes</h3></div>
        <div className="note-list">
          {client.notes.map((n) => (
            <article className="note" key={n.id}>
              <div className="note-head">
                <Avatar name={n.author} tone={(n.author.length % 7) + 1} size="sm" />
                <span className="note-author">{n.author}</span>
                <span className="note-date">{mediumDate(n.at)}</span>
              </div>
              <p className="note-body">{n.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Add a note</h3></div>
        <div className="card-body">
          <textarea className="note-input" rows={5} placeholder={`What came out of your last conversation with ${client.name}?`} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn btn-primary btn-sm">Save note</button>
          </div>
        </div>
      </section>
    </div>
  )
}
