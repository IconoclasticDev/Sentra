import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SOURCES } from '../data/company'
import { useApp } from '../state/AppContext'

interface Layer {
  key: string
  name: string
  blurb: string
  detail: string
  color: string
}

const LAYERS: Layer[] = [
  {
    key: 'sources', name: 'Company sources', color: '#5b7a8c',
    blurb: 'Slack · GitHub · Drive · Notion · Jira · CRM · Email · Meetings · DB',
    detail: 'Twelve simulated connectors demonstrate the ingestion surface. In production these would be OAuth-scoped enterprise integrations; in this demonstration no external system is contacted.',
  },
  {
    key: 'ingestion', name: 'Private ingestion', color: '#4c7a4c',
    blurb: 'Continuous, tenant-isolated ingestion',
    detail: 'Documents, messages and records are parsed into chunks inside the company boundary. Uploads in this demo are parsed locally in the browser environment.',
  },
  {
    key: 'extraction', name: 'Entity extraction', color: '#2f5f8f',
    blurb: 'People · projects · decisions · customers · topics',
    detail: 'Entities, facts and decision records are extracted and linked, so knowledge becomes queryable structure rather than loose text.',
  },
  {
    key: 'memory', name: 'Organizational memory', color: '#1f4a73',
    blurb: 'Typed memories with validity intervals + confidence',
    detail: 'Every memory carries a type, category, source, confidence and validity window. Superseded records are retained — that is what makes temporal reconstruction possible.',
  },
  {
    key: 'graph', name: 'Knowledge graph', color: '#6b5b95',
    blurb: 'Typed relationships between all entities',
    detail: 'WORKS_ON, DECIDED, AFFECTS, AUTHORED, EXPERT_IN and more. The graph is what turns retrieval into relational reasoning.',
  },
  {
    key: 'policy', name: 'Permission layer', color: '#8f4c4c',
    blurb: 'Clearance floors × role policy × source scope',
    detail: 'Filtering happens before synthesis. Restricted material never reaches the answer layer — it is not generated-then-hidden, it is excluded upstream.',
  },
  {
    key: 'router', name: 'Model router', color: '#b0682c',
    blurb: 'Sensitivity → model tier (simulated)',
    detail: 'Executive/HR/legal material routes to local models only; public material may use external tiers per policy. The router here is a simulated policy engine, not a live model service.',
  },
  {
    key: 'surfaces', name: 'Humans + AI agents', color: '#3f4551',
    blurb: 'Workspace surfaces + governed context API',
    detail: 'Employees use the workspace; agents call the context API with the same policy enforcement, scoping and redaction applied.',
  },
]

const MODEL_ROUTES = [
  { level: 'RESTRICTED', categories: 'Executive · HR · Legal', route: 'LOCAL_PRIVATE', model: 'Local Llama (on-prem)', color: '#8f4c4c' },
  { level: 'CONFIDENTIAL', categories: 'Finance · Security · Customer', route: 'LOCAL_PRIVATE', model: 'Private Mistral (VPC)', color: '#8a6d3b' },
  { level: 'INTERNAL', categories: 'Engineering · Product', route: 'PRIVATE_TIER', model: 'Enterprise Model (dedicated)', color: '#2f5f8f' },
  { level: 'PUBLIC', categories: 'Public internal', route: 'EXTERNAL_ALLOWED', model: 'External Model (policy-permitted)', color: '#4c7a4c' },
]

