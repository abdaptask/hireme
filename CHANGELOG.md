# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the platform is pre-1.0, the `0.MINOR.PATCH` scheme is used: each `MINOR`
bump delivers a new vertical slice from the spec ([docs/ROADMAP.md](docs/ROADMAP.md));
`PATCH` bumps are fixes and refinements within a slice.

## [Unreleased]

- **Consultants roster + Consultant 360** (§15, §38) at `/consultants` —
  lifecycle-aware roster (Active / Bench / Extension Pending / Offboarding /
  Converted / Former / Ineligible) with bill & pay rates, assignment, client,
  and owner columns; click through to a 3-tab 360 (Overview / Assignments /
  Lifecycle) with readiness radar, contact card, full assignment timeline.
  Nav item now live.

- **Packages** (§8, §9, §102) at `/packages` — card-grid view of 8 onboarding
  packages with version, status (Draft/In Review/Approved/Published/Retired),
  required item counts, client applicability, employment-type tags, and
  effective date. Package builder deep-link placeholder per card.

- **Documents** (§20, §113) at `/documents` — search + 7-category filter
  (background, tax, employment, identity, benefits, training, compliance),
  AI quality score bar (0–100 with color coding), extracted AI flags per
  document, status badges (pending / submitted / ai-review / approved /
  rejected / expired / correction-required). 20 document records seeded.

- **Screening** (§22, §58) at `/screening` — vendor-grouped pipeline
  (HireRight, Sterling, First Advantage, Checkr), status progression from
  Ordered through Adverse Pending, danger-tinted rows for review-required and
  adverse-pending records, SLA countdowns. 12 screening records.

- **Payroll Readiness** (§16.2, §59) at `/payroll` — filter bar (All / Not
  Ready / Pending), expandable rows showing an 11-point check grid
  (Classification, Pay Rate, Overtime, Tax Jurisdiction, Direct Deposit, W-4,
  State Tax, I-9, Benefits, Payroll Entity, Start Date) with pass/fail/pending
  icons and a mini-readiness summary per candidate.

- **Billing Readiness** (§16.3, §60) at `/billing` — identical pattern with
  11 billing-specific checks (Bill Rate, Markup, PO, Cost Center, Client
  Worker ID, VMS ID, Invoice Frequency, Timesheet Method, Expense Policy,
  Billing Entity, Approved Start Date). PO and worker-ID pills in expanded
  view. Revenue-at-risk summary tile.

- **Equipment & IT Provisioning** (§17, §61) at `/equipment` — IT access
  4-icon row per candidate (email / VPN / client credentials / device
  enrolled), expandable item detail table (Laptop, Monitor, Headset, Phone,
  Security Token, Badge, Software License) with asset status
  (requested → shipped → enrolled → ready / delayed). 10 equipment records.

- **Communications** (§24, §63) at `/communications` — channel filter tabs
  (Email / SMS / Portal / Voice), nudge-level badges (1–5) with escalation
  color coding, sentiment and delivery status, candidate + owner shown
  inline. 18 communication records seeded.

- **Training** (§37, §62) at `/training` — filter (All / Overdue / Required),
  color-coded completion scores, category tags (Security / Client / Safety /
  Compliance / Timekeeping), due-date countdown, 20 training records.

- **Integrations** (§29, §74–§95) at `/integrations` — 3-col card grid for
  10 integrations (Bullhorn ATS, SAP Fieldglass VMS, ADP Payroll, HireRight
  Screening, DocuSign eSign, Twilio SMS, Okta IAM, ServiceNow ITSM, Workday
  HRIS, SendGrid Email) showing health status (connected / degraded / error /
  disconnected), last-sync timestamp, success rate, latency, records/day, and
  a conditional Retry button on error states.

- **Workflow Studio** (§19, §103) at `/workflow-studio` — 3-panel canvas
  layout: left sidebar lists saved workflows with status badges; center panel
  shows a CSS node canvas with Start → Task → Decision → Integration → End
  nodes connected via SVG arrows (draggable placeholder); right inspector
  panel shows node properties with a read-only rule builder preview. Bottom
  toolbar: Validate, Test Run, Version History, Publish.

- **Compliance Policies** (§21, §57) at `/compliance` — 12 policies across 5
  jurisdictions (Federal, California, New York, Texas, Illinois) organized by
  category (background, drug, document, training, insurance, security),
  effective/expiration dates, owner, legal approver, and acknowledgment
  requirement. Search + jurisdiction + category filters.

- **Audit Center** (§26, §66) at `/audit` — searchable + event-type filtered
  dense grid of 25 audit events (created, updated, approved, rejected,
  escalated, overridden, exported, ai-action, integration-event, deleted)
  with actor, entity, previous/new value, device/IP, AI involvement flag,
  and critical-row highlighting. Export and date-range filter.

