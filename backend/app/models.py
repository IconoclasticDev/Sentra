"""SQLAlchemy schema for PrivateBrain.

Twenty tables modelling an organisation rather than a document store: people, teams,
projects, customers, memories, decisions, evidence, events, entities and the edges
between them, plus the governance tables (policies, audit, sync runs, conflicts).

SQLite is the demo store. Nothing here is SQLite-specific except the JSON column type,
which SQLAlchemy handles transparently.
"""

from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


# --------------------------------------------------------------------------- #
# Identity and governance
# --------------------------------------------------------------------------- #


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(96))
    description: Mapped[str] = mapped_column(Text, default="")
    clearance: Mapped[int] = mapped_column(Integer, default=1)
    departments: Mapped[List[str]] = mapped_column(JSON, default=list)
    can_approve_access: Mapped[bool] = mapped_column(Boolean, default=False)
    is_demo_role: Mapped[bool] = mapped_column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(96))
    role_key: Mapped[str] = mapped_column(ForeignKey("roles.key"), index=True)
    title: Mapped[str] = mapped_column(String(120), default="")
    department: Mapped[str] = mapped_column(String(64), default="")
    departments: Mapped[List[str]] = mapped_column(JSON, default=list)
    clearance: Mapped[int] = mapped_column(Integer, default=1)
    email: Mapped[str] = mapped_column(String(160), default="")
    initials: Mapped[str] = mapped_column(String(4), default="")
    accent: Mapped[str] = mapped_column(String(16), default="#3d5a80")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_demo_user: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    role: Mapped[Optional[Role]] = relationship("Role", lazy="joined")


class Policy(Base):
    """Role → category access rule."""

    __tablename__ = "policies"
    __table_args__ = (UniqueConstraint("role_key", "category", name="uq_policy_role_category"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    role_key: Mapped[str] = mapped_column(String(48), index=True)
    category: Mapped[str] = mapped_column(String(48), index=True)
    effect: Mapped[str] = mapped_column(String(16), default="DENY")
    min_clearance: Mapped[int] = mapped_column(Integer, default=1)
    note: Mapped[str] = mapped_column(Text, default="")
    is_editable: Mapped[bool] = mapped_column(Boolean, default=True)


class SourcePolicy(Base):
    """Role → source access level, rendered by the source access matrix."""

    __tablename__ = "source_policies"
    __table_args__ = (UniqueConstraint("source_key", "role_key", name="uq_source_role"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source_key: Mapped[str] = mapped_column(String(48), index=True)
    role_key: Mapped[str] = mapped_column(String(48), index=True)
    level: Mapped[str] = mapped_column(String(16), default="NONE")  # FULL | LIMITED | NONE
    note: Mapped[str] = mapped_column(Text, default="")


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)


# --------------------------------------------------------------------------- #
# Sources, documents, chunks
# --------------------------------------------------------------------------- #


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(96))
    kind: Mapped[str] = mapped_column(String(32))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(24), default="CONNECTED")
    health: Mapped[str] = mapped_column(String(24), default="HEALTHY")
    simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    category: Mapped[str] = mapped_column(String(48), default="PUBLIC_INTERNAL")
    owner_team: Mapped[str] = mapped_column(String(64), default="")
    last_synced: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    objects_indexed: Mapped[int] = mapped_column(Integer, default=0)
    coverage: Mapped[float] = mapped_column(Float, default=0.0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str] = mapped_column(Text, default="")
    accent: Mapped[str] = mapped_column(String(16), default="#5b6b7c")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    source_key: Mapped[str] = mapped_column(String(48), index=True)
    title: Mapped[str] = mapped_column(String(240))
    path: Mapped[str] = mapped_column(String(400), default="")
    category: Mapped[str] = mapped_column(String(48), index=True, default="PUBLIC_INTERNAL")
    author_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    summary: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    mime: Mapped[str] = mapped_column(String(96), default="text/plain")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    entities: Mapped[List[str]] = mapped_column(JSON, default=list)
    is_uploaded: Mapped[bool] = mapped_column(Boolean, default=False)
    project_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    customer_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    ordinal: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(48), default="PUBLIC_INTERNAL")
    tokens: Mapped[int] = mapped_column(Integer, default=0)
    embedding: Mapped[List[float]] = mapped_column(JSON, default=list)


