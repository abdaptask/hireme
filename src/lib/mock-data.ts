/**
 * Deterministic mock data for the v0.1 foundation slice. Replaced by real
 * persistence in v0.2 (see docs/ROADMAP.md). No Date.now()/random — values are
 * fixed so the UI renders identically every load.
 */
import type { PipelineStatus, RiskLevel, StatusTone } from "@/lib/types";

export type Vital = {
  id: string;
  label: string;
  value: number;
  /** Period-over-period delta; sign drives the trend arrow. */
  delta: number;
  /** "up is good" or "down is good" — controls delta coloring. */
  goodDirection: "up" | "down";
  tone: StatusTone;
  href: string;
};

/** §7.1 First Row — Operational Vitals. */
export const VITALS: Vital[] = [
  { id: "onb-week", label: "Onboarding This Week", value: 47, delta: 6, goodDirection: "up", tone: "info", href: "/planned/onboarding" },
  { id: "onb-month", label: "Onboarding This Month", value: 183, delta: 12, goodDirection: "up", tone: "info", href: "/planned/onboarding" },
  { id: "starts-week", label: "Starts This Week", value: 22, delta: 3, goodDirection: "up", tone: "success", href: "/planned/onboarding" },
  { id: "starts-month", label: "Starts This Month", value: 89, delta: -4, goodDirection: "up", tone: "success", href: "/planned/onboarding" },
  { id: "drop-week", label: "Drop-Offs This Week", value: 3, delta: 1, goodDirection: "down", tone: "danger", href: "/planned/reports" },
  { id: "drop-month", label: "Drop-Offs This Month", value: 11, delta: -2, goodDirection: "down", tone: "warning", href: "/planned/reports" },
  { id: "at-risk", label: "Start Dates At Risk", value: 8, delta: 2, goodDirection: "down", tone: "danger", href: "/planned/exceptions" },
  { id: "sla", label: "SLA Breaches", value: 5, delta: -1, goodDirection: "down", tone: "warning", href: "/planned/exceptions" },
  { id: "bgc", label: "Background Checks Delayed", value: 7, delta: 0, goodDirection: "down", tone: "warning", href: "/planned/screening" },
  { id: "payroll", label: "Payroll Not Ready", value: 6, delta: -3, goodDirection: "down", tone: "warning", href: "/planned/payroll" },
  { id: "billing", label: "Billing Not Ready", value: 4, delta: -1, goodDirection: "down", tone: "warning", href: "/planned/billing" },
  { id: "equipment", label: "Equipment Delayed", value: 3, delta: 1, goodDirection: "down", tone: "neutral", href: "/planned/equipment" },
];

export type StageCount = { stage: string; count: number };

/** §5.2 stages — Pipeline by Stage. */
export const PIPELINE_BY_STAGE: StageCount[] = [
  { stage: "Profile Setup", count: 41 },
  { stage: "Document Submission", count: 38 },
  { stage: "Background Check", count: 29 },
  { stage: "Tax & Payroll", count: 24 },
  { stage: "Client Requirements", count: 19 },
  { stage: "IT Provisioning", count: 15 },
  { stage: "Training", count: 11 },
  { stage: "Day 1 Preparation", count: 6 },
];

export type Confidence = { level: RiskLevel; label: string; count: number; tone: StatusTone };

/** §33 — Start-Date Confidence Distribution. */
export const CONFIDENCE_DISTRIBUTION: Confidence[] = [
  { level: "on-track", label: "On Track", count: 62, tone: "success" },
  { level: "needs-attention", label: "Needs Attention", count: 18, tone: "warning" },
  { level: "at-risk", label: "At Risk", count: 8, tone: "danger" },
  { level: "unlikely", label: "Start Unlikely", count: 4, tone: "danger" },
];

/** Drop-off trend (last 8 weeks). */
export const DROPOFF_TREND: number[] = [5, 4, 6, 3, 4, 2, 4, 3];

export type RankRow = { name: string; value: number; unit?: string };

/** §7.2 — Client bottleneck ranking (avg days stalled). */
export const CLIENT_BOTTLENECKS: RankRow[] = [
  { name: "Meridian Health", value: 6.8, unit: "d" },
  { name: "Vertex Financial", value: 5.1, unit: "d" },
  { name: "Northwind Logistics", value: 4.3, unit: "d" },
  { name: "Atlas Manufacturing", value: 3.6, unit: "d" },
  { name: "Cobalt Systems", value: 2.9, unit: "d" },
];

/** §7.2 — Vendor turnaround ranking (avg days). */
export const VENDOR_TURNAROUND: RankRow[] = [
  { name: "HireRight", value: 3.2, unit: "d" },
  { name: "Sterling", value: 4.0, unit: "d" },
  { name: "Checkr", value: 2.6, unit: "d" },
  { name: "First Advantage", value: 4.8, unit: "d" },
  { name: "Accurate", value: 3.5, unit: "d" },
];

