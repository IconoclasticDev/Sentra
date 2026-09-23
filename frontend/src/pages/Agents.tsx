import { useState } from 'react'
import { AGENTS, CUSTOMERS, MEMORIES, PEOPLE } from '../data/company'
import type { Agent } from '../data/types'
import { useApp } from '../state/AppContext'
import { evaluateCategory } from '../lib/permissions'
import { Badge, CategoryPill } from '../lib/ui'
import { Drawer } from '../components/Drawer'
import { fmtDate } from '../lib/ui'

interface ContextResult {
  agent: Agent
  task: string
  authorized: { kind: string; label: string; detail: string; source: string }[]
  redactions: { category: string; label: string; reason: string }[]
  denied: boolean
  latencyMs: number
  confidence: number
}

const AGENT_TASKS: Record<string, string> = {
  'sales-agent': 'Prepare a customer response for Acme',
  'eng-agent': 'Summarize the Orion gateway incident and remediation',
  'support-agent': 'Triage open Acme support tickets',
  'research-agent': 'Draft a competitive brief on private inference',
}

export function AgentsPage() {
  const { user, policies, logAudit } = useApp()
  const [openAgent, setOpenAgent] = useState<Agent | null>(null)
  const [result, setResult] = useState<ContextResult | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [showApi, setShowApi] = useState(false)

  const requestContext = (agent: Agent, task: string) => {
    setRequesting(true)
    setTimeout(() => {
      // Simulate authorized context assembly under the agent's scope
      const authorized: ContextResult['authorized'] = []
      const redactions: ContextResult['redactions'] = []
      const scopeOk = (cat: Parameters<typeof evaluateCategory>[0]) =>
        agent.scopes.includes(cat as never) && evaluateCategory(cat, user, policies).allowed

      if (task.includes('Acme')) {
        const acme = CUSTOMERS.find((c) => c.key === 'acme')!
        if (scopeOk('CUSTOMER')) {
          authorized.push(
            { kind: 'ACCOUNT', label: 'Account history', detail: acme.description, source: 'CRM-4300 · Account plan' },
            { kind: 'CONTRACT', label: 'Current contract', detail: 'Enterprise tier · amendment C-2026-114: dedicated cells, customer-held keys, in-region processing.', source: 'Drive · C-2026-114' },
            { kind: 'PROJECT_STATE', label: 'Latest project state', detail: 'Orion cell migration 78% complete; Acme validates in staging; GA gate: 7-day clean soak.', source: 'Jira ORION-271' },
            { kind: 'RISK', label: 'Open risk', detail: 'Renewal risk HIGH pending Orion GA commitment (Derek Voss, VP Infrastructure).', source: 'CRM-4512' },
            { kind: 'OWNER', label: 'Responsible employee', detail: `${PEOPLE.find((p) => p.key === acme.csmKey)?.name} — Sales Lead`, source: 'CRM' },
          )
          // Redacted under agent policy
          redactions.push(
            { category: 'FINANCE', label: 'Contract value & margin', reason: `Sales Agent max clearance L${agent.maxClearance}; financial fields are L4+` },
          )
        } else {
          redactions.push({ category: 'CUSTOMER', label: 'Entire account context', reason: `CUSTOMER category denied for viewer policy (${user.role})` })
        }
      } else if (task.includes('Orion')) {
        if (scopeOk('ENGINEERING')) {
          authorized.push(
            { kind: 'INCIDENT', label: 'Incident summary', detail: 'Gateway saturation under concurrent load; p95 exceeded 4s vs 800ms SLO (Apr 11).', source: 'GitHub incident #92' },
            { kind: 'REMEDIATION', label: 'Remediation', detail: 'Architecture B selected May 3 — dedicated inference cells; migration 78% complete.', source: 'DEC-201' },
            { kind: 'OPEN_GAP', label: 'Open gap', detail: 'GPU allocation contention remains the final reliability gap for GA.', source: 'GitHub incident #101' },
          )
        } else {
          redactions.push({ category: 'ENGINEERING', label: 'Incident detail', reason: `ENGINEERING denied at L${user.clearance}` })
        }
      } else {
        const pub = MEMORIES.filter((m) => m.category === 'PUBLIC').slice(0, 3)
        for (const m of pub) authorized.push({ kind: 'MEMORY', label: m.type, detail: m.statement, source: m.sourceRef })
      }

      const denied = authorized.length === 0
      const latency = 180 + Math.floor(Math.random() * 240)
      const r: ContextResult = { agent, task, authorized, redactions, denied, latencyMs: latency, confidence: denied ? 0.2 : 0.92 }
      setResult(r)
      setRequesting(false)
      logAudit({
        userKey: agent.key,
        action: 'AGENT_CONTEXT_REQUEST',
        resource: `${agent.name} · ${task}`,
        result: denied ? 'RESTRICTED' : 'OK',
        reason: denied ? 'No authorized context in agent scope' : `${authorized.length} context items · ${redactions.length} redaction${redactions.length === 1 ? '' : 's'}`,
        risk: redactions.length ? 'MEDIUM' : 'LOW',
      })
    }, 900)
  }

  const requestJson = result
    ? {
        endpoint: 'POST /api/agent/context',
        request: { agent: result.agent.key, task: result.task, entities: ['acme', 'orion'], role: result.agent.key },
        response: {
          authorized_context: result.authorized.map((a) => ({ kind: a.kind, label: a.label, source: a.source })),
          redactions: result.redactions,
          confidence: result.confidence,
          latency_ms: result.latencyMs,
          model_route: result.agent.modelRoute,
        },
      }
    : null

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Sentra for machines</div>
          <h1 className="mt-1 font-display text-[24px] font-medium tracking-tight text-ink-950">AI Agent Center</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            The same memory substrate serves humans and agents — scoped, redacted, audited.
          </p>
        </div>
        <button onClick={() => setShowApi((v) => !v)} className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold ${showApi ? 'border-accent bg-accent-soft text-accent-strong' : 'border-ink-200 bg-white text-ink-600'}`}>
          API Panel
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {AGENTS.map((a) => {
          const owner = PEOPLE.find((p) => p.key === a.ownerKey)
          return (
            <div key={a.key} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold text-white" style={{ background: a.color }}>
                    {a.name.split(' ').map((w) => w[0]).join('')}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-ink-950">{a.name}</div>
                    <div className="text-[11.5px] text-ink-400">{a.purpose}</div>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-400'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'ACTIVE' ? 'bg-emerald-500 pulse-dot' : 'bg-ink-300'}`} />
                  {a.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.scopes.map((s) => <CategoryPill key={s} category={s} />)}
                <Badge>max L{a.maxClearance}</Badge>
                <Badge color="#2f5f8f">{a.modelRoute}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-ink-50 pt-3 text-[11px] text-ink-400">
                <span>Owner: {owner?.name}</span>
                <span className="num">{a.runsToday} runs today · {fmtDate(a.lastActivity)}</span>
              </div>

              <button
                onClick={() => { setOpenAgent(a); setResult(null) }}
                className="mt-3 w-full rounded-lg bg-ink-950 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-ink-900"
              >
                Request Company Context
              </button>
            </div>
          )
        })}
      </div>

      {showApi && requestJson && (
        <div className="card mt-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
            <span className="num text-[11.5px] font-semibold text-ink-700">{requestJson.endpoint}</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">200 OK · {result?.latencyMs}ms</span>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <pre className="overflow-x-auto border-b border-ink-100 p-4 text-[11px] leading-relaxed text-ink-700 md:border-b-0 md:border-r">
{JSON.stringify(requestJson.request, null, 2)}
            </pre>
            <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-ink-700">
{JSON.stringify(requestJson.response, null, 2)}
            </pre>
          </div>
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-[10.5px] text-ink-400">
            Visual representation of the governed context API. Scope enforcement and redaction happen server-side before the agent sees anything.
          </div>
        </div>
      )}

      {/* Request drawer */}
      {openAgent && (
        <Drawer title={openAgent.name} sub={openAgent.purpose} onClose={() => { setOpenAgent(null); setResult(null) }} width={520}>
          <div className="eyebrow mb-2">Simulated task</div>
          <div className="rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-[13px] font-medium text-ink-900">
            “{AGENT_TASKS[openAgent.key] ?? 'Request company context'}”
          </div>
          <button
            onClick={() => requestContext(openAgent, AGENT_TASKS[openAgent.key] ?? 'Request company context')}
            disabled={requesting}
            className="mt-3 w-full rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
          >
            {requesting ? 'Assembling authorized context…' : 'Run context request'}
          </button>

          {result && (
            <div className="mt-4 animate-in space-y-4">
              {result.denied ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-[13px] font-semibold text-rose-800">Agent access denied</div>
                  <div className="mt-1 text-[12px] leading-snug text-rose-700">
                    No context in {openAgent.name}’s scope is readable for this task under current policy. Nothing was leaked — the request returned an empty authorized set.
                  </div>
                </div>
              ) : (
                <div>
                  <div className="eyebrow mb-2">Authorized context ({result.authorized.length})</div>
                  <div className="space-y-2">
                    {result.authorized.map((c, i) => (
                      <div key={i} className="rounded-lg border border-ink-100 p-3">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[9.5px] font-bold text-ink-500">{c.kind}</span>
                          <span className="text-[10px] text-ink-300">{c.source}</span>
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-ink-900">{c.label}</div>
                        <div className="mt-0.5 text-[11.5px] leading-snug text-ink-600">{c.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.redactions.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                  <div className="text-[12.5px] font-semibold text-amber-800">Restricted information removed ({result.redactions.length})</div>
                  {result.redactions.map((r, i) => (
                    <div key={i} className="mt-1.5 text-[11.5px] leading-snug text-amber-700">
                      <span className="font-semibold">{r.label}</span> — {r.reason}
                    </div>
                  ))}
                </div>
              )}

              <div className="num rounded-lg bg-ink-50 px-3.5 py-2.5 text-[11px] text-ink-500">
                {result.authorized.length} authorized items · {result.redactions.length} redactions · {result.latencyMs}ms · confidence {Math.round(result.confidence * 100)}% · route {openAgent.modelRoute}
              </div>

              <div className="rounded-lg bg-accent-soft/60 p-3 text-[11.5px] leading-relaxed text-ink-600">
                Sentra is the memory layer for the human <span className="font-semibold">and</span> machine workforce:
                agents never hold their own copies of company knowledge — they request governed context.
              </div>
            </div>
          )}
        </Drawer>
      )}
    </div>
  )
}
