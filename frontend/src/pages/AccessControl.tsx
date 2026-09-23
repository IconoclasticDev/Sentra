import { useState } from 'react'
import { CATEGORY_FLOORS, PEOPLE, SOURCES } from '../data/company'
import { CATEGORY_LABELS } from '../data/types'
import type { Category, Effect, RoleKey, SourceLevel } from '../data/types'
import { useApp } from '../state/AppContext'
import { Avatar, EffectPill, fmtClearance } from '../lib/ui'

const DEMO_ROLES: { key: RoleKey; label: string }[] = [
  { key: 'CEO', label: 'CEO' },
  { key: 'CTO', label: 'CTO' },
  { key: 'ENGINEERING_LEAD', label: 'Engineering Lead' },
  { key: 'SALES_LEAD', label: 'Sales Lead' },
  { key: 'SECURITY_LEAD', label: 'Security Lead' },
  { key: 'INTERN', label: 'Intern' },
]

const CATEGORY_ROWS: Category[] = ['ENGINEERING', 'PRODUCT', 'CUSTOMER', 'SECURITY', 'FINANCE', 'HR', 'EXECUTIVE']

const NEXT_EFFECT: Record<Effect, Effect> = { ALLOW: 'LIMITED', LIMITED: 'DENY', DENY: 'ALLOW' }
const NEXT_LEVEL: Record<SourceLevel, SourceLevel> = { FULL: 'LIMITED', LIMITED: 'NONE', NONE: 'FULL' }

