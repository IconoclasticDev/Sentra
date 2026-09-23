import type {
  Agent,
  AuditEntry,
  Customer,
  Decision,
  Entity,
  GraphEdge,
  Memory,
  PolicyMatrix,
  Project,
  Source,
  SourceMatrix,
  TimelineEvent,
  User,
} from './types'

// ---------------------------------------------------------------------------
// NexaCore Systems — the one fictional company every screen renders from.
// Demo clock: September 2026. Nothing outside this file defines facts.
// ---------------------------------------------------------------------------

export const COMPANY = {
  name: 'NexaCore Systems',
  tagline: 'Organizational intelligence, privately controlled.',
  demoDate: '2026-09-15',
}

export const PEOPLE: User[] = [
  {
    key: 'maya', name: 'Maya Kapoor', role: 'CEO', roleKey: 'CEO', department: 'Leadership',
    departments: ['Leadership', 'Finance', 'Product', 'Engineering', 'Sales', 'Security', 'HR'],
    clearance: 5, email: 'maya.kapoor@nexacore.io', initials: 'MK', accent: '#3f4551', isDemoUser: true,
  },
  {
    key: 'arjun', name: 'Arjun Mehta', role: 'CTO', roleKey: 'CTO', department: 'Engineering',
    departments: ['Engineering', 'Product', 'Security', 'Leadership'],
    clearance: 5, email: 'arjun.mehta@nexacore.io', initials: 'AM', accent: '#2f5f8f', isDemoUser: true,
  },
  {
    key: 'rohan', name: 'Rohan Shah', role: 'Engineering Lead', roleKey: 'ENGINEERING_LEAD', department: 'Engineering',
    departments: ['Engineering', 'Product'],
    clearance: 4, email: 'rohan.shah@nexacore.io', initials: 'RS', accent: '#4c7a4c', isDemoUser: true,
  },
  {
    key: 'priya', name: 'Priya Nair', role: 'Security Lead', roleKey: 'SECURITY_LEAD', department: 'Security',
    departments: ['Security', 'Engineering'],
    clearance: 5, email: 'priya.nair@nexacore.io', initials: 'PN', accent: '#8f4c4c', isDemoUser: false,
  },
  {
    key: 'ananya', name: 'Ananya Rao', role: 'Sales Lead', roleKey: 'SALES_LEAD', department: 'Sales',
    departments: ['Sales', 'Customer Success'],
    clearance: 3, email: 'ananya.rao@nexacore.io', initials: 'AR', accent: '#8a6d3b', isDemoUser: true,
  },
  {
    key: 'kunal', name: 'Kunal Verma', role: 'Intern', roleKey: 'INTERN', department: 'Engineering',
    departments: ['Engineering'],
    clearance: 1, email: 'kunal.verma@nexacore.io', initials: 'KV', accent: '#5b7a8c', isDemoUser: true,
  },
]

export const DEMO_USER_KEYS = ['maya', 'arjun', 'rohan', 'ananya', 'kunal']

// ------------------------------ Projects -----------------------------------

export const PROJECTS: Project[] = [
  {
    key: 'orion', name: 'Project Orion', description: 'Private inference platform for enterprise customers.',
    status: 'AT RISK', health: 'RECOVERING', ownerKey: 'arjun', team: 'Platform Engineering',
    startedOn: '2026-01-12', targetOn: '2026-08-15', progress: 0.78, budgetUsd: 2_400_000,
    customerKeys: ['acme', 'vertex'], memberKeys: ['rohan', 'arjun', 'priya', 'kunal'], repoKeys: ['orion-core', 'orion-gateway'],
  },
  {
    key: 'atlas', name: 'Project Atlas', description: 'Self-serve onboarding and activation flows.',
    status: 'ON TRACK', health: 'ON_TRACK', ownerKey: 'arjun', team: 'Product Engineering',
    startedOn: '2026-03-02', targetOn: '2026-10-30', progress: 0.62, budgetUsd: 900_000,
    customerKeys: ['helix', 'northstar'], memberKeys: ['rohan', 'kunal'], repoKeys: ['atlas-web'],
  },
  {
    key: 'sentinel', name: 'Project Sentinel', description: 'Continuous security posture monitoring.',
    status: 'ACTIVE', health: 'ON_TRACK', ownerKey: 'priya', team: 'Security Engineering',
    startedOn: '2026-02-10', targetOn: '2026-11-20', progress: 0.45, budgetUsd: 700_000,
    customerKeys: ['vertex'], memberKeys: ['priya', 'rohan'], repoKeys: ['sentinel-scanner'],
  },
  {
    key: 'mercury', name: 'Project Mercury', description: 'Billing and usage metering consolidation.',
    status: 'ON TRACK', health: 'AT_RISK', ownerKey: 'arjun', team: 'Payments Engineering',
    startedOn: '2026-04-01', targetOn: '2026-09-30', progress: 0.71, budgetUsd: 1_100_000,
    customerKeys: ['acme'], memberKeys: ['rohan'], repoKeys: ['mercury-billing'],
  },
]

export const CUSTOMERS: Customer[] = [
  {
    key: 'acme', name: 'Acme Industrial', industry: 'Industrial manufacturing', tier: 'ENTERPRISE',
    status: 'ACTIVE', health: 'AT RISK', arrUsd: 1_450_000, since: '2024-06-01',
    csmKey: 'ananya', aeKey: 'ananya',
    description: 'Largest enterprise account. Orion design partner; strict data-residency requirements.',
    contacts: [
      { name: 'Derek Voss', title: 'VP Infrastructure', email: 'd.voss@acme-ind.com' },
      { name: 'Sarah Lin', title: 'Head of Platform', email: 's.lin@acme-ind.com' },
    ],
    escalationRisk: 'HIGH',
  },
  {
    key: 'vertex', name: 'Vertex Health', industry: 'Healthcare analytics', tier: 'ENTERPRISE',
    status: 'ACTIVE', health: 'HEALTHY', arrUsd: 890_000, since: '2025-02-01',
    csmKey: 'ananya', aeKey: 'ananya',
    description: 'Regulated deployment; Sentinel pilot, HIPAA-aligned data boundary.',
    contacts: [{ name: 'Miguel Torres', title: 'Director of Data', email: 'm.torres@vertexhealth.com' }],
    escalationRisk: 'MEDIUM',
  },
  {
    key: 'northstar', name: 'Northstar Logistics', industry: 'Logistics', tier: 'GROWTH',
    status: 'ACTIVE', health: 'HEALTHY', arrUsd: 320_000, since: '2025-09-01',
    csmKey: 'ananya', aeKey: 'ananya',
    description: 'Route-optimization workloads on Atlas onboarding flows.',
    contacts: [{ name: 'Ada Okafor', title: 'CTO', email: 'a.okafor@northstar.co' }],
    escalationRisk: 'LOW',
  },
  {
    key: 'helix', name: 'Helix Robotics', industry: 'Robotics', tier: 'GROWTH',
    status: 'ONBOARDING', health: 'HEALTHY', arrUsd: 210_000, since: '2026-05-01',
    csmKey: 'ananya', aeKey: 'ananya',
    description: 'New logo; Atlas self-serve onboarding pilot customer.',
    contacts: [{ name: 'Rin Takahashi', title: 'VP Eng', email: 'rin@helixrobotics.com' }],
    escalationRisk: 'LOW',
  },
]

// ------------------------------- Sources -----------------------------------

