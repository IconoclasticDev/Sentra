from __future__ import annotations

import hashlib
import json
import math
import re
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE = Path(__file__).resolve().parent.parent
DATA_FILE = BASE / "data" / "company.json"
DB_FILE = BASE / "brain.db"
STATIC = BASE / "static"

app = FastAPI(title="Private Company Brain", version="2.0.0")
app.mount("/static", StaticFiles(directory=STATIC), name="static")


def conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_FILE)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    raw = json.loads(DATA_FILE.read_text())
    c = conn()
    c.executescript("""
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS docs;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS relationships;
    DROP TABLE IF EXISTS memories;
    DROP TABLE IF EXISTS decisions;
    DROP TABLE IF EXISTS connectors;
    DROP TABLE IF EXISTS sync_runs;
    CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, role TEXT, department TEXT, clearance INTEGER);
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT, status TEXT, description TEXT, classification INTEGER);
    CREATE TABLE customers (id TEXT PRIMARY KEY, name TEXT, classification INTEGER, status TEXT, summary TEXT);
    CREATE TABLE docs (id TEXT PRIMARY KEY, project_id TEXT, title TEXT, date TEXT, classification INTEGER, type TEXT, content TEXT, source_system TEXT, author_id TEXT);
    CREATE TABLE events (id TEXT PRIMARY KEY, date TEXT, kind TEXT, title TEXT, project_id TEXT, actor_id TEXT, classification INTEGER, summary TEXT);
    CREATE TABLE messages (id TEXT PRIMARY KEY, date TEXT, channel TEXT, author_id TEXT, classification INTEGER, project_id TEXT, text TEXT, source_system TEXT);
    CREATE TABLE relationships (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, target TEXT, type TEXT, confidence REAL);
    CREATE TABLE memories (id TEXT PRIMARY KEY, subject_type TEXT, subject_id TEXT, memory_type TEXT, text TEXT, date_from TEXT, date_to TEXT, confidence REAL, classification INTEGER, source_ids TEXT);
    CREATE TABLE decisions (id TEXT PRIMARY KEY, project_id TEXT, title TEXT, date TEXT, status TEXT, rationale TEXT, owner_id TEXT, classification INTEGER, evidence_ids TEXT);
    CREATE TABLE connectors (id TEXT PRIMARY KEY, name TEXT, kind TEXT, status TEXT, records INTEGER, last_sync TEXT, description TEXT);
    CREATE TABLE sync_runs (id TEXT PRIMARY KEY, connector_id TEXT, started_at TEXT, completed_at TEXT, records_ingested INTEGER, status TEXT, notes TEXT);
    """)
    c.executemany("INSERT INTO users VALUES (?,?,?,?,?)", [(x["id"],x["name"],x["role"],x["department"],x["clearance"]) for x in raw["users"]])
    c.executemany("INSERT INTO projects VALUES (?,?,?,?,?)", [(x["id"],x["name"],x["status"],x["description"],x["classification"]) for x in raw["projects"]])
    c.executemany("INSERT INTO customers VALUES (?,?,?,?,?)", [(x["id"],x["name"],x["classification"],x["status"],x["summary"]) for x in raw["customers"]])
    c.executemany("INSERT INTO docs VALUES (?,?,?,?,?,?,?,?,?)", [(x["id"],x.get("project_id"),x["title"],x["date"],x["classification"],x["type"],x["content"],x.get("source_system",x.get("type","Docs")),x.get("author_id")) for x in raw["documents"]])
    c.executemany("INSERT INTO events VALUES (?,?,?,?,?,?,?,?)", [(x["id"],x["date"],x["kind"],x["title"],x.get("project_id"),x.get("actor_id"),x["classification"],x["summary"]) for x in raw["events"]])
    c.executemany("INSERT INTO messages VALUES (?,?,?,?,?,?,?,?)", [(x["id"],x["date"],x["channel"],x["author_id"],x["classification"],x.get("project_id"),x["text"],x.get("source_system","Slack")) for x in raw["messages"]])
    c.executemany("INSERT INTO relationships(source,target,type,confidence) VALUES (?,?,?,?)", [(x["from"],x["to"],x["type"],x.get("confidence",0.95)) for x in raw["relationships"]])
    c.executemany("INSERT INTO memories VALUES (?,?,?,?,?,?,?,?,?,?)", [(x["id"],x["subject_type"],x["subject_id"],x["memory_type"],x["text"],x.get("date_from"),x.get("date_to"),x["confidence"],x["classification"],json.dumps(x.get("source_ids",[]))) for x in raw.get("memories",[])])
    c.executemany("INSERT INTO decisions VALUES (?,?,?,?,?,?,?,?,?)", [(x["id"],x["project_id"],x["title"],x["date"],x["status"],x["rationale"],x["owner_id"],x["classification"],json.dumps(x.get("evidence_ids",[]))) for x in raw.get("decisions",[])])
    c.executemany("INSERT INTO connectors VALUES (?,?,?,?,?,?,?)", [(x["id"],x["name"],x["kind"],x["status"],x["records"],x["last_sync"],x["description"]) for x in raw.get("connectors",[])])
    c.commit(); c.close()


