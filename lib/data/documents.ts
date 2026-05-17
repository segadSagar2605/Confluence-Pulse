export type LifecycleState = "current" | "needs-review" | "stale" | "archived";
export type ContentType = "policy" | "adr" | "prd" | "incident" | "runbook" | "knowledge-article";
export type TrustLevel = "high" | "medium" | "low";

export interface Decision {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  owner: string;
  dateDecided: string;
  alternativesConsidered: string[];
  reviewDate: string;
  linkedJira: string[];
  status: "active" | "superseded" | "under-review";
}

export interface Document {
  id: string;
  title: string;
  space: string;
  spaceKey: string;
  owner: string | null;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  lastValidated: string | null;
  reviewCadence: string;
  summary: string;
  contentType: ContentType;
  lifecycleState: LifecycleState;
  tags: string[];
  viewCount: number;
  linkedJira: string[];
  relatedDocIds: string[];
  trustScore: number;
  content: string;
  decisions: Decision[];
  stewardFlags: string[];
  conflictsWith: string[];
  risks: string[];
  recommendedActions: string[];
}

export const DOCUMENTS: Document[] = [
  {
    id: "doc-001",
    title: "Authentication & API Security Policy",
    space: "Platform Engineering",
    spaceKey: "PE",
    owner: null,
    createdBy: "Rajan Mehta",
    createdAt: "2021-03-12",
    lastUpdated: "2021-09-04",
    lastValidated: null,
    reviewCadence: "Annual — never completed",
    summary:
      "Original platform authentication policy authored in 2021. Mandates API key-based authentication for all internal and external integrations. Now superseded by the 2024 OAuth 2.0 mandate but never archived. No owner has been assigned since Rajan Mehta moved to a different team in 2022.",
    contentType: "policy",
    lifecycleState: "stale",
    tags: ["security", "authentication", "api", "policy"],
    viewCount: 342,
    linkedJira: [],
    relatedDocIds: ["doc-002", "doc-003"],
    trustScore: 24,
    conflictsWith: ["doc-002"],
    risks: [
      "Engineers reading this policy will follow deprecated API key practices",
      "Active runbook (doc-006) links to this page — compounding the misinformation risk",
      "No owner means no one is accountable for archiving or correcting it",
    ],
    recommendedActions: [
      "Archive immediately — superseded by Authentication Policy 2024",
      "Add a deprecation notice banner referencing doc-002",
      "Update doc-006 runbook to remove reference to this page",
    ],
    stewardFlags: [
      "No owner assigned — original author Rajan Mehta is on a different team",
      "Last updated 44 months ago — never reviewed since initial publication",
      "Directly conflicts with Authentication Policy 2024 (doc-002)",
      "Referenced by the highest-traffic runbook (doc-006, 2,341 views) — active misinformation risk",
      "Never formally validated by any owner or reviewer",
    ],
    content: `## Overview
This document defines the authentication and API access standards for all Platform Engineering services.

## API Authentication Standard
All internal and external API integrations **must use API key-based authentication**. API keys must be rotated every 90 days and stored in the team secrets vault.

API Key Format: \`pk_{environment}_{service}_{random32}\`

## Access Control
- API keys are provisioned via the DevOps team
- Keys must not be embedded in source code
- Keys must be passed via the \`X-API-Key\` header

## Incident Response
In the event of a compromised API key, revoke immediately via the secrets management console and notify the Security team within 1 hour.

## Exceptions
Teams requiring OAuth 2.0 for third-party integrations must raise an exception request with the Security Architecture team.

## Review Cadence
This policy should be reviewed annually by the Platform Security lead.

*Last reviewed: Q3 2021 — Rajan Mehta*`,
    decisions: [],
  },
  {
    id: "doc-002",
    title: "Authentication Policy 2024 — OAuth 2.0 Mandate",
    space: "Platform Engineering",
    spaceKey: "PE",
    owner: "Priya Nair",
    createdBy: "Priya Nair",
    createdAt: "2024-01-15",
    lastUpdated: "2024-11-20",
    lastValidated: "2025-02-10",
    reviewCadence: "Annual — due Feb 2026",
    summary:
      "The authoritative authentication standard for Platform Engineering, effective Q1 2024. Mandates OAuth 2.0 with short-lived tokens for all API integrations, replacing the 2021 API key model. Validated by Priya Nair in February 2025 and linked to completed Jira epics PLAT-2301 and PLAT-2302.",
    contentType: "policy",
    lifecycleState: "current",
    tags: ["security", "authentication", "oauth", "policy", "mandate"],
    viewCount: 891,
    linkedJira: ["PLAT-2301", "PLAT-2302", "SEC-445"],
    relatedDocIds: ["doc-001", "doc-003", "doc-004"],
    trustScore: 91,
    conflictsWith: ["doc-001"],
    risks: [
      "Older policy (doc-001) is still indexed and accessible — engineers may find it first via search",
      "Auth troubleshooting runbook (doc-006) still references API keys rather than OAuth 2.0 flows",
    ],
    recommendedActions: [
      "Archive doc-001 to remove it from search results",
      "Commission a full rewrite of doc-006 runbook for OAuth 2.0 troubleshooting",
      "Add a prominent deprecation notice on doc-001 linking here",
    ],
    stewardFlags: [],
    content: `## Overview
Effective Q1 2024, all API authentication across Platform Engineering **must use OAuth 2.0 with short-lived tokens**. API key-based authentication is **deprecated and will be disabled by December 2024**.

This policy supersedes: *Authentication & API Security Policy (2021)*.

## Why OAuth 2.0
Following the October 2023 API key compromise incident (see [Incident Review — SEC-INC-2023-047](doc-004)), the Security Architecture team conducted a full threat model review. OAuth 2.0 provides:
- Token expiry (15-minute default, configurable)
- Scoped access (least-privilege by design)
- Revocation without service disruption
- Audit trail through token introspection

## Mandate
| Integration Type | Required Standard | Deadline |
|---|---|---|
| Internal service-to-service | OAuth 2.0 Client Credentials | Q2 2024 |
| Third-party partner APIs | OAuth 2.0 Authorization Code | Q3 2024 |
| Legacy systems (exception only) | HMAC-signed requests | Q4 2024 |

## Implementation
OAuth tokens are issued by the Atlassian Identity Platform. See [ADR-007: OAuth Adoption](doc-003) for the full architectural decision.

## Compliance
Non-compliant services after December 2024 will have API access suspended. Contact #platform-security for migration support.

*Owner: Priya Nair | Validated: Feb 2025 | Next review: Feb 2026*`,
    decisions: [
      {
        id: "dec-001",
        title: "Mandate OAuth 2.0 as the only authentication standard",
        summary: "All API integrations must migrate from API keys to OAuth 2.0 by end of 2024.",
        rationale: "Following the Oct 2023 API key compromise, OAuth 2.0 provides token expiry, scoped access, and audit trails that API keys cannot.",
        owner: "Priya Nair",
        dateDecided: "2024-01-10",
        alternativesConsidered: ["Continue with API keys + mandatory rotation", "HMAC-signed requests for all services", "mTLS for internal services"],
        reviewDate: "2025-01-10",
        linkedJira: ["PLAT-2301", "SEC-445"],
        status: "active",
      },
    ],
  },
  {
    id: "doc-003",
    title: "ADR-007: Adopt OAuth 2.0 for All API Authentication",
    space: "Platform Engineering",
    spaceKey: "PE",
    owner: "Arjun Sharma",
    createdBy: "Arjun Sharma",
    createdAt: "2023-11-28",
    lastUpdated: "2024-01-08",
    lastValidated: "2024-06-01",
    reviewCadence: "When status changes — next check Jan 2025",
    summary:
      "Architecture Decision Record formally adopting OAuth 2.0 as the mandatory authentication standard across all Platform Engineering services. Written in the immediate aftermath of the October 2023 API key compromise. Evaluates and rejects three alternatives: enhanced key management, mTLS, and HMAC-signed requests. Approved by the CTO Office and Security.",
    contentType: "adr",
    lifecycleState: "current",
    tags: ["adr", "oauth", "authentication", "architecture", "security"],
    viewCount: 512,
    linkedJira: ["PLAT-2201", "PLAT-2301", "SEC-445"],
    relatedDocIds: ["doc-002", "doc-004"],
    trustScore: 88,
    conflictsWith: [],
    risks: [
      "mTLS (deferred to 2025) has not been revisited — decision review date passed",
      "HMAC exception sunset date (Q4 2024) may not have been enforced — no follow-up ADR found",
    ],
    recommendedActions: [
      "Confirm PLAT-2201 Jira epic is fully closed and mTLS review was completed",
      "Check whether any HMAC exception services remain active past the sunset date",
      "Update ADR status to 'Implemented' if all migration work is done",
    ],
    stewardFlags: ["Linked Jira epic PLAT-2201 — verify full execution is confirmed and ADR status updated to Implemented"],
    content: `# ADR-007: Adopt OAuth 2.0 for All API Authentication

**Status:** Accepted
**Date:** 2023-11-28
**Owner:** Arjun Sharma (Platform Architecture)
**Approvers:** Priya Nair (Security), Mihail Popescu (CTO Office)

---

## Context
Following the October 2023 API key compromise (SEC-INC-2023-047), the Security Architecture team identified that API key-based authentication lacks fundamental security properties required for a zero-trust environment:

1. API keys do not expire — a leaked key is valid indefinitely until manually revoked
2. API keys are not scoped — a key grants full access to all endpoints
3. API key usage is difficult to audit at scale
4. Revocation requires service disruption in many cases

The incident exposed 14 internal services and required a 72-hour emergency rotation effort.

## Decision
**We will adopt OAuth 2.0 as the mandatory authentication standard for all API integrations.**

- Internal service-to-service: Client Credentials flow
- User-facing integrations: Authorization Code flow with PKCE
- Legacy systems: HMAC-signed requests as a temporary exception (sunset: Q4 2024)

## Alternatives Considered

### Option A: Enhanced API Key Management (Rejected)
Mandatory 30-day rotation + HSM storage. Rejected because: rotation at scale is operationally expensive, keys still lack scoping and expiry, and the root problem (single compromised key = broad access) remains.

### Option B: mTLS for Internal Services (Deferred)
Strong security but high operational overhead. Certificate management at our current scale requires dedicated infra. Deferred to 2025 as a complementary layer.

### Option C: HMAC-Signed Requests (Partial Acceptance)
Accepted as a transitional measure for legacy systems only, with a hard sunset date of Q4 2024.

## Consequences
- **Positive:** Token expiry, least-privilege scoping, audit trail, revocation without disruption
- **Negative:** Migration effort for ~40 internal services, requires Identity Platform investment
- **Risks:** Migration timeline slippage; mitigated by phased rollout and dedicated migration squad

*Review date: Jan 2025*`,
    decisions: [
      {
        id: "dec-002",
        title: "Reject enhanced API key management in favour of OAuth 2.0",
        summary: "API key improvements (shorter rotation, HSM) were rejected because they don't eliminate the root problem: a single key grants broad, unscoped, non-expiring access.",
        rationale: "The Oct 2023 incident showed that even with rotation policies, a leaked key causes a 72-hour emergency. OAuth 2.0 eliminates this category of risk.",
        owner: "Arjun Sharma",
        dateDecided: "2023-11-28",
        alternativesConsidered: ["Enhanced API key rotation", "mTLS", "HMAC-signed requests"],
        reviewDate: "2025-01-28",
        linkedJira: ["PLAT-2201"],
        status: "active",
      },
      {
        id: "dec-003",
        title: "Defer mTLS to 2025 as a complementary layer",
        summary: "mTLS was evaluated for internal services but deferred due to certificate management overhead at current scale.",
        rationale: "Strong security properties but requires dedicated infrastructure investment not feasible in 2024 timeline.",
        owner: "Arjun Sharma",
        dateDecided: "2023-11-28",
        alternativesConsidered: ["mTLS only", "OAuth 2.0 only", "OAuth 2.0 + mTLS immediately"],
        reviewDate: "2025-06-01",
        linkedJira: ["PLAT-2201"],
        status: "under-review",
      },
    ],
  },
  {
    id: "doc-004",
    title: "Incident Review — SEC-INC-2023-047: API Key Compromise",
    space: "Platform Engineering",
    spaceKey: "PE",
    owner: "Kavita Rao",
    createdBy: "Kavita Rao",
    createdAt: "2023-10-22",
    lastUpdated: "2023-11-05",
    lastValidated: "2024-01-15",
    contentType: "incident",
    lifecycleState: "current",
    tags: ["incident", "security", "api-key", "postmortem", "p0"],
    viewCount: 1247,
    linkedJira: ["SEC-445", "SEC-446", "PLAT-2201", "INC-2023-047"],
    relatedDocIds: ["doc-002", "doc-003"],
    trustScore: 95,
    conflictsWith: [],
    reviewCadence: "One-time — incident review closed Nov 2023",
    summary:
      "Post-incident review for the October 2023 P0 security incident in which a long-lived API key was accidentally committed to a public GitHub repository. Covers the full 72-hour response timeline, root cause analysis, impact assessment (14 services exposed, 0 data exfiltrated), and five action items — all now closed. This incident directly triggered ADR-007 and the 2024 Auth Policy mandate.",
    risks: [
      "The 'Migrate to OAuth 2.0' action item was In Progress at the time of review — verify full closure",
      "Alert fatigue fix was marked Done but no evidence of post-fix effectiveness measurement",
    ],
    recommendedActions: [
      "Verify PLAT-2201 is fully closed and all 40 services have completed OAuth migration",
      "Schedule a 12-month retrospective to measure alert fatigue improvements",
    ],
    stewardFlags: [],
    content: `# Incident Review: API Key Compromise
**Incident ID:** SEC-INC-2023-047
**Severity:** P0 — Critical
**Date:** October 18–20, 2023
**Owner:** Kavita Rao (Security Engineering)

---

## Summary
A long-lived API key for the Reporting service was inadvertently committed to a public GitHub repository on October 18, 2023. The key was active for approximately 6 hours before discovery. During that window, 14 internal services were accessible to the exposed key. No customer data was exfiltrated, but the incident triggered a 72-hour emergency rotation effort affecting 40+ engineering teams.

## Timeline
- **Oct 18, 09:14** — API key committed to public GitHub repo in a config file
- **Oct 18, 09:31** — GitHub secret scanning alert generated (not actioned — alert fatigue)
- **Oct 18, 15:47** — External researcher notified security via responsible disclosure
- **Oct 18, 16:02** — Key revoked; incident declared P0
- **Oct 18–20** — 72-hour rotation effort across 40 services

## Root Cause
1. **Primary:** Long-lived API key with no expiry committed to version control
2. **Contributing:** Alert fatigue caused security scanning alerts to be missed
3. **Contributing:** Key had broader access scope than required (violated least-privilege)

## Impact
- 14 services exposed for ~6 hours
- 0 confirmed data exfiltration (confirmed via audit logs)
- 72 engineering hours to rotate keys across 40 services
- Significant on-call disruption across 8 teams

## Action Items
| Action | Owner | Status |
|---|---|---|
| Revoke all long-lived API keys | Security | ✅ Done |
| Migrate to OAuth 2.0 (see ADR-007) | Platform Arch | 🔄 In Progress |
| Implement secret scanning enforcement in CI | DevOps | ✅ Done |
| Reduce alert fatigue — triage process overhaul | Security | ✅ Done |
| Post-incident architecture review | Arjun Sharma | ✅ Done |

## Lessons Learned
The fundamental issue is not operational hygiene — it is architecture. API keys that do not expire and are not scoped will always pose a systemic risk regardless of rotation policies. The decision to move to OAuth 2.0 (ADR-007) directly addresses the root cause.

*Reviewed and closed: Nov 5, 2023*`,
    decisions: [],
  },
  {
    id: "doc-005",
    title: "Platform Q1 2024 Product Requirements — API Gateway Modernisation",
    space: "Platform Engineering",
    spaceKey: "PE",
    owner: "Sneha Kulkarni",
    createdBy: "Sneha Kulkarni",
    createdAt: "2023-12-10",
    lastUpdated: "2024-03-15",
    lastValidated: "2024-03-15",
    contentType: "prd",
    lifecycleState: "needs-review",
    tags: ["prd", "api-gateway", "oauth", "platform", "q1-2024"],
    viewCount: 678,
    linkedJira: ["PLAT-2300", "PLAT-2301", "PLAT-2302", "PLAT-2303"],
    relatedDocIds: ["doc-002", "doc-003"],
    trustScore: 67,
    conflictsWith: [],
    reviewCadence: "At project milestones — overdue since Q2 2024",
    summary:
      "Product requirements document for the API Gateway modernisation initiative, written to support the OAuth 2.0 migration mandated in ADR-007. Covers gateway-level token validation, migration tooling, and service team rollout targets. Last validated in March 2024; linked Jira epics PLAT-2301 and PLAT-2302 have since been closed, suggesting the core work is complete but the PRD has not been updated to reflect final outcomes.",
    risks: [
      "PRD still shows 'In Progress' status but underlying Jira epics are closed — creates confusion about project state",
      "Migration CLI tooling (R3) success metrics are unknown — no outcome data captured",
      "No follow-on PRD for Phase 2 OAuth scope expansion to partner integrations",
    ],
    recommendedActions: [
      "Update PRD status to Delivered and add an outcomes section with actual migration metrics",
      "Archive or supersede with a Phase 2 PRD covering partner OAuth integration scope",
      "Confirm PLAT-2303 (dashboard) delivery status and add link to live dashboard",
    ],
    stewardFlags: [
      "Last validated Mar 2024 — now 14+ months ago, overdue for review",
      "Linked Jira epics PLAT-2301 and PLAT-2302 are closed — PRD status field still shows 'In Progress'",
      "No outcomes section — success metrics from the PRD were never updated with actuals",
    ],
    content: `# Platform Q1 2024 PRD: API Gateway Modernisation

**PM:** Sneha Kulkarni
**Eng Lead:** Arjun Sharma
**Status:** In Progress
**Target:** Q1 2024 (GA by March 31, 2024)

---

## Problem Statement
The current API Gateway does not support OAuth 2.0 token validation. Following the mandate in [Authentication Policy 2024](doc-002) and [ADR-007](doc-003), all services must migrate from API keys to OAuth 2.0. The gateway must be upgraded before migration can proceed.

## Goals
1. Enable OAuth 2.0 Client Credentials validation at the gateway layer
2. Deprecate X-API-Key header support (with sunset logging)
3. Provide migration tooling for service teams
4. Achieve 100% OAuth 2.0 coverage for internal services by Q2 2024

## Non-Goals
- User-facing OAuth flows (handled by Identity Platform team)
- mTLS implementation (deferred to 2025 per ADR-007)

## User Stories
**As a** service team engineer,
**I want** clear migration guides and automated tooling,
**so that** I can migrate my service to OAuth 2.0 within a single sprint.

## Success Metrics
- 100% of internal services migrated by Q2 2024
- Zero P0/P1 incidents related to authentication during migration
- < 2 hours average migration time per service (tooling target)

## Requirements
| ID | Requirement | Priority |
|---|---|---|
| R1 | Gateway validates OAuth 2.0 Client Credentials tokens | P0 |
| R2 | Sunset logging for deprecated API key headers | P0 |
| R3 | Migration CLI tool for service teams | P1 |
| R4 | Dashboard showing migration status per service | P1 |
| R5 | Automated rollback on token validation failure | P0 |

*Last updated: March 15, 2024 — Sneha Kulkarni*`,
    decisions: [],
  },
  {
    id: "doc-006",
    title: "Runbook: Troubleshooting API Authentication Failures",
    space: "Platform Engineering",
    spaceKey: "PE",
    owner: null,
    createdBy: "Rahul Verma",
    createdAt: "2021-06-10",
    lastUpdated: "2022-02-14",
    lastValidated: null,
    reviewCadence: "Quarterly — last completed never",
    summary:
      "Operational runbook for on-call engineers troubleshooting API authentication failures. Written in 2021 when API key-based auth was the standard. The runbook covers 401/403 errors, key rotation, and emergency key compromise procedures — all specific to API keys. Rahul Verma (original author) left the company in 2023; no replacement owner has been assigned. The runbook is the highest-traffic page in the space at 2,341 views, meaning engineers are actively following critically outdated guidance.",
    risks: [
      "CRITICAL: Engineers following this runbook will rotate API keys rather than debug OAuth token issues",
      "Steps for 401 errors will fail silently — OAuth token validation errors have different root causes",
      "Emergency key compromise steps are irrelevant to OAuth; incident response will be delayed",
      "Highest-traffic page means maximum blast radius for incorrect guidance",
    ],
    recommendedActions: [
      "URGENT: Assign an owner from the current DevOps/Platform team immediately",
      "Add a prominent top-of-page banner: 'This runbook covers API key auth only. As of Jan 2024, all services use OAuth 2.0. See Authentication Policy 2024.'",
      "Commission a full rewrite for OAuth 2.0 troubleshooting (token expiry, scope errors, IDP issues)",
      "Archive this runbook once the OAuth version is published",
    ],
    contentType: "runbook",
    lifecycleState: "stale",
    tags: ["runbook", "authentication", "troubleshooting", "api-key", "devops"],
    viewCount: 2341,
    linkedJira: [],
    relatedDocIds: ["doc-001"],
    trustScore: 18,
    conflictsWith: ["doc-002"],
    stewardFlags: [
      "CRITICAL — highest-traffic page in space (2,341 views) with no owner and conflicting content",
      "No owner assigned — original author Rahul Verma left the company in 2023, role now vacant",
      "All troubleshooting steps reference API key rotation, which is deprecated and disabled",
      "Directly conflicts with Authentication Policy 2024 (doc-002) and ADR-007 (doc-003)",
      "Never formally validated — not reviewed once since publication in 2022",
    ],
    content: `# Runbook: Troubleshooting API Authentication Failures

**Maintained by:** DevOps Team
**Last updated:** Feb 14, 2022

---

## Common Issue 1: 401 Unauthorized

**Cause:** Invalid or expired API key

**Steps:**
1. Check the \`X-API-Key\` header is present and correctly formatted
2. Verify the key has not been rotated — check the secrets vault for the current key
3. Confirm the key is for the correct environment (prod keys won't work in staging)
4. If key was recently rotated, ensure all services are using the new key
5. If still failing, regenerate the key via the DevOps portal and notify dependent services

**Escalation:** If regeneration does not resolve, page the DevOps on-call via PagerDuty (#devops-oncall)

---

## Common Issue 2: 403 Forbidden

**Cause:** API key valid but insufficient permissions

**Steps:**
1. Confirm the key's permission scope matches the required endpoint
2. Check if the endpoint was recently added to a restricted tier
3. Request scope expansion via the DevOps service request form

---

## Common Issue 3: Key Rotation Failures

**Steps:**
1. Export the current key from the secrets vault
2. Generate a new key in the DevOps portal
3. Update all services using the old key (use the service dependency map)
4. Revoke the old key after confirming all services are healthy
5. Rotation window: allow 48 hours for full propagation

---

## Emergency: Suspected Key Compromise

1. Revoke the key immediately — do not wait for confirmation
2. Page Security on-call
3. Notify #incident-response
4. Follow the key rotation steps above
5. Open a P0 incident ticket

*For OAuth-related issues, contact the Identity Platform team (this runbook covers API key auth only)*`,
    decisions: [],
  },
];

export function getDocumentById(id: string): Document | undefined {
  return DOCUMENTS.find((d) => d.id === id);
}

export function getSpaceDocuments(spaceKey: string): Document[] {
  return DOCUMENTS.filter((d) => d.spaceKey === spaceKey);
}

export function getSpaceHealth() {
  const docs = DOCUMENTS;
  return {
    total: docs.length,
    healthy: docs.filter((d) => d.trustScore >= 80).length,
    needsReview: docs.filter((d) => d.trustScore >= 50 && d.trustScore < 80).length,
    stale: docs.filter((d) => d.trustScore < 50 && d.trustScore >= 20).length,
    critical: docs.filter((d) => d.trustScore < 20).length,
    ownerless: docs.filter((d) => !d.owner).length,
    conflicting: docs.filter((d) => d.conflictsWith.length > 0).length,
    highTrafficOutdated: docs.filter((d) => d.viewCount > 500 && d.trustScore < 50).length,
  };
}

export function getAllDecisions() {
  return DOCUMENTS.flatMap((doc) =>
    doc.decisions.map((d) => ({ ...d, sourceDocId: doc.id, sourceDocTitle: doc.title }))
  );
}
