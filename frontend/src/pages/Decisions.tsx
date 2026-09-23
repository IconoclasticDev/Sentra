import { useMemo, useState } from 'react'
import { DECISIONS, MEMORIES, PEOPLE, SOURCES } from '../data/company'
import type { Decision } from '../data/types'
import { useApp } from '../state/AppContext'
import { evaluateCategory } from '../lib/permissions'
import { Drawer } from '../components/Drawer'
import { Avatar, Badge, CategoryPill, ConfidenceBar, EmptyState, fmtDate } from '../lib/ui'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUPERSEDED: 'bg-ink-100 text-ink-500 border-ink-200',
  REVERSED: 'bg-rose-50 text-rose-700 border-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
}

export function DecisionsPage() {
  const { user, policies, logAudit } = useApp()
  const [status, setStatus] = useState<string>('ALL')
  const [open, setOpen] = useState<Decision | null>(null)

  const visible = useMemo(
    () => DECISIONS.filter((d) => evaluateCategory(d.category, user, policies).allowed)
      .filter((d) => status === 'ALL' || d.status === status)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [user, policies, status],
  )
  const hiddenCount = DECISIONS.length - DECISIONS.filter((d) => evaluateCategory(d.category, user, policies).allowed).length

  const openDecision = (d: Decision) => {
    setOpen(d)
    logAudit({
      userKey: user.key,
      action: 'DECISION_VIEWED',
      resource: `${d.code} · ${d.title}`,
      result: 'OK',
      reason: `${d.category} granted by policy for ${user.role}`,
      risk: 'LOW',
      category: d.category,
    })
  }

  const verdictFor = (d: Decision) => evaluateCategory(d.category, user, policies)

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium tracking-tight text-ink-950">Decision memory</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            Every decision with rationale, alternatives, evidence and validity · {visible.length} visible
            {hiddenCount > 0 && <> · {hiddenCount} restricted</>}
          </p>
        </div>
        <div className="flex gap-1.5">
          {['ALL', 'ACTIVE', 'PENDING', 'SUPERSEDED', 'REVERSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                status === s ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-500 hover:text-ink-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6"><EmptyState title="No decisions visible" body="Decision memory for your role excludes these categories. Switch identity to compare." /></div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visible.map((d) => {
            const owner = PEOPLE.find((p) => p.key === d.ownerKey)
            const v = verdictFor(d)
            return (
              <button key={d.code} onClick={() => openDecision(d)} className="card card-hover p-5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="num text-[10.5px] font-semibold text-ink-400">{d.code}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[d.status]}`}>{d.status}</span>
                    </div>
                    <div className="mt-1.5 text-[14px] font-semibold leading-snug text-ink-950">{d.title}</div>
                  </div>
                  <Avatar initials={owner?.initials ?? '?'} accent={owner?.accent ?? '#999'} name={owner?.name} size={30} />
                </div>

                <div className="mt-3 space-y-1.5 text-[12px] leading-snug">
                  <div><span className="font-semibold text-ink-400">Problem · </span><span className="text-ink-700">{d.problem}</span></div>
                  <div><span className="font-semibold text-ink-400">Decision · </span><span className="text-ink-700">{d.decision}</span></div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-50 pt-3">
                  <CategoryPill category={d.category} />
                  <span className="text-[11px] text-ink-400">{fmtDate(d.date)} · {owner?.name}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <Badge>{d.evidence.length} evidence</Badge>
                    {d.alternatives.length > 1 && <Badge>{d.alternatives.length} alternatives</Badge>}
                    {v.limited && <Badge color="#8a6d3b">FIELDS REDACTED</Badge>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {open && (
        <Drawer title={open.code} sub={open.title} onClose={() => setOpen(null)} width={520}>
          <div className="flex items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[open.status]}`}>{open.status}</span>
            <CategoryPill category={open.category} />
            <ConfidenceBar value={open.confidence} />
          </div>

          <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed">
            {[
              ['Problem', open.problem],
              ['Decision', open.decision],
              ['Impact', open.impact],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="eyebrow mb-1">{k}</div>
                <div className="text-ink-700">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="eyebrow mb-1.5">Owner</div>
            {(() => {
              const owner = PEOPLE.find((p) => p.key === open.ownerKey)
              return (
                <div className="flex items-center gap-2.5 rounded-lg border border-ink-100 p-2.5">
                  <Avatar initials={owner?.initials ?? '?'} accent={owner?.accent ?? '#999'} size={28} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-ink-900">{owner?.name}</div>
                    <div className="text-[11px] text-ink-400">{owner?.role}</div>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="mt-4">
            <div className="eyebrow mb-1.5">Alternatives considered</div>
            <div className="space-y-1.5">
              {open.alternatives.map((a) => (
                <div key={a.name} className={`rounded-lg border p-2.5 text-[12px] ${a.chosen ? 'border-emerald-300 bg-emerald-50/50' : 'border-ink-100'}`}>
                  <div className="flex items-center gap-2">
                    {a.chosen && <span className="rounded bg-emerald-100 px-1.5 py-px text-[9.5px] font-bold text-emerald-700">CHOSEN</span>}
                    <span className="font-medium text-ink-900">{a.name}</span>
                  </div>
                  {a.note && <div className="mt-0.5 text-[11px] text-ink-500">{a.note}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="eyebrow mb-1.5">Evidence chain</div>
            <div className="space-y-1.5">
              {open.evidence.map((code) => {
                const m = MEMORIES.find((x) => x.code === code)
                if (!m) return null
                const v = evaluateCategory(m.category, user, policies)
                return (
                  <div key={code} className={`rounded-lg border p-2.5 text-[11.5px] leading-snug ${v.allowed ? 'border-ink-100 text-ink-700' : 'border-dashed border-amber-200 bg-amber-50/40 text-amber-600'}`}>
                    <div className="flex items-center justify-between">
                      <span className="num font-semibold">{code}</span>
                      <span className="text-[10px] text-ink-300">{SOURCES.find((s) => s.key === m.sourceKey)?.name}</span>
                    </div>
                    <div className="mt-0.5">{v.allowed ? m.statement : 'Evidence restricted for your role — exists, was checked, not readable.'}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {open.sensitiveFields && verdictFor(open).limited && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[11.5px] text-amber-700">
              LIMITED scope: {open.sensitiveFields.join(', ')} redacted for {user.role}.
            </div>
          )}

          {open.supersedes && (
            <div className="mt-4 rounded-lg bg-ink-50 p-3 text-[11.5px] text-ink-500">
              Supersedes <span className="num font-semibold text-ink-700">{open.supersedes}</span> — the prior record remains in decision history.
            </div>
          )}
        </Drawer>
      )}
    </div>
  )
}