export const SOURCES: Source[] = [
  { key: 'slack', name: 'Slack', kind: 'Messages', description: '#engineering, #orion, #sales, #exec', category: 'PUBLIC', status: 'CONNECTED', lastSync: '2026-09-15T08:12:00', objects: 41218, coverage: 0.99, color: '#4a154b' },
  { key: 'github', name: 'GitHub', kind: 'Code & PRs', description: '6 repos · PRs, reviews, incidents', category: 'ENGINEERING', status: 'CONNECTED', lastSync: '2026-09-15T07:45:00', objects: 8867, coverage: 0.98, color: '#24292f' },
  { key: 'drive', name: 'Google Drive', kind: 'Documents', description: 'Contracts, board memos, policies', category: 'CUSTOMER', status: 'CONNECTED', lastSync: '2026-09-14T22:30:00', objects: 2341, coverage: 0.97, color: '#1a73e8' },
  { key: 'notion', name: 'Notion', kind: 'Wiki', description: 'Specs, RFCs, runbooks', category: 'PUBLIC', status: 'CONNECTED', lastSync: '2026-09-15T06:10:00', objects: 1876, coverage: 0.96, color: '#111111' },
  { key: 'jira', name: 'Jira', kind: 'Tickets', description: 'Delivery of record', category: 'ENGINEERING', status: 'CONNECTED', lastSync: '2026-09-15T07:58:00', objects: 5620, coverage: 0.99, color: '#0052cc' },
  { key: 'crm', name: 'CRM', kind: 'Accounts', description: 'Accounts, opportunities, notes', category: 'CUSTOMER', status: 'CONNECTED', lastSync: '2026-09-13T18:02:00', objects: 942, coverage: 0.92, color: '#0e9f6e' },
  { key: 'email', name: 'Email', kind: 'Threads', description: 'External threads, contracts', category: 'CUSTOMER', status: 'DEGRADED', lastSync: '2026-09-11T14:20:00', objects: 3290, coverage: 0.71, color: '#c5221f' },
  { key: 'meetings', name: 'Meeting Transcripts', kind: 'Transcripts', description: 'Decision-grade conversations', category: 'EXECUTIVE', status: 'CONNECTED', lastSync: '2026-09-15T09:02:00', objects: 1108, coverage: 0.94, color: '#6b5b95' },
  { key: 'docs', name: 'Internal Docs', kind: 'Documents', description: 'HR, finance, policy PDFs', category: 'HR', status: 'CONNECTED', lastSync: '2026-09-12T11:44:00', objects: 640, coverage: 0.88, color: '#5b7a8c' },
  { key: 'db', name: 'Ops Database', kind: 'Snapshots', description: 'Nightly metric snapshots', category: 'PRODUCT', status: 'CONNECTED', lastSync: '2026-09-15T03:00:00', objects: 2140, coverage: 1.0, color: '#4c7a4c' },
  { key: 'board', name: 'Board Portal', kind: 'Documents', description: 'Strategy memos, minutes', category: 'EXECUTIVE', status: 'CONNECTED', lastSync: '2026-09-10T09:00:00', objects: 118, coverage: 0.99, color: '#3f4551' },
  { key: 'uploads', name: 'Uploaded Files', kind: 'Files', description: 'Locally ingested documents', category: 'PUBLIC', status: 'CONNECTED', lastSync: '2026-09-15T08:40:00', objects: 12, coverage: 1.0, color: '#2f5f8f' },
]

// ------------------------------- Memories ----------------------------------
// Dates use ISO strings. validTo set ⇒ superseded at that date (temporal memory).

