# COMPETITIVE_POSITIONING.md

## The one-line distinction

> **RAG searches documents. PrivateBrain understands the organization.**

## The landscape

| | RAG chat / "chat with your docs" | Enterprise search (incl. Glean-style) | **PrivateBrain** |
|---|---|---|---|
| Unit of knowledge | Document / chunk | Document / file | **Memory**: typed facts, decisions, states with validity, confidence, provenance |
| Answers with | Retrieved passages | File lists | **Synthesized, evidence-cited answers** with timeline, root cause, decision, impact |
| People | Not modelled | Directory | First-class graph entities with expertise signals |
| Decisions | Buried in docs | Findable | **Decision memory**: rationale, alternatives, evidence chains, reversal history |
| Time | Latest version wins | Latest version wins | **Temporal reconstruction** — what did the org know on date X |
| Contradictions | Silently returns both | Silently returns both | **Detected + resolved** by authority, recency and decision records |
| Permissions | Post-filter, often bolted on | Usually file-level | **Pre-synthesis gate**: clearance floors × role policy × source scope; withheld content is explained, not hidden |
| AI agents | Each agent re-implements RAG | N/A | **Governed context API** with the same policy engine and audit trail |

## Why "more than RAG" is structural, not cosmetic

1. **Retrieval is not the product — the substrate is.** The demo's answer for
   *"Why was Orion delayed?"* composes an incident (GitHub), an escalation (Slack), a review
   (meetings), a contract amendment (Drive), a security review (docs) and a re-plan (Jira) into
   one causal narrative. A chunk-retrieval system returns six documents and hopes.
2. **Supersession is modelled.** "June 15 launch" is not deleted when "August 15" supersedes it —
   it stays queryable for temporal questions. Versioned documents can't do this; validity
   intervals can.
3. **Access is a first-class answer component.** The same question yields 94% (CEO) vs 78%
   (Intern) — and the difference is *explained* with gates and counts. Permission-awareness
   changes the answer, not just the search results.
4. **The memory substrate is shared.** Humans query it in the workspace; agents request slices
   of it through one governed endpoint, with redactions applied before the agent ever sees
   bytes. No per-agent scraping, no shadow copies.

## Where this wins for an AI-native enterprise

* **Every AI agent becomes instantly company-aware** without leaking company data to external
  model providers by default — sensitivity routes the model tier (simulated in the demo).
* **Institutional memory survives people.** Decisions with rationale and alternatives stop the
  "why did we do this?" archaeology that follows every reorg and every departed lead.
* **Compliance becomes observable.** The audit log is not an IT artifact — every denied answer
  is an explained, risk-rated event.

## Honest boundaries

This prototype demonstrates the *ideas* with synthetic data and simulated connectors. It is not
a certified security product, not a production integration, and does not claim to be. The UI
states this wherever it matters — because a private-intelligence pitch that lies about its
privacy would be self-refuting.

## The demo proof points (2-minute version)

1. One question → cross-source causal answer at 94% with clickable evidence.
2. Same question as Intern → 78%, withheld banner, explained gates.
3. Timeline scrubber → the organization's knowledge at March vs September.
4. One agent context call → authorized context, redactions applied, fully audited.
