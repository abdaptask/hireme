/**
 * Candidate 360 mock data (CLAUDE.md §15 360 record, §100 Candidate 360 UI).
 * Deterministic; binds to Prisma/Neon in the persistence half of v0.2.
 */
import type { PipelineStatus, RiskLevel, StatusTone } from "@/lib/types";

export type CandidateSummary = {
  id: string;
  name: string;
  preferredName?: string;
  role: string;
  client: string;
  employmentType: "W-2" | "1099" | "C2C";
  location: string;
  stage: string;
  status: PipelineStatus;
  risk: RiskLevel;
  startDateLabel: string;
  startInDays: number;
  recruiter: string;
  onboarder: string;
  progress: number;
  lastActivity: string;
  email: string;
  phone: string;
  tags: string[];
  /** Supplying vendor for C2C arrangements (§27, §30). Absent = direct/internal. */
  vendor?: string;
};

export type ReadinessDimension = {
  label: string;
  tone: StatusTone;
  value: number; // 0–100
  note: string;
};

export type TimelineEvent = {
  id: string;
  time: string;
  kind: "candidate" | "human" | "ai" | "integration" | "document" | "approval";
  title: string;
  detail?: string;
};

export type CandidateTask = {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: PipelineStatus;
};

export type CandidateDocument = {
  id: string;
  name: string;
  type: string;
  status: "approved" | "in-review" | "rejected" | "pending";
  updated: string;
};

