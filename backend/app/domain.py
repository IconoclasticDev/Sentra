"""Domain vocabulary shared by the seed data, the policy engine and the API.

Keeping this in one module is deliberate: the permission model is the thesis of the
product, so the vocabulary it operates on must have exactly one definition.
"""

from __future__ import annotations

from typing import Dict, List


class Category:
    """Information categories. Every memory, document, decision and event carries one."""

    PUBLIC_INTERNAL = "PUBLIC_INTERNAL"
    ENGINEERING = "ENGINEERING"
    PRODUCT = "PRODUCT"
    CUSTOMER = "CUSTOMER"
    FINANCE = "FINANCE"
    HR = "HR"
    EXECUTIVE = "EXECUTIVE"
    SECURITY = "SECURITY"
    LEGAL = "LEGAL"


ALL_CATEGORIES: List[str] = [
    Category.PUBLIC_INTERNAL,
    Category.ENGINEERING,
    Category.PRODUCT,
    Category.CUSTOMER,
    Category.FINANCE,
    Category.HR,
    Category.EXECUTIVE,
    Category.SECURITY,
    Category.LEGAL,
]

CATEGORY_LABELS: Dict[str, str] = {
    Category.PUBLIC_INTERNAL: "Public / Internal",
    Category.ENGINEERING: "Engineering",
    Category.PRODUCT: "Product",
    Category.CUSTOMER: "Customer",
    Category.FINANCE: "Finance",
    Category.HR: "People / HR",
    Category.EXECUTIVE: "Executive",
    Category.SECURITY: "Security",
    Category.LEGAL: "Legal",
}

# Minimum clearance required to see a category at all, independent of role policy.
# Role policy can be stricter; it can never be looser.
CATEGORY_MIN_CLEARANCE: Dict[str, int] = {
    Category.PUBLIC_INTERNAL: 1,
    Category.PRODUCT: 1,
    Category.ENGINEERING: 3,
    Category.CUSTOMER: 3,
    Category.LEGAL: 4,
    Category.SECURITY: 4,
    Category.FINANCE: 4,
    Category.HR: 4,
    Category.EXECUTIVE: 5,
}


class Effect:
    ALLOW = "ALLOW"
    LIMITED = "LIMITED"  # object is visible, sensitive fields are redacted
    DENY = "DENY"


class RoleKey:
    CEO = "CEO"
    CTO = "CTO"
    ENGINEERING_LEAD = "ENGINEERING_LEAD"
    SALES_LEAD = "SALES_LEAD"
    SECURITY_LEAD = "SECURITY_LEAD"
    PRODUCT_MANAGER = "PRODUCT_MANAGER"
    INTERN = "INTERN"


ROLE_LABELS: Dict[str, str] = {
    RoleKey.CEO: "Chief Executive Officer",
    RoleKey.CTO: "Chief Technology Officer",
    RoleKey.ENGINEERING_LEAD: "Engineering Lead",
    RoleKey.SALES_LEAD: "Sales Lead",
    RoleKey.SECURITY_LEAD: "Security Lead",
    RoleKey.PRODUCT_MANAGER: "Product Manager",
    RoleKey.INTERN: "Intern",
}

# Default clearance per role. Individual users may carry a higher personal clearance.
ROLE_CLEARANCE: Dict[str, int] = {
    RoleKey.CEO: 5,
    RoleKey.CTO: 5,
    RoleKey.SECURITY_LEAD: 5,
    RoleKey.ENGINEERING_LEAD: 4,
    RoleKey.PRODUCT_MANAGER: 3,
    RoleKey.SALES_LEAD: 3,
    RoleKey.INTERN: 1,
}

CLEARANCE_LABELS: Dict[int, str] = {
    1: "L1 — Restricted",
    2: "L2 — Internal",
    3: "L3 — Confidential",
    4: "L4 — Highly Confidential",
    5: "L5 — Executive",
}


class MemoryType:
    FACT = "FACT"
    EVENT = "EVENT"
    DECISION = "DECISION"
    RELATIONSHIP = "RELATIONSHIP"
    PREFERENCE = "PREFERENCE"
    PROJECT_STATE = "PROJECT_STATE"
    CUSTOMER_CONTEXT = "CUSTOMER_CONTEXT"
    POLICY = "POLICY"


