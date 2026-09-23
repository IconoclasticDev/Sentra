# DEMO_SCRIPT.md — the 8-step judge walkthrough (5–8 minutes)

**Setup before judges arrive:** `cd frontend && npm install && npm run dev` → open
http://localhost:5173. You should be on the landing screen, identity = Maya Kapoor (CEO),
DEMO MODE badge visible.

---

## Step 1 — The problem (30s) — Overview

Open **Overview**.

> “Every company’s knowledge is scattered across Slack, GitHub, email, documents, meetings
> and databases. Normal retrieval finds *documents*. It doesn’t know your organization —
> who decided what, what changed when, or who is allowed to see it.”

Point at the source strip (12 simulated connectors) and the headline stats:
**8,420 memories · 1,146 entities · 4,782 relationships · 184 decisions**.

## Step 2 — The wow (60s) — Ask Brain

Open **Ask Brain** → click the chip **“Why was Project Orion delayed?”**

Let the six-stage pipeline play (Understanding → Entities → Memory → Permissions → Evidence →
Answer). The answer lands at **94% confidence** with:

* a timeline (Mar 14 → May 05),
* a **root cause** card (auth lock serialization),
* a **decision** card (DEC-201, owner Arjun Mehta),
* **Customer & strategic impact** — Acme amendment, board credibility, FY27 wedge.

> “This wasn’t retrieved — it was *composed* from organizational memory across six source
> systems. Note the metadata: ‘Synthesized from authorized memory — not a document dump.’”

Open **Why this answer?** — retrieved memories, entities, decisions matched, access rules.
Open an **evidence card** — snippet, source, related entities.

## Step 3 — Permission story (90s) — the signature moment

Bottom-left user card → **Kunal Verma (Intern, L1)**. Everything re-renders.

Ask the **same question** (chip is still there). Now:

* the answer is simplified at **78% confidence**,
* the amber banner: **“Some information was withheld based on your access level.”**
* click **Why?** → Executive Strategy, Customer, Security — each with its gate
  (CLEARANCE vs ROLE_POLICY) and how many records existed but were not read.

> “Restricted content never reaches the answer layer. It isn’t generated and then hidden —
> it is filtered *before* synthesis. That’s the architecture, not a UI trick.”

Switch back to **Maya Kapoor (CEO)**, re-ask — the full answer returns.

## Step 4 — The graph (45s)

Open **Knowledge Graph**. Orion is pre-focused: Arjun OWNS, Rohan WORKS_ON, Acme CUSTOMER_OF,
PR #482 AUTHORED, DEC-201 AFFECTS. Hover nodes, click **Rohan Shah**, use
**“Who knows this?”** → type *distributed inference* → Rohan 94%, Arjun 88%, Priya 74% —
with the honest label *“demo signal, not an HR assessment.”*

## Step 5 — Temporal memory (45s)

Open **Timeline**. Drag the scrubber to **March** → Architecture A approved, June launch.
Click **Compare March ↔ September** → Architecture A → B, June → August.
Click **What changed?** → four before→event→after cards with evidence codes.

> “This isn’t a document diff. Memories carry validity intervals, so we can reconstruct
> what the company *knew* at any point in time.”

## Step 6 — Governance you can touch (45s)

Open **Access Control** → **Permissions** tab. Click **Sales Lead → Engineering** (LIMITED → DENY
→ ALLOW) — watch the “✓ Policy updated” banner. Try **Intern → Finance** — it **stays DENY**
because the L4 clearance floor can’t be loosened by policy. Point at the audit note.

## Step 7 — Agents (60s)

Open **Agents** → **Sales Agent** → *“Prepare a customer response for Acme”* → **Run context
request**. Authorized context: account history, contract, project state, risk, owner — and
**“Restricted information removed”** (margin/contract value). Open **API Panel** to show
`POST /api/agent/context` with redactions in the response.

> “Agents don’t hold copies of company knowledge. They request governed context through the
> same permission layer humans use.”

## Step 8 — Close (30s) — Audit + System

Open **Audit Log** — every query, denial, permission change, identity switch and sync from this
session is already recorded with reasons and risk ratings.

Open **System / Privacy** — the architecture flow, the sensitivity→route model router, and the
honesty panel.

Closing line:

> **“One company. One private brain. Intelligence for humans and AI agents.
> We don’t search the company’s documents — we understand the company’s memory.”**

---

## Recovery lines

* If a judge asks “is this real AI?” → “The retrieval, permission engine and temporal
  reconstruction are real deterministic code. Synthesis is a deterministic renderer; the model
  router is a simulated policy seam. The UI labels this honestly.”
* If a judge asks “is it secure?” → “It’s a demonstration of private deployment architecture —
  permission-aware by construction, fully audited, nothing leaves this machine. It is not a
  certified product, and we never claim otherwise.”
* If something breaks → sidebar **Reset Demo Data** returns everything to seed in one click.