- **Clients roster + Client 360** (§27, §30, §56) at `/clients` — portfolio
  list with compliance rate, start-date success, pipeline count, and industry
  badges; click through to a full client detail page with four tabs:
  Pipeline (active onboardings filtered to this client, linking to Candidate
  360), Compliance Rules (per-category tags, required vs optional, conditions),
  Contacts (primary / billing / HR / technical), and Client Info (billing
  terms, avg onboarding days, notes). Includes the Client Promise Tracker
  (§41.5) inline. Clients nav item now live.

- **Initiate Onboarding flow** (§9, §14) — a 5-step slide-over sheet matching
  the full ApTask "New Consultant" form, surfaced in three places:
  - **Onboarding pipeline page** (`/onboarding`, nav now live) — stage bar
    (click to filter), active-onboardings table with per-row "Start" action,
    stat tiles (active / starting this week / at risk / needs action), and a
    global "Initiate Onboarding" header button.
  - **Candidates list** (`/candidates`) — global "Initiate Onboarding" button
    in the page header plus a per-row "Start" action that pre-fills from the
    candidate record.
  - **Candidate 360** (`/candidates/[id]`) — "Initiate Onboarding" button in
    the sticky context header, pre-filled with name, email, phone, client,
    and job title from the candidate's 360 data.
  - The sheet covers all original form fields across 5 structured steps:
    Candidate Info · Assignment · Rates & Location · Team & Screening · Review.
    Employment-type toggle (Contract / Full Time / Employee) persists in the
    header across all steps. Step 5 shows an AI note that the compliance
    package will be auto-generated post-submit based on client rules, state,
    employment type, and job category (§8 Dynamic Package Assembly).
    "Save as Draft" and "Submit" both available; "Block sending emails"
    checkbox in footer. Pre-fill from any existing candidate record.

- **Exception Control Tower** (§18, §104) at `/exceptions` — open/critical/
  SLA-breached/start-impact stats, category (Pareto) and severity distributions,
  and a severity-prioritized exceptions table (owner, age, SLA, start-date
  impact, status) linking to the Candidate 360. Exceptions nav item now live.

- **All 21 primary nav items now live** (§4) — every section from Home through
  Audit Center has a built page; no more `/planned/*` redirects for any core
  nav item. The complete platform navigation is fully operational.

### v0.2.0 (in progress) — Identity & navigation entitlements

- **Roles & entitlements model** (§42) — six roles (the personas) with default
  per-role navigation visibility; Super Admin has full access.
- **Dev role switcher + Role Preview** (§121.7) — render the app as any role to
  see exactly what it's entitled to, with an "Exit preview" banner.
- **Sidebar pin/unpin** (§97.1) — unpinned collapses to an icon rail that
  expands to a labeled flyout on hover; pinned stays open. State persisted.
- **Per-item info tooltips** — each nav item shows an ⓘ describing what it
  contains, plus its spec section and roadmap version.
- **Entitlement-driven navigation** — sidebar, command palette, and quick-create
  all filter to the current role's visible items; empty sections are hidden.
- **Administration → Navigation Visibility** (§42) — admin matrix (role × nav
  item) to show/hide items per role, with bulk show/hide, reset, and
  per-role preview. Persisted client-side now; becomes account-backed when auth
  and persistence land (Neon Postgres + Prisma).
- **Candidates list** (§15) — dense, searchable roster with status, risk,
  progress, owner; click-through to the 360. Nav item now live.
- **Candidate 360 record** (§100, §41.1, §41.2) — context header, Next Best
  Action, six-dimension Readiness Radar, three-part layout (summary · tabbed
  workspace · context panel), Overview/Timeline/Tasks/Documents tabs plus
  placeholders for later modules. Command Center feed candidates deep-link in.
- **Vendor role + Vendor Portal** (§27) — external subcontractor role for C2C
  deals with a dedicated, scoped portal at `/vendor`. A vendor sees only the
  consultants their firm submitted, with permitted fields only (no pay/billing/
  markup, internal notes, recruiter/onboarder identities, or other vendors'
  people). "Preview as Vendor" routes into the portal; the internal Candidate
  360 shows the supplying vendor on C2C records.
- **Client role + Client Portal** (§27) — external end-client role with a
  scoped portal at `/client-portal`. A client sees only consultants assigned to
  their organization, with permitted readiness fields (pipeline, screening &
  equipment status, worker ID) — never other clients, pay/markup, or internal
  notes. Client actions: approve package, confirm start date, add client worker
  ID, download report. Completes the external-stakeholder trio (candidate,
  vendor, client); external-role routing generalized via `isExternalRole`.
- **Onboarder Workspace** (§5.3, §53) — HR Operations command center at
  `/onboarder`: workload vitals, a prioritized "needs attention" work queue
  (open / remind / escalate, deep-linking to the 360), pipeline-by-stage,
  start-date risk, and a document-review queue — scoped to the onboarder's
  assigned candidates. Role preview now lands on each role's home workspace.
- **Recruiter Workspace** (§5.4) — Candidate Handoff funnel at `/recruiter`:
  roster, handoff funnel, start-date risk with nudge, satisfaction.
