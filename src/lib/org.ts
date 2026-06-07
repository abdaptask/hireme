/**
 * Organisation hierarchy (CLAUDE.md §5, §36 capacity/workload, §55 manager
 * reports). Models the real reporting structure:
 *
 *   Manager → (optional) Team Lead → recruiters / onboarders
 *
 * A manager may have team leads OR direct individual contributors (no lead).
 * A team lead carries a (reduced) load themselves and has ICs reporting to
 * them. The same shape exists on the recruiting and onboarding sides.
 *
 * Person names here match candidate.recruiter / candidate.onboarder values so
 * workload rolls up correctly.
 */

export type OrgFunction = "recruiting" | "onboarding";
export type OrgRole = "manager" | "team-lead" | "recruiter" | "onboarder";

export type OrgPerson = {
  name: string;
  fn: OrgFunction;
  role: OrgRole;
  /** Who this person reports to (null for a function head). */
  reportsTo: string | null;
};

export const ORG: OrgPerson[] = [
  // Recruiting
  { name: "Priya Anand", fn: "recruiting", role: "manager", reportsTo: null },
  { name: "Devon Hughes", fn: "recruiting", role: "team-lead", reportsTo: "Priya Anand" },
  { name: "Lena Ortiz", fn: "recruiting", role: "recruiter", reportsTo: "Devon Hughes" },
  { name: "Aaron Flores", fn: "recruiting", role: "recruiter", reportsTo: "Priya Anand" }, // direct (no team lead)

  // Onboarding
  { name: "Marcus Reed", fn: "onboarding", role: "manager", reportsTo: null },
  { name: "Riya Kim", fn: "onboarding", role: "team-lead", reportsTo: "Marcus Reed" },
  { name: "Sasha Patel", fn: "onboarding", role: "onboarder", reportsTo: "Riya Kim" },
];

export function getPerson(name: string): OrgPerson | undefined {
  return ORG.find((p) => p.name === name);
}

export function managerOf(fn: OrgFunction): OrgPerson | undefined {
  return ORG.find((p) => p.fn === fn && p.role === "manager");
}

/** People who report directly to `name`. */
export function directReports(name: string): OrgPerson[] {
  return ORG.filter((p) => p.reportsTo === name);
}

/** A team lead's working group: the lead (who carries load) + their ICs. */
export function teamMembers(leadName: string): string[] {
  return [leadName, ...directReports(leadName).map((p) => p.name)];
}

export type ManagerStructure = {
  manager: string;
  teams: { lead: string; members: string[] }[];
  /** ICs reporting straight to the manager (no team lead). */
  directs: string[];
};

/** The hierarchy beneath a manager: team-lead pods + any direct ICs. */
export function managerStructure(fn: OrgFunction): ManagerStructure {
  const mgr = managerOf(fn);
  if (!mgr) return { manager: "—", teams: [], directs: [] };
  const reports = directReports(mgr.name);
  return {
    manager: mgr.name,
    teams: reports
      .filter((p) => p.role === "team-lead")
      .map((lead) => ({ lead: lead.name, members: teamMembers(lead.name) })),
    directs: reports.filter((p) => p.role !== "team-lead").map((p) => p.name),
  };
}

/** Resolve a team lead's pod by name (members they're responsible for). */
export function podOf(leadName: string): string[] {
  return teamMembers(leadName);
}
