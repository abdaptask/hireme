/**
 * Notification routing layer (§13 Gentle Nudge Protocol, §106 Notification Center,
 * §42 RBAC/ABAC scoping).
 *
 * A single SystemEvent stream is filtered per-viewer using:
 *   1. A persona × event-type ROUTING matrix that defines priority, channels,
 *      and ownership scope.
 *   2. Ownership context (which candidates/clients this viewer is responsible
 *      for) so we never leak another team's data into someone's inbox.
 *
 * Sensitive details (screening findings, drug test results, SSNs, salaries)
 * never appear in event messages — only the *status* and *what to do next*.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import { CURRENT_ONBOARDER, CURRENT_RECRUITER, TEAM_LEAD } from "@/lib/ops-data";
import type { RoleId } from "@/lib/roles";
import { daysAgo, hoursAgo, minutesAgo } from "@/lib/clock";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationEventType =
  | "OFFER_ACCEPTED"
  | "DOCUMENT_REJECTED"
  | "BG_CHECK_DELAY"
  | "START_DATE_AT_RISK"
  | "INTEGRATION_FAILURE"
  | "SLA_BREACH"
  | "PACKAGE_APPROVED"
  | "PAYROLL_NOT_READY"
  | "EQUIPMENT_DELAYED"
  | "CANDIDATE_UNRESPONSIVE_48H"
  | "COMPLIANCE_OVERRIDE"
  | "AI_RECOMMENDATION_HIGH_RISK"
  | "BIRTHDAY_MILESTONE"
  | "CLIENT_PROMISE_AT_RISK";

export type NotificationPriority = "critical" | "warning" | "info";
export type NotificationChannel = "in-app" | "email" | "sms";
export type NotificationCategory =
  | "task"
  | "approval"
  | "exception"
  | "integration"
  | "ai";

/** A raw event happening in the system. */
export type SystemEvent = {
  id: string;
  eventType: NotificationEventType;
  occurredAt: Date;
  subject: {
    kind: "candidate" | "consultant" | "client" | "system" | "integration";
    id?: string;
    name?: string;
  };
  /** Ownership context — which people on the staffing team own this subject. */
  owners: {
    onboarder?: string;
    recruiter?: string;
    teamLead?: string;
    recruitingManager?: string;
    accountManager?: string;
    client?: string;
  };
  title: string;
  message: string;
  href?: string;
};

/** A delivered notification (event + persona + priority + channel). */
export type Notification = {
  id: string;
  eventId: string;
  role: RoleId;
  eventType: NotificationEventType;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title: string;
  message: string;
  occurredAt: Date;
  read: boolean;
  href?: string;
};

export type NotificationScope =
  | "owner-only"
  | "pod-only"
  | "client-only"
  | "aggregate"
  | "self-only";

type RoleRule = {
  priority: NotificationPriority;
  channels: NotificationChannel[];
  scope: NotificationScope;
};

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

export function categoryFor(
  eventType: NotificationEventType,
): NotificationCategory {
  switch (eventType) {
    case "OFFER_ACCEPTED":
    case "SLA_BREACH":
    case "CANDIDATE_UNRESPONSIVE_48H":
    case "BIRTHDAY_MILESTONE":
      return "task";
    case "PACKAGE_APPROVED":
    case "COMPLIANCE_OVERRIDE":
      return "approval";
    case "DOCUMENT_REJECTED":
    case "BG_CHECK_DELAY":
    case "START_DATE_AT_RISK":
    case "PAYROLL_NOT_READY":
    case "EQUIPMENT_DELAYED":
    case "CLIENT_PROMISE_AT_RISK":
      return "exception";
    case "INTEGRATION_FAILURE":
      return "integration";
    case "AI_RECOMMENDATION_HIGH_RISK":
      return "ai";
  }
}

// ---------------------------------------------------------------------------
// Routing matrix
// ---------------------------------------------------------------------------

