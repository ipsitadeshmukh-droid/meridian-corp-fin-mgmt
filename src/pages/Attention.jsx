import { useMemo, useState } from 'react'
import AlertRow from '../components/AlertRow.jsx'
import { ViewTabs } from '../components/FilterBar.jsx'
import { EmptyState } from '../components/Primitives.jsx'
import { IconCheck } from '../components/Icons.jsx'
import { openAlerts, triagedAlerts, alertCounts } from '../data/index.js'
import { AS_OF } from '../data/index.js'
import { mediumDate } from '../data/format.js'

export default function Attention() {
  const [view, setView] = useState('all')

  const views = useMemo(() => ([
    { id: 'all', label: 'Everything', count: openAlerts.length },
    { id: 'critical', label: 'Critical', count: alertCounts.critical ?? 0 },
    { id: 'high', label: 'High', count: alertCounts.high ?? 0 },
    { id: 'Credit', label: 'Credit', count: openAlerts.filter((a) => a.category === 'Credit').length },
    { id: 'Compliance', label: 'Compliance', count: openAlerts.filter((a) => a.category === 'Compliance').length },
    { id: 'Monitoring', label: 'Monitoring', count: openAlerts.filter((a) => a.category === 'Monitoring').length },
    { id: 'Relationship', label: 'Relationship', count: openAlerts.filter((a) => a.category === 'Relationship').length },
  ].filter((v) => v.count > 0)), [])

  const rows = useMemo(() => {
    if (view === 'all') return triagedAlerts
    if (view === 'critical' || view === 'high') return triagedAlerts.filter((a) => a.severity === view)
    return triagedAlerts.filter((a) => a.category === view)
  }, [view])

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-title">
          <h1>Needs attention</h1>
          <p className="page-sub">
            Every open item across the book, derived from the ledger as of {mediumDate(AS_OF)}
          </p>
        </div>
      </header>

      <div style={{ marginBottom: 14 }}>
        <ViewTabs views={views} active={view} onChange={setView} />
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState icon={IconCheck} title="All clear" body="Nothing open in this view." />
        ) : (
          rows.map((a) => <AlertRow key={a.id} alert={a} />)
        )}
      </div>
    </div>
  )
}
