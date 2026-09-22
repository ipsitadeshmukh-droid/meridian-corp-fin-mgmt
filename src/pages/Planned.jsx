import { useLocation, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/Primitives.jsx'
import { IconAdmin, IconArrowRight } from '../components/Icons.jsx'

/* Routes that exist in the information architecture but were not part of this
   build. Each one states what belongs there rather than showing a dead end. */
const PLANNED = {
  '/approvals': ['Payments & approvals', 'The dual-authorisation queue: payments over the delegated limit, four-eyes state, SLA countdown, and approve or reject with a reason code.'],
  '/balances': ['Balances', 'Every account across the book in one grid — operating, reserve, foreign currency and escrow — with rates and end-of-day positions.'],
  '/statements': ['Statements', 'Generated statements per client and per account, with period selection and bulk export.'],
  '/credit/facilities': ['Facilities', 'Portfolio-wide credit exposure: limits, drawn balances, pricing, collateral and renewal status.'],
  '/credit/covenants': ['Covenants', 'A compliance matrix of client against covenant, each cell showing the latest test result and its headroom.'],
  '/credit/maturities': ['Maturity ladder', 'Committed exposure bucketed by quarter, so refinancing pressure is visible before it arrives.'],
  '/risk/alerts': ['Alert queue', 'The full compliance workflow — assignment, evidence, disposition and audit trail.'],
  '/risk/kyc': ['KYC refresh', 'Refresh cycles by client, document status and the escalation path for overdue packs.'],
  '/risk/screening': ['Screening', 'Sanctions and adverse-media screening history, with hit adjudication.'],
  '/treasury/liquidity': ['Liquidity & sweeps', 'Idle-cash opportunities: clients holding balances well above their operating need, with indicative sweep yield.'],
  '/treasury/fx': ['FX exposure', 'Foreign-currency positions across the book and the hedging conversations they imply.'],
  '/reference': ['Reference data', 'The field library — risk grades, product codes, fee schedules and segment definitions, each value enabled or retired.'],
  '/team': ['Team & limits', 'Bankers, their books, and the approval limits delegated to each.'],
  '/settings': ['Settings', 'Workspace preferences, notification routing and entitlements.'],
}

export default function Planned() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [title, body] = PLANNED[pathname] ?? ['Not found', 'This route does not exist in the current information architecture.']

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-title">
          <h1>{title}</h1>
        </div>
      </header>
      <div className="card">
        <EmptyState
          icon={IconAdmin}
          title="Planned for a later pass"
          body={body}
          action={
            <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate('/')}>
              Back to portfolio <IconArrowRight size={14} />
            </button>
          }
        />
      </div>
    </div>
  )
}