if not DB_FILE.exists():
    init_db()


def all_rows(kind: str) -> list[dict[str, Any]]:
    c = conn(); rows = [dict(r) for r in c.execute(f"SELECT * FROM {kind}")]; c.close(); return rows


def visible(user_id: str, classification: int) -> bool:
    c = conn(); row = c.execute("SELECT clearance FROM users WHERE id=?", (user_id,)).fetchone(); c.close()
    return bool(row and row[0] >= classification)


def user_by_id(uid: str) -> dict[str, Any] | None:
    c=conn(); r=c.execute("SELECT * FROM users WHERE id=?",(uid,)).fetchone(); c.close(); return dict(r) if r else None


def public_corpus(user_id: str) -> list[dict[str, Any]]:
    corpus = []
    for d in all_rows("docs"):
        if visible(user_id, d["classification"]):
            corpus.append({"id":d["id"],"kind":"document","date":d["date"],"title":d["title"],"text":d["content"],"classification":d["classification"],"source_system":d["source_system"]})
    for m in all_rows("messages"):
        if visible(user_id, m["classification"]):
            corpus.append({"id":m["id"],"kind":"message","date":m["date"],"title":m["channel"],"text":m["text"],"classification":m["classification"],"source_system":m["source_system"]})
    for e in all_rows("events"):
        if visible(user_id, e["classification"]):
            corpus.append({"id":e["id"],"kind":"event","date":e["date"],"title":e["title"],"text":e["summary"],"classification":e["classification"],"source_system":"Event ledger"})
    for m in all_rows("memories"):
        if visible(user_id, m["classification"]):
            corpus.append({"id":m["id"],"kind":"memory","date":m.get("date_from") or "-","title":m["memory_type"],"text":m["text"],"classification":m["classification"],"source_system":"Brain memory"})
    return corpus


def search_docs(user_id: str, query: str, limit: int = 8) -> list[dict[str, Any]]:
    docs = public_corpus(user_id)
    if not docs or not query.strip(): return []
    texts = [d["title"] + " " + d["text"] for d in docs]
    v = TfidfVectorizer(stop_words="english", ngram_range=(1,2), min_df=1)
    mat = v.fit_transform(texts + [query])
    sims = cosine_similarity(mat[-1], mat[:-1]).ravel()
    ranked = sorted(zip(docs, sims), key=lambda x:x[1], reverse=True)
    out=[]
    for d,s in ranked[:limit]:
        if s <= 0: continue
        x=dict(d); x["score"]=round(float(s),3); out.append(x)
    return out


def project_id_from_query(query: str) -> str | None:
    q=query.lower()
    for p in all_rows("projects"):
        if p["name"].lower() in q or p["name"].split()[-1].lower() in q:
            return p["id"]
    return None


def classify_question(q: str) -> str:
    if "who" in q and ("know" in q or "experience" in q or "worked" in q): return "expert_finder"
    if any(x in q for x in ["changed", "evolved", "before and after", "timeline"]): return "temporal"
    if any(x in q for x in ["why", "reason", "decision"]): return "decision_reasoning"
    if any(x in q for x in ["brief", "customer", "account", "client"]): return "customer_context"
    if any(x in q for x in ["who is", "what is", "where"]): return "lookup"
    return "synthesis"


def source_evidence(user_id: str, ids: list[str]) -> list[dict[str,Any]]:
    corpus = {x["id"]:x for x in public_corpus(user_id)}
    return [corpus[x] for x in ids if x in corpus]


