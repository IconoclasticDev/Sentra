import {
  DECISIONS,
  EDGES,
  ENTITIES,
  EVENTS,
  MEMORIES,
  PEOPLE,
  CUSTOMERS,
} from '../data/company'
import type { Memory, PolicyMatrix, User } from '../data/types'
import { filterMemories, evaluateCategory } from './permissions'
import type { Withheld } from './permissions'

export interface Evidence {
  id: string
  title: string
  source: string
  date: string
  category: string
  snippet: string
  author?: string
  entityKeys: string[]
}

export interface AnswerResult {
  question: string
  intent: string
  summary: string
  sections: { heading: string; kind: 'text' | 'timeline' | 'list' | 'cause' | 'decision'; items?: string[]; entries?: { date: string; label: string; note?: string }[]; subject?: string; cause?: string; effect?: string }[]
  confidence: number
  freshness: string
  evidence: Evidence[]
  entities: { key: string; name: string; kind: string }[]
  memoriesConsulted: number
  decisionsMatched: number
  timelineEvents: number
  policiesApplied: number
  withheld: Withheld[]
  redactions: string[]
  modelRoute: string
}

export interface Stage {
  key: string
  label: string
  detail: string
}

export const PIPELINE_STAGES: Stage[] = [
  { key: 'understand', label: 'Understanding query', detail: 'Intent classified · entities parsed' },
  { key: 'entities', label: 'Finding related entities', detail: 'Entity resolution across the graph' },
  { key: 'memory', label: 'Searching organizational memory', detail: 'Hybrid retrieval over the memory index' },
  { key: 'permissions', label: 'Checking permissions', detail: 'Clearance + role policy evaluation' },
  { key: 'evidence', label: 'Cross-referencing evidence', detail: 'Corroboration across sources' },
  { key: 'synthesize', label: 'Building answer', detail: 'Synthesis with confidence scoring' },
]

export const EXAMPLE_QUESTIONS = [
  'Why was Project Orion delayed?',
  'What changed in Orion’s architecture?',
  'Who knows distributed inference best?',
  'What happened with Acme?',
  'What decisions were reversed?',
  'What changed between March and September?',
]

// ---------------------------------------------------------------------------
// Intent classification (lexical demo classifier)
// ---------------------------------------------------------------------------

export function classifyIntent(q: string): string {
  const s = q.toLowerCase()
  if (/(who|which person).*(know|experience|expert|best|worked)/.test(s)) return 'EXPERTISE'
  if (/(why|root cause|cause).*(delay|late|slip|fail|incident)/.test(s) || /why.*orion/.test(s)) return 'CAUSAL'
  if (/(change|changed|evolved|differ|difference|between)/.test(s)) return 'TEMPORAL'
  if (/(reversed|overturned|walked back)/.test(s)) return 'DECISION_HISTORY'
  if (/(acme|customer|account|vertex|northstar|helix)/.test(s)) return 'CUSTOMER'
  if (/(decision|decide)/.test(s)) return 'DECISIONS'
  return 'GENERAL'
}

// ---------------------------------------------------------------------------
// Memory retrieval: a scored subset of seeded memories relevant to the intent.
// ---------------------------------------------------------------------------

function relevantMemories(intent: string, q: string): Memory[] {
  const s = q.toLowerCase()
  const orion = s.includes('orion')
  const acme = s.includes('acme')
  switch (intent) {
    case 'CAUSAL':
      return MEMORIES.filter((m) => ['MEM-1001', 'MEM-1002', 'MEM-1003', 'MEM-1004', 'MEM-1005', 'MEM-1006', 'MEM-1007', 'MEM-1008', 'MEM-1011', 'MEM-1012', 'MEM-1013', 'MEM-1015', 'MEM-1016', 'MEM-1017', 'MEM-1019', 'MEM-1022', 'MEM-1023', 'MEM-1032'].includes(m.code))
    case 'TEMPORAL':
      return orion
        ? MEMORIES.filter((m) => m.entityKeys.includes('orion'))
        : MEMORIES.filter((m) => m.entityKeys.some((e) => s.includes(e)))
    case 'EXPERTISE':
      return MEMORIES.filter((m) => m.code === 'MEM-1026')
    case 'CUSTOMER':
      return acme
        ? MEMORIES.filter((m) => m.entityKeys.includes('acme'))
        : MEMORIES.filter((m) => m.category === 'CUSTOMER')
    case 'DECISION_HISTORY':
      return MEMORIES.filter((m) => m.type === 'DECISION' || m.status === 'SUPERSEDED')
    case 'DECISIONS':
      return MEMORIES.filter((m) => m.type === 'DECISION')
    default:
      return MEMORIES.filter((m) => (orion ? m.entityKeys.includes('orion') : true))
  }
}

