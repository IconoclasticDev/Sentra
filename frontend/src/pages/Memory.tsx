import { useMemo, useState } from 'react'
import { CONFLICTS, MEMORIES, SOURCES } from '../data/company'
import type { Memory, MemoryType } from '../data/types'
import { useApp } from '../state/AppContext'
import { evaluateCategory, filterMemories, redactedFieldsFor } from '../lib/permissions'
import { Drawer } from '../components/Drawer'
import { Badge, CategoryPill, ConfidenceBar, EmptyState, fmtDate } from '../lib/ui'

const TYPES: (MemoryType | 'ALL')[] = ['ALL', 'FACT', 'EVENT', 'DECISION', 'PROJECT_STATE', 'CUSTOMER_CONTEXT', 'RELATIONSHIP', 'POLICY']

const TYPE_STYLES: Record<string, string> = {
  FACT: 'bg-sky-50 text-sky-700',
  EVENT: 'bg-orange-50 text-orange-700',
  DECISION: 'bg-violet-50 text-violet-700',
  PROJECT_STATE: 'bg-emerald-50 text-emerald-700',
  CUSTOMER_CONTEXT: 'bg-amber-50 text-amber-700',
  RELATIONSHIP: 'bg-rose-50 text-rose-700',
  POLICY: 'bg-slate-100 text-slate-600',
}

