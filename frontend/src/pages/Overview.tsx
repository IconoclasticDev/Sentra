import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DECISIONS, EVENTS, HEADLINE_STATS, MEMORIES, SOURCES } from '../data/company'
import { useApp } from '../state/AppContext'
import { evaluateCategory } from '../lib/permissions'
import { fmtDate } from '../lib/ui'
import { GraphCanvas } from '../components/GraphCanvas'

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="num text-[20px] font-semibold leading-tight tracking-tight text-ink-950">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-ink-500">{label}</div>
      {sub && <div className="text-[10px] text-ink-300">{sub}</div>}
    </div>
  )
}

const GROWTH = Array.from({ length: 9 }, (_, i) => {
  const month = new Date(2026, 0 + i, 1)
  const base = 3200 + i * 620 + (i > 3 ? (i - 3) * 260 : 0)
  return { month: month.toLocaleString('en-US', { month: 'short' }), memories: base, decisions: 8 + i * 22 }
})

export function Overview() {
  const nav = useNavigate()
  const { user, policies, profile } = useApp()

  const visibleDecisions = useMemo(
    () => DECISIONS.filter((d) => evaluateCategory(d.category, user, policies).allowed).slice(0, 4),
    [user, policies],
  )
  const visibleEvents = useMemo(() => {
    const seen = new Set<string>()
    return EVENTS.filter((e) => {
      const v = evaluateCategory(e.category, user, policies).allowed
      if (!v || seen.has(e.projectKey ?? e.code)) return false
      seen.add(e.projectKey ?? e.code)
      return true
    }).slice(-5).reverse()
  }, [user, policies])
  const memoryCount = useMemo(() => MEMORIES.filter((m) => evaluateCategory(m.category, user, policies).allowed).length, [user, policies])

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">NexaCore Systems · Private organizational intelligence</div>
          <h1 className="mt-1 font-display text-[26px] font-medium tracking-tight text-ink-950">Organizational intelligence, privately controlled.</h1>
        </div>
        <div className="text-right text-[11px] text-ink-400">
          <div className="num font-semibold text-ink-700">{HEADLINE_STATS.indexedPct}% indexed</div>
          <div>Demo clock: Sep 15, 2026</div>
        </div>
      </div>

      {/* What is this app — narrative strip */}
      <div className="card mt-4 flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="eyebrow">What you’re looking at</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
            This is a private brain for a fictional company, <span className="font-semibold text-ink-900">NexaCore Systems</span>.
            Twelve simulated connectors (Slack, GitHub, Drive, CRM…) continuously turn raw activity into
            <span className="font-semibold text-ink-900"> {HEADLINE_STATS.memories.toLocaleString()} memories</span>,
            <span className="font-semibold text-ink-900"> {HEADLINE_STATS.decisions} decisions</span> and
            <span className="font-semibold text-ink-900"> {HEADLINE_STATS.relationships.toLocaleString()} relationships</span> —
            and every answer is filtered through your access level before it’s synthesized.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button onClick={() => nav('/ask')} className="rounded-lg bg-ink-950 px-3 py-1.5 text-[11.5px] font-semibold text-white">Ask it a question →</button>
            <button onClick={() => nav('/graph')} className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-ink-600 hover:border-ink-300">Explore the graph</button>
            <button onClick={() => nav('/system')} className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-ink-600 hover:border-ink-300">How it works</button>
          </div>
        </div>
        <div className="shrink-0 rounded-xl border border-ink-100 bg-ink-50 p-4 md:w-72">
          <div className="text-[11px] font-semibold text-ink-700">The one-sentence pitch</div>
          <div className="mt-1 font-display text-[14.5px] leading-snug text-ink-900">
            “We don’t search the company’s documents. We understand the company’s memory.”
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 lg:grid-cols-6">
        <Stat value={HEADLINE_STATS.memories.toLocaleString()} label="Memories" sub={`${memoryCount} visible to you`} />
        <Stat value={HEADLINE_STATS.entities.toLocaleString()} label="Entities" sub="People · projects · docs" />
        <Stat value={HEADLINE_STATS.relationships.toLocaleString()} label="Relationships" sub="Typed graph edges" />
        <Stat value={HEADLINE_STATS.decisions.toLocaleString()} label="Decisions" sub="With rationale + evidence" />
        <Stat value={String(HEADLINE_STATS.sources)} label="Sources" sub="Simulated connectors" />
        <Stat value={String(HEADLINE_STATS.agents)} label="AI Agents" sub="Using Sentra" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {/* Memory growth */}
        <div className="card col-span-2 p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="eyebrow">Organizational memory</div>
              <div className="mt-0.5 text-[12px] text-ink-400">Indexed memories, Jan – Sep 2026</div>
            </div>
            <div className="num text-[12px] font-semibold text-emerald-700">▲ 11.2% this month</div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f5f8f" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2f5f8f" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8b93a1' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8b93a1' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #dfe2e7', borderRadius: 8 }}
                  formatter={(value) => [Number(value).toLocaleString(), 'memories'] as [string, string]}
                />
                <Area type="monotone" dataKey="memories" stroke="#2f5f8f" strokeWidth={1.6} fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security */}
        <div className="card p-5">
          <div className="eyebrow">Security posture</div>
          <div className="mt-3 space-y-2.5">
            {[
              { k: 'Private Mode', v: 'ACTIVE', ok: true },
              { k: 'Policy Engine', v: 'ACTIVE', ok: true },
              { k: 'Audit Logging', v: 'ACTIVE', ok: true },
              { k: 'External Model Access', v: 'POLICY BASED', ok: true },
              { k: 'Email connector', v: 'DEGRADED', ok: false },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                <span className="text-[12px] font-medium text-ink-700">{r.k}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${r.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10.5px] leading-snug text-ink-400">
            Demonstration of private deployment architecture. No certification is claimed.
          </div>
        </div>

        {/* Graph snapshot */}
        <div className="card col-span-2 p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="eyebrow">Knowledge graph snapshot</div>
              <div className="mt-0.5 text-[12px] text-ink-400">Orion’s neighborhood — people, decisions, evidence</div>
            </div>
            <button onClick={() => nav('/graph')} className="text-[11.5px] font-medium text-accent hover:underline">Open graph →</button>
          </div>
          <div className="mt-2 h-56">
            <GraphCanvas focus="orion" compact onSelect={(key) => nav(`/graph?focus=${key}`)} />
          </div>
          <div className="mt-2 text-center text-[10.5px] text-ink-300">Drag nodes · live physics · click to open in the full graph</div>
        </div>

        {/* Recent decisions */}
        <div className="card p-5">
          <div className="eyebrow">Recent decisions</div>
          <div className="mt-3 space-y-2">
            {visibleDecisions.map((d) => (
              <button key={d.code} onClick={() => nav('/decisions')} className="block w-full rounded-lg border border-ink-100 px-3 py-2 text-left transition-colors hover:border-ink-200">
                <div className="truncate text-[12px] font-medium text-ink-900">{d.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-ink-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'ACTIVE' ? 'bg-emerald-500' : d.status === 'PENDING' ? 'bg-amber-500' : 'bg-ink-300'}`} />
                  {d.code} · {fmtDate(d.date)}
                </div>
              </button>
            ))}
            {visibleDecisions.length === 0 && <div className="py-6 text-center text-[11.5px] text-ink-400">No decisions visible at your access level.</div>}
          </div>
        </div>

        {/* Recent changes */}
        <div className="card col-span-2 p-5">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">Recent changes</div>
            <button onClick={() => nav('/timeline')} className="text-[11.5px] font-medium text-accent hover:underline">Full timeline →</button>
          </div>
          <div className="mt-3 space-y-0">
            {visibleEvents.map((e) => (
              <div key={e.code} className="flex gap-3 border-l border-ink-200 pb-3 pl-4 last:pb-0" style={{ marginLeft: 4 }}>
                <span className="absolute h-1.5 w-1.5 -translate-x-[23px] translate-y-1.5 rounded-full bg-accent" style={{ marginLeft: 19 }} />
                <div>
                  <div className="text-[12px] font-medium text-ink-900">{e.title}</div>
                  <div className="text-[11px] leading-snug text-ink-400">{fmtDate(e.date)} · {e.sourceKey.toUpperCase()} · {e.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources strip */}
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">Connected sources</div>
            <button onClick={() => nav('/sources')} className="text-[11.5px] font-medium text-accent hover:underline">Manage →</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SOURCES.filter((s) => profile.accessibleSources.includes(s.key)).map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 rounded-md border border-ink-100 px-2 py-1 text-[11px] text-ink-600">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
            {SOURCES.filter((s) => !profile.accessibleSources.includes(s.key)).map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 rounded-md border border-dashed border-ink-200 px-2 py-1 text-[11px] text-ink-300">
                {s.name} · restricted
              </span>
            ))}
          </div>
          <div className="mt-3 text-[10.5px] leading-snug text-ink-400">
            Simulated enterprise connectors — no external systems are contacted in this demo.
          </div>
        </div>
      </div>
    </div>
  )
}
