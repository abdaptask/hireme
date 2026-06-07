# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the platform is pre-1.0, the `0.MINOR.PATCH` scheme is used: each `MINOR`
bump delivers a new vertical slice from the spec ([docs/ROADMAP.md](docs/ROADMAP.md));
`PATCH` bumps are fixes and refinements within a slice.

## [Unreleased]

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
