import { useNavigate } from 'react-router-dom'

export function Landing() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <div className="flex items-center gap-2.5 px-8 pt-7">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.4" />
            <circle cx="8" cy="8" r="2.2" fill="#2f5f8f" />
            <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" stroke="white" strokeWidth="1.2" />
          </svg>
        </div>
        <span className="text-[14px] font-semibold tracking-wide text-ink-950">SENTRA</span>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="text-center">
          <div className="eyebrow mb-4 animate-in">NexaCore Systems · Demonstration environment</div>
          <h1 className="animate-in animate-in-1 font-display text-[40px] font-medium leading-[1.12] tracking-tight text-ink-950">
            Your company already knows the answer.
            <br />
            It’s just scattered across <span className="text-accent">eleven tools</span>.
          </h1>
          <p className="animate-in animate-in-2 mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            Slack, GitHub, email, docs, meetings, the CRM — every fact your company knows lives in
            one of them, and none of them talk to each other. <span className="font-semibold text-ink-800">Sentra
            ingests all of it and builds a private, permission-aware brain of your organization</span> — its people,
            projects, decisions, customers and history — that employees and AI agents can securely ask questions of.
          </p>
          <div className="animate-in animate-in-3 mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => nav('/overview')}
              className="rounded-lg bg-ink-950 px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-card transition-all hover:bg-ink-900 hover:shadow-pop"
            >
              Enter Sentra
            </button>
            <button
              onClick={() => nav('/system')}
              className="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:border-ink-300"
            >
              View Architecture
            </button>
          </div>
        </div>

        {/* The contrast moment */}
        <div className="animate-in animate-in-4 mt-12">
          <div className="eyebrow mb-3 text-center">Why “chat with your documents” isn’t enough</div>
          <div className="card grid gap-0 overflow-hidden md:grid-cols-2">
            <div className="border-b border-ink-100 p-6 md:border-b-0 md:border-r">
              <div className="flex items-center gap-2">
                <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">RAG</span>
                <span className="text-[12.5px] font-semibold text-ink-700">“Why was Project Orion delayed?”</span>
              </div>
              <div className="mt-3 space-y-2">
                {['orion-load-test-report-final-v3.pdf', 'Slack — #orion (1,204 messages)', 'Gateway incident postmortem.md', 'Re-plan ticket ORION-260'].map((d, i) => (
                  <div key={d} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-[11.5px] text-ink-600">
                    <span className="truncate">{d}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-ink-300">{97 - i * 9}% match</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11.5px] italic leading-snug text-ink-400">
                Returns 4 documents. You still have to read all of them to learn the answer.
              </div>
            </div>
            <div className="bg-accent-soft/40 p-6">
              <div className="flex items-center gap-2">
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">SENTRA</span>
                <span className="text-[12.5px] font-semibold text-ink-800">Same question</span>
              </div>
              <div className="mt-3 text-[12.5px] leading-relaxed text-ink-700">
                “Orion was delayed because the shared gateway failed load testing (p95 4s vs 800ms SLO),
                and Architecture B was selected May 3 — <span className="font-semibold">moving launch June 15 → Aug 15</span>.”
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['Timeline · 8 events', 'Root cause', 'DEC-201 · Arjun M.', '94% confidence', '6 sources'].map((c) => (
                  <span key={c} className="rounded border border-accent/25 bg-white px-1.5 py-0.5 text-[10px] font-medium text-accent-strong">{c}</span>
                ))}
              </div>
              <div className="mt-3 text-[11.5px] italic leading-snug text-ink-400">
                One answer. With receipts, ownership and confidence.
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="animate-in animate-in-5 mt-10">
          <div className="eyebrow mb-3 text-center">How it works</div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { n: '01', k: 'Connect your sources', v: 'Simulated connectors ingest Slack, GitHub, Drive, Notion, Jira, CRM, email, meetings and databases into one private index.' },
              { n: '02', k: 'It becomes organizational memory', v: 'Facts become typed memories with validity windows; decisions keep their rationale; people, projects and customers form a knowledge graph.' },
              { n: '03', k: 'Humans and agents ask it questions', v: 'Every answer is permission-filtered before synthesis, cites its evidence, and every access is audited. Agents use the same governed API.' },
            ].map((s) => (
              <div key={s.n} className="card p-5">
                <div className="num text-[11px] font-bold text-accent">{s.n}</div>
                <div className="mt-1 text-[13.5px] font-semibold text-ink-950">{s.k}</div>
                <div className="mt-1.5 text-[12px] leading-relaxed text-ink-500">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-in mt-10 grid gap-3 md:grid-cols-4">
          {[
            { k: 'Private by design', v: 'Restricted content never reaches the answer layer — it’s filtered before synthesis, and the withholding is explained.' },
            { k: 'Temporal memory', v: 'Ask what the company knew in March vs September. Superseded facts stay queryable.' },
            { k: 'Decision memory', v: 'Every decision keeps its problem, alternatives, evidence and reversal history.' },
            { k: 'Agent-ready', v: 'One governed context API serves every AI agent — scoped, redacted, audited.' },
          ].map((c) => (
            <div key={c.k} className="card p-4">
              <div className="text-[12.5px] font-semibold text-ink-900">{c.k}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-ink-500">{c.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-[11px] text-ink-300">
          Synthetic prototype · NexaCore Systems and all data are fictional · Connectors and model routing are simulated · No external systems are contacted
        </div>
      </div>
    </div>
  )
}
