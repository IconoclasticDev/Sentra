# ARCHITECTURE.md

## Shape of the system

PrivateBrain is a **frontend-heavy prototype**: a Vite + React 18 + TypeScript SPA with
Tailwind CSS, Recharts and a canvas force-directed graph. There is no server; everything runs
in the browser against one seeded dataset. The product's ideas (permission engine, temporal
memory, governed agent context) are implemented as real, inspectable client code.

```
frontend/
├── src/
│   ├── data/
│   │   ├── types.ts        domain types: categories, RBAC, memories, decisions, graph
│   │   └── company.ts      THE seed — NexaCore Systems, consumed by every screen
│   ├── lib/
│   │   ├── permissions.ts  the policy engine (clearance floors × role policy × source scope)
│   │   ├── answers.ts      intent classification → role-filtered retrieval → synthesis plan
│   │   ├── ui.tsx          Avatar, Badge, EffectPill, ConfidenceBar, EmptyState…
│   │   └── format.ts       labels and truncation
│   ├── state/
│   │   └── AppContext.tsx  session identity, policy matrices, audit log, notifications, reset
│   ├── shell/              Sidebar, TopBar, RoleSwitcher, CommandPalette, ResetDemoButton
│   ├── components/         GraphCanvas (force sim), Drawer
│   └── pages/              one module per product surface (11 pages + landing)
```

## 1. Single source of truth

`data/company.ts` exports the whole fictional company: 6 people, 4 projects, 4 customers,
12 sources, **42 memories**, 9 decisions, 22 timeline events, 31 graph entities with 49 typed
edges, 3 memory conflicts, 4 agents, and the two RBAC matrices.

Every screen reads from these exports (or context derived from them), so **Orion, Acme, dates
and people cannot contradict themselves across pages**. Ask Brain evidence, Timeline events,
Graph nodes and Decision evidence chains all reference the same memory codes.

## 2. The permission engine

Two gates compose for every object (memory, decision, event, change):

```
verdict = clearance_floor(category) ∧ role_policy(role, category)
```

* **Clearance floor** — each category has a floor (`EXECUTIVE: L5, FINANCE/HR/SECURITY: L4,
  ENGINEERING/CUSTOMER: L3, PUBLIC/PRODUCT: L1`). Below the floor → DENY regardless of policy.
* **Role policy** — per-role effect: ALLOW / LIMITED / DENY. LIMITED passes the object but
  marks its sensitive fields (`arr_usd`, `contract_value`, `margin`, `revenue_targets`…)
  as redacted.
* **Source scope** — a third matrix (FULL/LIMITED/NONE per role per connector) gates the
  Sources page and participates in retrieval visibility.

The engine always returns a **verdict with a reason**, which the UI renders (the `Why?` drawer,
audit entries) instead of silently dropping content. Policy edits in Access Control are
guarded: a cell can never be raised past its clearance floor.

## 3. The answer pipeline

`lib/answers.ts` mirrors the pipeline the UI animates:

1. **Intent classification** — CAUSAL / TEMPORAL / EXPERTISE / CUSTOMER / DECISION_HISTORY /
   DECISIONS / GENERAL (lexical rules).
2. **Candidate retrieval** — intent-appropriate memory subsets.
3. **Permission filter** — `filterMemories` splits candidates into readable + withheld
   (with per-category counts and gate reasons).
4. **Variant synthesis** — the same question produces different *sections, tone and
   confidence* per access level. CEO gets customer/strategic impact at 94%; Intern gets a
   simplified summary at 78% plus the withheld banner.
5. **Evidence attachment** — only readable memories become evidence cards.
6. **Metadata** — memoriesConsulted, entities, decisions matched, access rules applied, model
   route (sensitivity-based, simulated).

No chain-of-thought is exposed — only system metadata.

## 4. Temporal memory

Memories carry `valid_from` / `valid_to`. Superseded records are **kept, not deleted**. The
Timeline page reconstructs point-in-time state by selecting memories whose validity interval
contains the scrubber date — that is how *Compare March ↔ September* shows Architecture A → B
and June → August without any duplicated "historical" dataset. Conflicts (`CONFLICTS`) pair
contradicting records with an authority-based resolution (recency, source authority, explicit
decision record) and an open case for the demo.

## 5. State flow

`AppContext` holds: current user, policy matrix, source matrix, audit log, notifications,
demo mode, ingested files and sync records. All mutations (identity switch, policy cell, sync,
upload) append an audit entry with a reason and risk. `Reset Demo Data` restores deep-cloned
seeds. The permission **profile** is memoized per user+policy, so every page re-renders on
identity or policy change — role switching is a global re-evaluation, not a label swap.

## 6. Visual identity

Warm-white base (`#f6f7f9`), charcoal ink ramp, single restrained blue accent (`#2f5f8f`),
Newsreader display serif for headings + Inter for UI. Cards are flat with hairline borders
and low shadows; motion is limited to 8px fade-up entrances and the deliberate pipeline
animation. No gradients, no neon, no chatbot bubbles.

## 7. What is simulated (and labelled)

* Connectors: **simulated** — sync is an animated pipeline with deterministic increments.
* File ingestion: **real local parsing** of type/size/name; entity extraction is deterministic,
  not a cloud service.
* Model router: **simulated policy seam** — sensitivity → route mapping is the demonstrated idea.
* Synthesis: deterministic renderer over the answer plan; no external LLM is called.