export const MEMORIES: Memory[] = [
  {
    code: 'MEM-1001', statement: 'Orion approved Architecture A — shared API gateway — as the serving design.',
    detail: 'RFC-114 approved by Arjun Mehta. Shared gateway handles auth, rate limiting and model fan-out for all Orion tenants.',
    type: 'DECISION', category: 'ENGINEERING', entityKeys: ['orion', 'arch-a', 'arjun'],
    sourceKey: 'notion', sourceRef: 'RFC-114 · Orion serving architecture', date: '2026-03-14',
    validFrom: '2026-03-14', validTo: '2026-05-03', confidence: 0.99, status: 'SUPERSEDED', supersededBy: 'MEM-1011', importance: 0.9,
  },
  {
    code: 'MEM-1002', statement: 'Orion production load testing began on the shared gateway.',
    detail: 'Target: 12k concurrent inference sessions at p95 < 800ms. Baseline run on 3 gateway nodes.',
    type: 'EVENT', category: 'ENGINEERING', entityKeys: ['orion', 'arch-a', 'rohan'],
    sourceKey: 'jira', sourceRef: 'ORION-241 · Load testing milestone', date: '2026-04-02',
    validFrom: '2026-04-02', confidence: 0.97, status: 'CURRENT', importance: 0.7,
  },
  {
    code: 'MEM-1003', statement: 'Gateway saturation detected under concurrent load — p95 latency exceeded 4 seconds.',
    detail: 'Root cause: noisy-neighbor contention in the shared auth middleware thread-pool. Auth re-validation serialized on a single lock across tenants.',
    type: 'FACT', category: 'ENGINEERING', entityKeys: ['orion', 'arch-a', 'rohan'],
    sourceKey: 'github', sourceRef: 'incident #92 · gateway saturation', date: '2026-04-11',
    validFrom: '2026-04-11', confidence: 0.96, status: 'CURRENT', importance: 0.95,
  },
  {
    code: 'MEM-1004', statement: 'Mitigation attempt — gateway connection pooling and cache warm-up — failed to clear the latency budget.',
    detail: 'Hotfix v2.14.3 recovered ~15% p95 but left tail latency above SLO. Rollback kept.',
    type: 'EVENT', category: 'ENGINEERING', entityKeys: ['orion', 'arch-a', 'rohan'],
    sourceKey: 'github', sourceRef: 'PR #475 · hotfix v2.14.3', date: '2026-04-18',
    validFrom: '2026-04-18', confidence: 0.94, status: 'CURRENT', importance: 0.8,
  },
  {
    code: 'MEM-1005', statement: 'Rohan escalated the gateway risk to leadership; launch delay acknowledged.',
    detail: 'Slack thread in #exec-channel: “Gateway won’t hit SLO without a redesign. We should stop pretending otherwise.”',
    type: 'EVENT', category: 'ENGINEERING', entityKeys: ['orion', 'rohan', 'arjun'],
    sourceKey: 'slack', sourceRef: '#exec-channel · Apr 20 thread', date: '2026-04-20',
    validFrom: '2026-04-20', confidence: 0.93, status: 'CURRENT', importance: 0.85,
  },
  {
    code: 'MEM-1006', statement: 'Architecture review convened; three options scored against latency and isolation criteria.',
    detail: 'Options: keep Arch A with partitioning, hybrid cell-based gateway, full Architecture B (dedicated inference cells per tenant).',
    type: 'EVENT', category: 'ENGINEERING', entityKeys: ['orion', 'arch-b', 'arjun', 'rohan'],
    sourceKey: 'meetings', sourceRef: 'Architecture Review · Apr 26 transcript', date: '2026-04-26',
    validFrom: '2026-04-26', confidence: 0.98, status: 'CURRENT', importance: 0.9,
  },
  {
    code: 'MEM-1007', statement: 'Acme requested customer-controlled data isolation as a contract condition for the Orion rollout.',
    detail: 'Enterprise contract amendment C-2026-114: dedicated inference cells, customer-held keys, in-region processing. Financial terms confidential.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['orion', 'acme', 'ananya'],
    sourceKey: 'drive', sourceRef: 'Contract amendment C-2026-114', date: '2026-04-24',
    validFrom: '2026-04-24', confidence: 0.97, status: 'CURRENT', importance: 0.95,
    redactedFields: ['contract_value', 'unit_price', 'margin'],
  },
  {
    code: 'MEM-1008', statement: 'Security review elevated customer-controlled isolation to a release requirement for Orion.',
    detail: 'Priya Nair’s review: shared multi-tenant gateway fails the data-boundary bar for regulated accounts. Blocks GA.',
    type: 'POLICY', category: 'SECURITY', entityKeys: ['orion', 'priya', 'arch-b'],
    sourceKey: 'docs', sourceRef: 'Security Review SR-88', date: '2026-04-29',
    validFrom: '2026-04-29', confidence: 0.95, status: 'CURRENT', importance: 0.9,
  },
  {
    code: 'MEM-1011', statement: 'Architecture B — dedicated inference cells per tenant — became the active Orion architecture.',
    detail: 'Approved at the Apr 26 engineering review after the shared gateway failed load criteria. Auth moves into each cell; no cross-tenant middleware.',
    type: 'DECISION', category: 'ENGINEERING', entityKeys: ['orion', 'arch-b', 'arjun'],
    sourceKey: 'meetings', sourceRef: 'Architecture Review · Apr 26', date: '2026-05-03',
    validFrom: '2026-05-03', confidence: 0.96, status: 'CURRENT', importance: 1.0,
  },
  {
    code: 'MEM-1012', statement: 'Orion launch target moved from June 15 to August 15.',
    detail: 'Re-plan after architecture migration. Six weeks attributed to cell-based rework and re-certification of the load criteria.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['orion'],
    sourceKey: 'jira', sourceRef: 'ORION-260 · Re-plan', date: '2026-05-05',
    validFrom: '2026-05-05', confidence: 0.98, status: 'CURRENT', importance: 0.9,
  },
  {
    code: 'MEM-1013', statement: 'Orion launch scheduled for June 15.',
    detail: 'Original plan of record communicated to customers in the March enablement deck.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['orion', 'acme'],
    sourceKey: 'slack', sourceRef: '#orion · March planning thread', date: '2026-03-20',
    validFrom: '2026-03-20', validTo: '2026-05-05', confidence: 0.9, status: 'SUPERSEDED', supersededBy: 'MEM-1012', importance: 0.8,
  },
  {
    code: 'MEM-1014', statement: 'Orion cell migration is 78% complete; two customers remain on staged rollout.',
    detail: 'Acme and Vertex validate in staging. GA gate: 7-day clean soak at 12k sessions.',
    type: 'PROJECT_STATE', category: 'ENGINEERING', entityKeys: ['orion', 'rohan'],
    sourceKey: 'jira', sourceRef: 'ORION-271 · Migration tracker', date: '2026-09-08',
    validFrom: '2026-09-08', confidence: 0.95, status: 'CURRENT', importance: 0.85,
  },
  {
    code: 'MEM-1015', statement: 'Orion GPU allocation contention remains the final reliability gap for GA.',
    detail: 'Cell autoscaling contends with Atlas batch jobs for capacity in us-east. Mitigation plan in review.',
    type: 'FACT', category: 'ENGINEERING', entityKeys: ['orion', 'rohan'],
    sourceKey: 'github', sourceRef: 'incident #101 · GPU contention', date: '2026-09-02',
    validFrom: '2026-09-02', confidence: 0.88, status: 'CURRENT', importance: 0.7,
  },
  {
    code: 'MEM-1016', statement: 'Acme contract upgraded from Standard to Enterprise with dedicated cells amendment.',
    detail: 'ARR impact recorded in CRM. Financial fields are restricted below L4.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['acme', 'ananya', 'orion'],
    sourceKey: 'crm', sourceRef: 'CRM-4471 · Acme renewal', date: '2026-05-12',
    validFrom: '2026-05-12', confidence: 0.97, status: 'CURRENT', importance: 0.9,
    redactedFields: ['arr_usd', 'contract_value', 'margin'],
  },
  {
    code: 'MEM-1017', statement: 'Acme renewal risk raised to HIGH pending Orion GA date commitment.',
    detail: 'Derek Voss (VP Infrastructure) reiterated that the dedicated-cell condition is contractual, not aspirational.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['acme', 'ananya'],
    sourceKey: 'crm', sourceRef: 'CRM-4512 · Escalation note', date: '2026-08-29',
    validFrom: '2026-08-29', confidence: 0.93, status: 'CURRENT', importance: 0.85,
  },
  {
    code: 'MEM-1018', statement: 'Acme is Orion’s design partner for private inference cells.',
    detail: 'Executive sponsor alignment from the January kickoff; Acme receives staged builds first.',
    type: 'RELATIONSHIP', category: 'CUSTOMER', entityKeys: ['acme', 'orion', 'ananya'],
    sourceKey: 'crm', sourceRef: 'CRM-4300 · Account plan', date: '2026-01-15',
    validFrom: '2026-01-15', confidence: 0.96, status: 'CURRENT', importance: 0.75,
  },
  {
    code: 'MEM-1019', statement: 'Acme ran a proof-of-concept on shared-gateway Orion and rejected it for regulated workloads.',
    detail: 'POC feedback from March: latency tails and shared tenancy were both disqualifying.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['acme', 'orion'],
    sourceKey: 'email', sourceRef: 'Acme POC feedback · Mar 9', date: '2026-03-09',
    validFrom: '2026-03-09', confidence: 0.91, status: 'CURRENT', importance: 0.7,
  },
  {
    code: 'MEM-1021', statement: 'Security policy moved from manual review to automated posture checks for releases.',
    detail: 'Sentinel rules run in CI; manual sign-off only for exceptions.',
    type: 'POLICY', category: 'SECURITY', entityKeys: ['sentinel', 'priya'],
    sourceKey: 'notion', sourceRef: 'Security policy v4.2', date: '2026-07-01',
    validFrom: '2026-07-01', confidence: 0.94, status: 'CURRENT', importance: 0.8,
  },
  {
    code: 'MEM-1022', statement: 'Executive strategy: win regulated industries via private, customer-controlled inference.',
    detail: 'Board strategy memo BSP-26: verticalized private deployments are the wedge into healthcare, industrial and finance.',
    type: 'FACT', category: 'EXECUTIVE', entityKeys: ['orion', 'maya'],
    sourceKey: 'board', sourceRef: 'Board memo BSP-26', date: '2026-02-20',
    validFrom: '2026-02-20', confidence: 0.97, status: 'CURRENT', importance: 0.95,
  },
  {
    code: 'MEM-1023', statement: 'FY27 planning assumes Orion GA by September with 3 regulated-industry lighthouse accounts.',
    detail: 'Revenue model ties Enterprise tier expansion to private-cell availability. Targets confidential.',
    type: 'FACT', category: 'EXECUTIVE', entityKeys: ['orion', 'maya', 'acme'],
    sourceKey: 'board', sourceRef: 'FY27 operating plan v3', date: '2026-08-15',
    validFrom: '2026-08-15', confidence: 0.95, status: 'CURRENT', importance: 0.95,
    redactedFields: ['revenue_targets', 'margin'],
  },
  {
    code: 'MEM-1024', statement: 'Atlas self-serve onboarding shipped cohort 1 to Helix Robotics.',
    detail: 'Activation time from signup to first inference job reduced from 11 days to 2.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['atlas', 'helix'],
    sourceKey: 'jira', sourceRef: 'ATLAS-88 · Cohort 1', date: '2026-08-20',
    validFrom: '2026-08-20', confidence: 0.94, status: 'CURRENT', importance: 0.65,
  },
  {
    code: 'MEM-1025', statement: 'Mercury consolidated three billing systems into a single metering pipeline.',
    detail: 'Usage events now land in one ledger; invoice parity checks passing at 99.2%.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['mercury'],
    sourceKey: 'github', sourceRef: 'mercury-billing · release 1.4', date: '2026-09-05',
    validFrom: '2026-09-05', confidence: 0.92, status: 'CURRENT', importance: 0.6,
  },
  {
    code: 'MEM-1026', statement: 'Distributed inference expertise is concentrated on the Orion platform team.',
    detail: 'Rohan Shah (cell scheduler, load work), Arjun Mehta (architecture), Priya Nair (isolation review), Kunal Verma (load-test dashboards under supervision).',
    type: 'RELATIONSHIP', category: 'ENGINEERING', entityKeys: ['rohan', 'arjun', 'priya', 'orion'],
    sourceKey: 'github', sourceRef: 'Derived from PRs, reviews & authored docs', date: '2026-09-01',
    validFrom: '2026-09-01', confidence: 0.9, status: 'CURRENT', importance: 0.7,
  },
  {
    code: 'MEM-1027', statement: 'Orion onboarding runbook updated for the cell-based architecture.',
    detail: 'Tenant provisioning now creates a dedicated cell, injects customer keys, and registers the cell in the service mesh.',
    type: 'FACT', category: 'ENGINEERING', entityKeys: ['orion', 'kunal'],
    sourceKey: 'notion', sourceRef: 'Orion runbook v9', date: '2026-08-25',
    validFrom: '2026-08-25', confidence: 0.9, status: 'CURRENT', importance: 0.5,
  },
  {
    code: 'MEM-1028', statement: 'Vertex Health expanded to the Enterprise tier contingent on Sentinel posture reports.',
    detail: 'HIPAA-aligned boundary review completed; expansion scheduled for Q4.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['vertex', 'ananya', 'priya'],
    sourceKey: 'crm', sourceRef: 'CRM-4489 · Vertex expansion', date: '2026-07-18',
    validFrom: '2026-07-18', confidence: 0.92, status: 'CURRENT', importance: 0.7,
    redactedFields: ['arr_usd', 'contract_value'],
  },
  {
    code: 'MEM-1029', statement: 'Northstar route-optimization workloads migrated onto Atlas onboarding.',
    detail: 'Cut over completed without incident; nightly batch windows halved.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['northstar', 'atlas'],
    sourceKey: 'jira', sourceRef: 'ATLAS-95 · Northstar cutover', date: '2026-06-30',
    validFrom: '2026-06-30', confidence: 0.9, status: 'CURRENT', importance: 0.5,
  },
  {
    code: 'MEM-1030', statement: 'Kunal Verma joined as an engineering intern on the Orion load-tooling workstream.',
    detail: 'Onboarding buddy: Rohan Shah. Scope: dashboards and test fixtures only.',
    type: 'FACT', category: 'PUBLIC', entityKeys: ['kunal', 'rohan', 'orion'],
    sourceKey: 'docs', sourceRef: 'Intern onboarding record', date: '2026-07-06',
    validFrom: '2026-07-06', confidence: 0.99, status: 'CURRENT', importance: 0.4,
  },
  {
    code: 'MEM-1031', statement: 'Q3 all-hands theme: “private inference as the enterprise wedge”.',
    detail: 'Company-wide narrative aligned to board strategy BSP-26.',
    type: 'EVENT', category: 'PUBLIC', entityKeys: ['maya', 'orion'],
    sourceKey: 'meetings', sourceRef: 'All-hands · Jul 3', date: '2026-07-03',
    validFrom: '2026-07-03', confidence: 0.95, status: 'CURRENT', importance: 0.5,
  },
  {
    code: 'MEM-1032', statement: 'Board raised the Orion delay in the August strategy session; GA credibility flagged.',
    detail: 'Minutes note a second slip would trigger a formal program review.',
    type: 'EVENT', category: 'EXECUTIVE', entityKeys: ['orion', 'maya'],
    sourceKey: 'board', sourceRef: 'Board minutes · Aug 15', date: '2026-08-15',
    validFrom: '2026-08-15', confidence: 0.96, status: 'CURRENT', importance: 0.95,
  },
  {
    code: 'MEM-1033', statement: 'Support volume for Orion staging tenants within expected bounds post-migration.',
    detail: 'Weekly support digest: 9 tickets, 2 on cell provisioning errors, all resolved.',
    type: 'FACT', category: 'PUBLIC', entityKeys: ['orion'],
    sourceKey: 'crm', sourceRef: 'Support digest W36', date: '2026-09-04',
    validFrom: '2026-09-04', confidence: 0.9, status: 'CURRENT', importance: 0.3,
  },
  {
    code: 'MEM-1034', statement: 'FY27 revenue targets and margin model for private inference.',
    detail: 'Targets: Enterprise tier expansion 118% NRR assumption; margin floor 62% on dedicated cells. Restricted to Executive.',
    type: 'FACT', category: 'FINANCE', entityKeys: ['orion', 'maya'],
    sourceKey: 'board', sourceRef: 'FY27 operating plan v3 · financials', date: '2026-08-15',
    validFrom: '2026-08-15', confidence: 0.96, status: 'CURRENT', importance: 0.95,
    redactedFields: ['revenue_targets', 'margin', 'contract_value'],
  },
  {
    code: 'MEM-1035', statement: 'Headcount plan adds 14 platform engineers to support private-cell demand.',
    detail: 'Seven offers already out; start dates staggered Oct–Jan. Compensation bands confidential.',
    type: 'FACT', category: 'HR', entityKeys: ['arjun', 'maya'],
    sourceKey: 'docs', sourceRef: 'FY27 headcount plan', date: '2026-08-20',
    validFrom: '2026-08-20', confidence: 0.94, status: 'CURRENT', importance: 0.8,
    redactedFields: ['comp_bands', 'performance_notes'],
  },
  {
    code: 'MEM-1036', statement: 'Security review found two medium findings in the cell key-rotation service.',
    detail: 'Findings resolved; retest scheduled with the 1.5 release.',
    type: 'POLICY', category: 'SECURITY', entityKeys: ['sentinel', 'priya'],
    sourceKey: 'docs', sourceRef: 'SR-91 · key rotation review', date: '2026-08-28',
    validFrom: '2026-08-28', confidence: 0.93, status: 'CURRENT', importance: 0.75,
  },
  {
    code: 'MEM-1037', statement: 'Legal completed review of the Acme data-residency amendment.',
    detail: 'In-region processing clause accepted; carve-outs documented for support access.',
    type: 'POLICY', category: 'SECURITY', entityKeys: ['acme'],
    sourceKey: 'drive', sourceRef: 'Legal review LR-42', date: '2026-05-20',
    validFrom: '2026-05-20', confidence: 0.95, status: 'CURRENT', importance: 0.7,
  },
  {
    code: 'MEM-1038', statement: 'Orion architecture is hybrid until the final cell migration lands.',
    detail: 'Tenants route through the legacy gateway front door; serving happens in dedicated cells behind it.',
    type: 'PROJECT_STATE', category: 'ENGINEERING', entityKeys: ['orion', 'arch-a', 'arch-b'],
    sourceKey: 'github', sourceRef: 'orion-core · design doc', date: '2026-09-08',
    validFrom: '2026-09-08', confidence: 0.89, status: 'CURRENT', importance: 0.6,
  },
  {
    code: 'MEM-1039', statement: 'Orion launch scheduled for June 15 (per March enablement deck).',
    detail: 'This duplicates MEM-1013 from a different source system — kept to demonstrate contradiction detection.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['orion'],
    sourceKey: 'email', sourceRef: 'Enablement deck distribution', date: '2026-03-21',
    validFrom: '2026-03-21', validTo: '2026-05-05', confidence: 0.82, status: 'DISPUTED', supersededBy: 'MEM-1012', importance: 0.4,
  },
  {
    code: 'MEM-1040', statement: 'Orion is on track for the August GA date with no further slips expected.',
    detail: 'Status report drafted before the GPU-contention incident was filed.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['orion'],
    sourceKey: 'jira', sourceRef: 'ORION-268 · Status rollup', date: '2026-08-27',
    validFrom: '2026-08-27', validTo: '2026-09-02', confidence: 0.85, status: 'SUPERSEDED', supersededBy: 'MEM-1015', importance: 0.5,
  },
  {
    code: 'MEM-1041', statement: 'Atlas cohort 2 onboarding cohort defined for Northstar and two new logos.',
    detail: 'Cohort 2 starts October 5; Helix feedback incorporated into activation checklist.',
    type: 'PROJECT_STATE', category: 'PRODUCT', entityKeys: ['atlas', 'northstar'],
    sourceKey: 'notion', sourceRef: 'Atlas rollout plan', date: '2026-09-10',
    validFrom: '2026-09-10', confidence: 0.9, status: 'CURRENT', importance: 0.5,
  },
  {
    code: 'MEM-1042', statement: 'Slack thread speculates Orion may slip again due to GPU capacity.',
    detail: 'Eng chatter, not a decision record. Mentioned here so the Brain can contrast rumor with the authoritative plan.',
    type: 'EVENT', category: 'ENGINEERING', entityKeys: ['orion', 'kunal'],
    sourceKey: 'slack', sourceRef: '#orion · Sep 6 thread', date: '2026-09-06',
    validFrom: '2026-09-06', confidence: 0.6, status: 'DISPUTED', importance: 0.3,
  },
  {
    code: 'MEM-1043', statement: 'Mercury billing parity failures traced to timezone bucketing in usage rollups.',
    detail: 'Fix in review; no customer impact yet — invoicing unaffected this cycle.',
    type: 'FACT', category: 'ENGINEERING', entityKeys: ['mercury', 'rohan'],
    sourceKey: 'github', sourceRef: 'mercury-billing · issue #310', date: '2026-09-09',
    validFrom: '2026-09-09', confidence: 0.88, status: 'CURRENT', importance: 0.55,
  },
  {
    code: 'MEM-1044', statement: 'Helix pilot NPS 62; onboarding friction concentrated in key management.',
    detail: 'Key-management UX flagged for Atlas cohort 2.',
    type: 'CUSTOMER_CONTEXT', category: 'CUSTOMER', entityKeys: ['helix', 'atlas'],
    sourceKey: 'crm', sourceRef: 'CRM-4530 · Helix pilot survey', date: '2026-09-11',
    validFrom: '2026-09-11', confidence: 0.87, status: 'CURRENT', importance: 0.5,
    redactedFields: ['contract_value'],
  },
  {
    code: 'MEM-1045', statement: 'Sentinel automated posture checks now gate 100% of production releases.',
    detail: 'Exception rate 3% with manual sign-off; target <1% next quarter.',
    type: 'POLICY', category: 'SECURITY', entityKeys: ['sentinel', 'priya'],
    sourceKey: 'jira', sourceRef: 'SENT-77 · CI gate rollout', date: '2026-09-12',
    validFrom: '2026-09-12', confidence: 0.93, status: 'CURRENT', importance: 0.65,
  },
]

