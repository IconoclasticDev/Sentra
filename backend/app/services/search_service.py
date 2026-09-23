"""Retrieval.

Hybrid scoring: BM25-style lexical matching over an inverted index, combined with
cosine similarity over deterministic embeddings. The embedding function is a hashed
bag-of-ngrams projection — it needs no model weights, produces stable vectors across
processes, and is honest about being a stand-in for a real embedding model (the API
reports the provider so the UI can label it).

The vector store sits behind `VectorIndex` so a FAISS or pgvector implementation can
be dropped in without touching callers.
"""

from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from ..config import EMBEDDING_DIM, VECTOR_BACKEND

_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9_\-\.]{1,}")

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "than", "that", "this", "these", "those",
    "is", "are", "was", "were", "be", "been", "being", "to", "of", "in", "on", "at", "by", "for",
    "with", "about", "against", "between", "into", "through", "during", "before", "after", "above",
    "below", "from", "up", "down", "out", "off", "over", "under", "again", "further", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "too",
    "very", "can", "will", "just", "should", "now", "do", "does", "did", "doing", "have", "has",
    "had", "having", "i", "me", "my", "we", "our", "you", "your", "he", "him", "his", "she", "her",
    "it", "its", "they", "them", "their", "what", "which", "who", "whom", "as", "us", "am",
}

# Light domain stemming so "delays" matches "delayed" and "migrations" matches "migration".
_SUFFIXES = ("ations", "ation", "ings", "ing", "ers", "er", "ies", "ed", "es", "s")


def normalize(token: str) -> str:
    for suf in _SUFFIXES:
        if len(token) > len(suf) + 3 and token.endswith(suf):
            return token[: -len(suf)]
    return token


def tokenize(text: str) -> List[str]:
    return [t for t in _TOKEN_RE.findall((text or "").lower()) if t not in STOPWORDS]


def stem_tokens(text: str) -> List[str]:
    return [normalize(t) for t in tokenize(text)]


# --------------------------------------------------------------------------- #
# Embeddings
# --------------------------------------------------------------------------- #


