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
import { CANDIDATES, type CandidateSummary } from "@/lib/candidates";
import { DOCUMENTS } from "@/lib/documents";
import { SCREENING_RECORDS } from "@/lib/screening";
import { getPerson } from "@/lib/org";
import type { RoleId } from "@/lib/roles";
import { hoursAgo, minutesAgo } from "@/lib/clock";

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
// Event derivation from live mock data
// ---------------------------------------------------------------------------

/**
 * The demo platform has a single Account Manager who owns every client
 * relationship; matches `getViewerOwnership("account-manager")`.
 */
const DEMO_ACCOUNT_MANAGER = "Alex Castellanos";

/**
 * Resolve the team lead for a recruiter/onboarder using the ORG tree (§55).
 * Returns the lead's name if the person reports to a team-lead, or the person
 * themselves if they *are* a team-lead. Returns undefined for ICs reporting
 * straight to a manager (no pod layer).
 */
function teamLeadFor(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const person = getPerson(name);
  if (!person) return undefined;
  if (person.role === "team-lead") return person.name;
  if (person.reportsTo) {
    const parent = getPerson(person.reportsTo);
    if (parent?.role === "team-lead") return parent.name;
  }
  return undefined;
}

/** Standard owner block for any candidate-subject event. */
function ownersForCandidate(c: CandidateSummary) {
  return {
    onboarder: c.onboarder,
    recruiter: c.recruiter,
    // Prefer the recruiter's lead (recruiter-side events); fall back to
    // onboarder's pod if recruiter has no lead layer.
    teamLead: teamLeadFor(c.recruiter) ?? teamLeadFor(c.onboarder),
    accountManager: DEMO_ACCOUNT_MANAGER,
    client: c.client,
  };
}

/**
 * Build the live event stream by scanning the operational mock data.
 *
 * Events are derived rather than hand-curated so the notification bell stays in
 * sync with whatever the rest of the app shows: rejected documents become
 * DOCUMENT_REJECTED events, at-risk candidates with imminent starts become
 * START_DATE_AT_RISK events, screening delays become BG_CHECK_DELAY events,
 * etc. Each message stays at the *status / next action* layer — never leaking
 * sensitive findings (screening results, drug findings, SSN, DOB, salary).
 *
 * In production the same shape arrives from the event bus (§76.3).
 */
