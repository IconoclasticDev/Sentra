import { useMemo, useState } from 'react'
import { PEOPLE } from '../data/company'
import { useApp } from '../state/AppContext'
import { Drawer } from '../components/Drawer'
import { Avatar, EmptyState } from '../lib/ui'

const RESULT_STYLES: Record<string, string> = {
  OK: 'bg-emerald-50 text-emerald-700',
  RESTRICTED: 'bg-amber-50 text-amber-700',
  ERROR: 'bg-rose-50 text-rose-700',
}

const RISK_STYLES: Record<string, string> = {
  LOW: 'bg-ink-100 text-ink-500',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-rose-50 text-rose-700',
}

export function AuditLogPage() {
  const { audit, user } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string>('ALL')
  const [open, setOpen] = useState<(typeof audit)[number] | null>(null)

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return audit
      .filter((a) => (filter === 'ALL' ? true : a.action === filter))
      .filter((a) => !s || a.resource.toLowerCase().includes(s) || a.userKey.toLowerCase().includes(s) || a.action.toLowerCase().includes(s))
  }, [audit, q, filter])

  const actions = useMemo(() => ['ALL', ...new Set(audit.map((a) => a.action))], [audit])

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium tracking-tight text-ink-950">Audit log</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            Every query, denial, sync, permission change and identity switch is recorded — {audit.length} entries this session.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search activity…"
          className="w-56 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-300 focus:border-accent"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {actions.slice(0, 12).map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
              filter === a ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-500 hover:text-ink-700'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="card mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No matching activity" body="Try a different filter. Every interaction in this session is captured here." /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5 font-semibold">Time</th>
                <th className="px-3 py-2.5 font-semibold">Actor</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Resource</th>
                <th className="px-3 py-2.5 font-semibold">Result</th>
                <th className="px-3 py-2.5 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const person = PEOPLE.find((p) => p.key === a.userKey)
                return (
                  <tr key={`${a.ts}-${i}`} onClick={() => setOpen(a)} className="cursor-pointer border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50/70">
                    <td className="num px-4 py-2 text-[11px] text-ink-500">{a.ts.replace('T', ' ')}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {person ? <Avatar initials={person.initials} accent={person.accent} size={20} name={person.name} /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-[8px] font-bold text-ink-500">AI</span>}
                        <span className="text-[12px] font-medium text-ink-800">{person?.name ?? (a.userKey.includes('agent') ? a.userKey : a.userKey)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2"><span className="num rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">{a.action}</span></td>
                    <td className="max-w-[300px] px-3 py-2"><div className="truncate text-[12px] text-ink-700">{a.resource}</div></td>
                    <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${RESULT_STYLES[a.result]}`}>{a.result}</span></td>
                    <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLES[a.risk]}`}>{a.risk}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Drawer title={open.action} sub={`${open.ts.replace('T', ' ')} · ${open.result}`} onClose={() => setOpen(null)}>
          {(() => {
            const person = PEOPLE.find((p) => p.key === open.userKey)
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-ink-100 p-3">
                  {person ? <Avatar initials={person.initials} accent={person.accent} size={34} name={person.name} /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 text-[10px] font-bold text-white">AI</span>}
                  <div>
                    <div className="text-[13px] font-semibold text-ink-900">{person?.name ?? open.userKey}</div>
                    <div className="text-[11px] text-ink-400">{person?.role ?? 'Autonomous agent'}</div>
                  </div>
                  <span className={`ml-auto rounded px-2 py-0.5 text-[10px] font-bold ${RISK_STYLES[open.risk]}`}>{open.risk} RISK</span>
                </div>
                <div>
                  <div className="eyebrow mb-1">Resource</div>
                  <div className="rounded-lg border border-ink-100 bg-ink-50 p-3 text-[12.5px] text-ink-800">{open.resource}</div>
                </div>
                <div>
                  <div className="eyebrow mb-1">Reason / detail</div>
                  <div className="text-[12.5px] leading-relaxed text-ink-700">{open.reason}</div>
                </div>
                {open.category && (
                  <div>
                    <div className="eyebrow mb-1">Category</div>
                    <div className="text-[12.5px] font-medium text-ink-800">{open.category}</div>
                  </div>
                )}
                <div className="rounded-lg bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-500">
                  Entries are append-only in this demonstration. Viewing as {user.name} — the log itself is
                  permission-filtered in a real deployment; here it is shown fully for transparency.
                </div>
              </div>
            )
          })()}
        </Drawer>
      )}
    </div>
  )
}