export function AccessControlPage() {
  const { user, policies, setPolicy, sourceMatrix, setSourceLevel, resetPolicies } = useApp()
  const [tab, setTab] = useState<'users' | 'permissions' | 'sources'>('users')
  const [banner, setBanner] = useState('')

  const flash = (msg: string) => {
    setBanner(msg)
    setTimeout(() => setBanner(''), 2200)
  }

  const cyclePolicy = (roleKey: RoleKey, category: Category) => {
    const current = policies[roleKey]?.[category] ?? 'DENY'
    let next = NEXT_EFFECT[current]
    // Never looser than the clearance floor
    const floor = CATEGORY_FLOORS[category] ?? 1
    const person = PEOPLE.find((p) => p.roleKey === roleKey)
    if (next !== 'DENY' && person && person.clearance < floor) next = 'DENY'
    setPolicy(roleKey, category, next)
    flash(`Policy updated · ${roleKey} → ${CATEGORY_LABELS[category]} → ${next}`)
  }

  const cycleSource = (roleKey: RoleKey, sourceKey: string) => {
    const current = sourceMatrix[roleKey]?.[sourceKey] ?? 'NONE'
    const next = NEXT_LEVEL[current]
    setSourceLevel(roleKey, sourceKey, next)
    flash(`Source policy updated · ${roleKey} → ${sourceKey} → ${next}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium tracking-tight text-ink-950">Access control</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            Demo RBAC: role policy × clearance floor. Click any cell to change it — the entire workspace re-evaluates instantly.
          </p>
        </div>
        <button
          onClick={() => { resetPolicies(); flash('Policies restored to seed') }}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-600 hover:border-ink-300"
        >
          Restore seed policies
        </button>
      </div>

      {banner && (
        <div className="mt-3 animate-in rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[12px] font-semibold text-emerald-700">
          ✓ {banner}
        </div>
      )}

      <div className="mt-4 flex gap-1.5">
        {(['users', 'permissions', 'sources'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors ${
              tab === t ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-500 hover:text-ink-700'
            }`}
          >
            {t === 'users' ? 'Users' : t === 'permissions' ? 'Permissions' : 'Source Access'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Role</th>
                <th className="px-3 py-2.5 font-semibold">Clearance</th>
                <th className="px-3 py-2.5 font-semibold">Departments</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {PEOPLE.map((p) => (
                <tr key={p.key} className={`border-b border-ink-50 last:border-0 ${p.key === user.key ? 'bg-accent-soft/40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={p.initials} accent={p.accent} size={28} name={p.name} />
                      <div>
                        <div className="text-[12.5px] font-semibold text-ink-900">{p.name}</div>
                        <div className="text-[10.5px] text-ink-400">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{p.role}</td>
                  <td className="px-3 py-2.5"><EffectPill effect={p.clearance >= 5 ? 'ALLOW' : p.clearance >= 3 ? 'LIMITED' : 'DENY'} /><span className="ml-1.5 text-[11px] text-ink-500">{fmtClearance(p.clearance)}</span></td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">{p.departments.slice(0, 4).map((d) => <span key={d} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">{d}</span>)}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-400'}`}>ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-[10.5px] text-ink-400">
            {PEOPLE.length} identities in the demonstration directory. Your current session is highlighted.
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5 font-semibold">Category</th>
                {DEMO_ROLES.map((r) => <th key={r.key} className="px-3 py-2.5 text-center font-semibold">{r.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ROWS.map((c) => (
                <tr key={c} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-2">
                    <div className="text-[12.5px] font-medium text-ink-900">{CATEGORY_LABELS[c]}</div>
                    <div className="text-[10px] text-ink-300">floor L{CATEGORY_FLOORS[c] ?? 1}</div>
                  </td>
                  {DEMO_ROLES.map((r) => {
                    const person = PEOPLE.find((p) => p.roleKey === r.key)!
                    const floorOk = person.clearance >= (CATEGORY_FLOORS[c] ?? 1)
                    const effect = policies[r.key]?.[c] ?? 'DENY'
                    return (
                      <td key={r.key} className="px-2 py-2 text-center">
                        <button
                          onClick={() => cyclePolicy(r.key, c)}
                          className={`mx-auto flex w-[74px] justify-center rounded-md border px-2 py-1.5 transition-all hover:scale-[1.04] ${
                            effect === 'ALLOW' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : effect === 'LIMITED' ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-rose-200 bg-rose-50 text-rose-600'
                          }`}
                          title={`${r.label} → ${CATEGORY_LABELS[c]}: ${effect}. Click to change.`}
                        >
                          <EffectPill effect={effect} />
                        </button>
                        {!floorOk && <div className="mt-0.5 text-[8.5px] font-medium text-ink-300">floor L{CATEGORY_FLOORS[c]}</div>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-[10.5px] leading-snug text-ink-400">
            Cells with a clearance floor below the role’s clearance can never be raised above DENY — the floor gate cannot be
            loosened by policy. Every change is written to the audit log and immediately re-evaluated across Ask Brain, Memory, Graph and Decisions.
          </div>
        </div>
      )}

      {tab === 'sources' && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5 font-semibold">Source</th>
                {DEMO_ROLES.map((r) => <th key={r.key} className="px-3 py-2.5 text-center font-semibold">{r.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.key} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-[12.5px] font-medium text-ink-900">{s.name}</span>
                      <span className="text-[10px] text-ink-300">{s.kind}</span>
                    </div>
                  </td>
                  {DEMO_ROLES.map((r) => {
                    const level = sourceMatrix[r.key]?.[s.key] ?? 'NONE'
                    return (
                      <td key={r.key} className="px-2 py-2 text-center">
                        <button
                          onClick={() => cycleSource(r.key, s.key)}
                          className={`mx-auto flex w-[74px] justify-center rounded-md border px-2 py-1.5 transition-all hover:scale-[1.04] ${
                            level === 'FULL' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : level === 'LIMITED' ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-rose-200 bg-rose-50 text-rose-600'
                          }`}
                          title={`${r.label} → ${s.name}: ${level}. Click to change.`}
                        >
                          <span className="text-[10.5px] font-semibold">{level}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-[10.5px] text-ink-400">
            Example: Board Portal — CEO ✓ · CTO LIMITED · Engineering Lead ✕ · Sales Lead ✕ · Intern ✕. Click any cell to cycle FULL → LIMITED → NONE.
          </div>
        </div>
      )}
    </div>
  )
}