export function getDerivedEvents(): SystemEvent[] {
  const events: SystemEvent[] = [];

  // ── Rejected / correction-required documents → DOCUMENT_REJECTED ──
  const rejectedDocs = DOCUMENTS.filter(
    (d) => d.status === "rejected" || d.status === "correction-required",
  );
  rejectedDocs.forEach((d, i) => {
    const owner = CANDIDATES.find((c) => c.id === d.candidateId);
    events.push({
      id: `evt-doc-rejected-${d.id}`,
      eventType: "DOCUMENT_REJECTED",
      occurredAt: minutesAgo(15 + i * 47),
      subject: {
        kind: "candidate",
        id: d.candidateId,
        name: d.candidateName,
      },
      owners: owner
        ? ownersForCandidate(owner)
        : { client: d.client, accountManager: DEMO_ACCOUNT_MANAGER },
      title: `${d.docType} rejected — ${d.candidateName}`,
      message:
        d.rejectionReason ??
        "Re-upload required before onboarding can continue.",
      href: `/candidates/${d.candidateId}`,
    });
  });

  // ── At-risk candidates with imminent starts → START_DATE_AT_RISK ──
  const atRiskSoon = CANDIDATES.filter(
    (c) =>
      (c.risk === "at-risk" || c.risk === "unlikely") && c.startInDays <= 7,
  );
  atRiskSoon.forEach((c, i) => {
    events.push({
      id: `evt-sdr-${c.id}`,
      eventType: "START_DATE_AT_RISK",
      occurredAt: minutesAgo(40 + i * 53),
      subject: { kind: "candidate", id: c.id, name: c.name },
      owners: ownersForCandidate(c),
      title: `Start date at risk — ${c.name}`,
      message: `Starts ${c.startDateLabel} (${c.startInDays} day${c.startInDays === 1 ? "" : "s"}). Still in ${c.stage}.`,
      href: `/candidates/${c.id}`,
    });
  });

  // ── Screening delays / info requests → BG_CHECK_DELAY ──
  const stalledScreens = SCREENING_RECORDS.filter(
    (s) => s.status === "vendor-delayed" || s.status === "info-required",
  );
  stalledScreens.forEach((s, i) => {
    const owner = CANDIDATES.find((c) => c.id === s.candidateId);
    events.push({
      id: `evt-bgc-${s.id}`,
      eventType: "BG_CHECK_DELAY",
      occurredAt: hoursAgo(2 + i * 3),
      subject: {
        kind: "candidate",
        id: s.candidateId,
        name: s.candidateName,
      },
      owners: owner
        ? ownersForCandidate(owner)
        : { client: s.client, accountManager: DEMO_ACCOUNT_MANAGER },
      title: `Background check delayed — ${s.candidateName}`,
      message:
        s.status === "info-required"
          ? "Vendor requested additional information from the candidate."
          : "Vendor turnaround exceeded SLA. No findings disclosed.",
      href: `/candidates/${s.candidateId}`,
    });
  });

  // ── Payroll not ready → tags from CANDIDATES ──
  const payrollGaps = CANDIDATES.filter(
    (c) =>
      c.tags.includes("Missing direct deposit") ||
      c.tags.includes("Payroll sync failed"),
  );
  payrollGaps.forEach((c, i) => {
    events.push({
      id: `evt-payroll-${c.id}`,
      eventType: "PAYROLL_NOT_READY",
      occurredAt: hoursAgo(6 + i * 4),
      subject: { kind: "candidate", id: c.id, name: c.name },
      owners: ownersForCandidate(c),
      title: `Payroll not ready — ${c.name}`,
      message: `${c.tags.find((t) => t.startsWith("Missing") || t === "Payroll sync failed") ?? "Payroll setup incomplete"}. Start date is ${c.startInDays} days away.`,
      href: `/candidates/${c.id}`,
    });
  });

  // ── Pending client approval → CLIENT_PROMISE_AT_RISK + PACKAGE_APPROVED twin ──
  const awaitingClient = CANDIDATES.filter((c) =>
    c.tags.includes("Package awaiting client approval"),
  );
  awaitingClient.forEach((c, i) => {
    events.push({
      id: `evt-client-promise-${c.id}`,
      eventType: "CLIENT_PROMISE_AT_RISK",
      occurredAt: hoursAgo(8 + i * 2),
      subject: { kind: "candidate", id: c.id, name: c.name },
      owners: ownersForCandidate(c),
      title: `Client promise at risk — ${c.client}`,
      message: `Package for ${c.name} awaiting client approval. Promised clearance date may slip.`,
      href: `/candidates/${c.id}`,
    });
  });

  // ── Unresponsive candidates (proxy: slow activity + needs-attention) ──
  const unresponsive = CANDIDATES.filter(
    (c) =>
      c.status === "needs-attention" &&
      (c.lastActivity.endsWith("h ago") || c.lastActivity.endsWith("d ago")) &&
      c.startInDays <= 10,
  ).slice(0, 2);
  unresponsive.forEach((c, i) => {
    events.push({
      id: `evt-unresponsive-${c.id}`,
      eventType: "CANDIDATE_UNRESPONSIVE_48H",
      occurredAt: hoursAgo(20 + i * 4),
      subject: { kind: "candidate", id: c.id, name: c.name },
      owners: ownersForCandidate(c),
      title: `Candidate unresponsive — ${c.name}`,
      message:
        "Portal activity has dropped off. Recruiter outreach recommended.",
      href: `/candidates/${c.id}`,
    });
  });

  // ── System-wide synthetic events (no candidate subject) ──
  events.push({
    id: "evt-integration-beeline",
    eventType: "INTEGRATION_FAILURE",
    occurredAt: hoursAgo(1),
    subject: { kind: "integration", id: "beeline-vms", name: "Beeline VMS" },
    owners: {},
    title: "Beeline VMS integration failed",
    message:
      "3 worker status updates failed to sync. Retry queue has 3 pending records.",
    href: "/planned/integrations",
  });

  if (atRiskSoon.length > 0) {
    events.push({
      id: "evt-ai-bulk-nudge",
      eventType: "AI_RECOMMENDATION_HIGH_RISK",
      occurredAt: hoursAgo(4),
      subject: { kind: "system" },
      owners: {},
      title: "AI recommends bulk nudge",
      message: `${atRiskSoon.length} at-risk candidate${atRiskSoon.length === 1 ? "" : "s"} flagged. AI drafted personalized SMS for each — requires approval.`,
      href: "/planned/my-work",
    });
  }

  return events;
}

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
    return notificationsForViewer(getDerivedEvents(), {
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
