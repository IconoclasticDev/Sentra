import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EDGES, ENTITIES, MEMORIES, PEOPLE, PROJECTS, CUSTOMERS } from '../data/company'
import type { EntityKind } from '../data/types'
import { useApp } from '../state/AppContext'
import { GraphCanvas } from '../components/GraphCanvas'
import { Drawer } from '../components/Drawer'
import { Avatar, ConfidenceBar } from '../lib/ui'
import { evaluateCategory } from '../lib/permissions'

const KINDS: EntityKind[] = ['PERSON', 'PROJECT', 'CUSTOMER', 'DECISION', 'REPO', 'DOCUMENT', 'EVENT', 'TOPIC']

export function GraphPage() {
  const [params, setParams] = useSearchParams()
  const focus = params.get('focus') ?? 'orion'
  const { user, policies, logAudit } = useApp()
  const [kinds, setKinds] = useState<EntityKind[]>([...KINDS])
  const [q, setQ] = useState('')
  const [drawerKey, setDrawerKey] = useState<string | null>(null)
  const [expertiseQuery, setExpertiseQuery] = useState('')

  const searchMatches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return ENTITIES.filter((e) => e.name.toLowerCase().includes(s) || e.key.includes(s)).slice(0, 6)
  }, [q])

  const graph = useMemo(() => {
    let nodes = ENTITIES.filter((n) => kinds.includes(n.kind))
    const keys = new Set(nodes.map((n) => n.key))
    const edges = EDGES.filter((e) => keys.has(e.from) && keys.has(e.to))
    // Keep the largest connected component around the focus to avoid orphans
    const oneHop = new Set([focus])
    let grew = true
    while (grew) {
      grew = false
      for (const e of edges) {
        if (oneHop.has(e.from) && !oneHop.has(e.to) && keys.has(e.to)) { oneHop.add(e.to); grew = true }
        if (oneHop.has(e.to) && !oneHop.has(e.from) && keys.has(e.from)) { oneHop.add(e.from); grew = true }
      }
    }
    nodes = nodes.filter((n) => oneHop.has(n.key))
    const kept = new Set(nodes.map((n) => n.key))
    return { nodes, edges: edges.filter((e) => kept.has(e.from) && kept.has(e.to)) }
  }, [kinds, focus])

  const drawerEntity = ENTITIES.find((e) => e.key === drawerKey)
  const drawerEdges = EDGES.filter((e) => e.from === drawerKey || e.to === drawerKey)

  const openNode = (key: string) => {
    setDrawerKey(key)
    logAudit({
      userKey: user.key,
      action: 'GRAPH_EXPLORED',
      resource: `Node · ${ENTITIES.find((e) => e.key === key)?.name ?? key}`,
      result: 'OK',
      reason: 'Graph neighborhood inspected',
      risk: 'LOW',
    })
  }

  const expertise = useMemo(() => {
    if (!expertiseQuery.trim()) return null
    const topic = ENTITIES.find((e) => e.kind === 'TOPIC' && expertiseQuery.toLowerCase().split(' ').some((w) => w.length > 3 && e.name.toLowerCase().includes(w)))
    if (!topic) return []
    return EDGES.filter((e) => e.kind === 'EXPERT_IN' && e.to === topic.key)
      .sort((a, b) => b.weight - a.weight)
      .map((e) => {
        const person = PEOPLE.find((p) => p.key === e.from)
        const signals = MEMORIES.filter((m) => m.entityKeys.includes(e.from) && evaluateCategory(m.category, user, policies).allowed)
        return { person, weight: e.weight, signals: signals.slice(0, 3) }
      })
      .filter((x) => x.person)
  }, [expertiseQuery, user, policies])

  return (
    <div className="mx-auto flex h-[calc(100vh-52px)] max-w-[1400px] flex-col px-6 py-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[24px] font-medium tracking-tight text-ink-950">Knowledge graph</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            {graph.nodes.length} nodes · {graph.edges.length} typed relationships · {graph.edges.length > 0 ? 'people, projects, customers, decisions, evidence' : ''}
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a node…"
            className="w-44 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-300 focus:border-accent"
          />
          {searchMatches.length > 0 && (
            <div className="absolute right-0 top-10 z-20 w-56 animate-in rounded-lg border border-ink-200 bg-white p-1 shadow-pop">
              {searchMatches.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setParams({ focus: m.key }); setQ('') }}
                  className="block w-full rounded px-2.5 py-1.5 text-left text-[12px] text-ink-800 hover:bg-ink-50"
                >
                  {m.name} <span className="text-[10px] text-ink-300">· {m.kind.toLowerCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {KINDS.map((k) => {
          const active = kinds.includes(k)
          return (
            <button
              key={k}
              onClick={() => setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-400'
              }`}
            >
              {k.toLowerCase()}
            </button>
          )
        })}
        <div className="ml-auto flex gap-1.5">
          {['orion', 'atlas', 'acme', 'arjun'].map((k) => (
            <button
              key={k}
              onClick={() => setParams({ focus: k })}
              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                focus === k ? 'border-accent bg-accent-soft text-accent-strong' : 'border-ink-200 bg-white text-ink-500 hover:text-ink-700'
              }`}
            >
              {(PROJECTS.find((p) => p.key === k) ?? CUSTOMERS.find((c) => c.key === k) ?? PEOPLE.find((p) => p.key === k))?.name ?? k}
            </button>
          ))}
        </div>
      </div>

      <div className="card relative mt-3 min-h-0 flex-1 overflow-hidden">
        <GraphCanvas focus={focus} onSelect={openNode} onExpand={openNode} />
      </div>

      {/* Who knows this */}
      <div className="card mt-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink-950">Who knows this?</div>
            <div className="text-[11px] text-ink-400">Knowledge Graph inference — demo signal, not an HR assessment</div>
          </div>
          <input
            value={expertiseQuery}
            onChange={(e) => setExpertiseQuery(e.target.value)}
            placeholder="Try: distributed inference"
            className="w-56 rounded-lg border border-ink-200 px-3 py-1.5 text-[12.5px] outline-none placeholder:text-ink-300 focus:border-accent"
          />
        </div>
        {expertise && (
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            {expertise.length === 0 && <div className="text-[12px] text-ink-400">No expertise signal found for that topic.</div>}
            {expertise.map(({ person, weight, signals }, i) => (
              <div key={person!.key} className={`rounded-lg border p-3 ${i === 0 ? 'border-accent/40 bg-accent-soft/40' : 'border-ink-100'}`}>
                <div className="flex items-center gap-2">
                  <Avatar initials={person!.initials} accent={person!.accent} size={26} name={person!.name} />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-ink-900">{person!.name}</div>
                    <div className="text-[10px] text-ink-400">{person!.role}</div>
                  </div>
                  <div className="ml-auto"><ConfidenceBar value={weight} /></div>
                </div>
                <div className="mt-2 space-y-0.5">
                  {signals.map((s) => (
                    <div key={s.code} className="truncate text-[10px] text-ink-400">• {s.statement.slice(0, 52)}…</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Node drawer */}
      {drawerEntity && (
        <Drawer title={drawerEntity.name} sub={`${drawerEntity.kind.toLowerCase()} · ${drawerEntity.meta ?? ''}`} onClose={() => setDrawerKey(null)}>
          <div className="eyebrow mb-2">Connections ({drawerEdges.length})</div>
          <div className="space-y-1.5">
            {drawerEdges.map((e, i) => {
              const otherKey = e.from === drawerKey ? e.to : e.from
              const other = ENTITIES.find((x) => x.key === otherKey)
              const direction = e.from === drawerKey ? '→' : '←'
              return (
                <button key={i} onClick={() => setDrawerKey(otherKey)} className="flex w-full items-center gap-2 rounded-lg border border-ink-100 p-2.5 text-left transition-colors hover:border-accent/40">
                  <span className="num rounded bg-ink-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-ink-500">{e.kind}</span>
                  <span className="text-[12px] text-ink-500">{direction}</span>
                  <span className="text-[12.5px] font-medium text-ink-900">{other?.name}</span>
                  <span className="num ml-auto text-[10px] text-ink-300">{Math.round(e.weight * 100)}%</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex gap-2">            <button
              onClick={() => setParams(drawerKey ? { focus: drawerKey } : {})}
              className="flex-1 rounded-lg bg-ink-950 px-3 py-2 text-[12px] font-semibold text-white"
            >
              Focus graph here
            </button>
            <button
              onClick={() => {
                setParams(drawerKey ? { focus: drawerKey } : {})
                const m = MEMORIES.filter((x) => x.entityKeys.includes(drawerKey ?? '') && evaluateCategory(x.category, user, policies).allowed)
                setDrawerKey(null)
                if (m.length) logAudit({ userKey: user.key, action: 'MEMORY_ACCESSED', resource: `${m.length} memories for ${drawerEntity.name}`, result: 'OK', reason: 'From graph node drawer', risk: 'LOW' })
              }}
              className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-[12px] font-medium text-ink-700"
            >
              Related memories
            </button>
          </div>
        </Drawer>
      )}
    </div>
  )
}
