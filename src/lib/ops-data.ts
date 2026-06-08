/**
 * Operational aggregations for the persona workspaces (§5.4–§5.6, §6).
 * Derived deterministically from CANDIDATES; replaced by DB queries in the
 * persistence half of v0.2.
 */
import { CANDIDATES, type CandidateSummary } from "@/lib/candidates";
import { managerStructure, podOf, type OrgFunction } from "@/lib/org";
import type { StatusTone } from "@/lib/types";

/* ------------------------------ Onboarder -------------------------------- */

/** The demo onboarder whose desk the Onboarder workspace renders. */
export const CURRENT_ONBOARDER = "Riya Kim";

/* ----------------------------- Recruiter (§5.4) ---------------------------- */

export const CURRENT_RECRUITER = "Devon Hughes";

export function getRecruiterCandidates(
  recruiter: string = CURRENT_RECRUITER,
): CandidateSummary[] {
  return CANDIDATES.filter((c) => c.recruiter === recruiter);
}

/** Candidate handoff funnel (§54.1), cumulative reach by progress. */
export function recruiterFunnel(
  recruiter: string = CURRENT_RECRUITER,
): { stage: string; count: number }[] {
  const mine = getRecruiterCandidates(recruiter);
  const reached = (min: number) => mine.filter((c) => c.progress >= min).length;
  return [
    { stage: "Offer Accepted", count: mine.length },
    { stage: "Onboarding Started", count: reached(1) },
    { stage: "Documents Submitted", count: reached(40) },
    { stage: "Screening Started", count: reached(55) },
    { stage: "Client Approved", count: reached(70) },
    { stage: "Ready to Start", count: reached(85) },
    { stage: "Fully Onboarded", count: reached(100) },
  ];
}

/* ------------------------- Recruiting Manager (§5.5) ----------------------- */

export type OwnerWorkload = {
  name: string;
  active: number;
  atRisk: number;
  /** Weighted load: each active = 1, each at-risk adds 1. */
  weighted: number;
};

function workloadByOwner(
  field: "recruiter" | "onboarder",
): OwnerWorkload[] {
  const map = new Map<string, OwnerWorkload>();
  for (const c of CANDIDATES) {
    const name = c[field];
    const row =
      map.get(name) ?? { name, active: 0, atRisk: 0, weighted: 0 };
    row.active += 1;
    if (c.risk === "at-risk" || c.risk === "unlikely") row.atRisk += 1;
    row.weighted = row.active + row.atRisk;
    map.set(name, row);
  }
  return [...map.values()].sort((a, b) => b.weighted - a.weighted);
}

export const recruiterWorkload = () => workloadByOwner("recruiter");
export const onboarderWorkload = () => workloadByOwner("onboarder");

export function teamStats() {
  const total = CANDIDATES.length;
  const atRisk = CANDIDATES.filter(
    (c) => c.risk === "at-risk" || c.risk === "unlikely",
  ).length;
  const avgProgress = Math.round(
    CANDIDATES.reduce((s, c) => s + c.progress, 0) / total,
  );
  const startingSoon = CANDIDATES.filter((c) => c.startInDays <= 7).length;
  // Synthetic but stable headline metrics.
  return {
    total,
    atRisk,
    avgProgress,
    startingSoon,
    avgTimeToBoard: 11.4,
    dropOffRate: 6,
  };
}

/** Stage bottlenecks across the whole team. */
export function stageBottlenecks(): { name: string; value: number }[] {
  const stages = [
    "Profile Setup",
    "Document Submission",
    "Background Check",
    "Tax & Payroll",
    "Client Requirements",
    "IT Provisioning",
    "Training",
    "Day 1 Preparation",
  ];
  return stages
    .map((stage) => ({
      name: stage,
      value: CANDIDATES.filter((c) => c.stage === stage).length,
    }))
    .filter((s) => s.value > 0);
}

/* ----------------------------- Team Lead --------------------------------- */

/** Workload for a single person (as recruiter or onboarder — names are unique
 *  across roles), so org rollups can be assembled member-by-member. */
export function personWorkload(name: string): OwnerWorkload {
  const list = CANDIDATES.filter(
    (c) => c.recruiter === name || c.onboarder === name,
  );
  const atRisk = list.filter(
    (c) => c.risk === "at-risk" || c.risk === "unlikely",
  ).length;
  return { name, active: list.length, atRisk, weighted: list.length + atRisk };
}