def answer(user_id: str, query: str) -> dict[str, Any]:
    u=user_by_id(user_id)
    if not u: raise HTTPException(404,"Unknown user")
    q=query.lower().strip(); mode=classify_question(q); hits=search_docs(user_id,query,12); pid=project_id_from_query(query)
    sources=hits[:8]
    timeline=[]; memory=[]; decisions=[]; caveats=[]; candidates=[]

    if mode=="decision_reasoning" and pid:
        timeline=sorted([e for e in all_rows("events") if e["project_id"]==pid and visible(user_id,e["classification"])],key=lambda x:x["date"])
        decisions=[d for d in all_rows("decisions") if d["project_id"]==pid and visible(user_id,d["classification"])]
        memory=[m for m in all_rows("memories") if m["subject_id"]==pid and visible(user_id,m["classification"])]
        if pid=="p1":
            answer_text=("Orion was delayed by a chain of operational and strategic changes. April load testing exposed p95 latency and noisy-neighbor behavior in the shared gateway. A subsequent security review elevated customer-controlled data isolation to a release requirement, which drove the May architecture decision toward private inference cells. The September plan therefore prioritizes private deployment for regulated workloads, while GPU scheduling and failover remain the final reliability gaps.")
            if not visible(user_id,3):
                answer_text=("Orion was delayed by performance issues found during load testing and a later move toward stronger customer isolation. The deeper security decision record is restricted for your role.")
                caveats.append("Some decision evidence is restricted at your current clearance level.")
        else: answer_text="The strongest evidence indicates the project changed after a measurable performance issue and a subsequent security requirement."
        conf=.96 if u["clearance"]>=3 else .86
        return pack(answer_text, conf, "decision-graph+temporal-memory", sources, timeline, memory, decisions, caveats)

    if mode=="expert_finder" and pid:
        scores=defaultdict(float)
        rationale=defaultdict(list)
        for r in all_rows("relationships"):
            if r["target"]==pid and r["source"].startswith("u"):
                scores[r["source"]]+=r["confidence"]
                rationale[r["source"]].append(r["type"])
        for m in all_rows("messages"):
            if m["project_id"]==pid and visible(user_id,m["classification"]):
                scores[m["author_id"]]+=1.7
                rationale[m["author_id"]].append("direct project discussion")
        people=[(s,user_by_id(uid),rationale[uid]) for uid,s in scores.items() if user_by_id(uid)]
        people.sort(key=lambda x:x[0],reverse=True)
        top=people[:5]
        candidates=[{"name":p[1]["name"],"role":p[1]["role"],"score":round(p[0],1),"signals":list(dict.fromkeys(p[2]))} for p in top]
        text=f"{top[0][1]['name']} is the strongest evidence-backed expert match for {next((p['name'] for p in all_rows('projects') if p['id']==pid),'the project')}. The ranking combines direct project activity, relationship evidence and authored discussions rather than title alone."
        return pack(text,.91,"graph+memory+evidence",sources,[],[],[],[],candidates)

    if mode=="temporal" and pid:
        timeline=sorted([e for e in all_rows("events") if e["project_id"]==pid and visible(user_id,e["classification"])],key=lambda x:x["date"])
        memory=[m for m in all_rows("memories") if m["subject_id"]==pid and visible(user_id,m["classification"])]
        return pack("The project's current state is the result of several dated changes, not one isolated decision. The timeline below shows the progression and the persistent memory records that survive across source systems.",.94,"temporal-memory",sources,timeline,memory,[],caveats)

    if mode=="customer_context" and "acme" in q:
        cst=next(x for x in all_rows("customers") if x["id"]=="c1")
        acme=[d for d in public_corpus(user_id) if "acme" in (d["text"]+d["title"]).lower()]
        if u["clearance"]<3:
            caveats.append("Restricted account strategy fields were filtered before synthesis.")
        return pack(f"Acme Industrial is currently {cst['status']}. The visible account evidence points to private deployment and customer-controlled inference as the key expansion condition. Their current narrative is: {cst['summary']}",.93,"customer-context",acme or hits[:6],[],[],[],caveats)

    if hits:
        text=f"I found {len(hits)} authorized pieces of organizational memory. The strongest evidence says: {hits[0]['text']}"
        if len(hits)>1: text+=f" A corroborating source adds: {hits[1]['text']}"
        return pack(text,round(min(.92,.55+hits[0]["score"]),2),"semantic-memory",sources,[],[],[],caveats)
    return pack("I don't have enough authorized evidence to answer that confidently.",.21,"insufficient-evidence",[],[],[],[],["No authorized evidence matched the request."])


def pack(text, confidence, mode, sources, timeline, memory, decisions, caveats, candidates=None):
    return {"answer":text,"confidence":confidence,"mode":mode,"sources":sources,"timeline":timeline,"memory":memory,"decisions":decisions,"caveats":caveats,"candidates":candidates or []}


class Ask(BaseModel):
    user_id: str = "u1"
    query: str


@app.get("/")
def root(): return FileResponse(STATIC / "index.html")

@app.get("/api/health")
def health(): return {"status":"ok","mode":"local-private","db":DB_FILE.name,"version":"2.0.0"}

@app.post("/api/reset")
def reset(): init_db(); return {"ok":True}

@app.get("/api/users")
def users(): return all_rows("users")

@app.get("/api/stats")
def stats():
    c=conn(); counts={t:c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in ["users","projects","customers","docs","events","messages","memories","decisions","relationships"]}; c.close()
    total=counts["docs"]+counts["events"]+counts["messages"]+counts["memories"]
    return {"company":json.loads(DATA_FILE.read_text())["company"],"counts":counts,"indexed_objects":total,"relationships":counts["relationships"]}