ALL_MEMORY_TYPES: List[str] = [
    MemoryType.FACT,
    MemoryType.EVENT,
    MemoryType.DECISION,
    MemoryType.RELATIONSHIP,
    MemoryType.PREFERENCE,
    MemoryType.PROJECT_STATE,
    MemoryType.CUSTOMER_CONTEXT,
    MemoryType.POLICY,
]


class EntityType:
    PERSON = "PERSON"
    TEAM = "TEAM"
    PROJECT = "PROJECT"
    CUSTOMER = "CUSTOMER"
    DECISION = "DECISION"
    REPOSITORY = "REPOSITORY"
    DOCUMENT = "DOCUMENT"
    INCIDENT = "INCIDENT"
    SKILL = "SKILL"
    METRIC = "METRIC"
    SYSTEM = "SYSTEM"


ALL_ENTITY_TYPES: List[str] = [
    EntityType.PERSON,
    EntityType.TEAM,
    EntityType.PROJECT,
    EntityType.CUSTOMER,
    EntityType.DECISION,
    EntityType.REPOSITORY,
    EntityType.DOCUMENT,
    EntityType.INCIDENT,
    EntityType.SKILL,
    EntityType.METRIC,
    EntityType.SYSTEM,
]


class Rel:
    """Relationship verbs. These are the edges the graph pages render."""

    WORKS_ON = "WORKS_ON"
    OWNS = "OWNS"
    DECIDED = "DECIDED"
    AFFECTS = "AFFECTS"
    DEPENDS_ON = "DEPENDS_ON"
    AUTHORED = "AUTHORED"
    DISCUSSED_IN = "DISCUSSED_IN"
    CUSTOMER_OF = "CUSTOMER_OF"
    SUPERSEDES = "SUPERSEDES"
    MEMBER_OF = "MEMBER_OF"
    EXPERT_IN = "EXPERT_IN"
    REPORTED_BY = "REPORTED_BY"
    MENTIONED_IN = "MENTIONED_IN"


ALL_RELATIONSHIPS: List[str] = [
    Rel.WORKS_ON,
    Rel.OWNS,
    Rel.DECIDED,
    Rel.AFFECTS,
    Rel.DEPENDS_ON,
    Rel.AUTHORED,
    Rel.DISCUSSED_IN,
    Rel.CUSTOMER_OF,
    Rel.SUPERSEDES,
    Rel.MEMBER_OF,
    Rel.EXPERT_IN,
    Rel.REPORTED_BY,
    Rel.MENTIONED_IN,
]


class DecisionStatus:
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"
    REVERSED = "REVERSED"
    PENDING = "PENDING"


class SourceKind:
    SLACK = "SLACK"
    GITHUB = "GITHUB"
    DRIVE = "DRIVE"
    NOTION = "NOTION"
    JIRA = "JIRA"
    CRM = "CRM"
    EMAIL = "EMAIL"
    MEETINGS = "MEETINGS"
    UPLOAD = "UPLOAD"


class AuditAction:
    MEMORY_ACCESSED = "MEMORY_ACCESSED"
    QUERY_EXECUTED = "QUERY_EXECUTED"
    ACCESS_DENIED = "ACCESS_DENIED"
    SOURCE_SYNC = "SOURCE_SYNC"
    DECISION_VIEWED = "DECISION_VIEWED"
    AGENT_CONTEXT_REQUEST = "AGENT_CONTEXT_REQUEST"
    PERMISSION_CHANGED = "PERMISSION_CHANGED"
    USER_SWITCHED = "USER_SWITCHED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    GRAPH_EXPLORED = "GRAPH_EXPLORED"
    DEMO_RESET = "DEMO_RESET"


class Risk:
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


# Source authority ranking, used by conflict resolution. Higher wins ties.
SOURCE_AUTHORITY: Dict[str, int] = {
    SourceKind.NOTION: 72,   # canonical internal documentation
    SourceKind.DRIVE: 68,    # signed documents, contracts, board memos
    SourceKind.JIRA: 64,     # delivery of record
    SourceKind.GITHUB: 60,   # technical source of truth
    SourceKind.CRM: 58,      # customer of record
    SourceKind.MEETINGS: 55, # transcribed decisions
    SourceKind.EMAIL: 50,
    SourceKind.SLACK: 34,    # conversational, superseded easily
    SourceKind.UPLOAD: 45,
}