# --------------------------------------------------------------------------- #
# Knowledge: entities and relationships
# --------------------------------------------------------------------------- #


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(96), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    type: Mapped[str] = mapped_column(String(32), index=True)
    category: Mapped[str] = mapped_column(String(48), index=True, default="PUBLIC_INTERNAL")
    description: Mapped[str] = mapped_column(Text, default="")
    meta: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    salience: Mapped[float] = mapped_column(Float, default=0.5)
    first_seen: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    last_seen: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    memory_count: Mapped[int] = mapped_column(Integer, default=0)


class Relationship(Base):
    __tablename__ = "relationships"

    id: Mapped[int] = mapped_column(primary_key=True)
    src_key: Mapped[str] = mapped_column(String(96), index=True)
    dst_key: Mapped[str] = mapped_column(String(96), index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    weight: Mapped[float] = mapped_column(Float, default=0.5)
    category: Mapped[str] = mapped_column(String(48), default="PUBLIC_INTERNAL")
    since: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    evidence: Mapped[str] = mapped_column(Text, default="")
    evidence_doc: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


# --------------------------------------------------------------------------- #
# Memory
# --------------------------------------------------------------------------- #


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    statement: Mapped[str] = mapped_column(Text)
    detail: Mapped[str] = mapped_column(Text, default="")
    mtype: Mapped[str] = mapped_column(String(32), index=True)
    category: Mapped[str] = mapped_column(String(48), index=True)
    visibility: Mapped[str] = mapped_column(String(24), default="INTERNAL")  # PUBLIC | INTERNAL | RESTRICTED
    entity_keys: Mapped[List[str]] = mapped_column(JSON, default=list)
    source_key: Mapped[str] = mapped_column(String(48), index=True)
    source_ref: Mapped[str] = mapped_column(String(240), default="")
    source_authority: Mapped[int] = mapped_column(Integer, default=50)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow, index=True)
    last_confirmed: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    valid_from: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True, index=True)
    valid_to: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    status: Mapped[str] = mapped_column(String(24), default="ACTIVE")  # ACTIVE | SUPERSEDED | DISPUTED | STALE
    superseded_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    project_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True, index=True)
    customer_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True, index=True)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    importance: Mapped[float] = mapped_column(Float, default=0.5)
    redacted_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    embedding: Mapped[List[float]] = mapped_column(JSON, default=list)
    ingested_file: Mapped[bool] = mapped_column(Boolean, default=False)


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(240))
    decided_on: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    owner_key: Mapped[str] = mapped_column(String(64), index=True)
    project_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True, index=True)
    customer_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="ACTIVE", index=True)
    category: Mapped[str] = mapped_column(String(48), index=True, default="PUBLIC_INTERNAL")
    reason: Mapped[str] = mapped_column(Text, default="")
    context: Mapped[str] = mapped_column(Text, default="")
    alternatives: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    impact: Mapped[str] = mapped_column(Text, default="")
    outcome: Mapped[str] = mapped_column(Text, default="")
    validity: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.85)
    supersedes: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    superseded_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    sensitive_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    embedding: Mapped[List[float]] = mapped_column(JSON, default=list)