export function MemoryPage() {
  const { user, policies, logAudit } = useApp()
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<MemoryType | 'ALL'>('ALL')
  const [open, setOpen] = useState<Memory | null>(null)

  const { readable, withheld } = useMemo(() => filterMemories(MEMORIES, user, policies), [user, policies])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return readable
      .filter((m) => (typeFilter === 'ALL' ? true : m.type === typeFilter))
      .filter((m) => (!s || m.statement.toLowerCase().includes(s) || m.detail.toLowerCase().includes(s) || m.entityKeys.join(' ').includes(s)))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [readable, q, typeFilter])

  const visibleCount = readable.length
  const deniedCount = withheld.reduce((acc, w) => acc + w.count, 0)

  const openMemory = (m: Memory) => {
    setOpen(m)
    logAudit({
      userKey: user.key,
      action: 'MEMORY_ACCESSED',
      resource: `${m.code} · ${m.statement.slice(0, 60)}…`,
      result: 'OK',
      reason: `${m.category} granted by policy for ${user.role}`,
      risk: 'LOW',
      category: m.category,
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium tracking-tight text-ink-950">Organizational memory</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            {visibleCount} memories visible to you{deniedCount > 0 && <> · {deniedCount} records hidden by policy</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search memory…"
            className="w-56 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-300 focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              typeFilter === t ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-500 hover:text-ink-700'
            }`}
          >
            {t === 'ALL' ? 'All types' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {withheld.length > 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3.5 py-2 text-[11.5px] text-amber-700">
          {withheld.map((w) => <span key={w.category} className="mr-3">{w.count} × {w.label} ({w.gate.toLowerCase()} gate)</span>)}
          — not readable at L{user.clearance} for {user.role}.
        </div>
      )}

      <div className="card mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No authorized memories found" body="Nothing in the memory index matches this filter for your access level. Restricted records are never shown or counted as results." /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5 font-semibold">Memory</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Entities</th>
                <th className="px-3 py-2.5 font-semibold">Source</th>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Confidence</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.code} onClick={() => openMemory(m)} className="cursor-pointer border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50/70">
                  <td className="max-w-[380px] px-4 py-2.5">
                    <div className="truncate text-[12.5px] font-medium text-ink-900">{m.statement}</div>
                    <div className="num mt-0.5 text-[10px] text-ink-300">{m.code}</div>
                  </td>
                  <td className="px-3 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[m.type]}`}>{m.type.replace('_', ' ')}</span></td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">{m.entityKeys.slice(0, 3).map((k) => <Badge key={k}>{k}</Badge>)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-ink-500">{SOURCES.find((s) => s.key === m.sourceKey)?.name ?? m.sourceKey}</td>
                  <td className="num px-3 py-2.5 text-[11.5px] text-ink-500">{fmtDate(m.date)}</td>
                  <td className="px-3 py-2.5"><ConfidenceBar value={m.confidence} /></td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      m.status === 'CURRENT' ? 'bg-emerald-50 text-emerald-700' : m.status === 'DISPUTED' ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-400'
                    }`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Conflicts */}
      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-[18px] font-medium text-ink-950">Memory conflicts</h2>
            <p className="text-[12px] text-ink-400">Contradiction detection with authority-based resolution — a “not just RAG” capability.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {CONFLICTS.map((c) => {
            const a = MEMORIES.find((m) => m.code === c.memoryACode)
            const b = MEMORIES.find((m) => m.code === c.memoryBCode)
            const auth = MEMORIES.find((m) => m.code === c.authoritativeCode)
            const canSeeA = a ? evaluateCategory(a.category, user, policies).allowed : false
            const canSeeB = b ? evaluateCategory(b.category, user, policies).allowed : false
            return (
              <div key={c.code} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status === 'RESOLVED' ? '✓' : '!'}
                    </span>
                    <span className="text-[13px] font-semibold text-ink-950">{c.topic}</span>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{c.status}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className={`rounded-lg border p-2.5 text-[11.5px] leading-snug ${canSeeA ? 'border-ink-100 bg-ink-50 text-ink-700' : 'border-dashed border-amber-200 bg-amber-50/40 text-amber-600'}`}>
                    {canSeeA ? <><span className="font-semibold">A · {a?.sourceKey.toUpperCase()}</span> — {a?.statement}</> : <><span className="font-semibold">A</span> — restricted for your role</>}
                  </div>
                  <div className={`rounded-lg border p-2.5 text-[11.5px] leading-snug ${canSeeB ? 'border-ink-100 bg-ink-50 text-ink-700' : 'border-dashed border-amber-200 bg-amber-50/40 text-amber-600'}`}>
                    {canSeeB ? <><span className="font-semibold">B · {b?.sourceKey.toUpperCase()}</span> — {b?.statement}</> : <><span className="font-semibold">B</span> — restricted for your role</>}
                  </div>
                </div>
                {c.status === 'RESOLVED' && auth && evaluateCategory(auth.category, user, policies).allowed && (
                  <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
                    <div className="text-[11.5px] font-semibold text-emerald-800">
                      Latest authoritative decision: {auth.statement.length > 70 ? auth.statement.slice(0, 70) + '…' : auth.statement}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <ConfidenceBar value={c.resolutionConfidence} />
                      <span className="text-[10px] text-emerald-700">resolution confidence</span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {c.basis.map((x, i) => (
                        <li key={i} className="flex gap-1.5 text-[10.5px] leading-snug text-emerald-700"><span>•</span>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {open && (
        <Drawer title={open.code} sub={`${open.type.replace('_', ' ')} · ${open.status}`} onClose={() => setOpen(null)}>
          <p className="text-[13.5px] font-medium leading-snug text-ink-950">{open.statement}</p>
          <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50 p-3 text-[12.5px] leading-relaxed text-ink-700">{open.detail}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            {[
              ['Created', fmtDate(open.validFrom)],
              ['Valid to', open.validTo ? fmtDate(open.validTo) : '— (current)'],
              ['Last confirmed', fmtDate(open.date)],
              ['Confidence', `${Math.round(open.confidence * 100)}%`],
              ['Source', SOURCES.find((s) => s.key === open.sourceKey)?.name ?? open.sourceKey],
              ['Source ref', open.sourceRef],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-ink-100 p-2.5">
                <div className="text-[10px] uppercase tracking-wide text-ink-300">{k}</div>
                <div className="mt-0.5 text-[12px] font-medium text-ink-800">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="eyebrow mb-1.5">Visibility</div>
            <CategoryPill category={open.category} />
            <span className="ml-2 text-[11.5px] text-ink-400">
              {open.category === 'PUBLIC' ? 'All employees' : `${open.category.toLowerCase()} policy gate applies`}
            </span>
          </div>
          {open.entityKeys.length > 0 && (
            <div className="mt-4">
              <div className="eyebrow mb-1.5">Entities</div>
              <div className="flex flex-wrap gap-1.5">{open.entityKeys.map((k) => <Badge key={k}>{k}</Badge>)}</div>
            </div>
          )}
          {open.supersededBy && (
            <div className="mt-4 rounded-lg border border-ink-100 p-3 text-[11.5px] text-ink-500">
              Superseded by <span className="num font-semibold text-ink-700">{open.supersededBy}</span> — this record remains
              for temporal reconstruction (“what did we know then?”).
            </div>
          )}
          {redactedFieldsFor(open).length > 0 && evaluateCategory(open.category, user, policies).limited && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[11.5px] text-amber-700">
              LIMITED scope: the following fields are redacted for your role — {redactedFieldsFor(open).join(', ')}.
            </div>
          )}
        </Drawer>
      )}
    </div>
  )
}
