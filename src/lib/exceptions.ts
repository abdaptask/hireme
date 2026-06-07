/**
 * Exception Control Tower data (CLAUDE.md §18 exception categories, §104 UI).
 * Deterministic mock; links to candidate records. Becomes DB-backed with
 * persistence.
 */
import type { StatusTone } from "@/lib/types";

export type ExceptionSeverity = "critical" | "high" | "medium" | "low";
export type ExceptionStatus = "open" | "in-progress" | "escalated" | "resolved";

export type Exception = {
  id: string;
  category: string;
  severity: ExceptionSeverity;
  candidate: string;
  candidateId: string;
  client: string;
  owner: string;
  resolver: string;
  ageDays: number;
  sla: { label: string; breached: boolean };
  startDateImpact: boolean;
  rootCause: string;
  businessImpact: string;
  status: ExceptionStatus;
  aiRecommendation: string;
};

export const SEVERITY_META: Record<
  ExceptionSeverity,
  { tone: StatusTone; label: string; rank: number }
> = {
  critical: { tone: "danger", label: "Critical", rank: 0 },
  high: { tone: "danger", label: "High", rank: 1 },
  medium: { tone: "warning", label: "Medium", rank: 2 },
  low: { tone: "neutral", label: "Low", rank: 3 },
};

export const STATUS_META: Record<
  ExceptionStatus,
  { tone: StatusTone; label: string }
> = {
  open: { tone: "info", label: "Open" },
  "in-progress": { tone: "warning", label: "In progress" },
  escalated: { tone: "danger", label: "Escalated" },
  resolved: { tone: "success", label: "Resolved" },
};