class DecisionEvidence(Base):
    __tablename__ = "decision_evidence"

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_code: Mapped[str] = mapped_column(String(64), index=True)
    label: Mapped[str] = mapped_column(String(240))
    source_key: Mapped[str] = mapped_column(String(48))
    ref: Mapped[str] = mapped_column(String(240), default="")
    occurred_on: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    category: Mapped[str] = mapped_column(String(48), default="PUBLIC_INTERNAL")
    document_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    memory_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    excerpt: Mapped[str] = mapped_column(Text, default="")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    occurred_on: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    title: Mapped[str] = mapped_column(String(240))
    summary: Mapped[str] = mapped_column(Text, default="")
    kind: Mapped[str] = mapped_column(String(32), default="EVENT")
    category: Mapped[str] = mapped_column(String(48), index=True, default="PUBLIC_INTERNAL")
    project_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True, index=True)
    customer_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    actor_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    source_key: Mapped[str] = mapped_column(String(48), default="SLACK")
    impact: Mapped[str] = mapped_column(String(24), default="MEDIUM")
    memory_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    codename_reason: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")
    health: Mapped[str] = mapped_column(String(24), default="ON_TRACK")
    category: Mapped[str] = mapped_column(String(48), default="PRODUCT")
    owner_key: Mapped[str] = mapped_column(String(64), default="")
    team: Mapped[str] = mapped_column(String(64), default="")
    started_on: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    target_on: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    budget_usd: Mapped[int] = mapped_column(Integer, default=0)  # FINANCE-category
    customer_keys: Mapped[List[str]] = mapped_column(JSON, default=list)
    member_keys: Mapped[List[str]] = mapped_column(JSON, default=list)
    repo_keys: Mapped[List[str]] = mapped_column(JSON, default=list)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    industry: Mapped[str] = mapped_column(String(96), default="")
    tier: Mapped[str] = mapped_column(String(24), default="ENTERPRISE")
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")
    health: Mapped[str] = mapped_column(String(24), default="HEALTHY")
    arr_usd: Mapped[int] = mapped_column(Integer, default=0)  # FINANCE-category
    since: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    csm_key: Mapped[str] = mapped_column(String(64), default="")
    ae_key: Mapped[str] = mapped_column(String(64), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    contacts: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    escalation_risk: Mapped[str] = mapped_column(String(24), default="LOW")


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(96))
    purpose: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(24), default="ACTIVE")
    owner_key: Mapped[str] = mapped_column(String(64), default="")
    last_run: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    runs_today: Mapped[int] = mapped_column(Integer, default=0)
    scopes: Mapped[List[str]] = mapped_column(JSON, default=list)      # categories
    denied_scopes: Mapped[List[str]] = mapped_column(JSON, default=list)
    sources: Mapped[List[str]] = mapped_column(JSON, default=list)
    tools: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    model_route: Mapped[str] = mapped_column(String(48), default="PRIVATE_PREFERRED")
    max_clearance: Mapped[int] = mapped_column(Integer, default=3)
    accent: Mapped[str] = mapped_column(String(16), default="#3d5a80")


# --------------------------------------------------------------------------- #
# Governance runtime
# --------------------------------------------------------------------------- #


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow, index=True)
    user_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    user_name: Mapped[str] = mapped_column(String(96), default="system")
    role_key: Mapped[str] = mapped_column(String(48), default="SYSTEM")
    action: Mapped[str] = mapped_column(String(48), index=True)
    resource: Mapped[str] = mapped_column(Text, default="")
    resource_type: Mapped[str] = mapped_column(String(48), default="")
    result: Mapped[str] = mapped_column(String(24), default="OK")  # OK | RESTRICTED | ERROR | PARTIAL
    reason: Mapped[str] = mapped_column(Text, default="")
    risk: Mapped[str] = mapped_column(String(16), default="LOW")
    category: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    meta: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)


class SyncRun(Base):
    __tablename__ = "sync_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_key: Mapped[str] = mapped_column(String(48), index=True)
    started_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    finished_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="RUNNING")  # RUNNING | COMPLETE | PARTIAL | FAILED
    objects_fetched: Mapped[int] = mapped_column(Integer, default=0)
    entities_extracted: Mapped[int] = mapped_column(Integer, default=0)
    memories_written: Mapped[int] = mapped_column(Integer, default=0)
    relationships_written: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    stages: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    triggered_by: Mapped[str] = mapped_column(String(64), default="manual")


class Conflict(Base):
    __tablename__ = "conflicts"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    topic: Mapped[str] = mapped_column(String(240))
    summary: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(48), default="PUBLIC_INTERNAL")
    memory_a_code: Mapped[str] = mapped_column(String(64))
    memory_b_code: Mapped[str] = mapped_column(String(64))
    detected_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    status: Mapped[str] = mapped_column(String(24), default="OPEN")  # OPEN | RESOLVED | ESCALATED
    resolution: Mapped[str] = mapped_column(Text, default="")
    authoritative_memory_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    resolution_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    basis: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    project_key: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow, index=True)
    user_key: Mapped[str] = mapped_column(String(64), index=True)
    question: Mapped[str] = mapped_column(Text)
    intent: Mapped[str] = mapped_column(String(48), default="GENERAL")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    memories_consulted: Mapped[int] = mapped_column(Integer, default=0)
    memories_withheld: Mapped[int] = mapped_column(Integer, default=0)
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    redactions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    model_route: Mapped[str] = mapped_column(String(48), default="PRIVATE_ONLY")
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    digest: Mapped[str] = mapped_column(Text, default="")
