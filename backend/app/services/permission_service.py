"""The policy engine.

Every read path in PrivateBrain funnels through this module. Nothing in the API layer
is allowed to decide visibility on its own — routers ask the engine, and the engine
returns both a verdict and the reason for it, so the UI can explain *why* something
was withheld rather than silently dropping it.

Two independent gates are combined:

  1. **Clearance** — a category floor (`CATEGORY_MIN_CLEARANCE`). L1 cannot reach
     EXECUTIVE material no matter what a role policy says.
  2. **Role policy** — an explicit per-role, per-category effect (ALLOW / LIMITED / DENY).
     A policy may be stricter than the clearance floor; it can never be looser.

Source-level access (the matrix on the Access Control page) is a third gate applied to
documents, chunks, memories and evidence that originate from a connector.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from sqlalchemy.orm import Session

from ..domain import (
    CATEGORY_LABELS,
    CATEGORY_MIN_CLEARANCE,
    Effect,
    RoleKey,
)
from ..models import Memory, Policy, SourcePolicy, User

# Fields that are only ever surfaced at ALLOW, never at LIMITED.
_LIMITED_REDACTED_FIELDS = ("budget_usd", "arr_usd", "contract_value", "unit_price", "margin")


@dataclass
class Verdict:
    """The outcome of a policy evaluation, including the reasoning."""

    effect: str
    allowed: bool
    limited: bool
    reason: str
    gate: str  # CLEARANCE | ROLE_POLICY | SOURCE_POLICY | GRANTED
    category: Optional[str] = None
    min_clearance: Optional[int] = None

    def as_dict(self) -> Dict[str, Any]:
        return {
            "effect": self.effect,
            "allowed": self.allowed,
            "limited": self.limited,
            "reason": self.reason,
            "gate": self.gate,
            "category": self.category,
            "category_label": CATEGORY_LABELS.get(self.category or "", self.category or ""),
            "min_clearance": self.min_clearance,
        }


@dataclass
class Redaction:
    """A single thing the viewer was not allowed to see, and why."""

    category: str
    label: str
    reason: str
    detail: str = ""
    gate: str = "ROLE_POLICY"
    count: int = 1
    sample_source: Optional[str] = None

    def as_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "label": self.label,
            "reason": self.reason,
            "detail": self.detail,
            "gate": self.gate,
            "count": self.count,
            "sample_source": self.sample_source,
        }


@dataclass
class AccessProfile:
    """A resolved, serialisable description of what a user can reach."""

    user_key: str
    user_name: str
    role_key: str
    role_label: str
    clearance: int
    categories: Dict[str, str] = field(default_factory=dict)      # category -> effect
    sources: Dict[str, str] = field(default_factory=dict)         # source -> FULL|LIMITED|NONE
    allowed_categories: List[str] = field(default_factory=list)
    limited_categories: List[str] = field(default_factory=list)
    denied_categories: List[str] = field(default_factory=list)
    accessible_sources: List[str] = field(default_factory=list)
    restricted_sources: List[str] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Policy loading
# --------------------------------------------------------------------------- #


def policies_for_role(db: Session, role_key: str) -> Dict[str, Policy]:
    rows = db.query(Policy).filter(Policy.role_key == role_key).all()
    return {r.category: r for r in rows}


def source_levels_for_role(db: Session, role_key: str) -> Dict[str, str]:
    rows = db.query(SourcePolicy).filter(SourcePolicy.role_key == role_key).all()
    return {r.source_key: r.level for r in rows}


# --------------------------------------------------------------------------- #
# Core evaluation
# --------------------------------------------------------------------------- #


def evaluate_category(
    category: Optional[str],
    *,
    role_key: str,
    clearance: int,
    policies: Optional[Dict[str, Policy]] = None,
) -> Verdict:
    """Combine the clearance floor and the role policy into one verdict."""
    if category is None:
        return Verdict(Effect.ALLOW, True, False, "No category restriction", "GRANTED")

    floor = CATEGORY_MIN_CLEARANCE.get(category, 1)
    if clearance < floor:
        return Verdict(
            effect=Effect.DENY,
            allowed=False,
            limited=False,
            reason=(
                f"Requires clearance L{floor}; {role_key} holds L{clearance}. "
                f"{CATEGORY_LABELS.get(category, category)} material is gated at the clearance floor."
            ),
            gate="CLEARANCE",
            category=category,
            min_clearance=floor,
        )

    policy = (policies or {}).get(category)
    if policy is None:
        # No explicit rule: fall back to a conservative default per category.
        default_effect = Effect.ALLOW if category in ("PUBLIC_INTERNAL",) else Effect.DENY
        return Verdict(
            effect=default_effect,
            allowed=default_effect != Effect.DENY,
            limited=default_effect == Effect.LIMITED,
            reason=f"No explicit policy for {CATEGORY_LABELS.get(category, category)}; defaulted to {default_effect}",
            gate="ROLE_POLICY",
            category=category,
            min_clearance=floor,
        )

    # A policy may raise the bar above the global floor.
    if policy.min_clearance and clearance < policy.min_clearance:
        return Verdict(
            effect=Effect.DENY,
            allowed=False,
            limited=False,
            reason=f"Policy for {role_key} requires clearance L{policy.min_clearance} on this category",
            gate="ROLE_POLICY",
            category=category,
            min_clearance=policy.min_clearance,
        )

    return Verdict(
        effect=policy.effect,
        allowed=policy.effect in (Effect.ALLOW, Effect.LIMITED),
        limited=policy.effect == Effect.LIMITED,
        reason=policy.note or f"{policy.effect} by policy for {role_key}",
        gate="ROLE_POLICY",
        category=category,
        min_clearance=policy.min_clearance,
    )


def evaluate_source(levels: Dict[str, str], source_key: Optional[str]) -> str:
    if not source_key:
        return "FULL"
    return levels.get(source_key, "NONE")


def build_profile(db: Session, user: User) -> AccessProfile:
    """Resolve a complete, serialisable access profile for a user."""
    policies = policies_for_role(db, user.role_key)
    levels = source_levels_for_role(db, user.role_key)

    profile = AccessProfile(
        user_key=user.key,
        user_name=user.name,
        role_key=user.role_key,
        role_label=(user.role.label if user.role else user.role_key),
        clearance=user.clearance,
        sources=levels,
    )

    for category in CATEGORY_LABELS:
        verdict = evaluate_category(category, role_key=user.role_key, clearance=user.clearance, policies=policies)
        profile.categories[category] = verdict.effect
        if verdict.effect == Effect.ALLOW:
            profile.allowed_categories.append(category)
        elif verdict.effect == Effect.LIMITED:
            profile.limited_categories.append(category)
        else:
            profile.denied_categories.append(category)

    for source_key, level in levels.items():
        if level == "NONE":
            profile.restricted_sources.append(source_key)
        else:
            profile.accessible_sources.append(source_key)

    return profile


# --------------------------------------------------------------------------- #
# Object-level filtering
# --------------------------------------------------------------------------- #


def can_read(
    db: Session,
    user: User,
    *,
    category: Optional[str] = None,
    source_key: Optional[str] = None,
) -> Verdict:
    """A single object is readable only if both its category and its source permit it."""
    policies = policies_for_role(db, user.role_key)
    verdict = evaluate_category(category, role_key=user.role_key, clearance=user.clearance, policies=policies)

    if not verdict.allowed:
        return verdict

    if source_key:
        levels = source_levels_for_role(db, user.role_key)
        level = evaluate_source(levels, source_key)
        if level == "NONE":
            return Verdict(
                effect=Effect.DENY,
                allowed=False,
                limited=False,
                reason=f"Source '{source_key}' is not granted to {user.role_key}",
                gate="SOURCE_POLICY",
                category=category,
            )
        if level == "LIMITED" and verdict.effect == Effect.ALLOW:
            verdict = Verdict(
                effect=Effect.LIMITED,
                allowed=True,
                limited=True,
                reason=f"Source '{source_key}' is granted to {user.role_key} at LIMITED scope",
                gate="SOURCE_POLICY",
                category=category,
            )

    return verdict


def filter_readable(
    db: Session,
    user: User,
    objects: Sequence[Any],
    *,
    category_attr: str = "category",
    source_attr: str = "source_key",
) -> Tuple[List[Any], List[Tuple[Any, Verdict]]]:
    """Split objects into (readable, denied-with-reason)."""
    policies = policies_for_role(db, user.role_key)
    levels = source_levels_for_role(db, user.role_key)

    readable: List[Any] = []
    denied: List[Tuple[Any, Verdict]] = []

    for obj in objects:
        category = getattr(obj, category_attr, None)
        source_key = getattr(obj, source_attr, None)
        verdict = evaluate_category(
            category, role_key=user.role_key, clearance=user.clearance, policies=policies
        )
        if verdict.allowed and source_key:
            level = evaluate_source(levels, source_key)
            if level == "NONE":
                verdict = Verdict(
                    Effect.DENY, False, False,
                    f"Source '{source_key}' not granted to {user.role_key}",
                    "SOURCE_POLICY", category,
                )
            elif level == "LIMITED":
                verdict.limited = True
                verdict.effect = Effect.LIMITED if verdict.effect == Effect.ALLOW else verdict.effect
        if verdict.allowed:
            readable.append(obj)
        else:
            denied.append((obj, verdict))

    return readable, denied


def redact_memory(memory: Memory, verdict: Verdict) -> Dict[str, Any]:
    """Apply LIMITED field-level masking to a memory payload."""
    if not verdict.limited:
        return {}
    masked: Dict[str, Any] = {}
    for field_name in _LIMITED_REDACTED_FIELDS:
        if memory.redacted_fields and field_name in memory.redacted_fields:
            masked[field_name] = {"value": None, "redacted": True, "reason": verdict.reason}
    # Memory-level redactable fields always collapse at LIMITED scope.
    for key in list((memory.redacted_fields or {}).keys()):
        masked.setdefault(key, {"value": None, "redacted": True, "reason": verdict.reason})
    return masked


def memory_visible_fields(memory: Memory, verdict: Verdict) -> Dict[str, Any]:
    """Fields present on the memory but withheld from this viewer."""
    if not verdict.limited:
        return {}
    return {k: v for k, v in (memory.redacted_fields or {}).items()}


# --------------------------------------------------------------------------- #
# Aggregation helpers used by answer_service and the audit trail
# --------------------------------------------------------------------------- #


def summarise_denials(denied: Iterable[Tuple[Any, Verdict]]) -> List[Redaction]:
    """Collapse denied objects into one Redaction per category, preserving the reason."""
    buckets: Dict[str, Redaction] = {}
    for obj, verdict in denied:
        category = verdict.category or getattr(obj, "category", "UNKNOWN")
        source = getattr(obj, "source_key", None)
        if category in buckets:
            buckets[category].count += 1
            continue
        buckets[category] = Redaction(
            category=category,
            label=CATEGORY_LABELS.get(category, category),
            reason=verdict.reason,
            detail=(
                f"{verdict.gate} gate · requires "
                f"{'L' + str(verdict.min_clearance) if verdict.min_clearance else 'a higher role grant'}"
            ),
            gate=verdict.gate,
            count=1,
            sample_source=source,
        )
    return sorted(buckets.values(), key=lambda r: -r.count)


def role_matrix(db: Session) -> List[Dict[str, Any]]:
    """The full role × category matrix rendered by the Access Control page."""
    from ..domain import ROLE_LABELS

    roles = db.query(Policy.role_key).distinct().all()
    role_keys = sorted({r[0] for r in roles})
    out = []
    for role_key in role_keys:
        policies = policies_for_role(db, role_key)
        row = {
            "role_key": role_key,
            "role_label": ROLE_LABELS.get(role_key, role_key),
            "categories": {},
        }
        for category in CATEGORY_LABELS:
            policy = policies.get(category)
            row["categories"][category] = {
                "effect": policy.effect if policy else "DENY",
                "min_clearance": policy.min_clearance if policy else CATEGORY_MIN_CLEARANCE.get(category, 1),
                "note": policy.note if policy else "",
                "policy_id": policy.id if policy else None,
                "editable": bool(policy.is_editable) if policy else False,
            }
        out.append(row)
    return out


def update_policy(db: Session, role_key: str, category: str, effect: str,
                  min_clearance: Optional[int] = None, note: Optional[str] = None) -> Policy:
    """Mutate one cell of the policy matrix. Used by the interactive Access Control page."""
    policy = (
        db.query(Policy)
        .filter(Policy.role_key == role_key, Policy.category == category)
        .one_or_none()
    )
    if policy is None:
        policy = Policy(role_key=role_key, category=category, effect=effect)
        db.add(policy)
    policy.effect = effect
    if min_clearance is not None:
        policy.min_clearance = min_clearance
    if note is not None:
        policy.note = note
    db.flush()
    return policy


def update_source_policy(db: Session, source_key: str, role_key: str, level: str,
                         note: Optional[str] = None) -> SourcePolicy:
    row = (
        db.query(SourcePolicy)
        .filter(SourcePolicy.source_key == source_key, SourcePolicy.role_key == role_key)
        .one_or_none()
    )
    if row is None:
        row = SourcePolicy(source_key=source_key, role_key=role_key, level=level)
        db.add(row)
    row.level = level
    if note is not None:
        row.note = note
    db.flush()
    return row


# --------------------------------------------------------------------------- #
# Model routing input — sensitivity drives which model may see a prompt
# --------------------------------------------------------------------------- #


SENSITIVE_CATEGORIES = ("EXECUTIVE", "FINANCE", "HR", "LEGAL", "SECURITY", "CUSTOMER")


def classify_sensitivity(categories: Iterable[str]) -> Dict[str, Any]:
    """Turn the category mix of a question into a routing recommendation."""
    present = {c for c in categories if c}
    if present & {"EXECUTIVE", "HR", "LEGAL"}:
        level = "RESTRICTED"
        rationale = "Question touches executive, people or legal material."
    elif present & {"FINANCE", "SECURITY", "CUSTOMER"}:
        level = "CONFIDENTIAL"
        rationale = "Question touches commercial, security or customer material."
    elif present & {"ENGINEERING", "PRODUCT"}:
        level = "INTERNAL"
        rationale = "Question touches internal engineering or product material."
    else:
        level = "PUBLIC"
        rationale = "Question only touches public/internal material."
    return {"level": level, "rationale": rationale, "categories": sorted(present)}


def required_route_for(sensitivity: str, policy: str) -> str:
    """PRIVATE_ONLY | PRIVATE_PREFERRED | POLICY_BASED -> chosen model tier."""
    if policy == "PRIVATE_ONLY" or sensitivity == "RESTRICTED":
        return "LOCAL_PRIVATE"
    if policy == "PRIVATE_PREFERRED":
        return "PRIVATE_TIER" if sensitivity in ("PUBLIC", "INTERNAL") else "LOCAL_PRIVATE"
    # POLICY_BASED
    return {
        "PUBLIC": "EXTERNAL_ALLOWED",
        "INTERNAL": "PRIVATE_TIER",
        "CONFIDENTIAL": "PRIVATE_TIER",
        "RESTRICTED": "LOCAL_PRIVATE",
    }.get(sensitivity, "PRIVATE_TIER")
