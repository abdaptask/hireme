/**
 * Candidate Portal mock data (§5.2, §101). Deterministic; replaced by real
 * candidate records in v0.2 (see docs/ROADMAP.md).
 */
import type { StatusTone } from "@/lib/types";

export type StageState = "completed" | "current" | "upcoming";

export type PortalStage = {
  id: string;
  label: string;
  state: StageState;
};

export type PortalTaskStatus =
  | "completed"
  | "pending"
  | "in-review"
  | "rejected";

export type PortalTask = {
  id: string;
  title: string;
  why: string;
  estimate: string;
  due: string;
  status: PortalTaskStatus;
  /** Present when status === "rejected": why it was rejected + what to do. */
  rejectionReason?: string;
};

export type Day1Item = {
  id: string;
  label: string;
  tone: StatusTone;
  status: string;
};

export const CANDIDATE = {
  firstName: "Sarah",
  fullName: "Sarah Chen",
  role: "Senior Data Analyst",
  client: "Meridian Health",
  employmentType: "W-2",
  location: "Remote · Austin, TX",
  startDateLabel: "Mon, Jun 15",
  startInDays: 8,
  progress: 38, // overall completion %
  currentStage: "Document Submission",
  estimatedCompletion: "~25 min of tasks remaining",
  recruiter: { name: "Devon Hughes", role: "Recruiter" },
  onboarder: { name: "Riya Kim", role: "Onboarding Specialist" },
};

/** §5.2 multi-stage timeline. */
export const PORTAL_STAGES: PortalStage[] = [
  { id: "profile", label: "Profile Setup", state: "completed" },
  { id: "documents", label: "Document Submission", state: "current" },
  { id: "background", label: "Background Check", state: "upcoming" },
  { id: "tax", label: "Tax & Payroll", state: "upcoming" },
  { id: "client", label: "Client Requirements", state: "upcoming" },
  { id: "it", label: "IT Provisioning", state: "upcoming" },
  { id: "training", label: "Training", state: "upcoming" },
  { id: "day1", label: "Day 1 Preparation", state: "upcoming" },
];

/** §41.1 Next Best Action. */
export const NEXT_BEST_ACTION = {
  title: "Re-upload your government ID",
  detail:
    "Your previous upload was too blurry to read the expiration date. A clear photo takes about a minute.",
  cta: "Re-upload ID",
};

/** §101.2 / §52.2 task flow. */
export const PORTAL_TASKS: PortalTask[] = [
  {
    id: "id-upload",
    title: "Upload government ID",
    why: "Confirms your identity for work authorization (I-9).",
    estimate: "1 min",
    due: "Due in 2 days",
    status: "rejected",
    rejectionReason:
      "The image was too blurry to read the expiration date. Please retake in good lighting and make sure all four corners are visible.",
  },
  {
    id: "i9",
    title: "Complete I-9 Section 1",
    why: "Federal requirement to verify employment eligibility.",
    estimate: "5 min",
    due: "Due in 2 days",
    status: "pending",
  },
  {
    id: "nda",
    title: "Sign Client NDA — Meridian Health",
    why: "Required by your client before access is granted.",
    estimate: "3 min",
    due: "Due in 3 days",
    status: "pending",
  },
  {
    id: "direct-deposit",
    title: "Set up direct deposit",
    why: "So your first paycheck arrives on time.",
    estimate: "4 min",
    due: "Due in 5 days",
    status: "pending",
  },
  {
    id: "w4",
    title: "Federal W-4",
    why: "Determines your federal tax withholding.",
    estimate: "5 min",
    due: "Submitted",
    status: "in-review",
  },
  {
    id: "consent",
    title: "Background check consent",
    why: "Authorizes your client-required screening.",
    estimate: "2 min",
    due: "Completed",
    status: "completed",
  },
  {
    id: "profile",
    title: "Profile & contact details",
    why: "Keeps your team able to reach you.",
    estimate: "3 min",
    due: "Completed",
    status: "completed",
  },
];

/** §5.2 / §101.4 Day 1 readiness checklist. */
export const DAY1_CHECKLIST: Day1Item[] = [
  { id: "client-approval", label: "Client approval", tone: "warning", status: "Pending" },
  { id: "payroll", label: "Payroll setup", tone: "warning", status: "Action needed" },
  { id: "equipment", label: "Equipment shipment", tone: "info", status: "Preparing" },
  { id: "training", label: "Orientation training", tone: "neutral", status: "Not started" },
  { id: "instructions", label: "Day 1 instructions", tone: "neutral", status: "Sent on Jun 12" },
];