export type CandidateDetail = CandidateSummary & {
  nextBestAction: { title: string; detail: string; cta: string };
  aiSummary: string;
  readiness: ReadinessDimension[];
  timeline: TimelineEvent[];
  tasks: CandidateTask[];
  documents: CandidateDocument[];
  openExceptions: { id: string; title: string; tone: StatusTone }[];
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CANDIDATES: CandidateSummary[] = [
  {
    id: "james-rivera",
    name: "James Rivera",
    role: "Senior Data Analyst",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Remote · Austin, TX",
    stage: "Document Submission",
    status: "needs-attention",
    risk: "at-risk",
    startDateLabel: "Jun 15",
    startInDays: 3,
    recruiter: "Devon Hughes",
    onboarder: "Riya Kim",
    progress: 42,
    lastActivity: "12m ago",
    email: "james.rivera@example.com",
    phone: "+1 (512) 555-0142",
    tags: ["Priority client", "Rejected ID"],
  },
  {
    id: "aisha-bello",
    name: "Aisha Bello",
    role: "RN — ICU",
    client: "Vertex Financial",
    employmentType: "W-2",
    location: "Onsite · Dallas, TX",
    stage: "Background Check",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jun 22",
    startInDays: 10,
    recruiter: "Lena Ortiz",
    onboarder: "Riya Kim",
    progress: 68,
    lastActivity: "1h ago",
    email: "aisha.bello@example.com",
    phone: "+1 (214) 555-0177",
    tags: ["Healthcare"],
  },
  {
    id: "marcus-webb",
    name: "Marcus Webb",
    role: "DevOps Engineer",
    client: "Northwind Logistics",
    employmentType: "C2C",
    location: "Hybrid · Chicago, IL",
    stage: "Tax & Payroll",
    status: "waiting-external",
    risk: "needs-attention",
    startDateLabel: "Jun 18",
    startInDays: 6,
    recruiter: "Devon Hughes",
    onboarder: "Aaron Flores",
    progress: 55,
    lastActivity: "3h ago",
    email: "marcus.webb@example.com",
    phone: "+1 (312) 555-0199",
    tags: ["Payroll sync failed"],
    vendor: "Apex Staffing Partners",
  },
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    role: "Product Designer",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    location: "Remote · Seattle, WA",
    stage: "Client Requirements",
    status: "ai-pending",
    risk: "needs-attention",
    startDateLabel: "Jun 20",
    startInDays: 8,
    recruiter: "Riya Kim",
    onboarder: "Aaron Flores",
    progress: 61,
    lastActivity: "25m ago",
    email: "sarah.chen@example.com",
    phone: "+1 (206) 555-0123",
    tags: ["AI waiver suggested"],
  },
  {
    id: "owen-bradley",
    name: "Owen Bradley",
    role: "Field Technician",
    client: "Northwind Logistics",
    employmentType: "W-2",
    location: "Onsite · Detroit, MI",
    stage: "Client Requirements",
    status: "at-risk",
    risk: "unlikely",
    startDateLabel: "Jun 14",
    startInDays: 2,
    recruiter: "Devon Hughes",
    onboarder: "Aaron Flores",
    progress: 38,
    lastActivity: "5h ago",
    email: "owen.bradley@example.com",
    phone: "+1 (313) 555-0188",
    tags: ["Start at risk", "Escalated"],
  },
  {
    id: "mei-lin",
    name: "Mei Lin",
    role: "Financial Analyst",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    location: "Hybrid · San Jose, CA",
    stage: "Tax & Payroll",
    status: "in-review",
    risk: "on-track",
    startDateLabel: "Jun 25",
    startInDays: 13,
    recruiter: "Riya Kim",
    onboarder: "Riya Kim",
    progress: 72,
    lastActivity: "40m ago",
    email: "mei.lin@example.com",
    phone: "+1 (408) 555-0166",
    tags: ["CA wage notice"],
  },
  {
    id: "diego-santos",
    name: "Diego Santos",
    role: "Solutions Architect",
    client: "Cobalt Systems",
    employmentType: "C2C",
    location: "Remote · Miami, FL",
    stage: "Client Requirements",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jun 30",
    startInDays: 18,
    recruiter: "Aaron Flores",
    onboarder: "Aaron Flores",
    progress: 80,
    lastActivity: "2h ago",
    email: "diego.santos@example.com",
    phone: "+1 (305) 555-0150",
    tags: ["Client approved"],
    vendor: "Apex Staffing Partners",
  },
  {
    id: "grace-okafor",
    name: "Grace Okafor",
    role: "Clinical Coordinator",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Onsite · Houston, TX",
    stage: "Document Submission",
    status: "in-review",
    risk: "on-track",
    startDateLabel: "Jun 23",
    startInDays: 11,
    recruiter: "Lena Ortiz",
    onboarder: "Riya Kim",
    progress: 58,
    lastActivity: "18m ago",
    email: "grace.okafor@example.com",
    phone: "+1 (713) 555-0133",
    tags: ["Healthcare"],
  },
  {
    id: "noah-klein",
    name: "Noah Klein",
    role: "Accountant",
    client: "Vertex Financial",
    employmentType: "W-2",
    location: "Hybrid · Dallas, TX",
    stage: "Tax & Payroll",
    status: "needs-attention",
    risk: "needs-attention",
    startDateLabel: "Jun 19",
    startInDays: 7,
    recruiter: "Lena Ortiz",
    onboarder: "Aaron Flores",
    progress: 49,
    lastActivity: "1h ago",
    email: "noah.klein@example.com",
    phone: "+1 (214) 555-0144",
    tags: ["Missing direct deposit"],
  },
  {
    id: "fatima-idris",
    name: "Fatima Idris",
    role: "QA Engineer",
    client: "Cobalt Systems",
    employmentType: "1099",
    location: "Remote · Phoenix, AZ",
    stage: "Training",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jul 06",
    startInDays: 24,
    recruiter: "Aaron Flores",
    onboarder: "Riya Kim",
    progress: 86,
    lastActivity: "4h ago",
    email: "fatima.idris@example.com",
    phone: "+1 (602) 555-0111",
    tags: ["Training assigned"],
  },
  {
    id: "ravi-menon",
    name: "Ravi Menon",
    role: "Backend Engineer",
    client: "Cobalt Systems",
    employmentType: "C2C",
    location: "Remote · Raleigh, NC",
    stage: "Document Submission",
    status: "needs-attention",
    risk: "needs-attention",
    startDateLabel: "Jun 21",
    startInDays: 9,
    recruiter: "Aaron Flores",
    onboarder: "Riya Kim",
    progress: 34,
    lastActivity: "2h ago",
    email: "ravi.menon@example.com",
    phone: "+1 (919) 555-0102",
    tags: ["Awaiting vendor MSA"],
    vendor: "Apex Staffing Partners",
  },
  {
    id: "sofia-marin",
    name: "Sofia Marin",
    role: "Data Engineer",
    client: "Atlas Manufacturing",
    employmentType: "C2C",
    location: "Hybrid · Denver, CO",
    stage: "Background Check",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jun 28",
    startInDays: 16,
    recruiter: "Aaron Flores",
    onboarder: "Aaron Flores",
    progress: 70,
    lastActivity: "5h ago",
    email: "sofia.marin@example.com",
    phone: "+1 (720) 555-0119",
    tags: [],
    vendor: "Apex Staffing Partners",
  },
];

