/**
 * Client / end-client master data (CLAUDE.md §27, §30, §43, §56, §97.3).
 * Five clients mirror what's already referenced in candidates.ts so counts
 * are consistent. Becomes DB-backed with persistence (Neon + Prisma).
 */
import { CANDIDATES } from "@/lib/candidates";

export type ClientStatus = "active" | "at-risk" | "on-hold";

export type ClientContact = {
  name: string;
  title: string;
  email: string;
  phone?: string;
  type: "primary" | "billing" | "technical" | "hr";
};

export type ComplianceRule = {
  id: string;
  label: string;
  category: "background" | "drug" | "document" | "training" | "insurance" | "security";
  required: boolean;
  condition?: string; // e.g. "W-2 only" or "CA state"
};

export type ClientPromise = {
  label: string;
  promisedDate: string;
  actualDate?: string;
  status: "on-track" | "at-risk" | "missed" | "delivered";
};

export type Client = {
  id: string;
  name: string;
  industry: string;
  hq: string;                     // "City, ST"
  accountManager: string;
  programs: string[];
  msp?: string;
  employmentTypesAllowed: string[];
  status: ClientStatus;

  // Compliance requirements
  rules: ComplianceRule[];

  // Contacts
  contacts: ClientContact[];

  // Promise tracker (§41.5)
  promises: ClientPromise[];

  // Client info
  website?: string;
  invoiceFrequency: string;
  paymentTermsDays: number;
  vmsPlatform?: string;
  workerIdPrefix?: string;        // e.g. "MH-" for Meridian Health

  // Metrics (mocked; derived from candidates in real system)
  activeConsultants: number;
  avgOnboardingDays: number;
  compliancePassRate: number;     // 0–100
  startDateSuccessRate: number;   // 0–100

  // Meta
  since: string;                  // "YYYY-MM"
  notes: string;
};

