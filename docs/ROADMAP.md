# Roadmap

This roadmap maps the product specification (`CLAUDE.md` — the source of truth)
to versioned, verifiable increments. Each `0.x.0` is a vertical slice that is
built, reviewed, and tagged before the next begins. Nothing in the spec is
silently dropped — features not yet built are listed here as **Planned** so we
always know exactly where we stand against the bible.

> **Process**: conventional commits, one slice per minor version, a passing
> typecheck/lint/build before tagging, and an updated `CHANGELOG.md` at each tag.
> Anything destructive (history rewrites, force-push, deletes) is confirmed with
> the product owner first.

## Versioning scheme

Pre-1.0: `0.MINOR.PATCH`. `MINOR` = new slice; `PATCH` = fixes/refinements
within a slice. `1.0.0` is reached when the spec's Phase 1–2 acceptance criteria
(§47, §73, §95, §124) are met end to end with real persistence.

---

## v0.1.0 — Foundation slice  ✅ (current)

Design system, app shell, and two flagship workspaces on mock data.

| Area | Spec |
| --- | --- |
| Design tokens, typography, status colors | §3, §120 |
| Light/Dark + 3 density modes, persisted | §3.1, §3.4, §115 |
| App shell: sidebar, header, breadcrumbs | §4, §97 |
| Command palette + workspace switcher | §31, §110 |
| Super Admin Command Center | §7, §98, §99 |
| Candidate Portal (mobile-first) | §5.2, §101 |
| Empty / loading / error states | §111 |

---

## v0.2.0 — Persistence & identity (In progress)

**Decisions:** persistence = **Neon serverless Postgres** via Prisma; real auth
is **deferred** in favour of a dev role switcher until a provider is wired.

Front half — identity & navigation entitlements — ✅ done (on `feat/v0.2-identity-nav`):

| Area | Spec | Status |
| --- | --- | --- |
| Roles & per-role navigation entitlements (RBAC) | §42 | ✅ |
| Dev role switcher + Role Preview | §121.7 | ✅ |
| Sidebar pin/unpin + icon rail + info tooltips | §97.1 | ✅ |
| Admin navigation-visibility matrix | §42 | ✅ |
| Vendor role + scoped external Vendor Portal (C2C) | §27 | ✅ UI (binds to DB) |

Back half — persistence — remaining:

| Area | Spec | Status |
| --- | --- | --- |
| Candidate 360 record page + Candidates list (mock) | §15, §100 | ✅ UI (binds to DB) |
| Neon Postgres + Prisma schema for core entities | §43, §44 | ☐ (needs DATABASE_URL) |
| Consultant 360 + 360 data model bound to DB | §15, §100 | ☐ |
| Audit event capture | §26 | ☐ |
| Entitlements + preferences persisted to DB | §42 | ☐ |
| Seed data replacing mocks | — | ☐ |

## v0.3.0 — Onboarding operations (Planned)

| Area | Spec |
| --- | --- |
| Onboarder workspace | §5.3 |
| Recruiter & Recruiting Manager workspaces | §5.4, §5.5 |
| Account Manager workspace | §5.6 |
| Universal "My Work" action center | §6 |
| Task engine + SLA countdowns | §19 (subset) |
| Notification center, approvals center | §106, §108 |

## v0.4.0 — Packages & workflow configuration (Planned)

| Area | Spec |
| --- | --- |
| Dynamic client-mapped package assembly | §8, §9 |
| Package builder UI (3-panel, drag & drop, rule blocks) | §102 |
| Package versioning | §8.3 |
| Workflow & Rules Studio | §19, §103 |
| Compliance Policy Center | §21 |

## v0.5.0 — Readiness, screening, equipment, exceptions (Planned)

| Area | Spec |
| --- | --- |
| Payroll & Billing readiness gates | §16 |
| Equipment & IT provisioning center | §17 |
| Background check & screening adjudication | §22, §23 |
| Exception Control Tower | §18, §104 |
| Start-Date Risk Engine | §33 |

## v0.6.0 — Documents & communications (Planned)

| Area | Spec |
| --- | --- |
| Document intelligence, viewer, e-signature | §20, §113 |
| Communications Command Center + Gentle Nudge protocol | §13, §24 |
| Calendar/timeline views | §114 |
| Collaboration (comments, mentions) | §107 |

## v0.7.0 — Reporting & analytics (Planned)

| Area | Spec |
| --- | --- |
| Reporting framework & catalog (per-persona) | §49–§68 |
| Custom report builder | §69 |
| Scheduled reports & alerts | §70 |
| Reporting data governance | §72 |

## v0.8.0 — Integration & automation hub (Planned)

| Area | Spec |
| --- | --- |
| Connector framework, API gateway, event bus | §74–§87 |
| Webhooks, file-based integration, reconciliation | §79, §90, §91 |
| Integration monitoring dashboard | §84 |
| Public API + developer portal | §88, §89 |

## v0.9.0 — AI copilot layer (Planned)

| Area | Spec |
| --- | --- |
| Provider-agnostic AI orchestration | §44, §10 |
| Persona copilots + explainable AI responses | §10, §105 |
| AI governance (modes, logging, approvals) | §11 |
| AI-powered reporting & morning briefing | §41.4, §71 |

## v1.0.0 — Lifecycle & GA hardening (Planned)

| Area | Spec |
| --- | --- |
| Offboarding, conversion, extension, rehire, delta onboarding | §38 |
| Client/Vendor portal + white-label | §27, §117 |
| Non-functional hardening, a11y audit, perf budgets | §45, §122, §123 |
| Acceptance criteria sign-off | §47, §73, §95, §124 |
