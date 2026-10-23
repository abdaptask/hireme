/**
 * Who does what in the onboarding process (§5, §25 segregation of duties).
 * Pure and client-safe — the UI hides what a role can't do, and the server
 * actions enforce the same rules.
 *
 *  - Recruiting Manager starts onboarding (candidate, assignment, team).
 *  - Onboarder carries it through: reviews, screening, provisioning, Day 1.
 *  - Account Manager can complete the client billing setup.
 *  - Super Admin approves NHR exceptions and can do everything.
 *  - Recruiting Manager (or Super Admin) can edit an NHR after submission.
 */

import type { RoleId } from "@/lib/roles";

export type OnboardingPermission = "initiate" | "review" | "billing" | "approve" | "editNhr";

const RULES: Record<OnboardingPermission, RoleId[]> = {
  initiate: ["recruiting-manager", "super-admin"],
  review: ["onboarder", "super-admin"],
  billing: ["onboarder", "account-manager", "super-admin"],
  /** Approve NHR exceptions such as a start date in the past (§25 override). */
  approve: ["super-admin"],
  /** Change NHR details (team, contacts, job) after submission. */
  editNhr: ["recruiting-manager", "super-admin"],
};

export function can(role: RoleId, permission: OnboardingPermission): boolean {
  return RULES[permission].includes(role);
}

export const INITIATOR_ROLES = RULES.initiate;
