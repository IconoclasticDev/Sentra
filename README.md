# Sentra

**A Drift-Aware Local LLM Framework for Enterprise Operations.**

A judge-ready, frontend-heavy ideathon prototype. Sentra turns a fictional company's
(NexaCore Systems) fragmented knowledge into a living organizational brain — with memory,
decisions, temporal reconstruction, a knowledge graph, role-based access and a governed
context API for AI agents.

> **RAG searches documents. Sentra understands the organization.**

This is a **synthetic prototype built for demonstration**. NexaCore Systems, its people,
customers and incidents are fictional. All connectors and model routing are simulated and
labelled as such in the UI. No external systems are contacted and nothing leaves your machine.

---

## Quick start

Requires Node 18+.

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

That's it. The entire demo runs client-side against seeded data.

Optional production build:

```bash
npm run build && npm run preview
```

---

## What actually works (not mockups)

| Surface | What to try |
|---|---|
| **Landing** | `Enter Sentra` or `View Architecture` |
| **Overview** | 8,420 memories / 1,146 entities / 4,782 relationships; memory growth chart; live graph snapshot; security posture |
| **Ask Brain** | Ask *“Why was Project Orion delayed?”* — animated 6-stage pipeline, structured answer, 6 clickable evidence cards, *Why this answer?* metadata |
| **Role switching** | Bottom-left user card → switch CEO → Intern → **ask the same question again** |
| **Withheld banner** | As Intern: amber banner + `Why?` drawer listing every restricted category and its gate |
| **Memory** | 42+ searchable memories, detail drawer, supersession chains, **Memory Conflicts** with authority-based resolution |
| **Decisions** | ACTIVE / SUPERSEDED / REVERSED / PENDING; alternatives considered; evidence chains; sensitive-field redaction |
| **Knowledge Graph** | Force-directed canvas, 31 nodes / 49 typed edges, kind filters, node drawer, *Who knows distributed inference?* |
| **Timeline** | Month scrubber (Jan–Sep), *Compare March ↔ September*, **What changed?** before→after cards |
| **Sources** | 12 simulated connectors, animated *Sync Now* (7 stages), **real local file upload** with deterministic ingestion |
| **Agents** | 4 agents, *Request Company Context* with authorized context + redactions, API panel (`POST /api/agent/context`) |
| **Access Control** | Interactive permission matrix — **click any cell** to cycle ALLOW → LIMITED → DENY; clearance floors enforced |
| **Audit Log** | Every query, denial, policy change, identity switch and sync is recorded with reasons |
| **System / Privacy** | Animated architecture flow (clickable layers), sensitivity→model-route table, honesty panel |
| **Global search** | `⌘K` / `Ctrl+K` — permission-aware grouped search |

---

## The two-minute demo

1. Enter → **Overview**.
2. **Ask Brain** → *“Why was Project Orion delayed?”* → evidence-backed answer at **94%**.
3. Bottom-left → switch **Maya Kapoor (CEO)** → **Kunal Verma (Intern)**.
4. Ask the **same question** → shorter answer at **78%** + amber
   **“Some information was withheld”** banner → click **Why?**.
5. **Timeline** → *Compare March ↔ September* → Architecture A → B.
6. **Agents** → Sales Agent → *“Prepare a customer response for Acme”* → authorized context with
   restricted fields removed.
7. **Audit Log** → every step above is already recorded.

The full 5–8 minute pitch script is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

---

## Architecture (one paragraph)

Everything renders from a single seeded dataset (`frontend/src/data/company.ts`), so Orion,
Acme, people and dates can never contradict each other across screens. A permission engine
(`frontend/src/lib/permissions.ts`) evaluates every object through two gates — a **category
clearance floor** and a **role policy effect** — plus a source-scope matrix. The answer service
(`frontend/src/lib/answers.ts`) filters candidates *before* synthesis, so restricted content is
never shown, partially shown, or even counted as retrieved. All mutations (policies, identity,
syncs, uploads) append to an in-memory audit log. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Honesty in product copy

* Connectors are labelled **“Simulated connectors”** — no external system is contacted.
* The deployment story is **“Demonstration of private deployment architecture”** — never a
  certification claim.
* Expertise ranking is labelled **“Knowledge Graph inference — demo signal, not an HR assessment.”**
* The model router is labelled **simulated** — the *policy seam* is the idea being demonstrated.

## Documentation

| Doc | Contents |
|---|---|
| [RUN_LOCAL.md](RUN_LOCAL.md) | Exact setup commands, ports, troubleshooting |
| [DEMO_SCRIPT.md](DEMO_SCRIPT.md) | 8-step judge walkthrough with what to click and say |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Data model, permission engine, answer pipeline, state flow |
| [COMPETITIVE_POSITIONING.md](COMPETITIVE_POSITIONING.md) | Why this is not RAG, enterprise search, or "chat with your docs" |

---

*Sentra — ideathon prototype. Synthetic data throughout.*
