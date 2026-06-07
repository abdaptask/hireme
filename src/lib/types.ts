/**
 * Core domain & UI types for HireMe (CLAUDE.md §43 entities, §5.3 status language).
 * Intentionally lean for v0.1 (mock-data foundation); expands with persistence
 * in v0.2 — see docs/ROADMAP.md.
 */

/** Semantic tone for the color-independent status language (§5.3, §3.6). */
export type StatusTone =
  | "success" // On Track
  | "warning" // Needs Attention
  | "danger" // At Risk
  | "info" // In Review
  | "ai" // AI Recommendation Pending
  | "neutral"; // Waiting on External Party / inert

/** Onboarding pipeline health, per §5.3 status visual language. */
export type PipelineStatus =
  | "on-track"
  | "needs-attention"
  | "at-risk"
  | "waiting-external"
  | "in-review"
  | "ai-pending";

/** Start-Date Risk Engine levels (§33). */
export type RiskLevel =
  | "on-track"
  | "needs-attention"
  | "at-risk"
  | "unlikely";

/** Personas with dedicated workspaces (§5). */
export type PersonaId =
  | "super-admin"
  | "candidate"
  | "onboarder"
  | "recruiter"
  | "recruiting-manager"
  | "account-manager";