- **Recruiting Manager Workspace** (§5.5) — Team Performance at
  `/recruiting-manager`: team stats, recruiter/onboarder workload (weighted by
  risk), stage bottlenecks, throughput trend.
- **Account Manager Workspace** (§5.6) — Client Readiness at `/account-manager`:
  client portfolio rollup, client promise tracker (§41.5), start forecast.
- **My Work action center** (§6) — universal prioritized action inbox at
  `/my-work` (review / approve / escalate / remind / AI), with quick actions and
  360 deep-links.
- With these, **every persona now has a distinct, live workspace** and role
  preview lands you in it (satisfies acceptance criteria §47 #1–2 for the UI
  layer; data becomes real with persistence). Shared `ops-data` aggregation
  layer + `StatTile` component.
- **Team Lead persona + Pod Performance workspace** (§5) — a 7th internal
  persona between Recruiter and Recruiting Manager, with a pod-scoped tactical
  view at `/team-lead`: pod stats, today's priorities, member workload, coaching
  flags.
- **Reports hub** (§49) at `/reports` — catalog of report categories.
- **Financial Performance report** (§67.4) at `/reports/financial` — 12-month
  historical trends (revenue, margin, cost-per-onboarding), month-over-month
  comparison, by-client financials, cost breakdown, revenue-at-risk.
- **Skills & Specialty report** (§49) at `/reports/specialty` — data-backed
  "what's your specialty": top skills (volume, success, time-to-fill,
  satisfaction), geographical strengths, a client-ready strengths summary, and
  current pipeline tied to specialty areas.
- **Theme bootstrap** now uses `next/script` `beforeInteractive` (clean console).
- **Org hierarchy** (§5, §36, §55) — modeled manager → *optional* team lead → IC
  for recruiting and onboarding (`src/lib/org.ts`); candidate data normalized so
  recruiters and onboarders are distinct people. Recruiting Manager workspace
  renders the org tree (team-lead pods + direct-to-manager reports) for both
  functions; Team Lead pod is org-derived.
- **AI-extracted skills** (§10, §20) — each candidate's résumé is parsed at
  onboarding start; the AI classifies a skill family and extracts granular
  skills (mocked deterministically; real parsing arrives with the AI layer).
  Surfaced on the Candidate 360 ("Skills — AI-extracted from résumé" with
  confidence) and now **drives the Skills & Specialty report** — top granular
  pipeline skills + AI-classified family distribution, with an explainable note
  that the report runs off résumé classification.
- **Reports catalog** (§49) — Reports hub rebuilt to mirror the real ApTask
  report menu: Financial Reports, Recruiters, and Back Office categories with
  every report listed. Each is a placeholder (`/reports/[slug]`) to be built
  individually; the two analytics reports already built (Financial Performance,
  Skills & Specialty) surface as live "Available now" previews.

> Decisions for the v0.2 persistence half: **Neon serverless Postgres** (via
> Prisma) and **deferred real auth** (this dev role switcher stands in until a
> provider is wired).

## [0.1.0] — Foundation slice

First versioned increment. Establishes the design system and application shell,
plus two flagship workspaces, using realistic mock data (no backend yet).

### Added

- **Project foundation** — Next.js 16 (App Router) + TypeScript + Tailwind v4 +
  shadcn/ui. Conventional-commit + semver versioning discipline.
- **Design system** (spec §3, §120) — Color tokens for the exact light/dark
  palette in §3.1, typography scale, spacing/radius/elevation/motion tokens,
  color-independent status colors.
- **Theming & density** (spec §3.1, §3.4, §115) — Seamless light/dark mode and
  three density modes (Comfortable, Compact, Ultra-Compact), persisted per user
  in `localStorage`, applied without a flash on load.
- **Application shell** (spec §4, §97) — Sticky collapsible role-aware sidebar,
  sticky top header (global search, command palette, notifications, AI Copilot,
  theme switcher, density selector, help, profile, workspace switcher), and
  breadcrumbs.
- **Command palette** (spec §31, §110) — `Cmd/Ctrl+K` keyboard-driven navigation
  and actions.
- **Workspace switcher** — Switch between persona workspaces.
- **Super Admin Command Center** (spec §7, §98, §99) — Filter header, operational
  vitals cards, risk/throughput widgets, package/exception widgets, culture &
  engagement widgets, and a dense granular line-item feed grid with sorting and
  filtering.
- **Candidate Portal** (spec §5.2, §101) — Mobile-first guided experience: home
  with progress ring, current stage, next best action, estimated completion,
  start date, assigned contact, task flow, and stage timeline.
- **Polished system states** (spec §111) — Empty, loading (skeletons), and error
  states for the workspaces shipped in this slice.

### Deferred (tracked in docs/ROADMAP.md)

Real authentication, Postgres persistence, the remaining four persona
workspaces, package builder, workflow studio, reporting engine, integration hub,
and live AI wiring.

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0
