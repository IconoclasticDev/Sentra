import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CUSTOMERS, DECISIONS, MEMORIES, PEOPLE, PROJECTS, SOURCES } from '../data/company'
import { useApp } from '../state/AppContext'
import { evaluateCategory } from '../lib/permissions'

interface Item {
  group: string
  label: string
  sub: string
  to: string
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const { user, policies } = useApp()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [
      { group: 'Pages', label: 'Overview', sub: 'Dashboard', to: '/overview' },
      { group: 'Pages', label: 'Ask Brain', sub: 'Query organizational memory', to: '/ask' },
      { group: 'Pages', label: 'Timeline', sub: 'Temporal memory', to: '/timeline' },
      { group: 'Pages', label: 'Access Control', sub: 'Policies & users', to: '/access' },
      { group: 'Pages', label: 'Audit Log', sub: 'Recorded activity', to: '/audit' },
    ]
    for (const p of PROJECTS) out.push({ group: 'Projects', label: p.name, sub: `${p.status} · ${p.team}`, to: `/graph?focus=${p.key}` })
    for (const c of CUSTOMERS) {
      const visible = evaluateCategory('CUSTOMER', user, policies).allowed
      out.push({ group: 'Customers', label: c.name, sub: visible ? `${c.tier} · ${c.health}` : 'Restricted for your role', to: visible ? `/graph?focus=${c.key}` : '/access' })
    }
    for (const p of PEOPLE) out.push({ group: 'People', label: p.name, sub: `${p.role} · ${p.department}`, to: `/graph?focus=${p.key}` })
    for (const d of DECISIONS) {
      const visible = evaluateCategory(d.category, user, policies).allowed
      out.push({ group: 'Decisions', label: `${d.code} · ${d.title}`, sub: visible ? `${d.status} · ${d.date}` : 'Restricted for your role', to: '/decisions' })
    }
    for (const m of MEMORIES.slice(0, 24)) {
      const visible = evaluateCategory(m.category, user, policies).allowed
      if (!visible) continue
      out.push({ group: 'Memories', label: m.statement.slice(0, 64) + (m.statement.length > 64 ? '…' : ''), sub: `${m.type} · ${m.sourceKey}`, to: '/memory' })
    }
    for (const s of SOURCES) out.push({ group: 'Sources', label: s.name, sub: `${s.kind} · ${s.objects.toLocaleString()} objects`, to: '/sources' })
    return out
  }, [user, policies])

  const filtered = useMemo(() => {
    if (!q.trim()) return items.slice(0, 24)
    const s = q.toLowerCase()
    return items.filter((i) => i.label.toLowerCase().includes(s) || i.sub.toLowerCase().includes(s)).slice(0, 24)
  }, [items, q])

  const groups = useMemo(() => {
    const m = new Map<string, Item[]>()
    for (const i of filtered) {
      if (!m.has(i.group)) m.set(i.group, [])
      m.get(i.group)!.push(i)
    }
    return [...m.entries()]
  }, [filtered])

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-ink-950/30 pt-[12vh] backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-[560px] max-w-[92vw] animate-in overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-ink-100 px-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, people, memories, decisions…"
            className="w-full bg-transparent py-3.5 text-[14px] text-ink-900 outline-none placeholder:text-ink-300"
          />
          <kbd className="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-400">ESC</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto py-1.5">
          {groups.length === 0 && (
            <div className="px-4 py-8 text-center text-[12.5px] text-ink-400">
              No authorized results match “{q}”. Results respect your access level.
            </div>
          )}
          {groups.map(([group, list]) => (
            <div key={group}>
              <div className="eyebrow px-4 pb-1 pt-2.5">{group}</div>
              {list.map((i, idx) => (
                <button
                  key={`${group}-${idx}`}
                  onClick={() => { nav(i.to); onClose() }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-ink-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink-900">{i.label}</div>
                    <div className="truncate text-[11px] text-ink-400">{i.sub}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-200"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 bg-ink-50 px-4 py-2 text-[10.5px] text-ink-400">
          Search is permission-aware — restricted objects never appear in results.
        </div>
      </div>
    </div>
  )
}
