import { useMemo, useState } from 'react'
import { EVENTS, MEMORIES, PEOPLE, SOURCES } from '../data/company'
import { useApp } from '../state/AppContext'
import { evaluateCategory } from '../lib/permissions'
import { Badge, CategoryPill, EmptyState, fmtDate } from '../lib/ui'
import type { Category } from '../data/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']

interface Change {
  title: string
  before: string
  event: string
  after: string
  evidence: string[]
  category: Category
}

const CHANGES: Change[] = [
  {
    title: 'Orion architecture',
    before: 'Architecture A — shared API gateway',
    event: 'Apr 26 architecture review → May 3 decision DEC-201',
    after: 'Architecture B — dedicated inference cells',
    evidence: ['MEM-1001', 'MEM-1011'],
    category: 'ENGINEERING',
  },
  {
    title: 'Acme contract',
    before: 'Standard tier · shared tenancy',
    event: 'Amendment C-2026-114 (Apr 24) → Enterprise upgrade (May 12)',
    after: 'Enterprise tier · dedicated cells, customer-held keys',
    evidence: ['MEM-1007', 'MEM-1016'],
    category: 'CUSTOMER',
  },
  {
    title: 'Security policy',
    before: 'Manual security review per release',
    event: 'Security policy v4.2 (Jul 1) · DEC-210',
    after: 'Automated posture gates in CI (100% of releases)',
    evidence: ['MEM-1021', 'MEM-1045'],
    category: 'SECURITY',
  },
  {
    title: 'Orion launch target',
    before: 'June 15, 2026',
    event: 'Re-plan DEC-212 after architecture migration (May 5)',
    after: 'August 15, 2026',
    evidence: ['MEM-1013', 'MEM-1012'],
    category: 'PRODUCT',
  },
]

