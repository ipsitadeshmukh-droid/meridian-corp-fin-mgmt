/* Static vocabulary the generator draws from. Kept separate so the shape of the
   book of business can be edited without touching generation logic. */

export const BANK = {
  name: 'Meridian',
  suffix: 'Commercial',
  legal: 'Meridian Commercial Bank, N.A.',
}

export const BANKERS = [
  { id: 'rm-1', name: 'Dana Whitfield', title: 'Senior Relationship Manager', initials: 'DW', tone: 1 },
  { id: 'rm-2', name: 'Priya Raghunathan', title: 'Relationship Manager', initials: 'PR', tone: 2 },
  { id: 'rm-3', name: 'Marcus Oyelaran', title: 'Relationship Manager', initials: 'MO', tone: 3 },
  { id: 'rm-4', name: 'Hannah Böhm', title: 'Associate RM', initials: 'HB', tone: 5 },
  { id: 'rm-5', name: 'Theo Castellanos', title: 'Credit Analyst', initials: 'TC', tone: 7 },
]

export const CURRENT_USER = BANKERS[0]

export const INDUSTRIES = [
  'Software & SaaS',
  'Healthcare services',
  'Logistics & freight',
  'Advanced manufacturing',
  'Specialty retail',
  'Professional services',
  'Renewable energy',
  'Food & beverage',
  'Construction',
  'Biotech',
  'Media & entertainment',
  'Financial technology',
]

export const SEGMENTS = ['Emerging growth', 'Mid-market', 'Enterprise']

/* Invented corporates. Any resemblance to real companies is unintended. */
export const COMPANY_NAMES = [
  ['Northwind Analytics', 'Software & SaaS'],
  ['Kestrel Logistics Group', 'Logistics & freight'],
  ['Verdant Health Partners', 'Healthcare services'],
  ['Ironbark Manufacturing', 'Advanced manufacturing'],
  ['Halcyon Retail Co.', 'Specialty retail'],
  ['Stonebridge Advisory', 'Professional services'],
  ['Solaris Grid Energy', 'Renewable energy'],
  ['Marrow & Field Foods', 'Food & beverage'],
  ['Pinnacle Structures', 'Construction'],
  ['Aperture Biosciences', 'Biotech'],
  ['Lumen Pictures', 'Media & entertainment'],
  ['Tessera Payments', 'Financial technology'],
  ['Cobalt Freightways', 'Logistics & freight'],
  ['Juniper Care Network', 'Healthcare services'],
  ['Redshift Robotics', 'Advanced manufacturing'],
  ['Alder & Vine Markets', 'Specialty retail'],
  ['Meridian Peak Consulting', 'Professional services'],
  ['Windward Renewables', 'Renewable energy'],
  ['Cask & Kettle Brewing', 'Food & beverage'],
  ['Granite Line Builders', 'Construction'],
  ['Helix Therapeutics', 'Biotech'],
  ['Foxglove Studios', 'Media & entertainment'],
  ['Arbor Ledger', 'Financial technology'],
  ['Quillon Software', 'Software & SaaS'],
  ['Basalt Industrial', 'Advanced manufacturing'],
  ['Cyan Harbor Shipping', 'Logistics & freight'],
  ['Wren Diagnostics', 'Healthcare services'],
  ['Thicket Outdoor Supply', 'Specialty retail'],
  ['Onyx Data Systems', 'Software & SaaS'],
  ['Palisade Capital Works', 'Professional services'],
  ['Tidewater Aquafarms', 'Food & beverage'],
  ['Copperline Metals', 'Advanced manufacturing'],
]

export const COUNTERPARTIES = {
  outflow: [
    ['Cascade Payroll Services', 'Payroll'],
    ['Foundry Cloud Compute', 'Technology'],
    ['Harborview Properties', 'Rent & facilities'],
    ['Northline Freight', 'Logistics'],
    ['Kite & Co. Legal', 'Professional fees'],
    ['Sterling Insurance Group', 'Insurance'],
    ['Apex Component Supply', 'Cost of goods'],
    ['Riverbend Utilities', 'Utilities'],
    ['Belfry Media Buying', 'Marketing'],
    ['Quarry Equipment Leasing', 'Equipment'],
    ['Lantern Staffing', 'Contract labour'],
    ['Department of Revenue', 'Tax'],
    ['Oakhurst Facilities Mgmt', 'Rent & facilities'],
    ['Pendleton Travel', 'Travel'],
    ['Vector Security Services', 'Facilities'],
  ],
  inflow: [
    ['Ardent Holdings', 'Customer receipt'],
    ['Crestline Group', 'Customer receipt'],
    ['Bayside Distributors', 'Customer receipt'],
    ['Fairmount Industries', 'Customer receipt'],
    ['Highgate Ventures', 'Investment'],
    ['Silverline Partners', 'Investment'],
    ['Merchant settlement', 'Card settlement'],
    ['Orchard Municipal', 'Customer receipt'],
    ['Waypoint Systems', 'Customer receipt'],
    ['Delta Rail Co.', 'Customer receipt'],
  ],
}

export const METHODS = [
  'Domestic wire',
  'International wire',
  'ACH',
  'Check',
  'Card',
  'Book transfer',
]

/* Internal risk grades, 1 (strongest) to 7 (substandard). */
export const RISK_GRADES = [
  { grade: 1, label: 'AAA — Exceptional', tone: 'pos' },
  { grade: 2, label: 'AA — Strong', tone: 'pos' },
  { grade: 3, label: 'A — Satisfactory', tone: 'pos' },
  { grade: 4, label: 'BBB — Acceptable', tone: 'neutral' },
  { grade: 5, label: 'BB — Monitor', tone: 'warn' },
  { grade: 6, label: 'B — Elevated', tone: 'warn' },
  { grade: 7, label: 'CCC — Substandard', tone: 'neg' },
]

export const FACILITY_TYPES = [
  { type: 'Revolving credit', spread: 2.4 },
  { type: 'Term loan A', spread: 3.1 },
  { type: 'Equipment finance', spread: 3.8 },
  { type: 'Trade finance line', spread: 2.9 },
  { type: 'Commercial mortgage', spread: 2.2 },
]

export const COVENANT_DEFS = [
  { key: 'dscr', name: 'Debt service coverage', unit: 'x', min: 1.25, direction: 'min' },
  { key: 'leverage', name: 'Total leverage', unit: 'x', max: 3.5, direction: 'max' },
  { key: 'liquidity', name: 'Minimum liquidity', unit: '$', min: 1_500_000, direction: 'min' },
  { key: 'tangible', name: 'Tangible net worth', unit: '$', min: 4_000_000, direction: 'min' },
]

export const NOTE_TEMPLATES = [
  'Quarterly review call. CFO walked through the updated forecast; top-line tracking ahead of plan.',
  'Discussed increasing the revolver limit ahead of the Q4 inventory build. Credit memo to follow.',
  'Flagged the concentration in receivables from their two largest customers. They are actively diversifying.',
  'Treasury introduction made — evaluating a sweep structure for the idle operating balance.',
  'Site visit completed. New facility is on schedule; equipment finance draw expected next quarter.',
  'Renewal conversation opened. Competitor approached them with an indicative term sheet.',
  'KYC refresh pack requested from their controller. Expecting documents within two weeks.',
  'Payroll run size increased materially — headcount growth confirmed at 22% year over year.',
]
