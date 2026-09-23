// ---------------------------------------------------------------------------
// PrivateBrain domain types.
// One fictional company (NexaCore Systems), seeded once, consumed everywhere.
// Every screen renders from src/data/company.ts or state derived from it, which
// is what keeps Orion / Acme / people / dates consistent across the whole app.
// ---------------------------------------------------------------------------

export type Category =
  | 'PUBLIC'
  | 'ENGINEERING'
  | 'PRODUCT'
  | 'CUSTOMER'
  | 'SECURITY'
  | 'FINANCE'
  | 'HR'
  | 'EXECUTIVE'

export const CATEGORIES: Category[] = [
  'PUBLIC',
  'ENGINEERING',
  'PRODUCT',
  'CUSTOMER',
  'SECURITY',
  'FINANCE',
  'HR',
  'EXECUTIVE',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  PUBLIC: 'Public / Internal',
  ENGINEERING: 'Engineering',
  PRODUCT: 'Product',
  CUSTOMER: 'Customer',
  SECURITY: 'Security',
  FINANCE: 'Finance',
  HR: 'People / HR',
  EXECUTIVE: 'Executive Strategy',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  PUBLIC: '#7c8794',
  ENGINEERING: '#2f5f8f',
  PRODUCT: '#4c7a4c',
  CUSTOMER: '#8a6d3b',
  SECURITY: '#8f4c4c',
  FINANCE: '#6b5b95',
  HR: '#5b7a8c',
  EXECUTIVE: '#3f4551',
}

export type RoleKey =
  | 'CEO'
  | 'CTO'
  | 'ENGINEERING_LEAD'
  | 'SALES_LEAD'
  | 'SECURITY_LEAD'
  | 'INTERN'

export type Effect = 'ALLOW' | 'LIMITED' | 'DENY'

export interface Person {
  key: string
  name: string
  role: string
  roleKey: RoleKey
  department: string
  clearance: 1 | 2 | 3 | 4 | 5
  email: string
  initials: string
  accent: string
  isDemoUser: boolean
  active?: boolean
}

export interface User extends Person {
  departments: string[]
}

export const CLEARANCE_LABELS: Record<number, string> = {
  1: 'L1 — Restricted',
  2: 'L2 — Internal',
  3: 'L3 — Confidential',
  4: 'L4 — Highly Confidential',
  5: 'L5 — Executive',
}

export type MemoryType =
  | 'FACT'
  | 'EVENT'
  | 'DECISION'
  | 'PROJECT_STATE'
  | 'CUSTOMER_CONTEXT'
  | 'RELATIONSHIP'
  | 'POLICY'

export interface Memory {
  code: string
  statement: string
  detail: string
  type: MemoryType
  category: Category
  entityKeys: string[]
  sourceKey: string
  sourceRef: string
  date: string // ISO
  validFrom: string
  validTo?: string // undefined = still current
  confidence: number
  status: 'CURRENT' | 'SUPERSEDED' | 'DISPUTED'
  supersededBy?: string
  importance: number
  redactedFields?: string[] // field names hidden at LIMITED scope
}

export interface Decision {
  code: string
  title: string
  date: string
  ownerKey: string
  projectKey?: string
  customerKey?: string
  status: 'ACTIVE' | 'SUPERSEDED' | 'REVERSED' | 'PENDING'
  category: Category
  problem: string
  decision: string
  alternatives: { name: string; chosen?: boolean; note?: string }[]
  impact: string
  confidence: number
  evidence: string[] // memory codes
  sensitiveFields?: string[] // hidden below full access
  supersedes?: string
}

export interface Customer {
  key: string
  name: string
  industry: string
  tier: string
  status: string
  health: string
  arrUsd: number
  since: string
  csmKey: string
  aeKey: string
  description: string
  contacts: { name: string; title: string; email: string }[]
  escalationRisk: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface Project {
  key: string
  name: string
  description: string
  status: string
  health: string
  ownerKey: string
  team: string
  startedOn: string
  targetOn: string
  progress: number
  budgetUsd: number
  customerKeys: string[]
  memberKeys: string[]
  repoKeys: string[]
}

export type EntityKind = 'PERSON' | 'PROJECT' | 'CUSTOMER' | 'DECISION' | 'REPO' | 'DOCUMENT' | 'EVENT' | 'TOPIC'

export interface Entity {
  key: string
  name: string
  kind: EntityKind
  category: Category
  meta?: string
}

export interface GraphEdge {
  from: string
  to: string
  kind: string
  weight: number
  since?: string
}

export interface Source {
  key: string
  name: string
  kind: string
  description: string
  category: Category
  status: 'CONNECTED' | 'DEGRADED' | 'PAUSED'
  lastSync: string
  objects: number
  coverage: number
  color: string
}

export interface Agent {
  key: string
  name: string
  purpose: string
  status: 'ACTIVE' | 'IDLE'
  ownerKey: string
  runsToday: number
  lastActivity: string
  scopes: Category[]
  maxClearance: number
  modelRoute: string
  color: string
}

export interface TimelineEvent {
  code: string
  date: string
  title: string
  summary: string
  category: Category
  projectKey?: string
  customerKey?: string
  actorKey?: string
  sourceKey: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface AuditEntry {
  ts: string
  userKey: string
  action: string
  resource: string
  result: 'OK' | 'RESTRICTED' | 'ERROR'
  reason: string
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  category?: Category
}

// --------------------------------- RBAC ------------------------------------

export interface PolicyMatrix {
  // roleKey -> category -> effect
  [roleKey: string]: Record<Category, Effect>
}

export type SourceLevel = 'FULL' | 'LIMITED' | 'NONE'
export interface SourceMatrix {
  // roleKey -> sourceKey -> level
  [roleKey: string]: Record<string, SourceLevel>
}