export type OpsTile = {
  id: string;
  label: string;
  value: number;
  tone: StatusTone;
  href: string;
};

/** §7 Third Row — Package & Exception Operations. */
export const OPS_TILES: OpsTile[] = [
  { id: "assembly", label: "Package Assembly Queue", value: 14, tone: "info", href: "/planned/packages" },
  { id: "pkg-exc", label: "Package Exceptions", value: 6, tone: "danger", href: "/planned/exceptions" },
  { id: "approval", label: "Awaiting Approval", value: 9, tone: "warning", href: "/planned/packages" },
  { id: "failed-int", label: "Failed Integrations", value: 3, tone: "danger", href: "/planned/integrations" },
  { id: "ai-rec", label: "AI Recommendations", value: 12, tone: "ai", href: "/planned/reports" },
  { id: "rule-conflict", label: "Compliance Rule Conflicts", value: 2, tone: "warning", href: "/planned/compliance" },
];

export type EngagementItem = { name: string; detail: string };

/** §7 Fourth Row — Culture & Engagement. */
export const BIRTHDAYS: EngagementItem[] = [
  { name: "Sarah Chen", detail: "Candidate · today" },
  { name: "Marcus Webb", detail: "Consultant · tomorrow" },
  { name: "Priya Nair", detail: "Internal · in 2 days" },
];

export const ANNIVERSARIES: EngagementItem[] = [
  { name: "Devon Hughes", detail: "2 years · Meridian Health" },
  { name: "Lena Ortiz", detail: "1 year · Vertex Financial" },
];

export const MILESTONES: EngagementItem[] = [
  { name: "James Rivera", detail: "Day 1 in 3 days" },
  { name: "Aisha Bello", detail: "Day 30 survey due" },
];

export type FeedStatus =
  | { kind: "pipeline"; status: PipelineStatus }
  | { kind: "tone"; tone: StatusTone; label: string };

export type FeedEvent = {
  id: string;
  /** ISO-like display timestamp (fixed string). */
  time: string;
  eventType: string;
  candidate: string;
  client: string;
  stage: string;
  owner: string;
  status: FeedStatus;
  /** SLA descriptor + whether it's breached. */
  sla: { label: string; tone: StatusTone };
  integration: string;
  ai: boolean;
  actionRequired: string | null;
};

