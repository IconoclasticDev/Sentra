import { CATEGORY_FLOORS, PEOPLE, SOURCES } from '../data/company'
import { CATEGORY_LABELS } from '../data/types'
import type {
  Category,
  Effect,
  Memory,
  PolicyMatrix,
  SourceLevel,
  SourceMatrix,
  User,
} from '../data/types'

// ---------------------------------------------------------------------------
// Demo RBAC engine. Two gates combine:
//   1. clearance floor per category (a policy can be stricter, never looser)
//   2. role policy effect (ALLOW / LIMITED / DENY)
// Source-level access is a third gate for connector-originated objects.
// ---------------------------------------------------------------------------

export const CATEGORY_ORDER: Category[] = [
  'PUBLIC', 'ENGINEERING', 'PRODUCT', 'CUSTOMER', 'SECURITY', 'FINANCE', 'HR', 'EXECUTIVE',
]

export interface Verdict {
  effect: Effect
  allowed: boolean
  limited: boolean
  gate: 'CLEARANCE' | 'ROLE_POLICY' | 'GRANTED'
  reason: string
  minClearance?: number
  category?: Category
}

export interface Withheld {
  category: Category
  label: string
  reason: string
  count: number
  gate: string
}

export type { PolicyMatrix, SourceMatrix, SourceLevel } from '../data/types'

export function userByKey(key: string): User {
  const u = PEOPLE.find((p) => p.key === key)
  if (!u) throw new Error(`Unknown user: ${key}`)
  return u
}

export function clearancesForRole(user: User): number {
  return user.clearance
}

export function evaluateCategory(
  category: Category | undefined,
  user: User,
  policies: PolicyMatrix,
): Verdict {
  if (!category) return { effect: 'ALLOW', allowed: true, limited: false, gate: 'GRANTED', reason: 'No category restriction' }

  const floor = CATEGORY_FLOORS[category] ?? 1
  if (user.clearance < floor) {
    return {
      effect: 'DENY', allowed: false, limited: false, gate: 'CLEARANCE',
      reason: `Requires clearance L${floor}; ${user.role} holds L${user.clearance}`,
      minClearance: floor, category,
    }
  }
  const effect = policies[user.roleKey]?.[category] ?? 'DENY'
  const reasonMap: Record<Effect, string> = {
    ALLOW: `${CATEGORY_LABELS[category]} granted by policy for ${user.role}`,
    LIMITED: `${CATEGORY_LABELS[category]} granted at LIMITED scope — sensitive fields are redacted`,
    DENY: `${CATEGORY_LABELS[category]} denied by policy for ${user.role}`,
  }
  return {
    effect, allowed: effect !== 'DENY', limited: effect === 'LIMITED',
    gate: 'ROLE_POLICY', reason: reasonMap[effect], category,
  }
}

export function sourceLevelFor(user: User, sourceKey: string, matrix: SourceMatrix): SourceLevel {
  return matrix[user.roleKey]?.[sourceKey] ?? 'NONE'
}

export function sourceVerdict(user: User, sourceKey: string, matrix: SourceMatrix): { allowed: boolean; level: SourceLevel; reason: string } {
  const level = sourceLevelFor(user, sourceKey, matrix)
  return {
    allowed: level !== 'NONE',
    level,
    reason: level === 'FULL'
      ? `Full access to ${sourceKey} for ${user.role}`
      : level === 'LIMITED'
        ? `${sourceKey} is LIMITED for ${user.role} — summaries only, raw objects withheld`
        : `${sourceKey} is not granted to ${user.role}`,
  }
}

export interface Profile {
  user: User
  allowed: Category[]
  limited: Category[]
  denied: Category[]
  accessibleSources: string[]
  restrictedSources: string[]
  summary: string
}

export function buildProfile(user: User, policies: PolicyMatrix, sources: SourceMatrix): Profile {
  const allowed: Category[] = []
  const limited: Category[] = []
  const denied: Category[] = []
  for (const c of CATEGORY_ORDER) {
    const v = evaluateCategory(c, user, policies)
    if (v.effect === 'ALLOW') allowed.push(c)
    else if (v.effect === 'LIMITED') limited.push(c)
    else denied.push(c)
  }
  const accessibleSources: string[] = []
  const restrictedSources: string[] = []
  for (const s of SOURCES) {
    const level = sourceLevelFor(user, s.key, sources)
    if (level === 'NONE') restrictedSources.push(s.key)
    else accessibleSources.push(s.key)
  }
  return {
    user, allowed, limited, denied, accessibleSources, restrictedSources,
    summary: `${allowed.length} categories allowed · ${limited.length} limited · ${denied.length} denied`,
  }
}

/** Filter memories for a viewer; returns readable + per-category denial rollup. */
export function filterMemories(
  memories: Memory[],
  user: User,
  policies: PolicyMatrix,
): { readable: Memory[]; withheld: Withheld[] } {
  const readable: Memory[] = []
  const buckets = new Map<Category, Withheld>()
  for (const m of memories) {
    const v = evaluateCategory(m.category, user, policies)
    if (v.allowed) readable.push(m)
    else {
      const label = CATEGORY_LABELS[m.category]
      const existing = buckets.get(m.category)
      if (existing) existing.count += 1
      else buckets.set(m.category, { category: m.category, label, reason: v.reason, count: 1, gate: v.gate })
    }
  }
  return { readable, withheld: [...buckets.values()].sort((a, b) => b.count - a.count) }
}

/** Field-level redaction for LIMITED scope. Returns masked field keys. */
export function redactedFieldsFor(item: { redactedFields?: string[] } | undefined): string[] {
  return item?.redactedFields ?? []
}

export function formatWithheldBanner(withheld: Withheld[]): string {
  if (!withheld.length) return ''
  const parts = withheld.map((w) => w.label)
  return parts.join(' · ')
}