// ------------------------------ Decisions ----------------------------------

export const DECISIONS: Decision[] = [
  {
    code: 'DEC-201', title: 'Orion Architecture Migration — replace shared gateway with dedicated inference cells',
    date: '2026-05-03', ownerKey: 'arjun', projectKey: 'orion', status: 'ACTIVE', category: 'ENGINEERING',
    problem: 'Shared Architecture A gateway saturated under concurrent load; p95 latency exceeded 4s against an 800ms SLO and the April mitigation failed.',
    decision: 'Approve Architecture B: dedicated inference cells per tenant with auth moved into each cell. Migrate tenants in staged waves.',
    alternatives: [
      { name: 'Architecture A + partitioning', note: 'Rejected — partitioning bought time, not headroom; isolation bar still unmet.' },
      { name: 'Architecture B (cells)', chosen: true, note: 'Meets latency and data-isolation bar; contractual fit with Acme amendment.' },
      { name: 'Hybrid cell gateway', note: 'Deferred — kept as interim routing until migration completes.' },
    ],
    impact: 'Launch moved June 15 → August 15 (six weeks). p95 latency now 610ms at 12k sessions. Unlocks regulated-industry segment.',
    confidence: 0.94,
    evidence: ['MEM-1001', 'MEM-1003', 'MEM-1004', 'MEM-1006', 'MEM-1007', 'MEM-1008'],
    supersedes: 'DEC-205',
  },
  {
    code: 'DEC-205', title: 'Orion serving architecture — adopt shared API gateway (Architecture A)',
    date: '2026-03-14', ownerKey: 'arjun', projectKey: 'orion', status: 'SUPERSEDED', category: 'ENGINEERING',
    problem: 'Orion needed a serving design that could ship fast with shared auth and rate limiting.',
    decision: 'Adopt Architecture A: a shared API gateway in front of pooled inference workers.',
    alternatives: [
      { name: 'Architecture A (shared gateway)', chosen: true, note: 'Fastest path to beta.' },
      { name: 'Dedicated cells', note: 'Deferred — judged premature in March.' },
    ],
    impact: 'Enabled the March beta; saturated in April under production-shaped load.',
    confidence: 0.9,
    evidence: ['MEM-1001'],
  },
  {
    code: 'DEC-208', title: 'Acme contract upgrade — Enterprise tier with dedicated-cells amendment',
    date: '2026-05-12', ownerKey: 'ananya', customerKey: 'acme', status: 'ACTIVE', category: 'CUSTOMER',
    problem: 'Acme made customer-controlled data isolation a contractual condition for the Orion rollout; renewal at risk.',
    decision: 'Upgrade Acme to the Enterprise tier with amendment C-2026-114: dedicated cells, customer-held keys, in-region processing.',
    alternatives: [
      { name: 'Enterprise upgrade with amendment', chosen: true, note: 'Anchors the flagship account to Orion B.' },
      { name: 'Hold on Standard tier', note: 'Rejected — breach of the stated condition; renewal likely lost.' },
    ],
    impact: 'ARR impact recorded in CRM (restricted below L4). Sets precedent for regulated-industry contracts.',
    confidence: 0.93,
    evidence: ['MEM-1007', 'MEM-1016', 'MEM-1019'],
    sensitiveFields: ['arr_usd', 'contract_value', 'margin'],
  },
  {
    code: 'DEC-210', title: 'Security policy — automated posture gates for all releases',
    date: '2026-07-01', ownerKey: 'priya', projectKey: 'sentinel', status: 'ACTIVE', category: 'SECURITY',
    problem: 'Manual security review was the release bottleneck and missed regressions between reviews.',
    decision: 'Run Sentinel posture checks in CI; manual sign-off only for exceptions.',
    alternatives: [
      { name: 'Automated CI gates', chosen: true },
      { name: 'Status quo (manual)', note: 'Rejected — throughput too low.' },
    ],
    impact: 'Release review time down 60%; 100% of production releases gated as of Sep 12.',
    confidence: 0.92,
    evidence: ['MEM-1021', 'MEM-1045'],
  },
  {
    code: 'DEC-212', title: 'Orion re-plan — GA moved to August 15',
    date: '2026-05-05', ownerKey: 'arjun', projectKey: 'orion', status: 'ACTIVE', category: 'PRODUCT',
    problem: 'Architecture migration invalidated the June 15 launch plan.',
    decision: 'Move GA to August 15; stage tenant migration in three waves; hold customer commitments until wave 2 completes.',
    alternatives: [
      { name: 'August 15 re-plan', chosen: true },
      { name: 'Hold June date on Arch A', note: 'Rejected — fails Acme condition and SLO.' },
    ],
    impact: 'Six-week delay; customer comms managed by Sales; board informed.',
    confidence: 0.95,
    evidence: ['MEM-1012', 'MEM-1013', 'MEM-1011'],
  },
  {
    code: 'DEC-214', title: 'FY27 strategy — regulated industries via private inference',
    date: '2026-08-15', ownerKey: 'maya', status: 'ACTIVE', category: 'EXECUTIVE',
    problem: 'Growth requires a defensible wedge beyond unregulated mid-market.',
    decision: 'Concentrate FY27 on regulated industries (healthcare, industrial, finance) delivered through private, customer-controlled inference.',
    alternatives: [
      { name: 'Regulated-industry wedge', chosen: true },
      { name: 'Volume mid-market push', note: 'Deferred — lower margin, weaker moat.' },
    ],
    impact: 'FY27 plan ties hiring and capacity to private-cell demand; targets confidential.',
    confidence: 0.96,
    evidence: ['MEM-1022', 'MEM-1023', 'MEM-1034'],
    sensitiveFields: ['revenue_targets', 'margin'],
  },
  {
    code: 'DEC-216', title: 'Mercury billing consolidation — single metering ledger',
    date: '2026-06-10', ownerKey: 'arjun', projectKey: 'mercury', status: 'ACTIVE', category: 'ENGINEERING',
    problem: 'Three billing systems produced divergent usage numbers and slow invoice cycles.',
    decision: 'Consolidate onto one metering pipeline with parity checks against legacy invoices.',
    alternatives: [
      { name: 'Single ledger', chosen: true },
      { name: 'Per-region ledgers', note: 'Rejected — reintroduces reconciliation drift.' },
    ],
    impact: 'Invoice parity at 99.2%; timezone bucketing fix in review.',
    confidence: 0.9,
    evidence: ['MEM-1025', 'MEM-1043'],
  },
  {
    code: 'DEC-218', title: 'Orion launch date — hold June 15 (reversed)',
    date: '2026-03-20', ownerKey: 'arjun', projectKey: 'orion', status: 'REVERSED', category: 'PRODUCT',
    problem: 'Original launch commitment made in the March enablement cycle.',
    decision: 'Hold June 15 as the GA date.',
    alternatives: [{ name: 'June 15', chosen: true }],
    impact: 'Reversed May 5 by DEC-212 after the architecture failure.',
    confidence: 0.85,
    evidence: ['MEM-1013'],
    supersedes: undefined,
  },
  {
    code: 'DEC-219', title: 'Atlas cohort 2 scope — include Northstar and two new logos',
    date: '2026-09-10', ownerKey: 'arjun', projectKey: 'atlas', status: 'PENDING', category: 'PRODUCT',
    problem: 'Cohort 1 validated the flows; two new logos requested earlier access.',
    decision: 'Proposed: admit Northstar + 2 logos on October 5 with the improved key-management flow.',
    alternatives: [
      { name: 'Admit 3 accounts Oct 5', chosen: true },
      { name: 'Delay to harden key UX', note: 'Considered — NPS friction is in key management.' },
    ],
    impact: 'Pending CTO sign-off expected Sep 18.',
    confidence: 0.7,
    evidence: ['MEM-1041', 'MEM-1044'],
  },
]