/** §7 Bottom — Granular Line-Item Feed (global system log). */
export const FEED_EVENTS: FeedEvent[] = [
  { id: "EVT-4821", time: "09:42:18", eventType: "Document Rejected", candidate: "James Rivera", client: "Meridian Health", stage: "Document Submission", owner: "D. Hughes", status: { kind: "pipeline", status: "needs-attention" }, sla: { label: "2h left", tone: "warning" }, integration: "Internal", ai: true, actionRequired: "Review rejected ID" },
  { id: "EVT-4820", time: "09:41:05", eventType: "Background Check Completed", candidate: "Aisha Bello", client: "Vertex Financial", stage: "Background Check", owner: "L. Ortiz", status: { kind: "pipeline", status: "on-track" }, sla: { label: "On time", tone: "success" }, integration: "HireRight", ai: false, actionRequired: null },
  { id: "EVT-4819", time: "09:38:52", eventType: "Integration Failure", candidate: "Marcus Webb", client: "Northwind Logistics", stage: "Tax & Payroll", owner: "System", status: { kind: "tone", tone: "danger", label: "Failed" }, sla: { label: "Breached", tone: "danger" }, integration: "ADP", ai: false, actionRequired: "Retry payroll sync" },
  { id: "EVT-4818", time: "09:35:21", eventType: "AI Recommendation", candidate: "Sarah Chen", client: "Atlas Manufacturing", stage: "Client Requirements", owner: "AI Copilot", status: { kind: "pipeline", status: "ai-pending" }, sla: { label: "—", tone: "neutral" }, integration: "Internal", ai: true, actionRequired: "Approve waiver suggestion" },
  { id: "EVT-4817", time: "09:31:44", eventType: "Package Dispatched", candidate: "Priya Nair", client: "Cobalt Systems", stage: "Profile Setup", owner: "R. Kim", status: { kind: "pipeline", status: "in-review" }, sla: { label: "5h left", tone: "info" }, integration: "SendGrid", ai: false, actionRequired: null },
  { id: "EVT-4816", time: "09:27:10", eventType: "Drug Screen Scheduled", candidate: "Tomás Vega", client: "Meridian Health", stage: "Background Check", owner: "L. Ortiz", status: { kind: "pipeline", status: "waiting-external" }, sla: { label: "1d left", tone: "neutral" }, integration: "Quest", ai: false, actionRequired: null },
  { id: "EVT-4815", time: "09:22:39", eventType: "Equipment Shipped", candidate: "Hannah Park", client: "Vertex Financial", stage: "IT Provisioning", owner: "IT Ops", status: { kind: "pipeline", status: "on-track" }, sla: { label: "On time", tone: "success" }, integration: "FedEx", ai: false, actionRequired: null },
  { id: "EVT-4814", time: "09:18:02", eventType: "Start Date At Risk", candidate: "Owen Bradley", client: "Northwind Logistics", stage: "Client Requirements", owner: "D. Hughes", status: { kind: "tone", tone: "danger", label: "At Risk" }, sla: { label: "Breached", tone: "danger" }, integration: "Internal", ai: true, actionRequired: "Escalate to AM" },
  { id: "EVT-4813", time: "09:14:55", eventType: "Tax Form Submitted", candidate: "Mei Lin", client: "Atlas Manufacturing", stage: "Tax & Payroll", owner: "R. Kim", status: { kind: "pipeline", status: "in-review" }, sla: { label: "3h left", tone: "info" }, integration: "Internal", ai: true, actionRequired: "Verify W-4" },
  { id: "EVT-4812", time: "09:09:31", eventType: "Client Approval", candidate: "Diego Santos", client: "Cobalt Systems", stage: "Client Requirements", owner: "A. Flores", status: { kind: "pipeline", status: "on-track" }, sla: { label: "On time", tone: "success" }, integration: "Fieldglass", ai: false, actionRequired: null },
  { id: "EVT-4811", time: "09:03:47", eventType: "Document Uploaded", candidate: "Grace Okafor", client: "Meridian Health", stage: "Document Submission", owner: "Candidate", status: { kind: "pipeline", status: "in-review" }, sla: { label: "6h left", tone: "info" }, integration: "Internal", ai: true, actionRequired: "AI quality check" },
  { id: "EVT-4810", time: "08:58:12", eventType: "Payroll Readiness Failed", candidate: "Noah Klein", client: "Vertex Financial", stage: "Tax & Payroll", owner: "System", status: { kind: "tone", tone: "warning", label: "Not Ready" }, sla: { label: "1d left", tone: "warning" }, integration: "ADP", ai: false, actionRequired: "Missing direct deposit" },
  { id: "EVT-4809", time: "08:52:40", eventType: "E-Signature Completed", candidate: "Yuki Tanaka", client: "Atlas Manufacturing", stage: "Document Submission", owner: "Candidate", status: { kind: "pipeline", status: "on-track" }, sla: { label: "On time", tone: "success" }, integration: "DocuSign", ai: false, actionRequired: null },
  { id: "EVT-4808", time: "08:47:19", eventType: "Background Check Ordered", candidate: "Ivan Petrov", client: "Northwind Logistics", stage: "Background Check", owner: "L. Ortiz", status: { kind: "pipeline", status: "waiting-external" }, sla: { label: "2d left", tone: "neutral" }, integration: "Sterling", ai: false, actionRequired: null },
  { id: "EVT-4807", time: "08:41:03", eventType: "Training Assigned", candidate: "Fatima Idris", client: "Cobalt Systems", stage: "Training", owner: "R. Kim", status: { kind: "pipeline", status: "on-track" }, sla: { label: "3d left", tone: "neutral" }, integration: "Cornerstone", ai: false, actionRequired: null },
  { id: "EVT-4806", time: "08:35:58", eventType: "Duplicate Profile Detected", candidate: "Carlos Mendez", client: "Meridian Health", stage: "Profile Setup", owner: "AI Copilot", status: { kind: "pipeline", status: "ai-pending" }, sla: { label: "—", tone: "neutral" }, integration: "Internal", ai: true, actionRequired: "Confirm merge" },
  { id: "EVT-4805", time: "08:30:22", eventType: "VPN Provisioned", candidate: "Elena Costa", client: "Vertex Financial", stage: "IT Provisioning", owner: "IT Ops", status: { kind: "pipeline", status: "on-track" }, sla: { label: "On time", tone: "success" }, integration: "Okta", ai: false, actionRequired: null },
  { id: "EVT-4804", time: "08:24:47", eventType: "Reminder Sent", candidate: "Liam Foster", client: "Atlas Manufacturing", stage: "Document Submission", owner: "AI Copilot", status: { kind: "pipeline", status: "waiting-external" }, sla: { label: "12h left", tone: "neutral" }, integration: "Twilio", ai: true, actionRequired: null },
  { id: "EVT-4803", time: "08:19:15", eventType: "Compliance Rule Conflict", candidate: "Zara Ahmed", client: "Northwind Logistics", stage: "Client Requirements", owner: "Compliance", status: { kind: "tone", tone: "warning", label: "Conflict" }, sla: { label: "1d left", tone: "warning" }, integration: "Internal", ai: true, actionRequired: "Resolve CA wage notice" },
  { id: "EVT-4802", time: "08:12:33", eventType: "Offer Accepted", candidate: "Ben Carter", client: "Cobalt Systems", stage: "Profile Setup", owner: "A. Flores", status: { kind: "pipeline", status: "on-track" }, sla: { label: "On time", tone: "success" }, integration: "Bullhorn", ai: false, actionRequired: null },
];