export function SystemPage() {
  const { user, profile } = useApp()
  const nav = useNavigate()
  const [layers, setLayers] = useState<Layer[]>(LAYERS)
  const [selectedKey, setSelectedKey] = useState(LAYERS[3].key)
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [editing, setEditing] = useState(false)
  const selected = layers.find((layer) => layer.key === selectedKey) ?? layers[0]

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % layers.length)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [layers.length, playing])

  const updateLayer = (field: keyof Layer, value: string) => {
    setLayers((current) => current.map((layer) => (
      layer.key === selectedKey ? { ...layer, [field]: value } : layer
    )))
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Demonstration of private deployment architecture</div>
          <h1 className="mt-1 font-display text-[24px] font-medium tracking-tight text-ink-950">System & privacy</h1>
        </div>
        <div className="flex gap-2">
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">Private Mode · ACTIVE</span>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">Audit Logging · ACTIVE</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: 'Data boundary', v: 'Company controlled', d: 'All processing stays inside the demonstration boundary.' },
          { k: 'External model access', v: 'Policy based', d: 'Route decided per query sensitivity, not per user preference.' },
          { k: 'Permission filtering', v: 'Before synthesis', d: `${profile.allowed.length} categories allowed for ${user.role}.` },
          { k: 'Audit trail', v: 'Append-only', d: 'Every access decision is recorded with its reason.' },
        ].map((c) => (
          <div key={c.k} className="card p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-ink-300">{c.k}</div>
            <div className="mt-1 text-[14px] font-semibold text-ink-950">{c.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-ink-400">{c.d}</div>
          </div>
        ))}
      </div>

      {/* Architecture flow */}
      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-ink-100 bg-[radial-gradient(circle_at_top_right,_#e7f2f8,_transparent_45%)] p-6 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Live architecture canvas</div>
              <h2 className="mt-1 font-display text-[20px] font-medium text-ink-950">See how company knowledge moves</h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-500">
                Every stage is visible, inspectable and editable. Pause the flow, jump to a stage, or change its description to model a different deployment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPlaying((value) => !value)} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[11px] font-semibold text-ink-700 hover:border-ink-300">
                {playing ? 'Pause flow' : 'Play flow'}
              </button>
              <button onClick={() => setEditing((value) => !value)} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${editing ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-ink-300'}`}>
                {editing ? 'Done editing' : 'Edit architecture'}
              </button>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 text-[10px] text-ink-400">
            <span className="flex items-center gap-1.5"><span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> Processing live</span>
            <span>Stage {activeIndex + 1} of {layers.length}</span>
            <span className="ml-auto hidden sm:inline">Click any node to inspect</span>
          </div>
        </div>

        <div className="p-6">
        <div className="flex flex-col items-stretch gap-1.5 lg:flex-row lg:items-center">
          {layers.map((l, i) => (
            <div key={l.key} className="flex flex-1 items-center gap-1.5 lg:flex-col lg:items-stretch">
              <button
                onClick={() => { setSelectedKey(l.key); setActiveIndex(i) }}
                className={`relative flex-1 rounded-xl border-2 p-3 text-left transition-all duration-300 lg:text-center ${
                  activeIndex === i ? 'shadow-card' : 'border-ink-100 bg-white hover:border-ink-200'
                }`}
                style={activeIndex === i ? { borderColor: l.color, background: `${l.color}08` } : undefined}
              >
                {activeIndex === i && <span className="absolute -top-2 left-3 rounded-full bg-white px-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: l.color }}>active</span>}
                <div className="text-[12px] font-semibold text-ink-950">{l.name}</div>
                <div className="mt-0.5 hidden text-[10px] leading-snug text-ink-400 lg:block">{l.blurb}</div>
              </button>
              {i < layers.length - 1 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={i < activeIndex ? layers[i + 1].color : '#8b93a1'} strokeWidth="2" className={`shrink-0 lg:rotate-90 ${i < activeIndex ? 'flow-line' : ''}`}>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="animate-in rounded-xl border border-ink-100 bg-ink-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: selected.color }} />
              <div className="text-[13.5px] font-semibold text-ink-950">{selected.name}</div>
              <span className="text-[10px] uppercase tracking-wide text-ink-300">layer {layers.indexOf(selected) + 1} / {layers.length}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-600">{selected.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Inspectable', 'Policy-aware', 'Reversible'].map((tag) => <span key={tag} className="rounded-full border border-ink-200 bg-white px-2 py-1 text-[10px] text-ink-500">{tag}</span>)}
            </div>
          </div>
          {editing && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-4">
              <div className="eyebrow">Control selected stage</div>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Name
                <input value={selected.name} onChange={(event) => updateLayer('name', event.target.value)} className="mt-1 w-full rounded-md border border-ink-200 bg-white px-2.5 py-2 text-[12px] text-ink-900 outline-none focus:border-accent" />
              </label>
              <label className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Short signal
                <input value={selected.blurb} onChange={(event) => updateLayer('blurb', event.target.value)} className="mt-1 w-full rounded-md border border-ink-200 bg-white px-2.5 py-2 text-[12px] text-ink-900 outline-none focus:border-accent" />
              </label>
              <label className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">What happens here?
                <textarea value={selected.detail} onChange={(event) => updateLayer('detail', event.target.value)} rows={4} className="mt-1 w-full resize-none rounded-md border border-ink-200 bg-white px-2.5 py-2 text-[12px] leading-relaxed text-ink-900 outline-none focus:border-accent" />
              </label>
              <button onClick={() => setActiveIndex((activeIndex + 1) % layers.length)} className="mt-3 w-full rounded-md bg-ink-950 px-2.5 py-2 text-[11px] font-semibold text-white">Apply & inspect next stage →</button>
            </div>
          )}
          </div>
        )}
        </div>
      </div>

      {/* Model router */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="eyebrow">Model router — sensitivity → route (simulated)</div>
          <div className="mt-3 space-y-2">
            {MODEL_ROUTES.map((r) => (
              <div key={r.level} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3.5 py-2.5">
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: r.color }}>{r.level}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink-900">{r.categories}</div>
                  <div className="text-[10.5px] text-ink-400">{r.model}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b93a1" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" /></svg>
                <span className="num rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">{r.route}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10.5px] leading-snug text-ink-400">
            The switching itself is simulated in this prototype — the design seam (policy → route) is the product idea being demonstrated.
          </div>
        </div>

        <div className="card p-5">
          <div className="eyebrow">Honesty in copy</div>
          <div className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-ink-600">
            <div className="rounded-lg border border-ink-100 p-3">
              <span className="font-semibold text-ink-900">What this is:</span> a synthetic, judge-ready prototype of a private
              organizational intelligence layer. All data is fictional; connectors and the model router are simulated.
            </div>
            <div className="rounded-lg border border-ink-100 p-3">
              <span className="font-semibold text-ink-900">What this is not:</span> a certified security product, a real
              enterprise integration, or a production deployment. We deliberately avoid phrases like
              “enterprise-grade certified secure infrastructure”.
            </div>
            <div className="rounded-lg bg-accent-soft/60 p-3">
              <span className="font-semibold text-ink-900">The thesis being demonstrated:</span> RAG searches documents.
              Sentra understands the organization — people, decisions, history, relationships and permissions as
              first-class, governed structure.
            </div>
          </div>
          <button onClick={() => nav('/ask')} className="mt-4 w-full rounded-lg bg-ink-950 px-3 py-2 text-[12.5px] font-semibold text-white">
            Try it — Ask Sentra
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 rounded-md border border-ink-100 bg-white px-2.5 py-1 text-[10.5px] text-ink-500">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name} <span className="text-ink-300">· simulated</span>
          </span>
        ))}
      </div>
    </div>
  )
}
