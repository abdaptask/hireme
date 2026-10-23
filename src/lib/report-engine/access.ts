/**
 * Report access control (§42 RBAC/ABAC, §72 row-level security, §73.11–12).
 *
 * Two layers:
 *  1. Catalog — which reports a role may open (by report persona tags, and an
 *     explicit list for the legacy back-office / financial pages).
 *  2. Rows — whose records a role sees inside a report (the demo identity for
 *     that role: an onboarder sees their own candidates, an account manager
 *     their own clients, and so on).
 *
 * Pure and client-safe. The viewer role comes from the "view as" role switcher,
 * mirrored into the `hireme.viewAs` cookie so the server can enforce it.
 */

import type { RoleId } from "@/lib/roles";
import type { ReportPersona } from "./types";

export const VIEW_AS_COOKIE = "hireme.viewAs";

const ROLE_IDS: RoleId[] = ["super-admin", "onboarder", "recruiter", "recruiting-manager", "team-lead", "account-manager", "candidate", "vendor", "client"];

export function parseRole(v: string | undefined | null): RoleId {
  return ROLE_IDS.includes(v as RoleId) ? (v as RoleId) : "super-admin";
}

/** Report personas each role is entitled to (super admin sees everything). */
const ROLE_REPORT_PERSONAS: Record<RoleId, ReportPersona[] | "all"> = {
  "super-admin": "all",
  onboarder: ["onboarder"],
  recruiter: ["recruiter"],
  "recruiting-manager": ["recruiting-manager"],
  "team-lead": ["recruiter", "recruiting-manager"],
  "account-manager": ["account-manager"],
  candidate: ["candidate"],
  vendor: [],
  client: [],
};

export function canViewReport(role: RoleId, r: { personas: ReportPersona[]; restricted?: boolean }): boolean {
  const allowed = ROLE_REPORT_PERSONAS[role];
  if (allowed === "all") return true;
  // Restricted reports are only tagged for personas with a need to know.
  return r.personas.some((p) => allowed.includes(p));
}

/** Persona tabs a role may browse in the report library. */
export function libraryPersonas(role: RoleId): ReportPersona[] | "all" {
  return ROLE_REPORT_PERSONAS[role];
}

// ─────────────────────────────────────────────────────────
// Legacy (hand-built) report pages under /reports/*
// ─────────────────────────────────────────────────────────

const SA: RoleId[] = ["super-admin"];
const SA_AM: RoleId[] = ["super-admin", "account-manager"];
const RECRUITING: RoleId[] = ["super-admin", "recruiting-manager", "team-lead", "recruiter"];

/** First path segment after /reports → roles allowed. */
export const LEGACY_REPORT_ACCESS: Record<string, RoleId[]> = {
  // Financial
  financial: SA,
  "fintech-profit-loss": SA,
  "combine-income-statement": SA,
  "balance-sheet": SA,
  "profit-loss-summary": SA,
  commission: SA,
  // Recruiting analytics
  "recruiter-performance": RECRUITING,
  specialty: [...RECRUITING, "account-manager"],
  "operational-counts": ["super-admin", "recruiting-manager", "onboarder"],
  // EEOC — restricted compliance data
  eeo: SA,
  // Back office
  "consultant-contact": SA_AM,
  "clients-invoice": SA_AM,
  "add-drop-reports": SA_AM,
  "client-add-drop-summary": SA_AM,
  "add-drop-summary": SA_AM,
  equipment: ["super-admin", "account-manager", "onboarder"],
  custom: SA,
  builder: SA,
  "ae-rec-summary": ["super-admin", "account-manager", "recruiting-manager"],
  consultant: SA_AM,
  headcount: ["super-admin", "account-manager", "recruiting-manager"],
  "consultant-pnl": SA,
};

export function canViewLegacy(role: RoleId, segment: string): boolean {
  const allowed = LEGACY_REPORT_ACCESS[segment];
  return !allowed || allowed.includes(role);
}

// ─────────────────────────────────────────────────────────
// Row-level scope — the demo identity behind each role
// ─────────────────────────────────────────────────────────

export type ViewerScope =
  | { kind: "all" }
  | { kind: "recruiter"; names: string[]; label: string }
  | { kind: "onboarder"; name: string; label: string }
  | { kind: "account-manager"; name: string; label: string }
  | { kind: "candidate"; label: string }
  | { kind: "none"; label: string };

/** Demo identities (names exist in the seeded data). Replaced by the session user when auth lands. */
export const DEMO_VIEWERS = {
  onboarder: "Riya Kim",
  recruiter: "Mia Thompson",
  teamLead: { name: "Sandra Lee", pod: ["Sandra Lee", "Mia Thompson", "Derek Okafor", "Jordan Ellis"] },
  accountManager: "Priya Shah",
} as const;

export function viewerScope(role: RoleId): ViewerScope {
  switch (role) {
    case "onboarder":
      return { kind: "onboarder", name: DEMO_VIEWERS.onboarder, label: `${DEMO_VIEWERS.onboarder} (Onboarder) — your candidates only` };
    case "recruiter":
      return { kind: "recruiter", names: [DEMO_VIEWERS.recruiter], label: `${DEMO_VIEWERS.recruiter} (Recruiter) — your candidates only` };
    case "team-lead":
      return { kind: "recruiter", names: [...DEMO_VIEWERS.teamLead.pod], label: `${DEMO_VIEWERS.teamLead.name} (Team Lead) — your pod: ${DEMO_VIEWERS.teamLead.pod.join(", ")}` };
    case "account-manager":
      return { kind: "account-manager", name: DEMO_VIEWERS.accountManager, label: `${DEMO_VIEWERS.accountManager} (Account Manager) — your clients only` };
    case "candidate":
      return { kind: "candidate", label: "Candidate — your own records only" };
    case "vendor":
    case "client":
      return { kind: "none", label: "External portal users don't have internal reports" };
    default:
      return { kind: "all" };
  }
}