export const CLIENTS: Client[] = [
  {
    id: "meridian-health",
    name: "Meridian Health",
    industry: "Healthcare",
    hq: "Nashville, TN",
    accountManager: "Devon Hughes",
    programs: ["Nursing Staff", "Health IT", "Compliance"],
    msp: undefined,
    employmentTypesAllowed: ["W-2", "1099"],
    status: "active",
    rules: [
      { id: "mh-bgc", label: "Background Check (7-yr)", category: "background", required: true },
      { id: "mh-drug", label: "10-Panel Drug Screen", category: "drug", required: true },
      { id: "mh-nda", label: "Meridian Health NDA", category: "document", required: true },
      { id: "mh-hipaa", label: "HIPAA Training", category: "training", required: true },
      { id: "mh-i9", label: "I-9 / E-Verify", category: "document", required: true },
      { id: "mh-flu", label: "Flu Vaccination or Waiver", category: "document", required: true, condition: "Healthcare workers" },
      { id: "mh-safety", label: "Safety Orientation", category: "training", required: true },
      { id: "mh-cyber", label: "Cybersecurity Awareness", category: "training", required: true },
    ],
    contacts: [
      { name: "Linda Marsh", title: "VP of Operations", email: "l.marsh@meridianhealth.com", phone: "+1 (615) 555-0101", type: "primary" },
      { name: "Tom Reid", title: "HR Director", email: "t.reid@meridianhealth.com", type: "hr" },
      { name: "Sara Kim", title: "Accounts Payable", email: "s.kim@meridianhealth.com", type: "billing" },
    ],
    promises: [
      { label: "Background clearance", promisedDate: "Jun 12", actualDate: "Jun 11", status: "delivered" },
      { label: "Portal access (James Rivera)", promisedDate: "Jun 14", status: "at-risk" },
      { label: "Equipment delivery (Grace Okafor)", promisedDate: "Jun 18", status: "on-track" },
    ],
    website: "meridianhealth.com",
    invoiceFrequency: "Weekly",
    paymentTermsDays: 30,
    workerIdPrefix: "MH-",
    activeConsultants: 18,
    avgOnboardingDays: 11,
    compliancePassRate: 94,
    startDateSuccessRate: 91,
    since: "2021-03",
    notes: "Priority client. Healthcare-specific compliance requires additional documentation. Prefer email communications for compliance items.",
  },

  {
    id: "northwind-logistics",
    name: "Northwind Logistics",
    industry: "Logistics & Supply Chain",
    hq: "Chicago, IL",
    accountManager: "Aaron Flores",
    programs: ["Tech Staff", "Operations"],
    msp: "Fieldglass",
    employmentTypesAllowed: ["W-2", "C2C"],
    status: "at-risk",
    rules: [
      { id: "nw-bgc", label: "Background Check (5-yr)", category: "background", required: true },
      { id: "nw-drug", label: "5-Panel Drug Screen", category: "drug", required: true },
      { id: "nw-nda", label: "Northwind Confidentiality Agreement", category: "document", required: true },
      { id: "nw-i9", label: "I-9 / E-Verify", category: "document", required: true },
      { id: "nw-vms", label: "Fieldglass Worker Profile", category: "document", required: true },
      { id: "nw-safety", label: "DOT Safety Training", category: "training", required: true, condition: "Operations roles" },
    ],
    contacts: [
      { name: "Patrick Cole", title: "Director of Staffing", email: "p.cole@northwindlog.com", phone: "+1 (312) 555-0088", type: "primary" },
      { name: "Jess Obi", title: "Procurement", email: "j.obi@northwindlog.com", type: "billing" },
    ],
    promises: [
      { label: "Start date (Owen Bradley)", promisedDate: "Jun 13", status: "missed" },
      { label: "Background clearance (Marcus Webb)", promisedDate: "Jun 15", status: "at-risk" },
    ],
    invoiceFrequency: "Bi-weekly",
    paymentTermsDays: 45,
    vmsPlatform: "SAP Fieldglass",
    workerIdPrefix: "NW-",
    activeConsultants: 9,
    avgOnboardingDays: 15,
    compliancePassRate: 81,
    startDateSuccessRate: 76,
    since: "2022-07",
    notes: "Uses Fieldglass for all VMS approvals. Start dates frequently slip due to client approval cycle — monitor closely.",
  },

  {
    id: "vertex-financial",
    name: "Vertex Financial",
    industry: "Financial Services",
    hq: "New York, NY",
    accountManager: "Devon Hughes",
    programs: ["Finance & Accounting", "Risk & Compliance", "Data"],
    msp: undefined,
    employmentTypesAllowed: ["W-2"],
    status: "active",
    rules: [
      { id: "vf-bgc", label: "Background Check (10-yr + credit)", category: "background", required: true },
      { id: "vf-drug", label: "10-Panel Drug Screen", category: "drug", required: true },
      { id: "vf-nda", label: "Vertex NDA + IP Agreement", category: "document", required: true },
      { id: "vf-i9", label: "I-9 / E-Verify", category: "document", required: true },
      { id: "vf-finra", label: "FINRA Disclosure Review", category: "document", required: true, condition: "Finance roles" },
      { id: "vf-sec", label: "Information Security Policy", category: "security", required: true },
      { id: "vf-aml", label: "AML & BSA Training", category: "training", required: true, condition: "Finance roles" },
      { id: "vf-insider", label: "Insider Trading Policy Acknowledgment", category: "document", required: true },
    ],
    contacts: [
      { name: "Rachel Torres", title: "Chief of Staff", email: "r.torres@vertexfinancial.com", phone: "+1 (212) 555-0200", type: "primary" },
      { name: "Mike Denn", title: "Finance Ops", email: "m.denn@vertexfinancial.com", type: "billing" },
      { name: "Amy Park", title: "HR Business Partner", email: "a.park@vertexfinancial.com", type: "hr" },
    ],
    promises: [
      { label: "Background clearance (Aisha Bello)", promisedDate: "Jun 20", status: "on-track" },
      { label: "System access (Noah Klein)", promisedDate: "Jun 22", status: "on-track" },
    ],
    invoiceFrequency: "Monthly",
    paymentTermsDays: 30,
    workerIdPrefix: "VF-",
    activeConsultants: 14,
    avgOnboardingDays: 17,
    compliancePassRate: 97,
    startDateSuccessRate: 95,
    since: "2020-01",
    notes: "Most rigorous compliance requirements in our portfolio — credit check + FINRA on top of standard BGC. Allow 17+ days for onboarding.",
  },

  {
    id: "atlas-manufacturing",
    name: "Atlas Manufacturing",
    industry: "Manufacturing",
    hq: "Detroit, MI",
    accountManager: "Lena Ortiz",
    programs: ["Engineering", "Operations", "IT"],
    msp: "Beeline",
    employmentTypesAllowed: ["W-2", "1099", "C2C"],
    status: "active",
    rules: [
      { id: "am-bgc", label: "Background Check (7-yr)", category: "background", required: true },
      { id: "am-drug", label: "5-Panel Drug Screen", category: "drug", required: true },
      { id: "am-nda", label: "Atlas NDA", category: "document", required: true },
      { id: "am-i9", label: "I-9 / E-Verify", category: "document", required: true },
      { id: "am-beeline", label: "Beeline Worker Profile", category: "document", required: true },
      { id: "am-safety", label: "OSHA Safety Training", category: "training", required: true, condition: "On-site roles" },
      { id: "am-iso", label: "ISO 9001 Awareness", category: "training", required: false },
      { id: "am-ins", label: "General Liability Certificate (C2C)", category: "insurance", required: true, condition: "C2C only" },
    ],
    contacts: [
      { name: "Greg Hanson", title: "Workforce Manager", email: "g.hanson@atlasmfg.com", phone: "+1 (313) 555-0155", type: "primary" },
      { name: "Diane Wu", title: "AP Specialist", email: "d.wu@atlasmfg.com", type: "billing" },
    ],
    promises: [
      { label: "Equipment delivery (Sofia Marin)", promisedDate: "Jun 20", status: "on-track" },
      { label: "Payroll setup (Sofia Marin)", promisedDate: "Jun 18", status: "at-risk" },
    ],
    invoiceFrequency: "Weekly",
    paymentTermsDays: 45,
    vmsPlatform: "Beeline",
    workerIdPrefix: "AM-",
    activeConsultants: 21,
    avgOnboardingDays: 12,
    compliancePassRate: 89,
    startDateSuccessRate: 88,
    since: "2019-11",
    notes: "Largest account by headcount. C2C placements require liability certificate — remind vendor partners on Day 0.",
  },

  {
    id: "cobalt-systems",
    name: "Cobalt Systems",
    industry: "Technology",
    hq: "Austin, TX",
    accountManager: "Aaron Flores",
    programs: ["Engineering", "Cloud & DevOps", "Product"],
    msp: undefined,
    employmentTypesAllowed: ["W-2", "C2C"],
    status: "active",
    rules: [
      { id: "cs-bgc", label: "Background Check (7-yr)", category: "background", required: true },
      { id: "cs-drug", label: "5-Panel Drug Screen", category: "drug", required: false },
      { id: "cs-nda", label: "Cobalt IP & Confidentiality Agreement", category: "document", required: true },
      { id: "cs-i9", label: "I-9 / E-Verify", category: "document", required: true },
      { id: "cs-sec", label: "Acceptable Use Policy", category: "security", required: true },
      { id: "cs-cloud", label: "Cloud Security Training", category: "training", required: true, condition: "DevOps/Cloud roles" },
      { id: "cs-ins", label: "E&O + General Liability (C2C)", category: "insurance", required: true, condition: "C2C only" },
    ],
    contacts: [
      { name: "Naomi Reyes", title: "Head of Talent Ops", email: "n.reyes@cobalt.systems", phone: "+1 (512) 555-0320", type: "primary" },
      { name: "Ben Fisher", title: "Finance", email: "b.fisher@cobalt.systems", type: "billing" },
      { name: "Preet Singh", title: "IT Manager", email: "p.singh@cobalt.systems", type: "technical" },
    ],
    promises: [
      { label: "Credential setup (Ravi Menon)", promisedDate: "Jun 17", status: "at-risk" },
      { label: "Background clearance (Diego Santos)", promisedDate: "Jun 19", status: "on-track" },
    ],
    invoiceFrequency: "Bi-weekly",
    paymentTermsDays: 30,
    workerIdPrefix: "CS-",
    activeConsultants: 12,
    avgOnboardingDays: 10,
    compliancePassRate: 92,
    startDateSuccessRate: 90,
    since: "2022-03",
    notes: "Fast-moving tech client. Shorter onboarding window typical — target 10 days. Drug test is optional at client discretion.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getClient(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id);
}

/** Active onboardings for a given client (from CANDIDATES). */
export function clientCandidates(clientId: string) {
  const client = getClient(clientId);
  if (!client) return [];
  return CANDIDATES.filter((c) => c.client === client.name);
}

/** Portfolio-level stats for the list page. */
export function clientPortfolioStats() {
  const totalOnboardings = CANDIDATES.length;
  const atRiskClients = CLIENTS.filter((c) => c.status === "at-risk").length;
  const avgComplianceRate = Math.round(
    CLIENTS.reduce((s, c) => s + c.compliancePassRate, 0) / CLIENTS.length,
  );
  const avgStartSuccess = Math.round(
    CLIENTS.reduce((s, c) => s + c.startDateSuccessRate, 0) / CLIENTS.length,
  );
  return { totalOnboardings, atRiskClients, avgComplianceRate, avgStartSuccess };
}

export const RULE_CATEGORY_META: Record<
  ComplianceRule["category"],
  { label: string; color: string }
> = {
  background: { label: "Background", color: "bg-warning/15 text-warning-foreground" },
  drug: { label: "Drug Screen", color: "bg-info/15 text-info-foreground" },
  document: { label: "Document", color: "bg-neutral/20 text-foreground" },
  training: { label: "Training", color: "bg-success/15 text-success-foreground" },
  insurance: { label: "Insurance", color: "bg-danger/15 text-danger-foreground" },
  security: { label: "Security", color: "bg-ai/15 text-ai-foreground" },
};

export const CLIENT_STATUS_META: Record<
  ClientStatus,
  { label: string; tone: string }
> = {
  active: { label: "Active", tone: "success" },
  "at-risk": { label: "At Risk", tone: "danger" },
  "on-hold": { label: "On Hold", tone: "neutral" },
};

export const PROMISE_STATUS_META: Record<
  ClientPromise["status"],
  { label: string; className: string }
> = {
  "on-track": { label: "On track", className: "text-success-muted-foreground" },
  "at-risk": { label: "At risk", className: "text-warning-muted-foreground" },
  missed: { label: "Missed", className: "text-danger-muted-foreground" },
  delivered: { label: "Delivered", className: "text-muted-foreground line-through" },
};
