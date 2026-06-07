# HireMe — Intelligent Enterprise Onboarding & Workforce Lifecycle Platform

An automation-first, AI-native platform for enterprise workforce onboarding and
the full consultant lifecycle. The complete product specification is the source
of truth in **[CLAUDE.md](CLAUDE.md)**; sequencing lives in
**[docs/ROADMAP.md](docs/ROADMAP.md)**.

> **Status: v0.1.0 — Foundation slice.** Design system, application shell, and
> two flagship workspaces (Super Admin Command Center + Candidate Portal) on
> realistic mock data. No backend yet — persistence arrives in v0.2.

## What's in v0.1.0

- **Design system** — exact light/dark palette, six-color status language,
  typography scale, three density modes, WCAG-minded focus & motion (§3, §120).
- **Application shell** — collapsible role-aware sidebar (all 21 nav sections),
  sticky header, breadcrumbs, workspace switcher, ⌘K command palette (§4, §97, §110).
- **Super Admin Command Center** — operational vitals, risk & throughput
  widgets, package/exception tiles, culture & engagement, and a dense
  line-item event feed grid with search/sort/select/bulk actions (§7, §98, §99).
- **Candidate Portal** — mobile-first guided experience: progress ring, Next
  Best Action, task flow with rejection guidance, stage timeline, Day 1
  readiness (§5.2, §101).

See **[CHANGELOG.md](CHANGELOG.md)** for the full list.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (CSS-first tokens) · [shadcn/ui](https://ui.shadcn.com)
- Deterministic mock data (replaced by Postgres + Prisma in v0.2)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /command-center
```

Routes: `/command-center` (Super Admin), `/portal` (Candidate).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

## Conventions

- **Versioning** — Semantic Versioning + Conventional Commits. One vertical
  slice per minor version (see the roadmap). A passing `lint`, `typecheck`, and
  `build` plus an updated `CHANGELOG.md` are required before each tag.
- **Spec references** — code comments cite spec sections (e.g. `§99`) so any
  piece of UI can be traced back to the requirement it satisfies.
