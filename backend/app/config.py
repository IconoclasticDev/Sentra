"""PrivateBrain backend configuration.

Everything is overridable by environment variable so the demo can be pointed at a
different database or an optional real LLM without touching code.
"""

from __future__ import annotations

import os
from pathlib import Path

try:  # python-dotenv is optional at runtime; absence must not break the server
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[3] / ".env")
except Exception:  # pragma: no cover - defensive
    pass


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = Path(os.getenv("PRIVATEBRAIN_DATA_DIR", PROJECT_ROOT / "data"))
UPLOAD_DIR = DATA_DIR / "uploads"
EXPORT_DIR = DATA_DIR / "exports"

for _d in (DATA_DIR, UPLOAD_DIR, EXPORT_DIR):
    _d.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("PRIVATEBRAIN_DATABASE_URL", f"sqlite:///{DATA_DIR / 'privatebrain.db'}")

# --- LLM -------------------------------------------------------------------
# mock | local | api.  MockLLM is a deterministic synthesiser that needs no model
# weights and no network. It is the honest default for a synthetic prototype.
LLM_PROVIDER = os.getenv("PRIVATEBRAIN_LLM_PROVIDER", "mock").strip().lower()
LLM_MODEL = os.getenv("PRIVATEBRAIN_LLM_MODEL", "local-llama-3-8b-instruct")
LLM_API_KEY = os.getenv("PRIVATEBRAIN_LLM_API_KEY", "")
LLM_API_BASE = os.getenv("PRIVATEBRAIN_LLM_API_BASE", "https://api.anthropic.com")
LLM_TEMPERATURE = float(os.getenv("PRIVATEBRAIN_LLM_TEMPERATURE", "0.1"))

# --- Retrieval -------------------------------------------------------------
VECTOR_BACKEND = os.getenv("PRIVATEBRAIN_VECTOR_BACKEND", "numpy").strip().lower()  # numpy | faiss
EMBEDDING_DIM = int(os.getenv("PRIVATEBRAIN_EMBEDDING_DIM", "256"))
MAX_CANDIDATE_MEMORIES = int(os.getenv("PRIVATEBRAIN_MAX_CANDIDATES", "60"))
ANSWER_MEMORY_BUDGET = int(os.getenv("PRIVATEBRAIN_ANSWER_BUDGET", "24"))

# --- Product behaviour -----------------------------------------------------
COMPANY_NAME = os.getenv("PRIVATEBRAIN_COMPANY_NAME", "NexaCore Systems")
DEMO_MODE = os.getenv("PRIVATEBRAIN_DEMO_MODE", "true").lower() in {"1", "true", "yes"}
# The demo clock. The product narrative is time-anchored so "current as of" is stable.
DEMO_TODAY = os.getenv("PRIVATEBRAIN_DEMO_TODAY", "2026-09-18")

CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "PRIVATEBRAIN_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if o.strip()
]
