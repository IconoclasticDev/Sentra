# RUN_LOCAL.md

## Requirements

* **Node 18+** (Node 20 recommended). Check with `node -v`.
* No database, no API keys, no network access needed. The demo runs entirely in the browser
  against seeded synthetic data.

## Run (development)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

If port 5173 is taken:

```bash
npm run dev -- --port 5174
```

## Run (production build)

```bash
cd frontend
npm run build
npm run preview     # serves dist/ at http://localhost:4173
```

## One-shot commands from the repo root

```bash
# install + dev (macOS/Linux)
cd frontend && npm install && npm run dev

# Windows (PowerShell)
cd frontend; npm install; npm run dev
```

## Clean environment checklist

From an empty machine, a working setup is exactly:

1. Install Node 18+ (`node -v` to verify).
2. `cd frontend && npm install`
3. `npm run dev`
4. Open http://localhost:5173 → **Enter Company Brain**.

## Verification (30-second smoke test)

| Check | Expected |
|---|---|
| Landing renders | Wordmark + *Enter Company Brain* |
| Overview stats | 8,420 memories · 1,146 entities · 4,782 relationships |
| Ask CEO | “Why was Project Orion delayed?” → **94%** confidence, customer & strategic impact section |
| Switch user | Bottom-left card → Kunal Verma (Intern) |
| Ask Intern | Same question → **78%**, simplified, amber withheld banner, `Why?` drawer works |
| Access Control → Permissions | Click Intern → Engineering cell → cycles LIMITED ↔ DENY; Finance cell stays DENY (floor L4) |
| Sources → Sync Now | 7-stage animation → “✓ Sync complete — +N memories…” |
| Sources → Upload | Drop a `.md`/`.txt`/`.csv`/`.json` → ingestion stages → file listed with +memories/+entities |
| Agents → Sales Agent (as CEO) | “Prepare a customer response for Acme” → 5 authorized context items, margin redacted |
| Agents → Sales Agent (as Intern) | “Agent access denied” — empty authorized set, nothing leaked |
| Audit Log | QUERY_EXECUTED, ACCESS_DENIED, PERMISSION_CHANGED, USER_SWITCHED, SOURCE_SYNC all present |
| `⌘K` / `Ctrl+K` | Grouped search opens; searching "orion" returns Project Orion + decisions |
| Reset Demo Data | Sidebar → Reset → Confirm → back to seed (CEO, seed policies, seed audit) |

## Troubleshooting

* **Blank page** — hard-refresh (`Ctrl/Cmd+Shift+R`); the app uses hash routing so any `#/**` URL is fine.
* **Fonts look off** — Inter/Newsreader load from Google Fonts; offline you get system fallbacks, which is fine.
* **Port in use** — pass `-- --port 5174` to `npm run dev`.
* **Upload rejected** — supported types are PDF/TXT/MD/CSV/JSON under 10 MB (demonstration limit).