const READINESS_TEMPLATES: Record<RiskLevel, ReadinessDimension[]> = {
  "on-track": [
    { label: "Compliance", tone: "success", value: 100, note: "All requirements met" },
    { label: "Payroll", tone: "success", value: 100, note: "Ready" },
    { label: "Client approval", tone: "success", value: 100, note: "Approved" },
    { label: "IT provisioning", tone: "info", value: 80, note: "Equipment shipped" },
    { label: "Engagement", tone: "success", value: 95, note: "Responsive" },
    { label: "Training", tone: "info", value: 60, note: "In progress" },
  ],
  "needs-attention": [
    { label: "Compliance", tone: "warning", value: 70, note: "1 item pending" },
    { label: "Payroll", tone: "warning", value: 55, note: "Direct deposit missing" },
    { label: "Client approval", tone: "info", value: 60, note: "In review" },
    { label: "IT provisioning", tone: "neutral", value: 30, note: "Not requested" },
    { label: "Engagement", tone: "warning", value: 65, note: "Slow responses" },
    { label: "Training", tone: "neutral", value: 20, note: "Not started" },
  ],
  "at-risk": [
    { label: "Compliance", tone: "danger", value: 45, note: "Rejected document" },
    { label: "Payroll", tone: "warning", value: 50, note: "Blocked on compliance" },
    { label: "Client approval", tone: "warning", value: 40, note: "Awaiting items" },
    { label: "IT provisioning", tone: "neutral", value: 25, note: "Pending" },
    { label: "Engagement", tone: "danger", value: 40, note: "Unresponsive 48h" },
    { label: "Training", tone: "neutral", value: 10, note: "Not started" },
  ],
  unlikely: [
    { label: "Compliance", tone: "danger", value: 35, note: "Multiple blockers" },
    { label: "Payroll", tone: "danger", value: 30, note: "Not ready" },
    { label: "Client approval", tone: "danger", value: 25, note: "Stalled" },
    { label: "IT provisioning", tone: "danger", value: 15, note: "Won't arrive in time" },
    { label: "Engagement", tone: "danger", value: 30, note: "No response" },
    { label: "Training", tone: "neutral", value: 0, note: "Not started" },
  ],
};

function timelineFor(c: CandidateSummary): TimelineEvent[] {
  return [
    { id: "t1", time: c.lastActivity, kind: "ai", title: "AI quality check on uploaded ID", detail: "Flagged blurry image — correction requested" },
    { id: "t2", time: "Today 09:12", kind: "document", title: "Government ID uploaded", detail: "By candidate via mobile portal" },
    { id: "t3", time: "Yesterday", kind: "human", title: `Package approved by ${c.onboarder}`, detail: `${c.client} W-2 onboarding package` },
    { id: "t4", time: "Yesterday", kind: "integration", title: "Background check ordered", detail: "Sent to HireRight" },
    { id: "t5", time: "2 days ago", kind: "candidate", title: "Portal activated", detail: "Candidate signed in for the first time" },
    { id: "t6", time: "3 days ago", kind: "approval", title: "Offer accepted", detail: `Recruiter ${c.recruiter}` },
  ];
}

function tasksFor(c: CandidateSummary): CandidateTask[] {
  return [
    { id: "k1", title: "Review rejected government ID", owner: c.onboarder, due: "Today", status: "needs-attention" },
    { id: "k2", title: "Verify I-9 Section 2", owner: c.onboarder, due: "In 1 day", status: "in-review" },
    { id: "k3", title: `Confirm ${c.client} client requirements`, owner: c.onboarder, due: "In 2 days", status: "waiting-external" },
    { id: "k4", title: "Direct deposit validation", owner: "Payroll", due: "In 3 days", status: "on-track" },
  ];
}

