import { useEffect, useRef } from 'react'
import { DEMO_USER_KEYS, PEOPLE } from '../data/company'
import { useApp } from '../state/AppContext'
import { Avatar, fmtClearance } from '../lib/ui'
import { CATEGORY_LABELS } from '../data/types'
import type { Category } from '../data/types'

const CATEGORY_ORDER: Category[] = ['PUBLIC', 'ENGINEERING', 'PRODUCT', 'CUSTOMER', 'SECURITY', 'FINANCE', 'HR', 'EXECUTIVE']

export function RoleSwitcher({ onClose }: { onClose: () => void }) {
  const { user, setUser, profile, logAudit } = useApp()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} className="absolute bottom-16 left-3 right-3 z-50 animate-in rounded-xl border border-ink-200 bg-white shadow-pop">
      <div className="border-b border-ink-100 px-4 py-3">
        <div className="eyebrow">Switch demo identity</div>
        <p className="mt-1 text-[11px] leading-snug text-ink-400">
          The entire workspace — memories, answers, graph, decisions — re-evaluates against the selected person’s access.
        </p>
      </div>
      <div className="max-h-[440px] overflow-y-auto py-1">
        {DEMO_USER_KEYS.map((key) => {
          const p = PEOPLE.find((x) => x.key === key)!
          const active = p.key === user.key
          return (
            <button
              key={key}
              onClick={() => { setUser(key); onClose() }}
              className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-50 ${active ? 'bg-accent-soft/60' : ''}`}
            >
              <Avatar initials={p.initials} accent={p.accent} size={34} name={p.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink-900">{p.name}</span>
                  {active && <span className="rounded bg-accent px-1.5 py-px text-[10px] font-semibold text-white">CURRENT</span>}
                </div>
                <div className="text-[11.5px] text-ink-500">{p.role} · {fmtClearance(p.clearance)}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <MiniChips roleKey={p.roleKey} clearance={p.clearance} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="border-t border-ink-100 px-4 py-2.5 text-[10.5px] leading-snug text-ink-400">
        Identity switches are recorded in the Audit Log. Policies for the current session: {profile.summary}.
        <button className="ml-1 font-medium text-accent hover:underline" onClick={() => { logAudit({ userKey: user.key, action: 'USER_SWITCHED', resource: 'Access profile inspected', result: 'OK', reason: 'Opened from role switcher', risk: 'LOW' }); onClose() }}>
          Log inspection
        </button>
      </div>
    </div>
  )
}

function MiniChips({ roleKey, clearance }: { roleKey: string; clearance: number }) {
  const { policies } = useApp()
  const floors: Record<string, number> = { PUBLIC: 1, PRODUCT: 1, ENGINEERING: 3, CUSTOMER: 3, SECURITY: 4, FINANCE: 4, HR: 4, EXECUTIVE: 5 }
  return (
    <>
      {CATEGORY_ORDER.map((c) => {
        const floorOk = (floors[c] ?? 1) <= clearance
        const effect = !floorOk ? 'DENY' : policies[roleKey]?.[c] ?? 'DENY'
        if (effect === 'DENY') return null
        return (
          <span key={c} className={`rounded px-1 py-px text-[9.5px] font-medium ${effect === 'LIMITED' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {CATEGORY_LABELS[c]}
            {effect === 'LIMITED' ? ' ~' : ''}
          </span>
        )
      })}
    </>
  )
}