export function TimelinePage() {
  const { user, policies } = useApp()
  const [month, setMonth] = useState(8) // September
  const [compareOpen, setCompareOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)

  const monthEvents = useMemo(() => {
    return EVENTS.filter((e) => {
      const d = new Date(e.date)
      if (d.getMonth() !== month) return false
      return evaluateCategory(e.category, user, policies).allowed
    }).sort((a, b) => a.date.localeCompare(b.date))
  }, [month, user, policies])

  const hiddenThisMonth = useMemo(() => {
    return EVENTS.filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() === month && !evaluateCategory(e.category, user, policies).allowed
    }).length
  }, [month, user, policies])

  // Point-in-time memory reconstruction: memories valid at end of selected month
  const stateAt = (monthIdx: number) => {
    const cutoff = new Date(2026, monthIdx + 1, 0) // last day of month
    const iso = cutoff.toISOString().slice(0, 10)
    return MEMORIES.filter((m) => {
      if (!evaluateCategory(m.category, user, policies).allowed) return false
      if (m.validFrom > iso) return false
      if (m.validTo && m.validTo <= iso) return false
      return true
    })
  }

  const marchState = useMemo(() => stateAt(2), [user, policies])
  const septState = useMemo(() => stateAt(8), [user, policies])

  const pick = (list: typeof MEMORIES, code: string) => list.find((m) => m.code === code)

  const orionArchThen = pick(marchState, 'MEM-1001')
  const orionArchNow = pick(septState, 'MEM-1011')
  const launchThen = pick(marchState, 'MEM-1013')
  const launchNow = pick(septState, 'MEM-1012')
  const acmeThen = pick(marchState, 'MEM-1018')
  const acmeNow = pick(septState, 'MEM-1016')
  const secNow = pick(septState, 'MEM-1045')

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium tracking-tight text-ink-950">Timeline · temporal memory</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">What the organization knew, and when. Move the scrubber to reconstruct any point in time.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCompareOpen((v) => !v)} className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors ${compareOpen ? 'border-accent bg-accent-soft text-accent-strong' : 'border-ink-200 bg-white text-ink-600'}`}>
            Compare March ↔ September
          </button>
          <button onClick={() => setChangesOpen((v) => !v)} className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${changesOpen ? 'bg-ink-950 text-white' : 'bg-ink-950 text-white'}`}>
            What changed?
          </button>
        </div>
      </div>

      {/* Scrubber */}
      <div className="card mt-5 px-6 py-5">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[9px] h-px bg-ink-200" />
          <div className="relative flex justify-between">
            {MONTHS.map((m, i) => {
              const active = i === month
              return (
                <button key={m} onClick={() => setMonth(i)} className="group flex flex-col items-center">
                  <span className={`h-[19px] w-[19px] rounded-full border-2 transition-all ${
                    active ? 'border-accent bg-accent scale-110' : i <= month ? 'border-accent/50 bg-white' : 'border-ink-200 bg-white group-hover:border-ink-300'
                  }`} />
                  <span className={`mt-1.5 text-[11px] font-medium ${active ? 'text-accent-strong' : 'text-ink-400'}`}>{m}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
          <span>Point in time: <span className="font-semibold text-ink-700">{MONTHS[month]} 2026</span></span>
          <span className="num">{monthEvents.length} visible events{hiddenThisMonth > 0 && ` · ${hiddenThisMonth} hidden by policy`}</span>
        </div>
      </div>

      {/* Events for month */}
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {monthEvents.length === 0 && (
          <div className="md:col-span-2"><EmptyState title={`No visible events in ${MONTHS[month]}`} body={hiddenThisMonth > 0 ? `${hiddenThisMonth} events occurred but are restricted for ${user.role}.` : 'Nothing was recorded for this month.'} /></div>
        )}
        {monthEvents.map((e) => (
          <div key={e.code} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${e.impact === 'CRITICAL' ? 'bg-rose-500' : e.impact === 'HIGH' ? 'bg-orange-400' : e.impact === 'MEDIUM' ? 'bg-amber-300' : 'bg-ink-200'}`} />
                <span className="num text-[12px] font-semibold text-ink-900">{fmtDate(e.date)}</span>
                <CategoryPill category={e.category} />
              </div>
              <Badge>{SOURCES.find((s) => s.key === e.sourceKey)?.name ?? e.sourceKey}</Badge>
            </div>
            <div className="mt-2 text-[13.5px] font-semibold text-ink-950">{e.title}</div>
            <div className="mt-0.5 text-[12px] leading-snug text-ink-500">{e.summary}</div>
            {e.actorKey && (
              <div className="mt-1.5 text-[10.5px] text-ink-400">Actor: {PEOPLE.find((p) => p.key === e.actorKey)?.name ?? e.actorKey}</div>
            )}
          </div>
        ))}
      </div>

      {/* Compare */}
      {compareOpen && (
        <div className="card mt-4 animate-in p-5">
          <div className="eyebrow mb-3">Historical state — Orion</div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">March 2026</div>
              <div className="mt-2 space-y-2.5">
                {[
                  ['Architecture', orionArchThen?.statement ?? 'Architecture A — shared gateway (approved Mar 14)'],
                  ['Launch target', launchThen?.statement ?? 'June 15 launch committed'],
                  ['Acme relationship', acmeThen ? 'Design partner · Standard tier' : '—'],
                  ['Security posture', 'Shared tenancy pending review'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase tracking-wide text-ink-300">{k}</div>
                    <div className="text-[12px] leading-snug text-ink-700">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-ink-400">{marchState.length} authorized memories were valid at this date</div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-950 text-white">→</div>
            </div>

            <div className="rounded-lg border border-accent/30 bg-accent-soft/40 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">September 2026</div>
              <div className="mt-2 space-y-2.5">
                {[
                  ['Architecture', orionArchNow?.statement ?? 'Architecture B — dedicated inference cells'],
                  ['Launch target', launchNow?.statement ?? 'August 15 launch (re-planned)'],
                  ['Acme relationship', acmeNow ? 'Enterprise tier · dedicated cells amendment' : '—'],
                  ['Security posture', secNow ? 'Automated posture gates · 100% of releases' : 'Manual review'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase tracking-wide text-ink-400">{k}</div>
                    <div className="text-[12px] leading-snug text-ink-800">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-ink-400">{septState.length} authorized memories valid now</div>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-ink-50 p-3 text-[11.5px] leading-relaxed text-ink-500">
            This is not a diff of documents — it is a reconstruction from memory validity intervals
            (valid_from / valid_to). Superseded records remain queryable for “what did we know then?”.
          </div>
        </div>
      )}

      {/* What changed */}
      {changesOpen && (
        <div className="mt-4 animate-in space-y-3">
          <div className="card p-5">
            <div className="eyebrow">3+ major organizational changes · Mar → Sep</div>
            <div className="mt-3 space-y-3">
              {CHANGES.filter((c) => evaluateCategory(c.category, user, policies).allowed).map((c) => (
                <div key={c.title} className="rounded-xl border border-ink-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[13.5px] font-semibold text-ink-950">{c.title}</div>
                    <CategoryPill category={c.category} />
                  </div>
                  <div className="mt-3 grid items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
                    <div className="rounded-lg bg-ink-50 px-3 py-2 text-[12px] text-ink-600 line-through decoration-ink-300">{c.before}</div>
                    <div className="mx-auto text-[11px] font-semibold text-accent">{c.event}</div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[12px] font-medium text-emerald-800">{c.after}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.evidence.map((code) => {
                      const m = MEMORIES.find((x) => x.code === code)
                      const visible = m && evaluateCategory(m.category, user, policies).allowed
                      return <Badge key={code} color={visible ? undefined : '#b45309'}>{visible ? code : `${code} · restricted`}</Badge>
                    })}
                  </div>
                </div>
              ))}
              {CHANGES.filter((c) => !evaluateCategory(c.category, user, policies).allowed).length > 0 && (
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 text-[11.5px] text-amber-700">
                  {CHANGES.filter((c) => !evaluateCategory(c.category, user, policies).allowed).length} organizational change(s) are restricted for {user.role}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
