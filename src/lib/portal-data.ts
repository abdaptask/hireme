/**
 * Candidate Portal data (§5.2, §101, §28).
 * Mobile-first guided onboarding experience for "Sarah Chen".
 * Replaced by real candidate records once auth + sessions land (v0.3+).
 */
import type { StatusTone } from "@/lib/types";

export type StageState = "completed" | "current" | "upcoming";

export type PortalStage = {
  id: string;
  label: string;
  state: StageState;
  /** Tasks in this stage */
  total: number;
  done: number;
};

export type TaskGroup = "action-required" | "up-next" | "in-review" | "completed";

export type TaskCategory =
  | "identity"
  | "tax"
  | "legal"
  | "payroll"
  | "screening"
  | "training"
  | "profile";

export type PortalTaskStatus = "completed" | "pending" | "in-review" | "rejected";

export type PortalTask = {
  id: string;
  title: string;
  why: string;
  /** What happens after completing this */
  impact?: string;
  estimate: string;
  due: string;
  status: PortalTaskStatus;
  group: TaskGroup;
  category: TaskCategory;
  /** CTA button label when actionable */
  ctaLabel?: string;
  /** AI concierge tip shown on the task */
  aiHint?: string;
  /** Present when status === "rejected" */
  rejectionReason?: string;
  /** Step-by-step fix instructions */
  fixSteps?: string[];
};

export type Day1Item = {
  id: string;
  label: string;
  tone: StatusTone;
  status: string;
  icon: "check" | "warning" | "clock" | "pending";
};

export type CommItem = {
  id: string;
  from: string;
  role: string;
  message: string;
  time: string;
  type: "message" | "reminder" | "system" | "ai";
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  available: boolean;
};

// ─────────────────────────────────────────────────────────────
// CANDIDATE
// ─────────────────────────────────────────────────────────────

export const CANDIDATE = {
  firstName: "Sarah",
  fullName: "Sarah Chen",
  role: "Senior Data Analyst",
  client: "Meridian Health",
  employmentType: "W-2",
  location: "Remote · Austin, TX",
  startDateLabel: "Mon, Jun 15",
  startInDays: 8,
  progress: 38,
  currentStage: "Document Submission",
  estimatedCompletion: "~25 min of tasks remaining",
  recruiter: { name: "Devon Hughes", role: "Recruiter" },
  onboarder: { name: "Riya Kim", role: "Onboarding Specialist" },
};

// ─────────────────────────────────────────────────────────────
// STAGE TIMELINE (§5.2)
// ─────────────────────────────────────────────────────────────

export const PORTAL_STAGES: PortalStage[] = [
  { id: "profile",    label: "Profile Setup",       state: "completed", total: 2, done: 2 },
  { id: "documents",  label: "Document Submission",  state: "current",   total: 5, done: 2 },
  { id: "background", label: "Background Check",     state: "upcoming",  total: 1, done: 0 },
  { id: "tax",        label: "Tax & Payroll",        state: "upcoming",  total: 2, done: 0 },
  { id: "client",     label: "Client Requirements",  state: "upcoming",  total: 2, done: 0 },
  { id: "it",         label: "IT Provisioning",      state: "upcoming",  total: 3, done: 0 },
  { id: "training",   label: "Training",             state: "upcoming",  total: 2, done: 0 },
  { id: "day1",       label: "Day 1 Preparation",    state: "upcoming",  total: 1, done: 0 },
];

// ─────────────────────────────────────────────────────────────
// NEXT BEST ACTION (§41.1)
// ─────────────────────────────────────────────────────────────

export const NEXT_BEST_ACTION = {
  title: "Re-upload your government ID",
  detail:
    "Your previous upload was too blurry to read the expiration date. A clear photo takes about 1 minute.",
  cta: "Fix now",
  urgency: "critical" as const,
  taskId: "id-upload",
};

// ─────────────────────────────────────────────────────────────
// TASKS (§101.2, §52.2)
// ─────────────────────────────────────────────────────────────