const IN_APP: NotificationChannel[] = ["in-app"];
const IN_APP_EMAIL: NotificationChannel[] = ["in-app", "email"];
const IN_APP_SMS: NotificationChannel[] = ["in-app", "sms"];
const IN_APP_SMS_EMAIL: NotificationChannel[] = ["in-app", "sms", "email"];

export const ROUTING: Partial<
  Record<NotificationEventType, Partial<Record<RoleId, RoleRule>>>
> = {
  OFFER_ACCEPTED: {
    onboarder: { priority: "info", channels: IN_APP, scope: "aggregate" },
    recruiter: {
      priority: "critical",
      channels: IN_APP_SMS,
      scope: "owner-only",
    },
    "team-lead": { priority: "info", channels: IN_APP, scope: "pod-only" },
    "recruiting-manager": {
      priority: "info",
      channels: IN_APP,
      scope: "aggregate",
    },
    "account-manager": {
      priority: "info",
      channels: IN_APP,
      scope: "client-only",
    },
    "super-admin": { priority: "info", channels: IN_APP, scope: "aggregate" },
    candidate: {
      priority: "info",
      channels: IN_APP_EMAIL,
      scope: "self-only",
    },
  },
  DOCUMENT_REJECTED: {
    onboarder: {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "team-lead": { priority: "warning", channels: IN_APP, scope: "pod-only" },
    "super-admin": { priority: "info", channels: IN_APP, scope: "aggregate" },
    candidate: {
      priority: "critical",
      channels: IN_APP_SMS_EMAIL,
      scope: "self-only",
    },
  },
  BG_CHECK_DELAY: {
    onboarder: {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "team-lead": { priority: "warning", channels: IN_APP, scope: "pod-only" },
    "recruiting-manager": {
      priority: "info",
      channels: IN_APP,
      scope: "aggregate",
    },
    "account-manager": {
      priority: "info",
      channels: IN_APP,
      scope: "client-only",
    },
    "super-admin": { priority: "info", channels: IN_APP, scope: "aggregate" },
    candidate: { priority: "info", channels: IN_APP, scope: "self-only" },
  },
  START_DATE_AT_RISK: {
    onboarder: {
      priority: "critical",
      channels: IN_APP_SMS_EMAIL,
      scope: "owner-only",
    },
    recruiter: {
      priority: "critical",
      channels: IN_APP_SMS,
      scope: "owner-only",
    },
    "team-lead": {
      priority: "critical",
      channels: IN_APP,
      scope: "pod-only",
    },
    "recruiting-manager": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
    "account-manager": {
      priority: "critical",
      channels: IN_APP,
      scope: "client-only",
    },
    "super-admin": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
  },
  INTEGRATION_FAILURE: {
    onboarder: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "super-admin": {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "aggregate",
    },
  },
  SLA_BREACH: {
    onboarder: {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "team-lead": { priority: "warning", channels: IN_APP, scope: "pod-only" },
    "recruiting-manager": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
    "account-manager": {
      priority: "warning",
      channels: IN_APP,
      scope: "client-only",
    },
    "super-admin": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
  },
  PACKAGE_APPROVED: {
    onboarder: { priority: "info", channels: IN_APP, scope: "owner-only" },
    recruiter: { priority: "info", channels: IN_APP, scope: "owner-only" },
    "account-manager": {
      priority: "info",
      channels: IN_APP,
      scope: "client-only",
    },
    candidate: { priority: "info", channels: IN_APP, scope: "self-only" },
  },
  PAYROLL_NOT_READY: {
    onboarder: {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "team-lead": { priority: "warning", channels: IN_APP, scope: "pod-only" },
    "account-manager": {
      priority: "warning",
      channels: IN_APP,
      scope: "client-only",
    },
    "super-admin": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
    candidate: { priority: "warning", channels: IN_APP, scope: "self-only" },
  },
  EQUIPMENT_DELAYED: {
    onboarder: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "account-manager": {
      priority: "warning",
      channels: IN_APP,
      scope: "client-only",
    },
    "super-admin": { priority: "info", channels: IN_APP, scope: "aggregate" },
    candidate: { priority: "info", channels: IN_APP, scope: "self-only" },
  },
  CANDIDATE_UNRESPONSIVE_48H: {
    onboarder: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    recruiter: {
      priority: "critical",
      channels: IN_APP_SMS,
      scope: "owner-only",
    },
    "team-lead": { priority: "warning", channels: IN_APP, scope: "pod-only" },
    "super-admin": { priority: "info", channels: IN_APP, scope: "aggregate" },
    candidate: {
      priority: "warning",
      channels: IN_APP_SMS_EMAIL,
      scope: "self-only",
    },
  },
  COMPLIANCE_OVERRIDE: {
    onboarder: { priority: "info", channels: IN_APP, scope: "aggregate" },
    "recruiting-manager": {
      priority: "info",
      channels: IN_APP,
      scope: "aggregate",
    },
    "super-admin": {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "aggregate",
    },
  },
  AI_RECOMMENDATION_HIGH_RISK: {
    onboarder: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "super-admin": {
      priority: "critical",
      channels: IN_APP_EMAIL,
      scope: "aggregate",
    },
  },
  BIRTHDAY_MILESTONE: {
    onboarder: { priority: "info", channels: IN_APP, scope: "owner-only" },
    recruiter: { priority: "info", channels: IN_APP, scope: "owner-only" },
    "super-admin": { priority: "info", channels: IN_APP, scope: "aggregate" },
    candidate: {
      priority: "info",
      channels: IN_APP_EMAIL,
      scope: "self-only",
    },
  },
  CLIENT_PROMISE_AT_RISK: {
    onboarder: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    recruiter: {
      priority: "warning",
      channels: IN_APP,
      scope: "owner-only",
    },
    "team-lead": { priority: "warning", channels: IN_APP, scope: "pod-only" },
    "recruiting-manager": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
    "account-manager": {
      priority: "critical",
      channels: IN_APP_SMS_EMAIL,
      scope: "client-only",
    },
    "super-admin": {
      priority: "warning",
      channels: IN_APP,
      scope: "aggregate",
    },
  },
};

// ---------------------------------------------------------------------------
// Sample events
// ---------------------------------------------------------------------------

/**
 * Demo event stream. Each message describes only the *status* and *next action* —
 * never sensitive findings (screening results, drug findings, SSN, DOB, salary).
 *
 * In production these come from the event bus (§76.3).
 */
export const SAMPLE_EVENTS: SystemEvent[] = [
  {
    id: "evt-001",
    eventType: "DOCUMENT_REJECTED",
    occurredAt: minutesAgo(15),
    subject: { kind: "candidate", id: "marcus-webb", name: "Marcus Webb" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Priya Kapoor",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "NovaTech Solutions",
    },
    title: "W-9 rejected — Marcus Webb",
    message:
      "Entity name mismatch. Payroll cannot be activated until corrected.",
    href: "/candidates/marcus-webb",
  },
  {
    id: "evt-002",
    eventType: "START_DATE_AT_RISK",
    occurredAt: minutesAgo(40),
    subject: { kind: "candidate", id: "james-rivera", name: "James Rivera" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Devon Hughes",
      teamLead: "Devon Hughes",
      accountManager: "Alex Castellanos",
      client: "Meridian Health",
    },
    title: "Start date at risk — James Rivera",
    message:
      "Background check consent not submitted. Start date is 3 days away.",
    href: "/candidates/james-rivera",
  },
  {
    id: "evt-003",
    eventType: "BG_CHECK_DELAY",
    occurredAt: hoursAgo(2),
    subject: { kind: "candidate", id: "raj-patel", name: "Raj Patel" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Marcus Chen",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "Apex Dynamics",
    },
    title: "Background check delayed — Raj Patel",
    message:
      "Vendor reports additional information requested. No findings disclosed.",
    href: "/candidates/raj-patel",
  },
  {
    id: "evt-004",
    eventType: "INTEGRATION_FAILURE",
    occurredAt: hoursAgo(1),
    subject: { kind: "integration", id: "beeline-vms", name: "Beeline VMS" },
    owners: {
      onboarder: "Riya Kim",
    },
    title: "Beeline VMS integration failed",
    message:
      "3 worker status updates failed to sync. Retry queue has 3 pending records.",
    href: "/planned/integrations",
  },
  {
    id: "evt-005",
    eventType: "SLA_BREACH",
    occurredAt: hoursAgo(2),
    subject: { kind: "candidate", id: "grace-okafor", name: "Grace Okafor" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Devon Hughes",
      teamLead: "Devon Hughes",
      accountManager: "Alex Castellanos",
      client: "Meridian Health",
    },
    title: "SLA approaching — I-9 review",
    message: "Grace Okafor's I-9 Section 2 review is due in 4 hours.",
    href: "/candidates/grace-okafor",
  },
  {
    id: "evt-006",
    eventType: "PACKAGE_APPROVED",
    occurredAt: hoursAgo(3),
    subject: { kind: "candidate", id: "raj-patel", name: "Raj Patel" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Marcus Chen",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "Apex Dynamics",
    },
    title: "Package approved — Raj Patel",
    message:
      "Apex Dynamics onboarding package approved by Devon Hughes. Candidate notified.",
    href: "/candidates/raj-patel",
  },
  {
    id: "evt-007",
    eventType: "OFFER_ACCEPTED",
    occurredAt: hoursAgo(4),
    subject: { kind: "candidate", id: "aisha-bello", name: "Aisha Bello" },
    owners: {
      onboarder: "Derek Okafor",
      recruiter: "Aisha Crawford",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "Global Finance Corp",
    },
    title: "Offer accepted — Aisha Bello",
    message:
      "Onboarding package auto-generated. Handoff started by Derek Okafor.",
    href: "/candidates/aisha-bello",
  },
  {
    id: "evt-008",
    eventType: "AI_RECOMMENDATION_HIGH_RISK",
    occurredAt: hoursAgo(4),
    subject: { kind: "system", name: "Lena Park" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Tyler Brooks",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "Apex Dynamics",
    },
    title: "AI recommendation — Lena Park",
    message:
      "Start date confidence dropped to 71%. Equipment delivery at risk. Human approval required.",
    href: "/candidates/lena-park",
  },
  {
    id: "evt-009",
    eventType: "BIRTHDAY_MILESTONE",
    occurredAt: hoursAgo(6),
    subject: { kind: "candidate", id: "grace-okafor", name: "Grace Okafor" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Devon Hughes",
      teamLead: "Devon Hughes",
      accountManager: "Alex Castellanos",
      client: "Meridian Health",
    },
    title: "Upcoming birthday — Grace Okafor",
    message:
      "Birthday is in 2 days. AI has drafted a personalized message for approval.",
    href: "/candidates/grace-okafor",
  },
  {
    id: "evt-010",
    eventType: "EQUIPMENT_DELAYED",
    occurredAt: hoursAgo(8),
    subject: { kind: "candidate", id: "lena-park", name: "Lena Park" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Tyler Brooks",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "Apex Dynamics",
    },
    title: "Equipment delayed — Lena Park",
    message:
      "Laptop shipment unlikely to arrive before start date. Reschedule provisioning.",
    href: "/candidates/lena-park",
  },
  {
    id: "evt-011",
    eventType: "CLIENT_PROMISE_AT_RISK",
    occurredAt: hoursAgo(12),
    subject: { kind: "client", id: "meridian-health", name: "Meridian Health" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Devon Hughes",
      teamLead: "Devon Hughes",
      accountManager: "Alex Castellanos",
      client: "Meridian Health",
    },
    title: "Client promise at risk — Meridian Health",
    message:
      "Promised clearance date for 2 consultants likely to slip. Notify Account Manager.",
    href: "/planned/clients",
  },
  {
    id: "evt-012",
    eventType: "PAYROLL_NOT_READY",
    occurredAt: hoursAgo(18),
    subject: { kind: "candidate", id: "marcus-webb", name: "Marcus Webb" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Priya Kapoor",
      teamLead: "Jordan Reed",
      accountManager: "Alex Castellanos",
      client: "NovaTech Solutions",
    },
    title: "Payroll not ready — Marcus Webb",
    message:
      "Direct deposit and state tax form outstanding. Start date is 4 days away.",
    href: "/candidates/marcus-webb",
  },
  {
    id: "evt-013",
    eventType: "COMPLIANCE_OVERRIDE",
    occurredAt: daysAgo(1),
    subject: { kind: "system", name: "Compliance" },
    owners: {},
    title: "Compliance override logged",
    message:
      "California wage notice waived for 1 consultant. Reason: client-provided equivalent. Audit logged.",
    href: "/planned/audit",
  },
  {
    id: "evt-014",
    eventType: "CANDIDATE_UNRESPONSIVE_48H",
    occurredAt: daysAgo(1),
    subject: { kind: "candidate", id: "sarah-chen", name: "Sarah Chen" },
    owners: {
      onboarder: "Riya Kim",
      recruiter: "Devon Hughes",
      teamLead: "Devon Hughes",
      accountManager: "Alex Castellanos",
      client: "Atlas Manufacturing",
    },
    title: "Candidate unresponsive — Sarah Chen",
    message:
      "No portal activity in 48 hours. Recruiter outreach recommended.",
    href: "/candidates/sarah-chen",
  },
  {
    id: "evt-015",
    eventType: "OFFER_ACCEPTED",
    occurredAt: daysAgo(2),
    subject: { kind: "candidate", id: "noah-klein", name: "Noah Klein" },
    owners: {
      onboarder: "Sasha Patel",
      recruiter: "Devon Hughes",
      teamLead: "Devon Hughes",
      accountManager: "Alex Castellanos",
      client: "Vertex Financial",
    },
    title: "Offer accepted — Noah Klein",
    message:
      "Package auto-generated. Handoff to onboarder complete.",
    href: "/candidates/noah-klein",
  },
];

// ---------------------------------------------------------------------------
// Filter / route
// ---------------------------------------------------------------------------

export type ViewerOwnership = {
  onboarder?: string;
  recruiter?: string;
  teamLead?: string;
  accountManager?: string;
  client?: string;
  candidateId?: string;
};

export type Viewer = {
  role: RoleId;
  ownership?: ViewerOwnership;
  readIds?: Set<string>;
};

function passesScope(
  event: SystemEvent,
  role: RoleId,
  scope: NotificationScope,
  ownership: ViewerOwnership | undefined,
): boolean {
  if (scope === "aggregate") return true;
  const own = ownership ?? {};

  if (scope === "owner-only") {
    // Owner field depends on the role.
    if (role === "onboarder") {
      return (
        !!own.onboarder &&
        !!event.owners.onboarder &&
        event.owners.onboarder === own.onboarder
      );
    }
    if (role === "recruiter") {
      return (
        !!own.recruiter &&
        !!event.owners.recruiter &&
        event.owners.recruiter === own.recruiter
      );
    }
    if (role === "account-manager") {
      return (
        !!own.accountManager &&
        !!event.owners.accountManager &&
        event.owners.accountManager === own.accountManager
      );
    }
    return false;
  }

  if (scope === "pod-only") {
    return (
      !!own.teamLead &&
      !!event.owners.teamLead &&
      event.owners.teamLead === own.teamLead
    );
  }

  if (scope === "client-only") {
    const amMatch =
      !!own.accountManager &&
      !!event.owners.accountManager &&
      event.owners.accountManager === own.accountManager;
    const clientMatch =
      !!own.client && !!event.owners.client && event.owners.client === own.client;
    return amMatch || clientMatch;
  }

  if (scope === "self-only") {
    return (
      !!own.candidateId &&
      !!event.subject.id &&
      event.subject.id === own.candidateId
    );
  }

  return false;
}

export function notificationsForViewer(
  events: SystemEvent[],
  viewer: Viewer,
): Notification[] {
  const out: Notification[] = [];
  for (const event of events) {
    const rule = ROUTING[event.eventType]?.[viewer.role];
    if (!rule) continue;
    if (!passesScope(event, viewer.role, rule.scope, viewer.ownership)) continue;

    const id = `${event.id}:${viewer.role}`;
    out.push({
      id,
      eventId: event.id,
      role: viewer.role,
      eventType: event.eventType,
      category: categoryFor(event.eventType),
      priority: rule.priority,
      channels: rule.channels,
      title: event.title,
      message: event.message,
      occurredAt: event.occurredAt,
      read: viewer.readIds?.has(id) ?? false,
      href: event.href,
    });
  }

  out.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return out;
}

// ---------------------------------------------------------------------------
// Viewer ownership lookup (per-role)
// ---------------------------------------------------------------------------

export function getViewerOwnership(role: RoleId): {
  ownership: ViewerOwnership;
  noInbox?: boolean;
} {
  switch (role) {
    case "super-admin":
      // Aggregate scope reads everything; ownership fields are unused.
      return { ownership: {} };
    case "onboarder":
      return { ownership: { onboarder: CURRENT_ONBOARDER } };
    case "recruiter":
      return { ownership: { recruiter: CURRENT_RECRUITER } };
    case "team-lead":
      return { ownership: { teamLead: TEAM_LEAD } };
    case "recruiting-manager":
      // Aggregate scope only — no owner filter needed.
      return { ownership: {} };
    case "account-manager":
      return { ownership: { accountManager: "Alex Castellanos" } };
    case "candidate":
      return { ownership: { candidateId: "sarah-chen" } };
    case "vendor":
    case "client":
      // External portal roles do not use the operational inbox.
      return { ownership: {}, noInbox: true };
    default:
      return { ownership: {}, noInbox: true };
  }
}

// ---------------------------------------------------------------------------
// React hook — shared by the header bell badge and the side panel
// ---------------------------------------------------------------------------

const READ_STATE = new Map<RoleId, Set<string>>();

function getReadSet(role: RoleId): Set<string> {
  let set = READ_STATE.get(role);
  if (!set) {
    set = new Set<string>();
    READ_STATE.set(role, set);
  }
  return set;
}

export function useViewerNotifications(role: RoleId): {
  notifications: Notification[];
  unreadCount: number;
  noInbox: boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
} {
  const { ownership, noInbox } = useMemo(() => getViewerOwnership(role), [role]);
  // Reactive container — bump on read changes so dependents re-render.
  const [readVersion, setReadVersion] = useState(0);

  const notifications = useMemo(() => {
    if (noInbox) return [];
    const readIds = getReadSet(role);
    return notificationsForViewer(SAMPLE_EVENTS, {
      role,
      ownership,
      readIds,
    });
    // readVersion is intentionally in the deps so re-reads pick up local mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, ownership, noInbox, readVersion]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAllRead = useCallback(() => {
    const set = getReadSet(role);
    for (const n of notifications) set.add(n.id);
    setReadVersion((v) => v + 1);
  }, [role, notifications]);

  const markRead = useCallback(
    (id: string) => {
      const set = getReadSet(role);
      set.add(id);
      setReadVersion((v) => v + 1);
    },
    [role],
  );

  return {
    notifications,
    unreadCount,
    noInbox: !!noInbox,
    markAllRead,
    markRead,
  };
}
