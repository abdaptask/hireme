/**
 * Who is acting (§26 audit "user") until real auth lands (§42).
 *  - Internal users: the "view as" role cookie → that role's demo identity.
 *  - Candidates: the portal session cookie set by /portal/start?c=<id>.
 *
 * Server-only — never import in client components.
 */

import { cookies } from "next/headers";
import type { RoleId } from "@/lib/roles";
import { DEMO_VIEWERS, VIEW_AS_COOKIE, parseRole } from "@/lib/report-engine/access";
import type { Actor } from "./service";

export const PORTAL_COOKIE = "hireme.portalCandidate";

const NAME_FOR_ROLE: Partial<Record<RoleId, string>> = {
  "super-admin": "Super Admin",
  onboarder: DEMO_VIEWERS.onboarder,
  recruiter: DEMO_VIEWERS.recruiter,
  "team-lead": DEMO_VIEWERS.teamLead.name,
  "account-manager": DEMO_VIEWERS.accountManager,
  "recruiting-manager": "Recruiting Manager",
};

/** Internal staff actor, or null for roles that can't act on onboarding records. */
export async function staffActor(): Promise<Actor | null> {
  const role = parseRole((await cookies()).get(VIEW_AS_COOKIE)?.value);
  const name = NAME_FOR_ROLE[role];
  return name ? { name, role } : null;
}

export async function portalCandidateId(): Promise<string | null> {
  return (await cookies()).get(PORTAL_COOKIE)?.value ?? null;
}
