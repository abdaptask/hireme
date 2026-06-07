/**
 * Training & Certification data (CLAUDE.md §37).
 * Tracks course assignments, completions, scores, and expiry across candidates.
 */
import type { StatusTone } from "@/lib/types";

export type TrainingStatus =
  | "assigned"
  | "started"
  | "completed"
  | "failed"
  | "overdue"
  | "waived";

export type TrainingRecord = {
  id: string;
  candidateId: string;
  candidateName: string;
  client: string;
  courseName: string;
  category: string;
  dueDate: string;
  completedDate?: string;
  status: TrainingStatus;
  score?: number;
  attempts: number;
  required: boolean;
  expiresDate?: string;
  lmsLink?: string;
};

export const TRAINING_STATUS_META: Record<
  TrainingStatus,
  { label: string; tone: StatusTone }
> = {
  assigned: { label: "Assigned", tone: "neutral" },
  started: { label: "In Progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  overdue: { label: "Overdue", tone: "danger" },
  waived: { label: "Waived", tone: "neutral" },
};

export const TRAINING_RECORDS: TrainingRecord[] = [
  {
    id: "tr-001",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    courseName: "HIPAA Essentials",
    category: "Compliance",
    dueDate: "2026-06-05",
    completedDate: "2026-06-03",
    status: "completed",
    score: 92,
    attempts: 1,
    required: true,
    expiresDate: "2027-06-03",
    lmsLink: "https://lms.example.com/hipaa-essentials",
  },
  {
    id: "tr-002",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    courseName: "Workplace Safety Fundamentals",
    category: "Safety",
    dueDate: "2026-06-08",
    status: "started",
    attempts: 1,
    required: true,
    lmsLink: "https://lms.example.com/safety-fundamentals",
  },
  {
    id: "tr-003",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Apex Financial",
    courseName: "Anti-Money Laundering (AML)",
    category: "Compliance",
    dueDate: "2026-06-04",
    completedDate: "2026-06-02",
    status: "completed",
    score: 87,
    attempts: 1,
    required: true,
    expiresDate: "2027-06-02",
    lmsLink: "https://lms.example.com/aml",
  },
  {
    id: "tr-004",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Apex Financial",
    courseName: "Data Privacy & GDPR",
    category: "Privacy",
    dueDate: "2026-06-04",
    completedDate: "2026-06-03",
    status: "completed",
    score: 95,
    attempts: 1,
    required: true,
    expiresDate: "2027-06-03",
    lmsLink: "https://lms.example.com/gdpr",
  },
  {
    id: "tr-005",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    courseName: "Forklift Safety Certification",
    category: "Safety",
    dueDate: "2026-05-30",
    status: "overdue",
    attempts: 0,
    required: true,
    lmsLink: "https://lms.example.com/forklift-safety",
  },
  {
    id: "tr-006",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    courseName: "Timekeeping & Expense Reporting",
    category: "Client Orientation",
    dueDate: "2026-06-07",
    completedDate: "2026-06-01",
    status: "completed",
    score: 100,
    attempts: 1,
    required: true,
    lmsLink: "https://lms.example.com/timekeeping",
  },
  {
    id: "tr-007",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "SkyBridge Tech",
    courseName: "Information Security Awareness",
    category: "Security",
    dueDate: "2026-06-06",
    completedDate: "2026-06-05",
    status: "completed",
    score: 91,
    attempts: 1,
    required: true,
    expiresDate: "2027-06-05",
    lmsLink: "https://lms.example.com/infosec",
  },
  {
    id: "tr-008",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "SkyBridge Tech",
    courseName: "Remote Work Policy",
    category: "Client Orientation",
    dueDate: "2026-06-06",
    completedDate: "2026-06-04",
    status: "completed",
    score: 100,
    attempts: 1,
    required: false,
    lmsLink: "https://lms.example.com/remote-work",
  },
  {
    id: "tr-009",
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Meridian Health",
    courseName: "Patient Privacy (HIPAA Advanced)",
    category: "Privacy",
    dueDate: "2026-06-03",
    completedDate: "2026-06-02",
    status: "completed",
    score: 88,
    attempts: 2,
    required: true,
    expiresDate: "2027-06-02",
    lmsLink: "https://lms.example.com/hipaa-advanced",
  },
  {
    id: "tr-010",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Apex Financial",
    courseName: "Anti-Harassment in the Workplace",
    category: "Compliance",
    dueDate: "2026-06-10",
    status: "assigned",
    attempts: 0,
    required: true,
    lmsLink: "https://lms.example.com/anti-harassment",
  },
  {
    id: "tr-011",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Apex Financial",
    courseName: "Apex Financial Client Orientation",
    category: "Client Orientation",
    dueDate: "2026-06-10",
    status: "assigned",
    attempts: 0,
    required: true,
    lmsLink: "https://lms.example.com/apex-orientation",
  },
  {
    id: "tr-012",
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Northwind Logistics",
    courseName: "Hazardous Materials Handling",
    category: "Safety",
    dueDate: "2026-05-28",
    status: "overdue",
    attempts: 1,
    required: true,
    lmsLink: "https://lms.example.com/hazmat",
  },
  {
    id: "tr-013",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "SkyBridge Tech",
    courseName: "Cloud Security Fundamentals",
    category: "Security",
    dueDate: "2026-06-12",
    status: "started",
    score: undefined,
    attempts: 1,
    required: true,
    lmsLink: "https://lms.example.com/cloud-security",
  },
  {
    id: "tr-014",
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    courseName: "Clinical Documentation Standards",
    category: "Compliance",
    dueDate: "2026-06-04",
    completedDate: "2026-06-03",
    status: "completed",
    score: 84,
    attempts: 1,
    required: true,
    expiresDate: "2027-06-03",
    lmsLink: "https://lms.example.com/clinical-docs",
  },
  {
    id: "tr-015",
    candidateId: "sofia-marin",
    candidateName: "Sofia Marin",
    client: "Apex Financial",
    courseName: "Regulatory Compliance — Finance",
    category: "Compliance",
    dueDate: "2026-06-06",
    completedDate: "2026-06-05",
    status: "completed",
    score: 90,
    attempts: 1,
    required: true,
    expiresDate: "2027-06-05",
    lmsLink: "https://lms.example.com/reg-finance",
  },
  {
    id: "tr-016",
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Northwind Logistics",
    courseName: "Warehouse Operations Safety",
    category: "Safety",
    dueDate: "2026-06-03",
    completedDate: "2026-06-02",
    status: "completed",
    score: 78,
    attempts: 2,
    required: true,
    expiresDate: "2027-06-02",
    lmsLink: "https://lms.example.com/warehouse-safety",
  },
  {
    id: "tr-017",
    candidateId: "fatima-idris",
    candidateName: "Fatima Idris",
    client: "SkyBridge Tech",
    courseName: "Acceptable Use Policy",
    category: "Security",
    dueDate: "2026-06-08",
    completedDate: "2026-06-06",
    status: "completed",
    score: 100,
    attempts: 1,
    required: true,
    lmsLink: "https://lms.example.com/aup",
  },
  {
    id: "tr-018",
    candidateId: "owen-bradley",
    candidateName: "Owen Bradley",
    client: "Northwind Logistics",
    courseName: "Fleet Vehicle Safety",
    category: "Safety",
    dueDate: "2026-05-25",
    status: "overdue",
    attempts: 1,
    required: true,
    lmsLink: "https://lms.example.com/fleet-safety",
  },
  {
    id: "tr-019",
    candidateId: "priya-sharma",
    candidateName: "Priya Sharma",
    client: "SkyBridge Tech",
    courseName: "DevSecOps Foundations",
    category: "Security",
    dueDate: "2026-06-14",
    status: "assigned",
    attempts: 0,
    required: true,
    lmsLink: "https://lms.example.com/devsecops",
  },
  {
    id: "tr-020",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "SkyBridge Tech",
    courseName: "Expense Submission Training",
    category: "Client Orientation",
    dueDate: "2026-06-10",
    completedDate: undefined,
    status: "failed",
    score: 58,
    attempts: 2,
    required: false,
    lmsLink: "https://lms.example.com/expense-submit",
  },
];

export function trainingStats(): {
  completed: number;
  inProgress: number;
  overdue: number;
  failed: number;
} {
  const completed = TRAINING_RECORDS.filter((r) => r.status === "completed").length;
  const inProgress = TRAINING_RECORDS.filter((r) =>
    ["assigned", "started"].includes(r.status),
  ).length;
  const overdue = TRAINING_RECORDS.filter((r) => r.status === "overdue").length;
  const failed = TRAINING_RECORDS.filter((r) => r.status === "failed").length;
  return { completed, inProgress, overdue, failed };
}