// ---------------------------------------------------------------------------
// Evidence assembly
// ---------------------------------------------------------------------------

function memoryToEvidence(m: Memory): Evidence {
  return {
    id: m.code,
    title: m.statement.length > 82 ? m.statement.slice(0, 82) + '…' : m.statement,
    source: m.sourceRef,
    date: m.date,
    category: m.category,
    snippet: m.detail,
    entityKeys: m.entityKeys,
  }
}

// ---------------------------------------------------------------------------
// The answer engine
// ---------------------------------------------------------------------------

export function answerQuestion(question: string, user: User, policies: PolicyMatrix): AnswerResult {
  const intent = classifyIntent(question)
  const candidates = relevantMemories(intent, question)
  const { readable, withheld } = filterMemories(candidates, user, policies)
  const redactions: string[] = []
  for (const m of readable) {
    for (const f of m.redactedFields ?? []) if (!redactions.includes(f)) redactions.push(f)
  }
  const policiesApplied = new Set<string>()
  for (const m of candidates) {
    const v = evaluateCategory(m.category, user, policies)
    policiesApplied.add(v.gate === 'GRANTED' ? 'PUBLIC' : m.category)
  }

  const entityKeys = [...new Set(readable.flatMap((m) => m.entityKeys))]
  const entities = ENTITIES.filter((e) => entityKeys.includes(e.key)).map((e) => ({ key: e.key, name: e.name, kind: e.kind }))

  let summary = ''
  let sections: AnswerResult['sections'] = []
  let confidence = 0.9
  const evidence: Evidence[] = []
  let decisionsMatched = 0
  let timelineEvents = 0
  let modelRoute = 'PRIVATE_TIER'

  const can = (code: string) => readable.some((m) => m.code === code)

  switch (intent) {
    case 'CAUSAL': {
      const technical = can('MEM-1003')
      const customerVisible = can('MEM-1007')
      const executiveVisible = can('MEM-1022')

      if (executiveVisible && customerVisible && technical) {
        summary =
          'Project Orion was delayed because the original shared-gateway architecture failed production load testing, and the replacement architecture was required both by engineering reality and by a contractual customer condition for data isolation.'
        sections = [
          {
            heading: 'What happened', kind: 'timeline',
            entries: [
              { date: 'Mar 14', label: 'Architecture A approved', note: 'RFC-114 — shared API gateway' },
              { date: 'Apr 02', label: 'Load testing begins', note: '12k sessions, p95 budget 800ms' },
              { date: 'Apr 11', label: 'Gateway saturation detected', note: 'p95 exceeded 4s — auth lock contention' },
              { date: 'Apr 18', label: 'Mitigation attempt failed', note: 'Hotfix recovered ~15% of p95 — SLO still missed' },
              { date: 'Apr 24', label: 'Acme isolation amendment', note: 'Customer-controlled cells became contractual' },
              { date: 'Apr 26', label: 'Architecture review', note: 'Three options scored; B selected' },
              { date: 'May 03', label: 'Architecture B replaces A', note: 'Dedicated inference cells per tenant' },
              { date: 'May 05', label: 'GA re-plan', note: 'Launch moved June 15 → August 15' },
            ],
          },
          {
            heading: 'Root cause', kind: 'cause', subject: 'Gateway saturation under concurrent workloads',
            cause: 'Auth re-validation serialized on a single lock across all tenants in the shared gateway.',
            effect: 'p95 latency exceeded 4s against an 800ms SLO; the April hotfix recovered only ~15%.',
          },
          {
            heading: 'Decision', kind: 'decision', subject: 'Replace Architecture A with Architecture B',
            cause: 'DEC-201 · approved May 3 · owner Arjun Mehta (CTO)',
            effect: 'Launch moved by six weeks; p95 now 610ms at 12k sessions; regulated-industry segment unlocked.',
          },
          {
            heading: 'Customer & strategic impact', kind: 'text',
            items: [
              'Acme’s amendment C-2026-114 made dedicated cells a contractual condition — the delay carried direct renewal risk (CRM-4512, HIGH).',
              'The board flagged GA credibility in the August strategy session; a second slip would trigger a formal program review.',
              'FY27 strategy (BSP-26) ties Enterprise expansion to private-cell availability — the delay lands on the company’s primary growth wedge.',
            ],
          },
        ]
        confidence = 0.94
        modelRoute = 'LOCAL_PRIVATE'
      } else if (technical) {
        summary =
          'Orion was delayed because the original shared-gateway architecture failed production load testing: p95 latency exceeded the 800ms SLO by 5×. The replacement architecture (dedicated inference cells) required a six-week migration.'
        sections = [
          {
            heading: 'What happened', kind: 'timeline',
            entries: [
              { date: 'Apr 02', label: 'Load testing begins' },
              { date: 'Apr 11', label: 'Gateway saturation detected', note: 'p95 exceeded 4s' },
              { date: 'Apr 18', label: 'Mitigation attempt failed' },
              { date: 'Apr 26', label: 'Architecture review' },
              { date: 'May 03', label: 'Architecture B selected' },
              { date: 'May 05', label: 'GA re-plan to Aug 15' },
            ],
          },
          {
            heading: 'Root cause', kind: 'cause', subject: 'Gateway saturation under concurrent workloads',
            cause: 'Auth re-validation serialized on a single lock across all tenants.',
            effect: 'p95 exceeded 4s; hotfix recovered only ~15%.',
          },
        ]
        confidence = 0.91
        modelRoute = 'LOCAL_PRIVATE'
      } else if (customerVisible) {
        summary =
          'Orion’s launch moved from June 15 to August 15 after performance issues in load testing. Customer-facing commitments were re-planned; Acme’s rollout now tracks the new architecture.'
        sections = [
          {
            heading: 'Customer impact', kind: 'text',
            items: [
              'Acme (Enterprise tier) is the design partner for the new architecture; its rollout tracks the August GA.',
              'Internal architecture details are not included in your view.',
            ],
          },
        ]
        confidence = 0.83
        modelRoute = 'PRIVATE_TIER'
      } else {
        summary =
          'Orion was delayed because the original architecture did not meet performance requirements. A new architecture was selected in May, and the launch moved to August.'
        sections = [
          {
            heading: 'Key facts', kind: 'text',
            items: [
              'Load testing found the original design too slow under real traffic.',
              'A review on April 26 selected a replacement architecture.',
              'The launch date moved to August 15.',
            ],
          },
        ]
        confidence = 0.78
        modelRoute = 'PRIVATE_TIER'
      }

      for (const code of ['MEM-1002', 'MEM-1003', 'MEM-1004', 'MEM-1006', 'MEM-1007', 'MEM-1008', 'MEM-1011', 'MEM-1012']) {
        const m = MEMORIES.find((x) => x.code === code)
        if (m && can(code)) evidence.push(memoryToEvidence(m))
      }
      const d = DECISIONS.find((x) => x.code === 'DEC-201')
      if (d) decisionsMatched += 1
      timelineEvents = EVENTS.filter((e) => e.projectKey === 'orion').length
      break
    }

    case 'TEMPORAL': {
      const full = can('MEM-1022')
      summary = full
        ? 'Between March and September, Orion moved from a shared gateway (Architecture A) to dedicated inference cells (Architecture B), and the launch target moved from June 15 to August 15. The company also formalized regulated-industry strategy on the back of the new design.'
        : 'Between March and September, Orion moved from Architecture A (shared gateway) to Architecture B (dedicated inference cells), and the launch target moved from June 15 to August 15.'
      sections = [
        {
          heading: 'Then → Now', kind: 'list',
          items: full
            ? [
                'Architecture: shared gateway → dedicated inference cells',
                'Launch target: June 15 → August 15',
                'Security posture: manual review → automated CI gates',
                'Acme: Standard tier → Enterprise with isolation amendment',
                'Strategy: regulated industries formalized as the FY27 wedge (executive view)',
              ]
            : [
                'Architecture: shared gateway → dedicated inference cells',
                'Launch target: June 15 → August 15',
                'Security posture: manual review → automated CI gates',
              ],
        },
      ]
      confidence = full ? 0.93 : 0.86
      for (const code of ['MEM-1001', 'MEM-1011', 'MEM-1012', 'MEM-1021', 'MEM-1016', 'MEM-1022']) {
        const m = MEMORIES.find((x) => x.code === code)
        if (m && can(code)) evidence.push(memoryToEvidence(m))
      }
      timelineEvents = EVENTS.length
      break
    }

    case 'EXPERTISE': {
      const ranked = EDGES.filter((e) => e.kind === 'EXPERT_IN' && e.to === 'dist-inference')
        .sort((a, b) => b.weight - a.weight)
      const visible = ranked.filter((e) => {
        const person = PEOPLE.find((p) => p.key === e.from)
        if (!person) return false
        const expertiseMemory = MEMORIES.find((m) => m.code === 'MEM-1026')
        return expertiseMemory ? evaluateCategory(expertiseMemory.category, user, policies).allowed : true
      })
      const labels: Record<string, string[]> = {
        rohan: ['Cell scheduler & load work', 'PR #482, PR #475', 'Load test report', 'Architecture review'],
        arjun: ['Architecture decisions', 'RFC-114, DEC-201', 'Architecture review'],
        priya: ['Isolation review SR-88', 'Security policy'],
        kunal: ['Load-test dashboards (supervised)'],
      }
      summary = visible.length
        ? `Based on the knowledge graph, ${PEOPLE.find((p) => p.key === visible[0].from)?.name} has the strongest evidence-backed expertise in distributed inference, followed by ${visible.slice(1).map((e) => PEOPLE.find((p) => p.key === e.from)?.name).filter(Boolean).join(' and ')}. The ranking combines project experience, authored artifacts, reviews and decision involvement — not job titles.`
        : 'Expertise signals are restricted for your role.'
      sections = [
        {
          heading: 'Ranked by evidence', kind: 'list',
          items: visible.map((e) => {
            const p = PEOPLE.find((x) => x.key === e.from)
            return `${p?.name ?? e.from} — ${Math.round(e.weight * 100)}% · ${(labels[e.from] ?? []).join(' · ')}`
          }),
        },
        { heading: 'Method', kind: 'text', items: ['Knowledge Graph inference — demo signal, not an HR assessment. Derived from PRs, authored documents, meetings and decision records.'] },
      ]
      confidence = 0.9
      for (const code of ['MEM-1026']) {
        const m = MEMORIES.find((x) => x.code === code)
        if (m && can(code)) evidence.push(memoryToEvidence(m))
      }
      break
    }

    case 'CUSTOMER': {
      const isAcme = question.toLowerCase().includes('acme')
      const full = can('MEM-1016') && can('MEM-1017')
      const basic = can('MEM-1018')
      if (isAcme) {
        if (full) {
          summary =
            'Acme Industrial is the flagship enterprise account and Orion’s design partner. The relationship deepened after the shared gateway failed their POC: they made customer-controlled isolation contractual, upgraded to the Enterprise tier, and now anchor the regulated-industry strategy. Renewal risk is HIGH until Orion GA lands.'
          sections = [
            {
              heading: 'Relationship timeline', kind: 'timeline',
              entries: [
                { date: 'Jan 2024', label: 'Initial contract (Standard tier)' },
                { date: 'Jan 15 2026', label: 'Named Orion design partner' },
                { date: 'Mar 09 2026', label: 'POC on shared gateway rejected for regulated workloads' },
                { date: 'Apr 24 2026', label: 'Amendment C-2026-114 — isolation contractual' },
                { date: 'May 12 2026', label: 'Upgraded to Enterprise tier' },
                { date: 'Aug 29 2026', label: 'Renewal risk raised to HIGH pending GA commitment' },
              ],
            },
            {
              heading: 'Current state', kind: 'text',
              items: [
                'Health: AT RISK · Escalation risk HIGH · ARR recorded in CRM (restricted below L4).',
                'Primary contact: Derek Voss, VP Infrastructure — reiterated the isolation condition is contractual, not aspirational.',
                'Open dependency: Orion GA (Aug 15 target) with a 7-day clean soak gate still pending.',
              ],
            },
          ]
          confidence = 0.93
          modelRoute = 'PRIVATE_TIER'
        } else if (basic) {
          summary =
            'Acme Industrial is an enterprise customer and Orion’s design partner. Their rollout tracks Orion’s new architecture; commercial details are not included in your view.'
          sections = [{ heading: 'What we know', kind: 'text', items: ['Acme is the design partner for Orion’s private inference cells.', 'Commercial and contract fields are restricted for your role.'] }]
          confidence = 0.8
        } else {
          summary = 'Customer context is restricted for your role.'
          sections = []
          confidence = 0.3
        }
        for (const code of ['MEM-1018', 'MEM-1019', 'MEM-1007', 'MEM-1016', 'MEM-1017']) {
          const m = MEMORIES.find((x) => x.code === code)
          if (m && can(code)) evidence.push(memoryToEvidence(m))
        }
      } else {
        summary =
          'Four accounts are active: Acme (Enterprise, at-risk renewal pending Orion GA), Vertex (expanding via Sentinel), Northstar (migrated onto Atlas) and Helix (pilot NPS 62, key-management friction flagged).'
        sections = [{ heading: 'Accounts', kind: 'list', items: CUSTOMERS.filter((c) => can('MEM-1018') || c.key !== 'acme').map((c) => `${c.name} — ${c.tier} · ${c.health}`) }]
        confidence = 0.85
        for (const m of readable.slice(0, 5)) evidence.push(memoryToEvidence(m))
      }
      break
    }

    case 'DECISION_HISTORY': {
      const reversed = DECISIONS.filter((d) => d.status === 'REVERSED')
      summary = reversed.length
        ? `One decision was fully reversed this quarter: "${reversed[0].title}" (June 15 launch) — reversed by DEC-212 when the architecture migration invalidated the date. One decision (DEC-205, Architecture A) was superseded rather than reversed: it was replaced by DEC-201.`
        : 'Decision history is restricted for your role.'
      sections = reversed.length
        ? [
            {
              heading: 'Reversal chain', kind: 'timeline',
              entries: [
                { date: 'Mar 20', label: 'DEC-218 · June 15 launch committed', note: 'Status: REVERSED' },
                { date: 'May 03', label: 'DEC-201 · Architecture B selected', note: 'Triggered the re-plan' },
                { date: 'May 05', label: 'DEC-212 · GA moved to August 15', note: 'Reversed the June commitment' },
              ],
            },
            {
              heading: 'Superseded (not reversed)', kind: 'text',
              items: ['DEC-205 — Architecture A. It was not a mistake when made; it was invalidated by evidence that did not exist yet.'],
            },
          ]
        : []
      confidence = reversed.length ? 0.92 : 0.3
      for (const m of readable.slice(0, 4)) evidence.push(memoryToEvidence(m))
      break
    }

    case 'DECISIONS': {
      const visibleDecisions = DECISIONS.filter((d) => evaluateCategory(d.category, user, policies).allowed)
      summary = visibleDecisions.length
        ? `${visibleDecisions.length} decisions are visible to you. The most consequential active decision is DEC-201 (Orion architecture migration) with full rationale, alternatives and evidence attached.`
        : 'No decisions are visible for your role.'
      sections = visibleDecisions.length
        ? [{ heading: 'Recently matched', kind: 'list', items: visibleDecisions.slice(0, 5).map((d) => `${d.code} · ${d.title} · ${d.status}`) }]
        : []
      confidence = visibleDecisions.length ? 0.9 : 0.3
      for (const m of readable.slice(0, 4)) evidence.push(memoryToEvidence(m))
      break
    }

    default: {
      summary = readable.length
        ? `The strongest authorized evidence indicates: ${readable[0].statement}`
        : 'No authorized memories were found for this question.'
      sections = readable.length
        ? [{ heading: 'Supporting memories', kind: 'list', items: readable.slice(0, 4).map((m) => m.statement) }]
        : []
      confidence = readable.length ? 0.75 : 0.2
      for (const m of readable.slice(0, 4)) evidence.push(memoryToEvidence(m))
    }
  }

  return {
    question, intent, summary, sections, confidence,
    freshness: 'Current as of September 2026',
    evidence: evidence.slice(0, 6),
    entities: entities.slice(0, 8),
    memoriesConsulted: candidates.length,
    decisionsMatched,
    timelineEvents,
    policiesApplied: policiesApplied.size,
    withheld,
    redactions,
    modelRoute,
  }
}
