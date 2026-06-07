# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the platform is pre-1.0, the `0.MINOR.PATCH` scheme is used: each `MINOR`
bump delivers a new vertical slice from the spec ([docs/ROADMAP.md](docs/ROADMAP.md));
`PATCH` bumps are fixes and refinements within a slice.

## [Unreleased]

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