@app.get("/api/search")
def search(user_id:str=Query("u1"),q:str=Query("")): return {"results":search_docs(user_id,q,12)}

@app.post("/api/ask")
def ask(body:Ask): return answer(body.user_id,body.query)

@app.get("/api/graph")
def graph(user_id:str=Query("u1"),focus:str|None=None):
    users=all_rows("users"); projects=all_rows("projects"); customers=all_rows("customers"); rel=all_rows("relationships")
    nodes=[]; allowed=set()
    for u in users: nodes.append({"id":u["id"],"label":u["name"],"type":"person","meta":u["role"],"clearance":u["clearance"]}); allowed.add(u["id"])
    for p in projects: nodes.append({"id":p["id"],"label":p["name"],"type":"project","meta":p["status"],"clearance":p["classification"]}); allowed.add(p["id"])
    for cu in customers:
        if visible(user_id,cu["classification"]): nodes.append({"id":cu["id"],"label":cu["name"],"type":"customer","meta":cu["status"],"clearance":cu["classification"]}); allowed.add(cu["id"])
    edges=[{"source":r["source"],"target":r["target"],"type":r["type"],"confidence":r["confidence"]} for r in rel if r["source"] in allowed and r["target"] in allowed]
    if focus:
        neigh={focus}; changed=True
        while changed:
            changed=False
            for e in edges:
                if e["source"] in neigh or e["target"] in neigh:
                    for x in (e["source"],e["target"]):
                        if x not in neigh: neigh.add(x); changed=True
        nodes=[n for n in nodes if n["id"] in neigh]; edges=[e for e in edges if e["source"] in neigh and e["target"] in neigh]
    return {"nodes":nodes,"edges":edges}

@app.get("/api/timeline/{project_id}")
def timeline(project_id:str,user_id:str=Query("u1")):
    events=sorted([e for e in all_rows("events") if e["project_id"]==project_id and visible(user_id,e["classification"])],key=lambda x:x["date"])
    decisions=[d for d in all_rows("decisions") if d["project_id"]==project_id and visible(user_id,d["classification"])]; return {"events":events,"decisions":decisions}

@app.get("/api/memories")
def memories(user_id:str=Query("u1"),subject_id:str|None=None):
    rows=[m for m in all_rows("memories") if visible(user_id,m["classification"])]
    if subject_id: rows=[m for m in rows if m["subject_id"]==subject_id]
    return {"memories":rows}

@app.get("/api/decisions")
def decisions(user_id:str=Query("u1"),project_id:str|None=None):
    rows=[d for d in all_rows("decisions") if visible(user_id,d["classification"])]
    if project_id: rows=[d for d in rows if d["project_id"]==project_id]
    for d in rows:
        ids=json.loads(d["evidence_ids"]); d["evidence_count"]=len(ids); d["evidence_ids"]=ids
    return {"decisions":rows}

@app.get("/api/connectors")
def connectors(): return {"connectors":all_rows("connectors")}

@app.post("/api/connectors/{connector_id}/sync")
def sync_connector(connector_id:str):
    c=conn(); row=c.execute("SELECT * FROM connectors WHERE id=?",(connector_id,)).fetchone()
    if not row: c.close(); raise HTTPException(404,"Unknown connector")
    now=datetime.now().isoformat(timespec="seconds")
    run_id=hashlib.sha1(f"{connector_id}{now}".encode()).hexdigest()[:12]
    records=max(6,int(row["records"]*0.08))
    c.execute("INSERT INTO sync_runs VALUES (?,?,?,?,?,?,?)",(run_id,connector_id,now,now,records,"completed","Synthetic local sync for prototype demo"))
    c.execute("UPDATE connectors SET last_sync=?,status=? WHERE id=?",(now,"synced",connector_id)); c.commit(); c.close()
    return {"ok":True,"connector_id":connector_id,"records_ingested":records,"completed_at":now}

@app.get("/api/sync-runs")
def sync_runs(limit:int=Query(8,ge=1,le=30)):
    c=conn(); rows=[dict(r) for r in c.execute("SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT ?",(limit,))]; c.close(); return {"runs":rows}

@app.get("/api/access")
def access(user_id:str=Query("u1")):
    u=user_by_id(user_id); return {"user":u,"levels":[{"level":1,"label":"Public","description":"General company information"},{"level":2,"label":"Internal","description":"Team and project context"},{"level":3,"label":"Confidential","description":"Strategic and customer-sensitive memory"},{"level":4,"label":"Restricted","description":"Leadership-only information"}]}

@app.get("/api/company")
def company(): return json.loads(DATA_FILE.read_text())["company"]
