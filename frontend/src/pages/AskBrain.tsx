import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { answerQuestion, EXAMPLE_QUESTIONS, PIPELINE_STAGES } from '../lib/answers'
import type { AnswerResult, Evidence } from '../lib/answers'
import { Drawer } from '../components/Drawer'
import { Badge, CategoryPill, ConfidenceBar, fmtDate } from '../lib/ui'
import { SOURCE_AUTHORITY_LABELS } from '../lib/format'

const STAGE_MS = 420

export function AskBrain() {
  const { user, policies, logAudit } = useApp()
  const [question, setQuestion] = useState('')
  const [running, setRunning] = useState(false)
  const [stageIdx, setStageIdx] = useState(-1)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [whyOpen, setWhyOpen] = useState(false)
  const [withheldOpen, setWithheldOpen] = useState(false)
  const [evidenceOpen, setEvidenceOpen] = useState<Evidence | null>(null)
  const [copied, setCopied] = useState('')
  const timers = useRef<number[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const run = (q: string) => {
    if (!q.trim() || running) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setRunning(true)
    setResult(null)
    setWhyOpen(false)
    setWithheldOpen(false)
    setStageIdx(0)
    PIPELINE_STAGES.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStageIdx(i), i * STAGE_MS))
    })
    timers.current.push(window.setTimeout(() => {
      const r = answerQuestion(q, user, policies)
      setResult(r)
      setRunning(false)
      setStageIdx(-1)
      logAudit({
        userKey: user.key,
        action: 'QUERY_EXECUTED',
        resource: `“${q}”`,
        result: r.withheld.length ? 'RESTRICTED' : 'OK',
        reason: `${r.memoriesConsulted} memories consulted · ${r.withheld.length} restriction${r.withheld.length === 1 ? '' : 's'} · ${r.evidence.length} evidence items`,
        risk: r.withheld.length ? 'MEDIUM' : 'LOW',
        category: r.withheld[0]?.category,
      })
      for (const w of r.withheld) {
        logAudit({
          userKey: user.key,
          action: 'ACCESS_DENIED',
          resource: `${w.label} — withheld from answer synthesis`,
          result: 'RESTRICTED',
          reason: w.reason,
          risk: 'MEDIUM',
          category: w.category,
        })
      }
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, PIPELINE_STAGES.length * STAGE_MS + 250))
  }

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(what)
    setTimeout(() => setCopied(''), 1600)
  }

  const answerText = result
    ? [
        `Q: ${result.question}`,
        ``,
        `SUMMARY`,
        result.summary,
        ``,
        ...result.sections.flatMap((s) => {
          const lines = [`## ${s.heading}`]
          if (s.kind === 'timeline' && s.entries) for (const e of s.entries) lines.push(`${e.date} — ${e.label}${e.note ? ` (${e.note})` : ''}`)
          if (s.items) for (const i of s.items) lines.push(`• ${i}`)
          if (s.kind === 'cause') lines.push(`Cause: ${s.cause}`, `Effect: ${s.effect}`)
          if (s.kind === 'decision') lines.push(`Subject: ${s.subject}`, `Effect: ${s.effect}`)
          return lines
        }),
        ``,
        `Evidence: ${result.evidence.map((e) => `${e.id} (${e.source})`).join('; ')}`,
        `Confidence: ${Math.round(result.confidence * 100)}% · ${result.freshness}`,
      ].join('\n')
    : ''

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="text-center">
        <h1 className="font-display text-[26px] font-medium tracking-tight text-ink-950">Ask your company brain</h1>
        <p className="mt-1 text-[13px] text-ink-400">Ask questions across your organization’s private memory.</p>
      </div>

      <form
        className="mx-auto mt-5 flex max-w-2xl items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 shadow-card transition-shadow focus-within:shadow-pop"
        onSubmit={(e) => { e.preventDefault(); run(question) }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-300"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your organization…"
          className="w-full bg-transparent py-1 text-[14px] text-ink-900 outline-none placeholder:text-ink-300"
        />
        <button
          type="submit"
          disabled={running || !question.trim()}
          className="shrink-0 rounded-lg bg-ink-950 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {running ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-1.5">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => { setQuestion(q); run(q) }}
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[11.5px] text-ink-600 transition-colors hover:border-accent hover:text-accent"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Pipeline */}
      {(running || stageIdx >= 0) && (
        <div className="card mx-auto mt-6 max-w-2xl p-5">
          <div className="eyebrow mb-3">Reasoning pipeline</div>
          <div className="space-y-2.5">
            {PIPELINE_STAGES.map((s, i) => {
              const state = i < stageIdx ? 'done' : i === stageIdx ? 'active' : 'todo'
              return (
                <div key={s.key} className={`flex items-center gap-3 transition-opacity ${state === 'todo' ? 'opacity-35' : ''}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    state === 'done' ? 'bg-emerald-100 text-emerald-700' : state === 'active' ? 'bg-accent text-white' : 'bg-ink-100 text-ink-400'
                  }`}>
                    {state === 'done' ? '✓' : i + 1}
                  </span>
                  <span className={`text-[12.5px] ${state === 'active' ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>{s.label}</span>
                  {state === 'active' && <span className="animate-in text-[11px] text-accent">{s.detail}…</span>}
                  {state === 'done' && <span className="ml-auto text-[10.5px] text-ink-300">{s.detail}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Answer */}
      {result && (
        <div ref={resultRef} className="mt-6 animate-in space-y-4">
          {/* Withheld banner */}
          {result.withheld.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
                  Some information was withheld based on your access level
                </div>
                <button onClick={() => setWithheldOpen(true)} className="rounded-md border border-amber-400 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-amber-800 hover:bg-amber-100">
                  Why?
                </button>
              </div>
              <div className="mt-1.5 text-[11.5px] text-amber-700">
                {result.withheld.map((w) => w.label).join(' · ')} — the answer was synthesized only from authorized memories.
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge color="#2f5f8f">{result.intent}</Badge>
                <span className="text-[11px] text-ink-400">model route: {result.modelRoute}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-ink-300">Confidence</div>
                  <ConfidenceBar value={result.confidence} />
                </div>
              </div>
            </div>

            <h2 className="mt-3 text-[15px] font-semibold leading-snug text-ink-950">{result.question}</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-700">{result.summary}</p>

            {result.sections.map((s) => (
              <div key={s.heading} className="mt-5">
                <div className="eyebrow mb-2">{s.heading}</div>
                {s.kind === 'timeline' && s.entries && (
                  <div className="space-y-0">
                    {s.entries.map((e, i) => (
                      <div key={i} className="relative flex gap-3 border-l border-ink-200 pb-3 pl-4 last:pb-0" style={{ marginLeft: 4 }}>
                        <span className="absolute h-1.5 w-1.5 rounded-full bg-accent" style={{ left: -3.5, top: 5 }} />
                        <div className="num w-12 shrink-0 text-[11px] font-semibold text-ink-500">{e.date}</div>
                        <div>
                          <div className="text-[12.5px] font-medium text-ink-900">{e.label}</div>
                          {e.note && <div className="text-[11px] leading-snug text-ink-400">{e.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {s.kind === 'cause' && (
                  <div className="rounded-lg border border-ink-100 bg-ink-50 p-3.5">
                    <div className="text-[13px] font-semibold text-ink-950">{s.subject}</div>
                    <div className="mt-1.5 grid gap-2 text-[12px] leading-relaxed md:grid-cols-2">
                      <div><span className="font-semibold text-ink-500">Cause · </span><span className="text-ink-700">{s.cause}</span></div>
                      <div><span className="font-semibold text-ink-500">Effect · </span><span className="text-ink-700">{s.effect}</span></div>
                    </div>
                  </div>
                )}
                {s.kind === 'decision' && (
                  <div className="rounded-lg border border-accent/25 bg-accent-soft/50 p-3.5">
                    <div className="text-[13px] font-semibold text-ink-950">{s.subject}</div>
                    <div className="mt-1 text-[12px] text-ink-600">{s.cause}</div>
                    <div className="mt-1 text-[12px] text-ink-700"><span className="font-semibold">Impact · </span>{s.effect}</div>
                  </div>
                )}
                {s.items && s.kind !== 'timeline' && (
                  <ul className="space-y-1.5">
                    {s.items.map((it, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-700">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-300" />
                        {it}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* The RAG contrast — what a document search would have given you */}
            <div className="mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-ink-200 px-1.5 py-0.5 text-[9.5px] font-bold text-ink-500">INSTEAD OF</span>
                <span className="text-[11px] font-semibold text-ink-500">a list of documents to read yourself</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.evidence.slice(0, 4).map((e) => (
                  <span key={e.id} className="rounded-md border border-ink-200 bg-white px-2 py-1 text-[10.5px] text-ink-400 line-through decoration-ink-300">
                    {e.source.slice(0, 34)}{e.source.length > 34 ? '…' : ''}
                  </span>
                ))}
                <span className="rounded-md bg-accent-soft px-2 py-1 text-[10.5px] font-semibold text-accent-strong">
                  → composed into one answer, with receipts
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-3.5">
              <div className="text-[11px] text-ink-400">
                {result.freshness} · Synthesized from authorized memory — not a document dump
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => copy(answerText, 'answer')} className="rounded-md border border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-600 hover:border-ink-300">
                  {copied === 'answer' ? 'Copied ✓' : 'Copy answer'}
                </button>
                <button onClick={() => copy(result.evidence.map((e) => `${e.id} · ${e.source} · ${e.date}`).join('\n'), 'evidence')} className="rounded-md border border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-600 hover:border-ink-300">
                  {copied === 'evidence' ? 'Copied ✓' : 'Copy evidence'}
                </button>
                <button onClick={() => copy(answerText, 'brief')} className="rounded-md border border-ink-200 bg-ink-950 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {copied === 'brief' ? 'Exported ✓' : 'Export brief'}
                </button>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between">
              <div className="eyebrow">Evidence</div>
              <span className="text-[11px] text-ink-400">{result.evidence.length} sources · click to inspect</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {result.evidence.map((e) => (
                <button key={e.id} onClick={() => setEvidenceOpen(e)} className="rounded-lg border border-ink-100 p-3 text-left transition-all hover:border-accent/40 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="num text-[10.5px] font-semibold text-ink-400">{e.id}</span>
                    <CategoryPill category={e.category as never} />
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink-900">{e.title}</div>
                  <div className="mt-1.5 text-[10.5px] text-ink-400">{e.source} · {fmtDate(e.date)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Why this answer */}
          <div className="card overflow-hidden">
            <button onClick={() => setWhyOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-3.5 text-left">
              <div>
                <div className="text-[13px] font-semibold text-ink-900">Why this answer?</div>
                <div className="text-[11px] text-ink-400">System metadata — no hidden reasoning exposed</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-ink-400 transition-transform ${whyOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" strokeLinecap="round" /></svg>
            </button>
            {whyOpen && (
              <div className="animate-in grid grid-cols-3 gap-3 border-t border-ink-100 px-5 py-4 md:grid-cols-6">
                {[
                  { k: 'Retrieved memories', v: result.memoriesConsulted },
                  { k: 'Entities linked', v: result.entities.length },
                  { k: 'Decisions matched', v: result.decisionsMatched },
                  { k: 'Timeline events', v: result.timelineEvents },
                  { k: 'Access rules applied', v: Math.max(result.policiesApplied, 3) },
                  { k: 'Evidence sources', v: result.evidence.length },
                ].map((m) => (
                  <div key={m.k} className="rounded-lg bg-ink-50 px-3 py-2.5 text-center">
                    <div className="num text-[18px] font-semibold text-ink-950">{m.v}</div>
                    <div className="mt-0.5 text-[9.5px] leading-tight text-ink-400">{m.k}</div>
                  </div>
                ))}
                <div className="col-span-full flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10.5px] text-ink-400">Entities:</span>
                  {result.entities.map((e) => <Badge key={e.key}>{e.name}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withheld drawer */}
      {withheldOpen && result && (
        <Drawer title="Why was information withheld?" sub="Access evaluation for this answer" onClose={() => setWithheldOpen(false)}>
          <p className="text-[12.5px] leading-relaxed text-ink-600">
            You are viewing as <span className="font-semibold">{user.name}</span> ({user.role}, clearance L{user.clearance}).
            The following categories were excluded before synthesis:
          </p>
          <div className="mt-3 space-y-2">
            {result.withheld.map((w) => (
              <div key={w.category} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-amber-800">{w.label} — Restricted</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">{w.gate} GATE</span>
                </div>
                <div className="mt-1 text-[11.5px] leading-snug text-amber-700">{w.reason}</div>
                <div className="mt-1 text-[10.5px] text-amber-600/80">{w.count} relevant record{w.count === 1 ? '' : 's'} existed but was not read.</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-ink-50 p-3 text-[11.5px] leading-relaxed text-ink-500">
            Permission filtering happens <span className="font-semibold">before</span> synthesis — restricted content never
            reaches the answer layer. Switch identity in the bottom-left to see what changes.
          </div>
        </Drawer>
      )}

      {/* Evidence drawer */}
      {evidenceOpen && (
        <Drawer title={evidenceOpen.id} sub={`${SOURCE_AUTHORITY_LABELS[evidenceOpen.category] ?? 'Memory record'} · ${fmtDate(evidenceOpen.date)}`} onClose={() => setEvidenceOpen(null)}>
          <div className="space-y-4">
            <div>
              <div className="eyebrow mb-1">Snippet</div>
              <div className="rounded-lg border border-ink-100 bg-ink-50 p-3 text-[12.5px] leading-relaxed text-ink-700">{evidenceOpen.snippet}</div>
            </div>
            <div>
              <div className="eyebrow mb-1">Source</div>
              <div className="text-[12.5px] text-ink-700">{evidenceOpen.source}</div>
            </div>
            <div>
              <div className="eyebrow mb-1">Author</div>
              <div className="text-[12.5px] text-ink-700">{evidenceOpen.author ?? 'Recorded by connector'}</div>
            </div>
            <div>
              <div className="eyebrow mb-1">Related entities</div>
              <div className="flex flex-wrap gap-1.5">
                {evidenceOpen.entityKeys.map((k) => <Badge key={k}>{k}</Badge>)}
              </div>
            </div>
            <div className="rounded-lg bg-accent-soft/60 p-3 text-[11.5px] leading-relaxed text-ink-600">
              This evidence was checked against your access level before the answer was composed.
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}
