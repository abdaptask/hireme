/**
 * Audit Center data (CLAUDE.md §26, §66).
 * Every important action, override, AI event, and permission change is recorded.
 */
import type { StatusTone } from "@/lib/types";
import { daysFromNow, now } from "@/lib/clock";

/** Build an audit timestamp string at `HH:MM:SS` today (locale-independent ISO-like). */
function todayAt(hour: number, minute: number, second: number): string {
  const d = now();
  d.setHours(hour, minute, second, 0);
  return formatAuditTimestamp(d);
}

/** Format a Date as `YYYY-MM-DD HH:MM:SS` using local time. */
function formatAuditTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** ISO date string (`YYYY-MM-DD`) for a day offset from today. */
function isoDayOffset(offsetDays: number): string {
  const d = daysFromNow(offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type AuditEventType =
  | "login"
  | "record-view"
  | "record-edit"
  | "approval"
  | "override"
  | "ai-action"
  | "export"
  | "permission-change"
  | "document-download"
  | "integration-event";

export type AuditEvent = {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  actor: string;
  actorRole: string;
  target: string;
  targetType: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  aiInvolved: boolean;
  severity: "info" | "warning" | "critical";
  notes?: string;
};

export const EVENT_TYPE_META: Record<
  AuditEventType,
  { label: string; tone: StatusTone }
> = {
  login: { label: "Login", tone: "neutral" },
  "record-view": { label: "Record View", tone: "neutral" },
  "record-edit": { label: "Record Edit", tone: "info" },
  approval: { label: "Approval", tone: "success" },
  override: { label: "Override", tone: "warning" },
  "ai-action": { label: "AI Action", tone: "ai" },
  export: { label: "Export", tone: "warning" },
  "permission-change": { label: "Permission Change", tone: "danger" },
  "document-download": { label: "Document Download", tone: "info" },
  "integration-event": { label: "Integration Event", tone: "info" },
};

export const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "aud-0001",
    timestamp: todayAt(8, 1, 14),
    eventType: "login",
    actor: "Riya Kim",
    actorRole: "Onboarder",
    target: "HireMe Platform",
    targetType: "System",
    action: "Logged in",
    ipAddress: "192.168.1.42",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0002",
    timestamp: todayAt(8, 5, 22),
    eventType: "record-view",
    actor: "Riya Kim",
    actorRole: "Onboarder",
    target: "James Rivera / Candidate 360",
    targetType: "Candidate",
    action: "Viewed candidate record",
    ipAddress: "192.168.1.42",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0003",
    timestamp: todayAt(8, 12, 47),
    eventType: "approval",
    actor: "Riya Kim",
    actorRole: "Onboarder",
    target: "James Rivera / Package — Meridian Health W-2",
    targetType: "Package",
    action: "Approved onboarding package",
    ipAddress: "192.168.1.42",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0004",
    timestamp: todayAt(8, 23, 11),
    eventType: "override",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Owen Bradley / Start Date",
    targetType: "Assignment",
    action: "Overrode start date",
    previousValue: isoDayOffset(2),
    newValue: isoDayOffset(9),
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "warning",
    notes: "Client Northwind requested one-week delay for site readiness",
  },
  {
    id: "aud-0005",
    timestamp: todayAt(8, 31, 5),
    eventType: "ai-action",
    actor: "AI Copilot",
    actorRole: "System",
    target: "James Rivera / Document — Government ID",
    targetType: "Document",
    action: "Flagged document quality issue",
    ipAddress: "internal",
    aiInvolved: true,
    severity: "info",
    notes: "Confidence 0.94 — blur detected on expiration date region",
  },
  {
    id: "aud-0006",
    timestamp: todayAt(8, 45, 30),
    eventType: "record-edit",
    actor: "Sasha Patel",
    actorRole: "Recruiter",
    target: "Aisha Bello / Pay Rate",
    targetType: "Assignment",
    action: "Edited pay rate",
    previousValue: "$72/hr",
    newValue: "$78/hr",
    ipAddress: "192.168.2.10",
    aiInvolved: false,
    severity: "warning",
    notes: "Rate corrected to match signed offer letter",
  },
  {
    id: "aud-0007",
    timestamp: todayAt(9, 2, 18),
    eventType: "export",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Global Onboarding Pipeline Report",
    targetType: "Report",
    action: "Exported report to CSV",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "warning",
    notes: "Export included 47 candidate records",
  },
  {
    id: "aud-0008",
    timestamp: todayAt(9, 15, 44),
    eventType: "permission-change",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Riya Kim / Role Assignment",
    targetType: "User",
    action: "Promoted to Senior Onboarder",
    previousValue: "Onboarder",
    newValue: "Senior Onboarder",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "critical",
    notes: "Expanded access includes package publication rights",
  },
  {
    id: "aud-0009",
    timestamp: todayAt(9, 28, 0),
    eventType: "document-download",
    actor: "Sasha Patel",
    actorRole: "Recruiter",
    target: "Marcus Webb / Signed NDA",
    targetType: "Document",
    action: "Downloaded signed document",
    ipAddress: "192.168.2.10",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0010",
    timestamp: todayAt(9, 44, 12),
    eventType: "integration-event",
    actor: "System",
    actorRole: "Integration",
    target: "ADP Payroll / Marcus Webb Worker Sync",
    targetType: "Integration",
    action: "Sync failed — HTTP 500",
    ipAddress: "internal",
    aiInvolved: false,
    severity: "critical",
    notes: "Dead-letter queued; retry #3 pending",
  },
  {
    id: "aud-0011",
    timestamp: todayAt(10, 0, 55),
    eventType: "ai-action",
    actor: "AI Copilot",
    actorRole: "System",
    target: "Morning Briefing — All Onboarders",
    targetType: "Report",
    action: "Generated AI morning briefing",
    ipAddress: "internal",
    aiInvolved: true,
    severity: "info",
    notes: "Summarized 18 active onboardings; flagged 4 at-risk starts",
  },
  {
    id: "aud-0012",
    timestamp: todayAt(10, 14, 33),
    eventType: "approval",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Compliance Waiver / Marcus Webb / Drug Screen",
    targetType: "Compliance",
    action: "Approved compliance waiver",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "warning",
    notes: "Waiver granted: client confirmed drug screen not required for remote role",
  },
  {
    id: "aud-0013",
    timestamp: todayAt(10, 30, 0),
    eventType: "override",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Noah Klein / Screening Status",
    targetType: "Screening",
    action: "Manually cleared screening status",
    previousValue: "In Progress",
    newValue: "Cleared — Manual Override",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "critical",
    notes: "Vendor confirmed clear result verbally; written confirmation pending",
  },
  {
    id: "aud-0014",
    timestamp: todayAt(10, 47, 22),
    eventType: "record-edit",
    actor: "Riya Kim",
    actorRole: "Onboarder",
    target: "Sarah Chen / Start Date",
    targetType: "Assignment",
    action: "Updated start date",
    previousValue: isoDayOffset(3),
    newValue: isoDayOffset(5),
    ipAddress: "192.168.1.42",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0015",
    timestamp: todayAt(11, 2, 9),
    eventType: "ai-action",
    actor: "AI Copilot",
    actorRole: "System",
    target: "Diego Santos / Nudge Sequence",
    targetType: "Communication",
    action: "Escalated nudge to level 4",
    ipAddress: "internal",
    aiInvolved: true,
    severity: "warning",
    notes: "No response to portal + email + SMS after 72h — recruiter task created",
  },
  {
    id: "aud-0016",
    timestamp: todayAt(11, 20, 45),
    eventType: "record-view",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Aisha Bello / Screening Adjudication",
    targetType: "Screening",
    action: "Viewed adjudication record",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "info",
    notes: "Accessed restricted screening detail — logged per policy",
  },
  {
    id: "aud-0017",
    timestamp: todayAt(11, 38, 0),
    eventType: "integration-event",
    actor: "System",
    actorRole: "Integration",
    target: "Bullhorn ATS / Ravi Menon Candidate Sync",
    targetType: "Integration",
    action: "Candidate record synced successfully",
    ipAddress: "internal",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0018",
    timestamp: todayAt(11, 55, 14),
    eventType: "permission-change",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Sasha Patel / Client Access",
    targetType: "User",
    action: "Revoked access to Meridian Health records",
    previousValue: "Meridian Health — Full Access",
    newValue: "Apex Financial, Northwind Logistics, SkyBridge Tech",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "critical",
    notes: "Client reassignment per account manager change",
  },
  {
    id: "aud-0019",
    timestamp: todayAt(12, 10, 30),
    eventType: "document-download",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Grace Okafor / Audit Compliance Packet",
    targetType: "Document",
    action: "Downloaded audit evidence packet",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "warning",
    notes: "Requested by client Meridian Health for external audit",
  },
  {
    id: "aud-0020",
    timestamp: todayAt(12, 30, 0),
    eventType: "approval",
    actor: "Riya Kim",
    actorRole: "Onboarder",
    target: "Sofia Marin / Document — Apex NDA v2.1",
    targetType: "Document",
    action: "Approved submitted document",
    ipAddress: "192.168.1.42",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0021",
    timestamp: todayAt(13, 5, 17),
    eventType: "ai-action",
    actor: "AI Copilot",
    actorRole: "System",
    target: "Tara Voss / Package Risk Analysis",
    targetType: "Package",
    action: "Detected duplicate form submission",
    ipAddress: "internal",
    aiInvolved: true,
    severity: "warning",
    notes: "W-4 submitted twice with conflicting allowance counts — flagged for review",
  },
  {
    id: "aud-0022",
    timestamp: todayAt(13, 22, 48),
    eventType: "record-edit",
    actor: "Sasha Patel",
    actorRole: "Recruiter",
    target: "Fatima Idris / Employment Type",
    targetType: "Assignment",
    action: "Changed employment type",
    previousValue: "1099",
    newValue: "W-2",
    ipAddress: "192.168.2.10",
    aiInvolved: false,
    severity: "critical",
    notes: "Correction after client confirmed W-2 engagement; package must be regenerated",
  },
  {
    id: "aud-0023",
    timestamp: todayAt(13, 45, 0),
    eventType: "integration-event",
    actor: "System",
    actorRole: "Integration",
    target: "HireRight / Priya Sharma Screening Order",
    targetType: "Integration",
    action: "Screening order placed successfully",
    ipAddress: "internal",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0024",
    timestamp: todayAt(14, 1, 33),
    eventType: "export",
    actor: "Sasha Patel",
    actorRole: "Recruiter",
    target: "Recruiter Performance Scorecard",
    targetType: "Report",
    action: "Exported report to Excel",
    ipAddress: "192.168.2.10",
    aiInvolved: false,
    severity: "info",
  },
  {
    id: "aud-0025",
    timestamp: todayAt(14, 23, 11),
    eventType: "override",
    actor: "Jordan Lee",
    actorRole: "Super Admin",
    target: "Priya Sharma / Required Document Waiver — Drug Screen",
    targetType: "Compliance",
    action: "Granted emergency requirement waiver",
    previousValue: "Required — Pending",
    newValue: "Waived — Emergency Override",
    ipAddress: "10.0.0.5",
    aiInvolved: false,
    severity: "critical",
    notes: `Approved by VP Operations; expiration ${isoDayOffset(14)}; audit evidence attached`,
  },
];

export function auditStats(): {
  total: number;
  critical: number;
  aiActions: number;
  overrides: number;
} {
  const total = AUDIT_EVENTS.length;
  const critical = AUDIT_EVENTS.filter((e) => e.severity === "critical").length;
  const aiActions = AUDIT_EVENTS.filter((e) => e.aiInvolved).length;
  const overrides = AUDIT_EVENTS.filter((e) => e.eventType === "override").length;
  return { total, critical, aiActions, overrides };
}