export const PORTAL_TASKS: PortalTask[] = [
  {
    id: "id-upload",
    group: "action-required",
    category: "identity",
    title: "Upload government ID",
    why: "Confirms your identity and work authorization (required for I-9).",
    impact: "Unblocks your I-9 form and background check start.",
    estimate: "1 min",
    due: "Due Jun 9",
    status: "rejected",
    ctaLabel: "Re-upload ID",
    aiHint: "Tip: Place your ID on a dark, flat surface in natural light. Tap to focus before capturing.",
    rejectionReason:
      "Your photo was too blurry — the expiration date wasn't readable. Please retake in good lighting with all four corners visible.",
    fixSteps: [
      "Lay your ID flat on a dark, contrasting surface",
      "Use natural or bright overhead light — no shadows",
      "Hold your phone steady and tap the screen to focus",
      "Make sure all four corners are in frame",
      "File must be under 10 MB (JPG, PNG, or HEIC)",
    ],
  },
  {
    id: "i9",
    group: "up-next",
    category: "identity",
    title: "Complete I-9 Section 1",
    why: "Federal law requires every new hire to verify employment eligibility before Day 1.",
    impact: "Required before your start date is confirmed.",
    estimate: "5 min",
    due: "Due Jun 10",
    status: "pending",
    ctaLabel: "Start I-9",
    aiHint: "Tip: You'll need your Social Security Number and the legal name that appears on your ID.",
  },
  {
    id: "nda",
    group: "up-next",
    category: "legal",
    title: "Sign Client NDA — Meridian Health",
    why: "Required by your client before system access is provisioned.",
    impact: "Unlocks IT provisioning and client credentials.",
    estimate: "3 min",
    due: "Due Jun 11",
    status: "pending",
    ctaLabel: "Review & Sign",
    aiHint: "This is a standard mutual NDA. It covers confidentiality of patient data you may encounter in your role.",
  },
  {
    id: "direct-deposit",
    group: "up-next",
    category: "payroll",
    title: "Set up direct deposit",
    why: "Ensures your first paycheck is deposited on your pay date.",
    impact: "Payroll cannot be activated without banking information on file.",
    estimate: "4 min",
    due: "Due Jun 12",
    status: "pending",
    ctaLabel: "Add bank info",
    aiHint: "You'll need your bank's routing number (9 digits) and your account number from a check or your banking app.",
  },
  {
    id: "w4",
    group: "in-review",
    category: "tax",
    title: "Federal W-4",
    why: "Determines how much federal income tax is withheld from your paycheck.",
    impact: "Reviewed by your onboarding team — typically takes 1–2 business days.",
    estimate: "Already submitted",
    due: "Submitted Jun 5",
    status: "in-review",
  },
  {
    id: "consent",
    group: "completed",
    category: "screening",
    title: "Background check consent",
    why: "Authorizes the client-required background screening.",
    estimate: "2 min",
    due: "Completed Jun 4",
    status: "completed",
  },
  {
    id: "profile",
    group: "completed",
    category: "profile",
    title: "Profile & contact details",
    why: "Keeps your team able to reach you.",
    estimate: "3 min",
    due: "Completed Jun 3",
    status: "completed",
  },
];

// ─────────────────────────────────────────────────────────────
// DAY 1 READINESS (§5.2, §101.4)
// ─────────────────────────────────────────────────────────────

export const DAY1_CHECKLIST: Day1Item[] = [
  { id: "client-approval", label: "Client approval",      tone: "warning", status: "Pending",       icon: "warning" },
  { id: "payroll",         label: "Payroll setup",        tone: "warning", status: "Action needed", icon: "warning" },
  { id: "screening",       label: "Background check",     tone: "info",    status: "In progress",   icon: "clock"   },
  { id: "equipment",       label: "Equipment shipment",   tone: "neutral", status: "Preparing",     icon: "pending" },
  { id: "training",        label: "Orientation training", tone: "neutral", status: "Not started",   icon: "pending" },
];

// ─────────────────────────────────────────────────────────────
// TEAM CONTACTS
// ─────────────────────────────────────────────────────────────

export const TEAM: TeamMember[] = [
  {
    id: "recruiter",
    name: "Devon Hughes",
    role: "Recruiter",
    email: "d.hughes@aptask.com",
    initials: "DH",
    available: true,
  },
  {
    id: "onboarder",
    name: "Riya Kim",
    role: "Onboarding Specialist",
    email: "r.kim@aptask.com",
    initials: "RK",
    available: true,
  },
];

// ─────────────────────────────────────────────────────────────
// COMMUNICATIONS (§24, §63)
// ─────────────────────────────────────────────────────────────

export const COMMS: CommItem[] = [
  {
    id: "c3",
    from: "AI Concierge",
    role: "automated",
    type: "reminder",
    message: "Hi Sarah — your government ID still needs to be re-uploaded. Start date is 8 days away. Tap here to fix it now.",
    time: "Today, 9:02 AM",
  },
  {
    id: "c2",
    from: "Riya Kim",
    role: "Onboarding Specialist",
    type: "message",
    message: "Hi Sarah — I reviewed your W-4 and it looks great, I'll have it approved by end of day. Your ID was rejected due to blur, please re-upload when you get a chance.",
    time: "Jun 6, 3:14 PM",
  },
  {
    id: "c1",
    from: "System",
    role: "automated",
    type: "system",
    message: "Your onboarding package has been sent. You have 7 items to complete before June 15. Log in to your portal to get started.",
    time: "Jun 3, 8:00 AM",
  },
];

// ─────────────────────────────────────────────────────────────
// AI CONCIERGE SUGGESTED QUESTIONS
// ─────────────────────────────────────────────────────────────

export const AI_SUGGESTED_QUESTIONS = [
  "What do I need for the I-9 form?",
  "Why was my ID rejected?",
  "When will my equipment arrive?",
  "How do benefits work for this role?",
];