/** The demo team lead (recruiting). Their pod comes from the org tree. */
export const TEAM_LEAD = "Devon Hughes";
export const POD_MEMBERS = podOf(TEAM_LEAD);

export function getPodCandidates(): CandidateSummary[] {
  return CANDIDATES.filter(
    (c) => POD_MEMBERS.includes(c.recruiter) || POD_MEMBERS.includes(c.onboarder),
  );
}

/** Workload for each member of the pod (lead + their ICs). */
export function podMemberWorkload(): OwnerWorkload[] {
  return POD_MEMBERS.map(personWorkload).sort((a, b) => b.weighted - a.weighted);
}

/** Members whose share of at-risk work suggests a coaching conversation. */
export function coachingFlags(): { name: string; reason: string }[] {
  return podMemberWorkload()
    .filter((m) => m.atRisk >= 1)
    .map((m) => ({
      name: m.name,
      reason:
        m.atRisk >= 2
          ? `${m.atRisk} at-risk starts — review pipeline together`
          : `${m.atRisk} at-risk start — check in`,
    }));
}

/** Manager rollup respecting the optional team-lead layer (§55). */
export type ManagerRollup = {
  manager: string;
  teams: { lead: string; members: OwnerWorkload[] }[];
  directs: OwnerWorkload[];
};

export function managerRollup(fn: OrgFunction): ManagerRollup {
  const s = managerStructure(fn);
  return {
    manager: s.manager,
    teams: s.teams.map((t) => ({
      lead: t.lead,
      members: t.members.map(personWorkload),
    })),
    directs: s.directs.map(personWorkload),
  };
}

/* ------------------------- Account Manager (§5.6) -------------------------- */

export type ClientReadiness = {
  client: string;
  consultants: number;
  startingSoon: number;
  atRisk: number;
  awaitingApproval: number;
  avgProgress: number;
};

export function clientReadiness(): ClientReadiness[] {
  const map = new Map<string, CandidateSummary[]>();
  for (const c of CANDIDATES) {
    const list = map.get(c.client) ?? [];
    list.push(c);
    map.set(c.client, list);
  }
  return [...map.entries()]
    .map(([client, list]) => ({
      client,
      consultants: list.length,
      startingSoon: list.filter((c) => c.startInDays <= 14).length,
      atRisk: list.filter((c) => c.risk === "at-risk" || c.risk === "unlikely")
        .length,
      awaitingApproval: list.filter(
        (c) => c.status === "in-review" || c.stage === "Client Requirements",
      ).length,
      avgProgress: Math.round(
        list.reduce((s, c) => s + c.progress, 0) / list.length,
      ),
    }))
    .sort((a, b) => b.consultants - a.consultants);
}

/* ----------------------------- My Work (§6) -------------------------------- */

export type Priority = "Critical" | "High" | "Medium" | "Low";

export type WorkItem = {
  id: string;
  type: string;
  priority: Priority;
  tone: StatusTone;
  candidate: CandidateSummary;
  action: string;
  due: string;
};

const PRIORITY_RANK: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

/** Universal action inbox items derived from candidate state (§6). */
export function getWorkItems(): WorkItem[] {
  const items: WorkItem[] = [];
  for (const c of CANDIDATES) {
    const due = `${c.startInDays}d to start`;
    if (c.risk === "at-risk" || c.risk === "unlikely") {
      items.push({
        id: `${c.id}-risk`,
        type: "Start date at risk",
        priority: "Critical",
        tone: "danger",
        candidate: c,
        action: "Escalate",
        due,
      });
    }
    if (c.status === "needs-attention") {
      items.push({
        id: `${c.id}-doc`,
        type: "Document review",
        priority: "High",
        tone: "danger",
        candidate: c,
        action: "Review document",
        due,
      });
    }
    if (c.status === "ai-pending") {
      items.push({
        id: `${c.id}-ai`,
        type: "AI recommendation",
        priority: "Medium",
        tone: "ai",
        candidate: c,
        action: "Approve / reject",
        due,
      });
    }
    if (c.status === "in-review") {
      items.push({
        id: `${c.id}-approve`,
        type: "Awaiting approval",
        priority: "Medium",
        tone: "info",
        candidate: c,
        action: "Review",
        due,
      });
    }
    if (c.status === "waiting-external") {
      items.push({
        id: `${c.id}-remind`,
        type: "Waiting on candidate",
        priority: "Low",
        tone: "neutral",
        candidate: c,
        action: "Send reminder",
        due,
      });
    }
  }
  return items.sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.candidate.startInDays - b.candidate.startInDays,
  );
}
