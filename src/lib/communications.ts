/**
 * Communications Command Center data (CLAUDE.md §24).
 * Unified channel tracking: email, SMS, portal, voice — with nudge escalation
 * protocol (§13) and visibility controls.
 */
import type { StatusTone } from "@/lib/types";

export type CommChannel = "email" | "sms" | "portal" | "voice";
export type CommStatus =
  | "sent"
  | "delivered"
  | "opened"
  | "replied"
  | "bounced"
  | "failed"
  | "scheduled";
export type CommVisibility = "candidate" | "internal" | "client";

export type CommunicationRecord = {
  id: string;
  candidateId: string;
  candidateName: string;
  client: string;
  channel: CommChannel;
  subject: string;
  templateName?: string;
  status: CommStatus;
  sentAt?: string;
  scheduledFor?: string;
  openedAt?: string;
  sentBy: string;
  visibility: CommVisibility;
  isNudge: boolean;
  nudgeLevel?: number;
};

export const CHANNEL_META: Record<CommChannel, { label: string; icon: string }> = {
  email: { label: "Email", icon: "Mail" },
  sms: { label: "SMS", icon: "MessageSquare" },
  portal: { label: "Portal", icon: "Globe" },
  voice: { label: "Voice", icon: "Phone" },
};

export const COMM_STATUS_META: Record<CommStatus, { label: string; tone: StatusTone }> = {
  sent: { label: "Sent", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  opened: { label: "Opened", tone: "success" },
  replied: { label: "Replied", tone: "success" },
  bounced: { label: "Bounced", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  scheduled: { label: "Scheduled", tone: "neutral" },
};

export const COMMUNICATIONS: CommunicationRecord[] = [
  {
    id: "comm-001",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    channel: "email",
    subject: "Welcome! Your onboarding package is ready",
    templateName: "Welcome — Package Dispatched",
    status: "opened",
    sentAt: "2026-06-01 09:00",
    openedAt: "2026-06-01 09:14",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-002",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    channel: "portal",
    subject: "Reminder: Government ID still pending",
    templateName: "Document Nudge — Day 1",
    status: "delivered",
    sentAt: "2026-06-02 08:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: true,
    nudgeLevel: 1,
  },
  {
    id: "comm-003",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    channel: "sms",
    subject: "Action needed: ID upload required before start",
    templateName: "Document Nudge — Day 2",
    status: "delivered",
    sentAt: "2026-06-03 10:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: true,
    nudgeLevel: 2,
  },
  {
    id: "comm-004",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Apex Financial",
    channel: "email",
    subject: "Your background check has been ordered",
    templateName: "Screening Initiated",
    status: "delivered",
    sentAt: "2026-06-01 11:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-005",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Apex Financial",
    channel: "email",
    subject: "I-9 form requires completion",
    templateName: "Document Nudge — Day 1",
    status: "replied",
    sentAt: "2026-06-02 09:30",
    openedAt: "2026-06-02 10:05",
    sentBy: "System",
    visibility: "candidate",
    isNudge: true,
    nudgeLevel: 1,
  },
  {
    id: "comm-006",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    channel: "email",
    subject: "Direct deposit setup required",
    templateName: "Payroll Setup Reminder",
    status: "bounced",
    sentAt: "2026-06-01 14:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-007",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    channel: "sms",
    subject: "Urgent: email bounced. Please log in to the portal.",
    templateName: "Bounce Recovery — SMS",
    status: "delivered",
    sentAt: "2026-06-01 14:15",
    sentBy: "System",
    visibility: "candidate",
    isNudge: true,
    nudgeLevel: 3,
  },
  {
    id: "comm-008",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "SkyBridge Tech",
    channel: "email",
    subject: "Happy Birthday, Noah! 🎉",
    templateName: "Birthday Celebration",
    status: "opened",
    sentAt: "2026-06-03 08:00",
    openedAt: "2026-06-03 08:22",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-009",
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Meridian Health",
    channel: "portal",
    subject: "Your Day 1 instructions are ready",
    templateName: "Day 1 Briefing",
    status: "opened",
    sentAt: "2026-06-05 08:00",
    openedAt: "2026-06-05 08:30",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-010",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Apex Financial",
    channel: "email",
    subject: "Onboarding package sent — action required",
    templateName: "Welcome — Package Dispatched",
    status: "sent",
    sentAt: "2026-06-06 09:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-011",
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Northwind Logistics",
    channel: "sms",
    subject: "Client NDA expires in 3 days — please re-sign",
    templateName: "Document Expiry Alert",
    status: "delivered",
    sentAt: "2026-06-04 10:00",
    sentBy: "Riya Kim",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-012",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "SkyBridge Tech",
    channel: "email",
    subject: "Screening additional info required",
    templateName: "Screening Action Required",
    status: "failed",
    sentAt: "2026-06-02 15:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-013",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "SkyBridge Tech",
    channel: "sms",
    subject: "Urgent: background check needs your response",
    templateName: "Screening Nudge — SMS Fallback",
    status: "delivered",
    sentAt: "2026-06-02 15:10",
    sentBy: "System",
    visibility: "candidate",
    isNudge: true,
    nudgeLevel: 4,
  },
  {
    id: "comm-014",
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    channel: "email",
    subject: "Internal note: candidate unresponsive for 48h",
    templateName: undefined,
    status: "delivered",
    sentAt: "2026-06-05 13:00",
    sentBy: "Sasha Patel",
    visibility: "internal",
    isNudge: false,
  },
  {
    id: "comm-015",
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    channel: "voice",
    subject: "Recruiter call — confirm start date",
    templateName: "Recruiter Follow-Up Call",
    status: "replied",
    sentAt: "2026-06-05 14:00",
    sentBy: "Sasha Patel",
    visibility: "internal",
    isNudge: true,
    nudgeLevel: 5,
  },
  {
    id: "comm-016",
    candidateId: "sofia-marin",
    candidateName: "Sofia Marin",
    client: "Apex Financial",
    channel: "email",
    subject: "Client onboarding status update",
    templateName: "Client Status Report",
    status: "delivered",
    sentAt: "2026-06-03 16:00",
    sentBy: "Jordan Lee",
    visibility: "client",
    isNudge: false,
  },
  {
    id: "comm-017",
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Northwind Logistics",
    channel: "email",
    subject: "Equipment shipment confirmation",
    templateName: "Equipment Shipped",
    status: "opened",
    sentAt: "2026-06-04 11:00",
    openedAt: "2026-06-04 11:42",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
  {
    id: "comm-018",
    candidateId: "priya-sharma",
    candidateName: "Priya Sharma",
    client: "SkyBridge Tech",
    channel: "portal",
    subject: "Security training assigned — complete before Day 1",
    templateName: "Training Assignment",
    status: "scheduled",
    scheduledFor: "2026-06-08 09:00",
    sentBy: "System",
    visibility: "candidate",
    isNudge: false,
  },
];

export function commStats(): {
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
} {
  const sent = COMMUNICATIONS.length;
  const delivered = COMMUNICATIONS.filter((c) =>
    ["delivered", "opened", "replied"].includes(c.status),
  ).length;
  const opened = COMMUNICATIONS.filter((c) =>
    ["opened", "replied"].includes(c.status),
  ).length;
  const failed = COMMUNICATIONS.filter((c) =>
    ["failed", "bounced"].includes(c.status),
  ).length;
  return { sent, delivered, opened, failed };
}