def embed(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """Deterministic hashed n-gram embedding, L2-normalised."""
    vec = [0.0] * dim
    tokens = stem_tokens(text)
    if not tokens:
        return vec

    grams: List[str] = list(tokens)
    grams += [f"{a}_{b}" for a, b in zip(tokens, tokens[1:])]  # bigrams carry phrase signal

    counts = Counter(grams)
    for gram, count in counts.items():
        h = hashlib.blake2b(gram.encode("utf-8"), digest_size=8).digest()
        idx = int.from_bytes(h[:4], "big") % dim
        sign = 1.0 if h[4] & 1 else -1.0
        # Sublinear term weighting keeps common bigrams from dominating.
        vec[idx] += sign * (1.0 + math.log(count))

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b:
        return 0.0
    return float(sum(x * y for x, y in zip(a, b)))


class VectorIndex:
    """Thin vector store abstraction. numpy is the default; FAISS is opt-in."""

    def __init__(self, backend: str = VECTOR_BACKEND, dim: int = EMBEDDING_DIM):
        self.backend = backend
        self.dim = dim
        self._ids: List[str] = []
        self._matrix = None
        self._faiss = None

    def build(self, items: Sequence[Tuple[str, Sequence[float]]]) -> None:
        self._ids = [i for i, _ in items]
        vectors = [list(v) for _, v in items]
        if not vectors:
            self._matrix = None
            return
        try:
            import numpy as np

            self._matrix = np.array(vectors, dtype="float32")
            if self.backend == "faiss":  # pragma: no cover - optional acceleration
                import faiss  # type: ignore

                index = faiss.IndexFlatIP(self.dim)
                index.add(self._matrix)
                self._faiss = index
        except ImportError:
            self._matrix = vectors
            self.backend = "python"

    def search(self, query_vec: Sequence[float], top_k: int = 20) -> List[Tuple[str, float]]:
        if not self._ids or self._matrix is None:
            return []
        if self._faiss is not None:  # pragma: no cover
            import numpy as np

            q = np.array([list(query_vec)], dtype="float32")
            scores, idx = self._faiss.search(q, min(top_k, len(self._ids)))
            return [(self._ids[i], float(s)) for s, i in zip(scores[0], idx[0]) if i >= 0]

        try:
            import numpy as np

            q = np.array(list(query_vec), dtype="float32")
            sims = self._matrix @ q
            order = np.argsort(-sims)[:top_k]
            return [(self._ids[int(i)], float(sims[int(i)])) for i in order]
        except ImportError:
            scored = [(self._ids[i], cosine(query_vec, v)) for i, v in enumerate(self._matrix)]
            scored.sort(key=lambda x: -x[1])
            return scored[:top_k]


# --------------------------------------------------------------------------- #
# BM25 lexical index
# --------------------------------------------------------------------------- #


class BM25Index:
    """Standard BM25 with an in-memory inverted index."""

    def __init__(self, k1: float = 1.4, b: float = 0.72):
        self.k1 = k1
        self.b = b
        self._docs: Dict[str, Counter] = {}
        self._lengths: Dict[str, int] = {}
        self._df: Counter = Counter()
        self._avg_len = 0.0

    def build(self, docs: Sequence[Tuple[str, str]]) -> None:
        self._docs.clear()
        self._lengths.clear()
        self._df.clear()
        for doc_id, text in docs:
            tokens = stem_tokens(text)
            counts = Counter(tokens)
            self._docs[doc_id] = counts
            self._lengths[doc_id] = max(1, len(tokens))
            for term in counts:
                self._df[term] += 1
        self._avg_len = (sum(self._lengths.values()) / len(self._lengths)) if self._lengths else 1.0

    def score(self, query: str, doc_id: str) -> float:
        counts = self._docs.get(doc_id)
        if not counts:
            return 0.0
        n = max(1, len(self._docs))
        length = self._lengths.get(doc_id, 1)
        total = 0.0
        for term in stem_tokens(query):
            tf = counts.get(term, 0)
            if not tf:
                continue
            df = self._df.get(term, 0)
            idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
            denom = tf + self.k1 * (1 - self.b + self.b * length / self._avg_len)
            total += idf * (tf * (self.k1 + 1)) / denom
        return total

    def search(self, query: str, top_k: int = 30, allowed: Optional[Iterable[str]] = None) -> List[Tuple[str, float]]:
        allow = set(allowed) if allowed is not None else None
        scored: List[Tuple[str, float]] = []
        for doc_id in self._docs:
            if allow is not None and doc_id not in allow:
                continue
            s = self.score(query, doc_id)
            if s > 0:
                scored.append((doc_id, s))
        scored.sort(key=lambda x: -x[1])
        return scored[:top_k]


# --------------------------------------------------------------------------- #
# Hybrid retriever
# --------------------------------------------------------------------------- #


@dataclass
class Hit:
    key: str
    score: float
    lexical: float = 0.0
    vector: float = 0.0


class HybridRetriever:
    """Combines BM25 and vector similarity with a small exact-phrase bonus."""

    def __init__(self, lexical_weight: float = 0.62, vector_weight: float = 0.38):
        self.bm25 = BM25Index()
        self.vectors = VectorIndex()
        self.lexical_weight = lexical_weight
        self.vector_weight = vector_weight
        self._texts: Dict[str, str] = {}

    @property
    def size(self) -> int:
        return len(self._texts)

    def build(self, docs: Sequence[Tuple[str, str]], embeddings: Optional[Dict[str, Sequence[float]]] = None) -> None:
        self._texts = {k: v for k, v in docs}
        self.bm25.build(docs)
        vectors = [(k, embeddings[k] if embeddings and k in embeddings else embed(v)) for k, v in docs]
        self.vectors.build(vectors)

    def search(self, query: str, top_k: int = 24, allowed: Optional[Iterable[str]] = None) -> List[Hit]:
        if not self._texts:
            return []
        lexical_hits = dict(self.bm25.search(query, top_k=top_k * 3, allowed=allowed))
        vector_hits = dict(self.vectors.search(embed(query), top_k=top_k * 3))

        allow = set(allowed) if allowed is not None else None
        if allow is not None:
            vector_hits = {k: v for k, v in vector_hits.items() if k in allow}

        candidates = set(lexical_hits) | set(vector_hits)
        if not candidates:
            return []

        max_lex = max(lexical_hits.values()) if lexical_hits else 1.0
        # Cosine of hashed embeddings sits low; rescale against the best vector hit.
        max_vec = max(vector_hits.values()) if vector_hits else 1.0

        q_terms = set(stem_tokens(query))
        results: List[Hit] = []
        for key in candidates:
            lex = lexical_hits.get(key, 0.0) / max_lex if max_lex else 0.0
            vec = vector_hits.get(key, 0.0) / max_vec if max_vec else 0.0
            score = self.lexical_weight * lex + self.vector_weight * vec

            text_terms = set(stem_tokens(self._texts.get(key, "")))
            overlap = len(q_terms & text_terms) / max(1, len(q_terms))
            score += 0.14 * overlap

            # Reward exact substring presence for named entities ("orion", "acme").
            lowered = self._texts.get(key, "").lower()
            for raw in tokenize(query):
                if len(raw) > 3 and raw in lowered:
                    score += 0.035

            results.append(Hit(key=key, score=round(score, 5), lexical=round(lex, 4), vector=round(vec, 4)))

        results.sort(key=lambda h: -h.score)
        return results[:top_k]