function documentsFor(): CandidateDocument[] {
  return [
    { id: "d1", name: "Government ID", type: "Identity", status: "rejected", updated: "12m ago" },
    { id: "d2", name: "I-9", type: "Work authorization", status: "in-review", updated: "1h ago" },
    { id: "d3", name: "Federal W-4", type: "Tax", status: "approved", updated: "Yesterday" },
    { id: "d4", name: "Client NDA", type: "Client form", status: "pending", updated: "2 days ago" },
    { id: "d5", name: "Direct deposit", type: "Payroll", status: "pending", updated: "2 days ago" },
  ];
}

export function getCandidate(id: string): CandidateDetail | undefined {
  const c = CANDIDATES.find((x) => x.id === id);
  if (!c) return undefined;
  return {
    ...c,
    nextBestAction: {
      title:
        c.status === "at-risk"
          ? "Escalate to Account Manager"
          : "Review rejected government ID",
      detail:
        c.risk === "unlikely" || c.risk === "at-risk"
          ? `Start date is in ${c.startInDays} days and key items are blocked.`
          : `A document needs review before ${c.client} can approve.`,
      cta: c.status === "at-risk" ? "Open exception" : "Review document",
    },
    aiSummary: `${c.preferredName ?? c.name.split(" ")[0]} is in ${c.stage} for ${c.client} (${c.employmentType}), starting ${c.startDateLabel}. Risk is ${c.risk.replace("-", " ")}; ${c.progress}% complete. Latest activity ${c.lastActivity}.`,
    readiness: READINESS_TEMPLATES[c.risk],
    timeline: timelineFor(c),
    tasks: tasksFor(c),
    documents: documentsFor(),
    openExceptions:
      c.risk === "at-risk" || c.risk === "unlikely"
        ? [
            { id: "EXC-1", title: "Rejected identity document", tone: "danger" },
            { id: "EXC-2", title: "Start date at risk", tone: "danger" },
          ]
        : c.status === "needs-attention"
          ? [{ id: "EXC-3", title: "Missing payroll information", tone: "warning" }]
          : [],
  };
}

/** Map a free-text candidate name (e.g. from the event feed) to a record id. */
export function candidateIdByName(name: string): string | undefined {
  return CANDIDATES.find((c) => c.name === name)?.id;
}

/* ---------------------------------------------------------------------------
   Vendor portal scoping (§27).
   Vendors are external subcontractors in C2C deals. They may only see their
   own submitted candidates, and only permitted fields — never confidential
   pay/markup, internal notes/tags, recruiter/onboarder identities, internal AI
   analysis, or other vendors' people.
   --------------------------------------------------------------------------- */

/** The vendor currently signed into the demo portal. */
export const CURRENT_VENDOR = "Apex Staffing Partners";

export type VendorCandidateView = {
  id: string;
  name: string;
  role: string;
  client: string;
  location: string;
  employmentType: string;
  stage: string;
  status: PipelineStatus;
  startDateLabel: string;
  startInDays: number;
  progress: number;
  /** What the vendor must do next, if anything (no internal detail). */
  actionNeeded: string | null;
  /** High-level screening readiness only — never results. */
  screeningStatus: string;
};

function vendorActionFor(c: CandidateSummary): string | null {
  if (c.tags.includes("Awaiting vendor MSA"))
    return "Upload signed MSA / work order";
  switch (c.status) {
    case "needs-attention":
      return "Action needed — submit outstanding documents";
    case "waiting-external":
      return "Awaiting documents from your candidate";
    default:
      return null;
  }
}

/** Project an internal candidate down to the vendor-permitted view (§27). */
export function toVendorView(c: CandidateSummary): VendorCandidateView {
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    client: c.client,
    location: c.location,
    employmentType: c.employmentType,
    stage: c.stage,
    status: c.status,
    startDateLabel: c.startDateLabel,
    startInDays: c.startInDays,
    progress: c.progress,
    actionNeeded: vendorActionFor(c),
    screeningStatus:
      c.stage === "Background Check"
        ? "In progress"
        : c.progress > 60
          ? "Clear"
          : "Not started",
  };
}

/** All candidates a vendor is entitled to see (their own, permitted view). */
export function getVendorCandidates(
  vendor: string = CURRENT_VENDOR,
): VendorCandidateView[] {
  return CANDIDATES.filter((c) => c.vendor === vendor).map(toVendorView);
}