// --------------------------- Timeline events -------------------------------

export const EVENTS: TimelineEvent[] = [
  { code: 'EV-01', date: '2026-03-14', title: 'Architecture A approved', summary: 'RFC-114: shared API gateway becomes Orion’s serving design.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'arjun', sourceKey: 'notion', impact: 'HIGH' },
  { code: 'EV-02', date: '2026-03-20', title: 'June 15 launch committed', summary: 'Launch date communicated in the March enablement cycle.', category: 'PRODUCT', projectKey: 'orion', actorKey: 'arjun', sourceKey: 'slack', impact: 'MEDIUM' },
  { code: 'EV-03', date: '2026-03-21', title: 'Enablement deck distributed', summary: 'Deck repeats the June 15 date — later contradicted by the re-plan.', category: 'PRODUCT', projectKey: 'orion', sourceKey: 'email', impact: 'LOW' },
  { code: 'EV-04', date: '2026-04-02', title: 'Load testing begins', summary: '12k-session target on the shared gateway, p95 budget 800ms.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'rohan', sourceKey: 'jira', impact: 'MEDIUM' },
  { code: 'EV-05', date: '2026-04-11', title: 'Gateway saturation incident', summary: 'p95 exceeded 4s; auth lock contention identified as root cause.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'rohan', sourceKey: 'github', impact: 'CRITICAL' },
  { code: 'EV-06', date: '2026-04-18', title: 'Mitigation attempt failed', summary: 'Hotfix v2.14.3 recovered 15% p95 — not enough to meet SLO.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'rohan', sourceKey: 'github', impact: 'HIGH' },
  { code: 'EV-07', date: '2026-04-20', title: 'Risk escalated to leadership', summary: 'Rohan: “Gateway won’t hit SLO without a redesign.”', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'rohan', sourceKey: 'slack', impact: 'MEDIUM' },
  { code: 'EV-08', date: '2026-04-24', title: 'Acme isolation amendment', summary: 'Customer-controlled cells became a contractual condition (C-2026-114).', category: 'CUSTOMER', projectKey: 'orion', customerKey: 'acme', actorKey: 'ananya', sourceKey: 'drive', impact: 'CRITICAL' },
  { code: 'EV-09', date: '2026-04-26', title: 'Architecture review', summary: 'Three options scored; Architecture B selected for latency and isolation.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'arjun', sourceKey: 'meetings', impact: 'HIGH' },
  { code: 'EV-10', date: '2026-04-29', title: 'Security review blocks shared tenancy', summary: 'SR-88: shared gateway fails the data-boundary bar for regulated accounts.', category: 'SECURITY', projectKey: 'orion', actorKey: 'priya', sourceKey: 'docs', impact: 'HIGH' },
  { code: 'EV-11', date: '2026-05-03', title: 'Architecture B selected', summary: 'Dedicated inference cells become the Orion serving design.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'arjun', sourceKey: 'meetings', impact: 'CRITICAL' },
  { code: 'EV-12', date: '2026-05-05', title: 'GA re-plan: August 15', summary: 'Launch moved six weeks; migration staged in three waves.', category: 'PRODUCT', projectKey: 'orion', actorKey: 'arjun', sourceKey: 'jira', impact: 'HIGH' },
  { code: 'EV-13', date: '2026-05-12', title: 'Acme upgraded to Enterprise', summary: 'Contract amendment anchors Acme to Architecture B.', category: 'CUSTOMER', customerKey: 'acme', actorKey: 'ananya', sourceKey: 'crm', impact: 'HIGH' },
  { code: 'EV-14', date: '2026-06-10', title: 'Mercury consolidation kicked off', summary: 'Billing systems converge on a single metering ledger.', category: 'ENGINEERING', projectKey: 'mercury', actorKey: 'arjun', sourceKey: 'github', impact: 'MEDIUM' },
  { code: 'EV-15', date: '2026-07-01', title: 'Automated security gates live', summary: 'Sentinel posture checks run in CI for every release.', category: 'SECURITY', projectKey: 'sentinel', actorKey: 'priya', sourceKey: 'notion', impact: 'MEDIUM' },
  { code: 'EV-16', date: '2026-07-03', title: 'Q3 all-hands', summary: '“Private inference as the enterprise wedge” becomes the company narrative.', category: 'PUBLIC', actorKey: 'maya', sourceKey: 'meetings', impact: 'LOW' },
  { code: 'EV-17', date: '2026-08-15', title: 'Board strategy session', summary: 'Orion delay discussed; FY27 plan tied to private-cell demand.', category: 'EXECUTIVE', actorKey: 'maya', sourceKey: 'board', impact: 'HIGH' },
  { code: 'EV-18', date: '2026-08-20', title: 'Atlas cohort 1 shipped', summary: 'Helix onboarded; activation time cut from 11 days to 2.', category: 'PRODUCT', projectKey: 'atlas', sourceKey: 'jira', impact: 'MEDIUM' },
  { code: 'EV-19', date: '2026-09-02', title: 'GPU contention incident', summary: 'Cell autoscaling contends with Atlas batch jobs — final GA gap.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'rohan', sourceKey: 'github', impact: 'HIGH' },
  { code: 'EV-20', date: '2026-09-08', title: 'Cell migration 78% complete', summary: 'Two customers remain in staged rollout; soak test gate pending.', category: 'ENGINEERING', projectKey: 'orion', actorKey: 'rohan', sourceKey: 'jira', impact: 'MEDIUM' },
  { code: 'EV-21', date: '2026-09-10', title: 'Atlas cohort 2 proposed', summary: 'Northstar and two new logos slated for October 5.', category: 'PRODUCT', projectKey: 'atlas', actorKey: 'arjun', sourceKey: 'notion', impact: 'LOW' },
  { code: 'EV-22', date: '2026-09-12', title: 'Sentinel gates 100% of releases', summary: 'Automated posture checks fully rolled out.', category: 'SECURITY', projectKey: 'sentinel', actorKey: 'priya', sourceKey: 'jira', impact: 'MEDIUM' },
]

// ------------------------------ Graph --------------------------------------

export const ENTITIES: Entity[] = [
  { key: 'orion', name: 'Project Orion', kind: 'PROJECT', category: 'ENGINEERING', meta: 'Private inference platform' },
  { key: 'atlas', name: 'Project Atlas', kind: 'PROJECT', category: 'PRODUCT', meta: 'Self-serve onboarding' },
  { key: 'sentinel', name: 'Project Sentinel', kind: 'PROJECT', category: 'SECURITY', meta: 'Posture monitoring' },
  { key: 'mercury', name: 'Project Mercury', kind: 'PROJECT', category: 'PRODUCT', meta: 'Billing consolidation' },
  { key: 'arch-a', name: 'Architecture A', kind: 'TOPIC', category: 'ENGINEERING', meta: 'Shared gateway (retired)' },
  { key: 'arch-b', name: 'Architecture B', kind: 'TOPIC', category: 'ENGINEERING', meta: 'Dedicated inference cells' },
  { key: 'maya', name: 'Maya Kapoor', kind: 'PERSON', category: 'EXECUTIVE', meta: 'CEO' },
  { key: 'arjun', name: 'Arjun Mehta', kind: 'PERSON', category: 'ENGINEERING', meta: 'CTO' },
  { key: 'rohan', name: 'Rohan Shah', kind: 'PERSON', category: 'ENGINEERING', meta: 'Engineering Lead' },
  { key: 'priya', name: 'Priya Nair', kind: 'PERSON', category: 'SECURITY', meta: 'Security Lead' },
  { key: 'ananya', name: 'Ananya Rao', kind: 'PERSON', category: 'CUSTOMER', meta: 'Sales Lead' },
  { key: 'kunal', name: 'Kunal Verma', kind: 'PERSON', category: 'PUBLIC', meta: 'Intern' },
  { key: 'acme', name: 'Acme Industrial', kind: 'CUSTOMER', category: 'CUSTOMER', meta: 'Enterprise · design partner' },
  { key: 'vertex', name: 'Vertex Health', kind: 'CUSTOMER', category: 'CUSTOMER', meta: 'Enterprise' },
  { key: 'northstar', name: 'Northstar Logistics', kind: 'CUSTOMER', category: 'CUSTOMER', meta: 'Growth' },
  { key: 'helix', name: 'Helix Robotics', kind: 'CUSTOMER', category: 'CUSTOMER', meta: 'Growth · onboarding' },
  { key: 'dec-201', name: 'Architecture Migration', kind: 'DECISION', category: 'ENGINEERING', meta: 'DEC-201 · ACTIVE' },
  { key: 'dec-212', name: 'GA Re-plan', kind: 'DECISION', category: 'PRODUCT', meta: 'DEC-212 · ACTIVE' },
  { key: 'dec-208', name: 'Acme Enterprise Upgrade', kind: 'DECISION', category: 'CUSTOMER', meta: 'DEC-208 · ACTIVE' },
  { key: 'dec-214', name: 'FY27 Strategy', kind: 'DECISION', category: 'EXECUTIVE', meta: 'DEC-214 · ACTIVE' },
  { key: 'pr-482', name: 'GitHub PR #482', kind: 'DOCUMENT', category: 'ENGINEERING', meta: 'Architecture migration' },
  { key: 'pr-475', name: 'GitHub PR #475', kind: 'DOCUMENT', category: 'ENGINEERING', meta: 'Hotfix v2.14.3' },
  { key: 'load-test', name: 'Load Test Report', kind: 'DOCUMENT', category: 'ENGINEERING', meta: 'Apr 11 · failed SLO' },
  { key: 'incident-92', name: 'Incident #92', kind: 'EVENT', category: 'ENGINEERING', meta: 'Gateway saturation' },
  { key: 'review-apr26', name: 'Architecture Review', kind: 'EVENT', category: 'ENGINEERING', meta: 'Apr 26 · transcript' },
  { key: 'orion-core', name: 'orion-core', kind: 'REPO', category: 'ENGINEERING', meta: 'Serving platform' },
  { key: 'orion-gateway', name: 'orion-gateway', kind: 'REPO', category: 'ENGINEERING', meta: 'Legacy gateway' },
  { key: 'atlas-web', name: 'atlas-web', kind: 'REPO', category: 'PRODUCT', meta: 'Onboarding app' },
  { key: 'amend-c114', name: 'Amendment C-2026-114', kind: 'DOCUMENT', category: 'CUSTOMER', meta: 'Acme data isolation' },
  { key: 'board-bsp26', name: 'Board memo BSP-26', kind: 'DOCUMENT', category: 'EXECUTIVE', meta: 'Regulated-industry strategy' },
  { key: 'dist-inference', name: 'Distributed inference', kind: 'TOPIC', category: 'ENGINEERING', meta: 'Expertise topic' },
]

export const EDGES: GraphEdge[] = [
  { from: 'arjun', to: 'orion', kind: 'OWNS', weight: 0.95, since: '2026-01-12' },
  { from: 'rohan', to: 'orion', kind: 'WORKS_ON', weight: 0.97, since: '2026-01-12' },
  { from: 'priya', to: 'orion', kind: 'WORKS_ON', weight: 0.7, since: '2026-04-29' },
  { from: 'kunal', to: 'orion', kind: 'WORKS_ON', weight: 0.5, since: '2026-07-06' },
  { from: 'arjun', to: 'dec-201', kind: 'DECIDED', weight: 0.95, since: '2026-05-03' },
  { from: 'arjun', to: 'dec-212', kind: 'DECIDED', weight: 0.9, since: '2026-05-05' },
  { from: 'ananya', to: 'dec-208', kind: 'DECIDED', weight: 0.9, since: '2026-05-12' },
  { from: 'maya', to: 'dec-214', kind: 'DECIDED', weight: 0.95, since: '2026-08-15' },
  { from: 'dec-201', to: 'orion', kind: 'AFFECTS', weight: 0.95 },
  { from: 'dec-212', to: 'orion', kind: 'AFFECTS', weight: 0.9 },
  { from: 'dec-208', to: 'acme', kind: 'AFFECTS', weight: 0.9 },
  { from: 'acme', to: 'orion', kind: 'CUSTOMER_OF', weight: 0.95, since: '2026-01-15' },
  { from: 'vertex', to: 'orion', kind: 'CUSTOMER_OF', weight: 0.7, since: '2026-02-01' },
  { from: 'northstar', to: 'atlas', kind: 'CUSTOMER_OF', weight: 0.7, since: '2026-06-30' },
  { from: 'helix', to: 'atlas', kind: 'CUSTOMER_OF', weight: 0.8, since: '2026-08-20' },
  { from: 'vertex', to: 'sentinel', kind: 'CUSTOMER_OF', weight: 0.6, since: '2026-07-18' },
  { from: 'acme', to: 'amend-c114', kind: 'MENTIONED_IN', weight: 0.9 },
  { from: 'amend-c114', to: 'orion', kind: 'AFFECTS', weight: 0.9 },
  { from: 'rohan', to: 'pr-482', kind: 'AUTHORED', weight: 0.95, since: '2026-05-03' },
  { from: 'pr-482', to: 'orion', kind: 'AFFECTS', weight: 0.9 },
  { from: 'rohan', to: 'pr-475', kind: 'AUTHORED', weight: 0.9, since: '2026-04-18' },
  { from: 'pr-475', to: 'arch-a', kind: 'AFFECTS', weight: 0.8 },
  { from: 'rohan', to: 'load-test', kind: 'AUTHORED', weight: 0.85, since: '2026-04-11' },
  { from: 'load-test', to: 'arch-a', kind: 'AFFECTS', weight: 0.9 },
  { from: 'incident-92', to: 'arch-a', kind: 'AFFECTS', weight: 0.95, since: '2026-04-11' },
  { from: 'rohan', to: 'incident-92', kind: 'REPORTED_BY', weight: 0.9 },
  { from: 'arjun', to: 'review-apr26', kind: 'DISCUSSED_IN', weight: 0.9, since: '2026-04-26' },
  { from: 'rohan', to: 'review-apr26', kind: 'DISCUSSED_IN', weight: 0.9, since: '2026-04-26' },
  { from: 'review-apr26', to: 'dec-201', kind: 'AFFECTS', weight: 0.85 },
  { from: 'orion', to: 'orion-core', kind: 'DEPENDS_ON', weight: 0.95 },
  { from: 'arch-a', to: 'orion-gateway', kind: 'DEPENDS_ON', weight: 0.9 },
  { from: 'arch-b', to: 'orion-core', kind: 'DEPENDS_ON', weight: 0.95 },
  { from: 'orion', to: 'arch-b', kind: 'DEPENDS_ON', weight: 0.95, since: '2026-05-03' },
  { from: 'arch-a', to: 'arch-b', kind: 'SUPERSEDES', weight: 0.9, since: '2026-05-03' },
  { from: 'maya', to: 'board-bsp26', kind: 'AUTHORED', weight: 0.9 },
  { from: 'board-bsp26', to: 'dec-214', kind: 'AFFECTS', weight: 0.9 },
  { from: 'dec-214', to: 'orion', kind: 'AFFECTS', weight: 0.85 },
  { from: 'atlas', to: 'atlas-web', kind: 'DEPENDS_ON', weight: 0.9 },
  { from: 'rohan', to: 'atlas', kind: 'WORKS_ON', weight: 0.6 },
  { from: 'kunal', to: 'rohan', kind: 'REPORTED_BY', weight: 0.8, since: '2026-07-06' },
  { from: 'rohan', to: 'dist-inference', kind: 'EXPERT_IN', weight: 0.94 },
  { from: 'arjun', to: 'dist-inference', kind: 'EXPERT_IN', weight: 0.88 },
  { from: 'priya', to: 'dist-inference', kind: 'EXPERT_IN', weight: 0.74 },
  { from: 'kunal', to: 'dist-inference', kind: 'EXPERT_IN', weight: 0.41 },
  { from: 'maya', to: 'orion', kind: 'WORKS_ON', weight: 0.4 },
  { from: 'ananya', to: 'acme', kind: 'OWNS', weight: 0.95 },
  { from: 'ananya', to: 'vertex', kind: 'OWNS', weight: 0.9 },
  { from: 'priya', to: 'sentinel', kind: 'OWNS', weight: 0.95 },
  { from: 'arjun', to: 'mercury', kind: 'OWNS', weight: 0.85 },
]

// --------------------------- Memory conflicts ------------------------------

export interface ConflictPair {
  code: string
  topic: string
  summary: string
  memoryACode: string
  memoryBCode: string
  authoritativeCode: string
  resolutionConfidence: number
  basis: string[]
  status: 'RESOLVED' | 'OPEN'
  category: string
}

export const CONFLICTS: ConflictPair[] = [
  {
    code: 'CON-01', topic: 'Orion launch date', status: 'RESOLVED', category: 'PRODUCT',
    summary: 'The March enablement deck says June 15; the May re-plan says August 15.',
    memoryACode: 'MEM-1013', memoryBCode: 'MEM-1012', authoritativeCode: 'MEM-1012',
    resolutionConfidence: 0.91,
    basis: ['More recent record (May 5 vs Mar 20)', 'Higher-authority source (Jira delivery of record vs Slack chatter)', 'Explicit decision record exists (DEC-212)'],
  },
  {
    code: 'CON-02', topic: 'Orion GA risk status', status: 'RESOLVED', category: 'PRODUCT',
    summary: 'The Aug 27 status rollup said “no further slips”; the Sep 2 GPU incident contradicts it.',
    memoryACode: 'MEM-1040', memoryBCode: 'MEM-1015', authoritativeCode: 'MEM-1015',
    resolutionConfidence: 0.88,
    basis: ['Newer evidence supersedes stale status', 'Incident record filed in GitHub (source of truth for technical state)'],
  },
  {
    code: 'CON-03', topic: 'Orion architecture naming', status: 'OPEN', category: 'ENGINEERING',
    summary: 'Runbook v9 calls the target “cell-based”; the Sep status rollup still says “hybrid”.',
    memoryACode: 'MEM-1038', memoryBCode: 'MEM-1027', authoritativeCode: '',
    resolutionConfidence: 0,
    basis: ['Both records are current; owner review requested'],
  },
]

// ------------------------------- Agents ------------------------------------

export const AGENTS: Agent[] = [
  {
    key: 'sales-agent', name: 'Sales Agent', purpose: 'Drafts account responses, renewal briefs and escalation summaries.',
    status: 'ACTIVE', ownerKey: 'ananya', runsToday: 34, lastActivity: '2026-09-15T08:41:00',
    scopes: ['CUSTOMER', 'PRODUCT', 'PUBLIC'], maxClearance: 3, modelRoute: 'PRIVATE_PREFERRED', color: '#8a6d3b',
  },
  {
    key: 'eng-agent', name: 'Engineering Agent', purpose: 'Summarizes incidents, drafts postmortems and change briefs.',
    status: 'ACTIVE', ownerKey: 'rohan', runsToday: 57, lastActivity: '2026-09-15T09:05:00',
    scopes: ['ENGINEERING', 'PRODUCT', 'PUBLIC'], maxClearance: 4, modelRoute: 'PRIVATE_ONLY', color: '#2f5f8f',
  },
  {
    key: 'support-agent', name: 'Support Agent', purpose: 'Triages tickets against known project state.',
    status: 'IDLE', ownerKey: 'ananya', runsToday: 0, lastActivity: '2026-09-14T17:22:00',
    scopes: ['PUBLIC', 'CUSTOMER'], maxClearance: 2, modelRoute: 'POLICY_BASED', color: '#5b7a8c',
  },
  {
    key: 'research-agent', name: 'Research Agent', purpose: 'Builds competitive and market briefs from internal memory.',
    status: 'ACTIVE', ownerKey: 'maya', runsToday: 12, lastActivity: '2026-09-15T07:30:00',
    scopes: ['PUBLIC', 'PRODUCT'], maxClearance: 2, modelRoute: 'POLICY_BASED', color: '#4c7a4c',
  },
]

// ------------------------------- RBAC --------------------------------------
// Demo policy model: role → category → effect. Seed is consistent with the
// clearance floors (a policy can be stricter than the floor, never looser).

export const SEED_POLICY_MATRIX: PolicyMatrix = {
  CEO:            { PUBLIC: 'ALLOW', ENGINEERING: 'ALLOW', PRODUCT: 'ALLOW', CUSTOMER: 'ALLOW', SECURITY: 'ALLOW', FINANCE: 'ALLOW', HR: 'ALLOW', EXECUTIVE: 'ALLOW' },
  CTO:            { PUBLIC: 'ALLOW', ENGINEERING: 'ALLOW', PRODUCT: 'ALLOW', CUSTOMER: 'LIMITED', SECURITY: 'ALLOW', FINANCE: 'LIMITED', HR: 'DENY', EXECUTIVE: 'LIMITED' },
  ENGINEERING_LEAD: { PUBLIC: 'ALLOW', ENGINEERING: 'ALLOW', PRODUCT: 'LIMITED', CUSTOMER: 'LIMITED', SECURITY: 'LIMITED', FINANCE: 'DENY', HR: 'DENY', EXECUTIVE: 'DENY' },
  SALES_LEAD:     { PUBLIC: 'ALLOW', ENGINEERING: 'LIMITED', PRODUCT: 'LIMITED', CUSTOMER: 'ALLOW', SECURITY: 'DENY', FINANCE: 'LIMITED', HR: 'DENY', EXECUTIVE: 'DENY' },
  SECURITY_LEAD:  { PUBLIC: 'ALLOW', ENGINEERING: 'ALLOW', PRODUCT: 'ALLOW', CUSTOMER: 'LIMITED', SECURITY: 'ALLOW', FINANCE: 'DENY', HR: 'DENY', EXECUTIVE: 'LIMITED' },
  INTERN:         { PUBLIC: 'ALLOW', ENGINEERING: 'LIMITED', PRODUCT: 'LIMITED', CUSTOMER: 'DENY', SECURITY: 'DENY', FINANCE: 'DENY', HR: 'DENY', EXECUTIVE: 'DENY' },
}

export const SEED_SOURCE_MATRIX: SourceMatrix = {
  CEO:      { slack: 'FULL', github: 'FULL', drive: 'FULL', notion: 'FULL', jira: 'FULL', crm: 'FULL', email: 'FULL', meetings: 'FULL', docs: 'FULL', db: 'FULL', board: 'FULL', uploads: 'FULL' },
  CTO:      { slack: 'FULL', github: 'FULL', drive: 'FULL', notion: 'FULL', jira: 'FULL', crm: 'LIMITED', email: 'LIMITED', meetings: 'FULL', docs: 'FULL', db: 'FULL', board: 'LIMITED', uploads: 'FULL' },
  ENGINEERING_LEAD: { slack: 'FULL', github: 'FULL', drive: 'LIMITED', notion: 'FULL', jira: 'FULL', crm: 'LIMITED', email: 'NONE', meetings: 'FULL', docs: 'LIMITED', db: 'FULL', board: 'NONE', uploads: 'FULL' },
  SALES_LEAD: { slack: 'FULL', github: 'LIMITED', drive: 'FULL', notion: 'FULL', jira: 'LIMITED', crm: 'FULL', email: 'FULL', meetings: 'LIMITED', docs: 'LIMITED', db: 'NONE', board: 'NONE', uploads: 'FULL' },
  SECURITY_LEAD: { slack: 'FULL', github: 'FULL', drive: 'FULL', notion: 'FULL', jira: 'FULL', crm: 'LIMITED', email: 'LIMITED', meetings: 'FULL', docs: 'FULL', db: 'FULL', board: 'NONE', uploads: 'FULL' },
  INTERN:   { slack: 'LIMITED', github: 'LIMITED', drive: 'NONE', notion: 'FULL', jira: 'LIMITED', crm: 'NONE', email: 'NONE', meetings: 'LIMITED', docs: 'LIMITED', db: 'NONE', board: 'NONE', uploads: 'FULL' },
}

// Category clearance floors. Role policy can be stricter; never looser.
export const CATEGORY_FLOORS: Record<string, number> = {
  PUBLIC: 1, PRODUCT: 1, ENGINEERING: 3, CUSTOMER: 3, SECURITY: 4, FINANCE: 4, HR: 4, EXECUTIVE: 5,
}

// --------------------------- Initial audit trail ----------------------------

export const SEED_AUDIT: AuditEntry[] = [
  { ts: '2026-09-15T09:02:11', userKey: 'rohan', action: 'MEMORY_ACCESSED', resource: 'MEM-1014 · Orion migration tracker', result: 'OK', reason: 'Engineering category granted', risk: 'LOW', category: 'ENGINEERING' },
  { ts: '2026-09-15T08:41:03', userKey: 'sales-agent', action: 'AGENT_CONTEXT_REQUEST', resource: 'Sales Agent · Acme renewal brief', result: 'OK', reason: 'Context assembled under Sales Agent scope', risk: 'LOW', category: 'CUSTOMER' },
  { ts: '2026-09-15T08:12:44', userKey: 'system', action: 'SOURCE_SYNC', resource: 'Slack · scheduled sync', result: 'OK', reason: '41,218 objects scanned', risk: 'LOW' },
  { ts: '2026-09-15T07:55:19', userKey: 'kunal', action: 'ACCESS_DENIED', resource: 'FY27 operating plan · financials', result: 'RESTRICTED', reason: 'Finance requires L4; Intern holds L1', risk: 'MEDIUM', category: 'FINANCE' },
  { ts: '2026-09-15T07:30:02', userKey: 'research-agent', action: 'AGENT_CONTEXT_REQUEST', resource: 'Research Agent · competitive brief', result: 'OK', reason: 'Context assembled under Research Agent scope', risk: 'LOW', category: 'PUBLIC' },
  { ts: '2026-09-14T22:31:05', userKey: 'system', action: 'SOURCE_SYNC', resource: 'Google Drive · scheduled sync', result: 'OK', reason: '2,341 objects scanned', risk: 'LOW' },
  { ts: '2026-09-14T18:04:56', userKey: 'ananya', action: 'QUERY_EXECUTED', resource: '“Summarize Acme’s history with us”', result: 'OK', reason: '6 evidence items, 1 redaction applied', risk: 'LOW', category: 'CUSTOMER' },
  { ts: '2026-09-14T16:47:33', userKey: 'priya', action: 'PERMISSION_CHANGED', resource: 'INTERN → SECURITY', result: 'OK', reason: 'Policy confirmed DENY by Security Lead', risk: 'MEDIUM', category: 'SECURITY' },
  { ts: '2026-09-14T14:22:09', userKey: 'maya', action: 'DECISION_VIEWED', resource: 'DEC-214 · FY27 strategy', result: 'OK', reason: 'Executive category granted', risk: 'LOW', category: 'EXECUTIVE' },
]

// --------------------------- Overview headline stats ------------------------

export const HEADLINE_STATS = {
  memories: 8420,
  entities: 1146,
  relationships: 4782,
  decisions: 184,
  sources: 12,
  agents: 4,
  indexedPct: 97.4,
}
