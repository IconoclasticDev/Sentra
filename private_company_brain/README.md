# PrivateBrain — Sovereign Company Brain (Ideathon Prototype)

A polished, offline-first prototype for a **private organizational intelligence layer**.

## Demo thesis
Companies have knowledge scattered across Slack, GitHub, Drive, Notion, CRM, meetings and databases. PrivateBrain turns that fragmented information into a living organizational memory that understands:

- people, projects, customers and relationships
- historical vs current truth
- decision rationale and evidence
- role-based information boundaries
- persistent memory for humans and future AI agents
- customer-controlled / private model routing

### The core distinction
**RAG retrieves documents. PrivateBrain reconstructs organizational knowledge.**

## Included prototype capabilities

1. **Company Brain Q&A** — deterministic, evidence-backed reasoning for demo-critical questions.
2. **Temporal memory** — reconstruct how a project evolved over time.
3. **Decision memory** — store rationale, owner, status, date and evidence links.
4. **Knowledge graph** — visualize people ↔ projects ↔ customers and relationship confidence.
5. **Permission-aware retrieval** — content is filtered by clearance before synthesis; test CEO vs Intern.
6. **Persistent memory** — current truth, decision reasons, account memory and organizational lessons.
7. **Source connectors** — Slack, GitHub, Google Drive, Notion and CRM, with synthetic record counts and sync simulation.
8. **Privacy architecture screen** — local runtime, model-agnostic routing, permission-before-retrieval, freshness/provenance.
9. **Local semantic search** — TF-IDF baseline over authorized content, no external AI call required.

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000

Windows: `run.bat`
Linux/macOS: `./run.sh`

## Demo flow (90 seconds)

1. Open **Company Brain** and ask: `Why was Project Orion delayed?`
2. Show the answer with confidence, evidence chain, persistent memory and timeline.
3. Change identity from CEO → Intern and ask the same question. Restricted context disappears.
4. Ask: `Who has the most experience with Orion’s inference architecture?` and show evidence-backed ranking.
5. Open **Memory** and **Decisions** to show the structured substrate beneath the chat.
6. Open **Sources & sync** and trigger a sync to demonstrate continuous ingestion.
7. Open **Privacy & access** for the sovereign architecture story.

## Production direction (not implemented here)

Replace the local baseline with tenant-isolated ingestion workers, pgvector/graph storage, policy-aware retrieval, local/private LLM serving, cryptographic audit trails, connector OAuth, and agent-scoped permissions.

All data in this repository is synthetic.