export const EXCEPTIONS: Exception[] = [
  {
    id: "EXC-1042",
    category: "Rejected document",
    severity: "high",
    candidate: "James Rivera",
    candidateId: "james-rivera",
    client: "Meridian Health",
    owner: "Riya Kim",
    resolver: "Riya Kim",
    ageDays: 1,
    sla: { label: "2h left", breached: false },
    startDateImpact: true,
    rootCause: "Government ID image too blurry to read expiration",
    businessImpact: "Blocks I-9 — start date in 3 days",
    status: "in-progress",
    aiRecommendation: "Request re-upload with mobile capture guidance",
  },
  {
    id: "EXC-1041",
    category: "Start-date change",
    severity: "critical",
    candidate: "Owen Bradley",
    candidateId: "owen-bradley",
    client: "Northwind Logistics",
    owner: "Sasha Patel",
    resolver: "Sasha Patel",
    ageDays: 2,
    sla: { label: "Breached", breached: true },
    startDateImpact: true,
    rootCause: "Client requirement items outstanding past SLA",
    businessImpact: "Start unlikely — escalated to Account Manager",
    status: "escalated",
    aiRecommendation: "Escalate to AM; propose revised start date",
  },
  {
    id: "EXC-1040",
    category: "Integration failure",
    severity: "high",
    candidate: "Marcus Webb",
    candidateId: "marcus-webb",
    client: "Northwind Logistics",
    owner: "IT Ops",
    resolver: "System",
    ageDays: 0,
    sla: { label: "Breached", breached: true },
    startDateImpact: false,
    rootCause: "ADP payroll worker-sync returned 500",
    businessImpact: "Payroll setup blocked",
    status: "open",
    aiRecommendation: "Retry sync; if 3rd failure, route to dead-letter queue",
  },
  {
    id: "EXC-1039",
    category: "Invalid bank information",
    severity: "medium",
    candidate: "Noah Klein",
    candidateId: "noah-klein",
    client: "Vertex Financial",
    owner: "Sasha Patel",
    resolver: "Sasha Patel",
    ageDays: 1,
    sla: { label: "1d left", breached: false },
    startDateImpact: false,
    rootCause: "Direct deposit account failed verification",
    businessImpact: "First paycheck at risk",
    status: "open",
    aiRecommendation: "Request corrected routing/account from candidate",
  },
  {
    id: "EXC-1038",
    category: "Compliance rule conflict",
    severity: "medium",
    candidate: "Sarah Chen",
    candidateId: "sarah-chen",
    client: "Atlas Manufacturing",
    owner: "Compliance",
    resolver: "Compliance",
    ageDays: 2,
    sla: { label: "1d left", breached: false },
    startDateImpact: false,
    rootCause: "CA wage notice overlaps client NDA clause",
    businessImpact: "Package approval blocked pending legal review",
    status: "in-progress",
    aiRecommendation: "Route to legal; suggest precedence rule",
  },
  {
    id: "EXC-1037",
    category: "Candidate unresponsive",
    severity: "high",
    candidate: "Ravi Menon",
    candidateId: "ravi-menon",
    client: "Cobalt Systems",
    owner: "Aaron Flores",
    resolver: "Aaron Flores",
    ageDays: 2,
    sla: { label: "12h left", breached: false },
    startDateImpact: true,
    rootCause: "No response to MSA request in 48h",
    businessImpact: "Onboarding stalled at Document Submission",
    status: "escalated",
    aiRecommendation: "Trigger SMS nudge; notify recruiter",
  },
  {
    id: "EXC-1036",
    category: "Background check delay",
    severity: "medium",
    candidate: "Aisha Bello",
    candidateId: "aisha-bello",
    client: "Vertex Financial",
    owner: "Lena Ortiz",
    resolver: "Lena Ortiz",
    ageDays: 3,
    sla: { label: "1d left", breached: false },
    startDateImpact: false,
    rootCause: "Vendor jurisdiction delay (county court)",
    businessImpact: "Screening clearance delayed",
    status: "open",
    aiRecommendation: "Check vendor ETA; consider alternate jurisdiction filing",
  },
  {
    id: "EXC-1035",
    category: "Equipment delay",
    severity: "low",
    candidate: "Mei Lin",
    candidateId: "mei-lin",
    client: "Atlas Manufacturing",
    owner: "IT Ops",
    resolver: "IT Ops",
    ageDays: 1,
    sla: { label: "2d left", breached: false },
    startDateImpact: false,
    rootCause: "Laptop shipment delayed by carrier",
    businessImpact: "Day 1 access at minor risk",
    status: "in-progress",
    aiRecommendation: "Expedite shipping or assign loaner",
  },
  {
    id: "EXC-1034",
    category: "Expired ID",
    severity: "medium",
    candidate: "Diego Santos",
    candidateId: "diego-santos",
    client: "Cobalt Systems",
    owner: "Aaron Flores",
    resolver: "Aaron Flores",
    ageDays: 0,
    sla: { label: "3d left", breached: false },
    startDateImpact: false,
    rootCause: "Passport past expiration date",
    businessImpact: "Work authorization re-verification needed",
    status: "open",
    aiRecommendation: "Request alternate List A/B document",
  },
  {
    id: "EXC-1033",
    category: "Duplicate profile",
    severity: "low",
    candidate: "Grace Okafor",
    candidateId: "grace-okafor",
    client: "Meridian Health",
    owner: "Riya Kim",
    resolver: "AI Copilot",
    ageDays: 4,
    sla: { label: "—", breached: false },
    startDateImpact: false,
    rootCause: "Possible duplicate ATS record detected by AI",
    businessImpact: "Data quality — none if merged",
    status: "resolved",
    aiRecommendation: "Confirmed merge of duplicate record",
  },
  {
    id: "EXC-1032",
    category: "Payroll issue",
    severity: "medium",
    candidate: "Sofia Marin",
    candidateId: "sofia-marin",
    client: "Atlas Manufacturing",
    owner: "Sasha Patel",
    resolver: "Sasha Patel",
    ageDays: 1,
    sla: { label: "2d left", breached: false },
    startDateImpact: false,
    rootCause: "Missing state tax form for CO",
    businessImpact: "Payroll readiness incomplete",
    status: "open",
    aiRecommendation: "Assign CO state tax form to candidate",
  },
  {
    id: "EXC-1031",
    category: "Drug screen delay",
    severity: "low",
    candidate: "Tara Voss",
    candidateId: "tara-voss",
    client: "Meridian Health",
    owner: "Lena Ortiz",
    resolver: "Lena Ortiz",
    ageDays: 2,
    sla: { label: "2d left", breached: false },
    startDateImpact: false,
    rootCause: "Candidate missed first appointment",
    businessImpact: "Screening timeline slipped",
    status: "in-progress",
    aiRecommendation: "Reschedule; send appointment reminder",
  },
  {
    id: "EXC-1030",
    category: "E-signature failure",
    severity: "low",
    candidate: "Fatima Idris",
    candidateId: "fatima-idris",
    client: "Cobalt Systems",
    owner: "Riya Kim",
    resolver: "Riya Kim",
    ageDays: 5,
    sla: { label: "—", breached: false },
    startDateImpact: false,
    rootCause: "DocuSign envelope expired before signing",
    businessImpact: "None — re-sent and completed",
    status: "resolved",
    aiRecommendation: "Re-issued envelope with extended expiry",
  },
];

export const isOpen = (e: Exception) => e.status !== "resolved";

export function exceptionStats() {
  const open = EXCEPTIONS.filter(isOpen);
  return {
    open: open.length,
    critical: open.filter((e) => e.severity === "critical").length,
    slaBreaches: open.filter((e) => e.sla.breached).length,
    startImpact: open.filter((e) => e.startDateImpact).length,
  };
}

export function byCategory(): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const e of EXCEPTIONS.filter(isOpen)) {
    counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function bySeverity(): { name: string; value: number; tone: StatusTone }[] {
  return (["critical", "high", "medium", "low"] as ExceptionSeverity[]).map(
    (s) => ({
      name: SEVERITY_META[s].label,
      value: EXCEPTIONS.filter((e) => isOpen(e) && e.severity === s).length,
      tone: SEVERITY_META[s].tone,
    }),
  );
}

/** Open exceptions, most urgent first (severity, then SLA breach, then age). */
export function sortedExceptions(): Exception[] {
  return [...EXCEPTIONS].sort((a, b) => {
    if (a.status === "resolved" && b.status !== "resolved") return 1;
    if (b.status === "resolved" && a.status !== "resolved") return -1;
    const sev = SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank;
    if (sev !== 0) return sev;
    if (a.sla.breached !== b.sla.breached) return a.sla.breached ? -1 : 1;
    return b.ageDays - a.ageDays;
  });
}
