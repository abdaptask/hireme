/**
 * Consultant 360 record — server component.
 * DB-first: fetches from Neon, falls back to mock if not found.
 * (CLAUDE.md §15, §38, §97.3, §100)
 */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Globe,
  Handshake,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Tag,
  User,
} from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { DocumentsTable } from "@/components/documents/documents-table";
import { StatTile } from "@/components/workspace/stat-tile";
import { EditConsultantSheet } from "@/components/consultants/edit-consultant-sheet";
import { Placeholder } from "@/components/360/placeholder";
import { Timeline, type TimelineEventRow } from "@/components/360/timeline";
import { DbScreening } from "@/components/360/db-screening";
import { DbTraining } from "@/components/360/db-training";
import { DbEquipment } from "@/components/360/db-equipment";
import { DbPayroll } from "@/components/360/db-payroll";
import { DbBilling } from "@/components/360/db-billing";
import { DbAudit } from "@/components/360/db-audit";
import {
  getConsultant,
  CONSULTANT_STATUS_META,
  type Consultant,
} from "@/lib/consultants";
import {
  getDbConsultantFull,
  dbConsultantToUI,
  type DbConsultantFull,
} from "@/lib/db-consultants";
import { relativeTime } from "@/lib/db-candidates";
import {
  DOCUMENTS,
  type Document as MockDocument,
} from "@/lib/documents";
import {
  COMMUNICATIONS,
  CHANNEL_META,
  COMM_STATUS_META,
  type CommChannel,
  type CommunicationRecord,
} from "@/lib/communications";
import type { StatusTone } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const db = await getDbConsultantFull(id).catch(() => null);
  if (db) return { title: `${db.firstName} ${db.lastName}` };
  const mock = getConsultant(id);
  return { title: mock?.name ?? "Consultant" };
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function fmt(rate: number): string {
  return `$${rate}/hr`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <span className="text-muted-foreground w-28 shrink-0 text-xs">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm font-medium">{value}</span>
    </div>
  );
}

type AssignmentRow = {
  id: string;
  client: string;
  role: string;
  start: string;
  end: string;
  status: "Completed" | "Active" | "Extended";
};

const ASSIGNMENT_STATUS_TONE: Record<
  AssignmentRow["status"],
  "success" | "info" | "warning"
> = {
  Completed: "success",
  Active: "info",
  Extended: "warning",
};

// ─────────────────────────────────────────────────────────
// Audit → Timeline normalizer
// ─────────────────────────────────────────────────────────

function auditToTimelineKind(action: string): TimelineEventRow["kind"] {
  const a = action.toUpperCase();
  if (a.includes("AI") || a.includes("RECOMMEND")) return "ai";
  if (a.includes("APPROVE") || a.includes("REJECT")) return "approval";
  if (a.includes("DOCUMENT") || a.includes("UPLOAD") || a.includes("RECORD_EDIT"))
    return "document";
  if (a.includes("INTEGRATION") || a.includes("SYNC") || a.includes("API"))
    return "integration";
  if (a.includes("CANDIDATE") || a.includes("CONSULTANT")) return "candidate";
  return "human";
}

function auditEventsToTimeline(
  events: DbConsultantFull["auditEvents"],
): TimelineEventRow[] {
  return events.map((ev) => ({
    id: ev.id,
    time: relativeTime(ev.timestamp),
    kind: auditToTimelineKind(ev.action),
    title: ev.action.replace(/_/g, " ").toLowerCase().replace(/^./, (s) => s.toUpperCase()),
    detail:
      ev.newValue ??
      ev.entityLabel ??
      (ev.actor ? `by ${ev.actor}` : undefined),
  }));
}

// ─────────────────────────────────────────────────────────
// DB-backed Assignments tab
// ─────────────────────────────────────────────────────────

function DbAssignments({
  assignments,
  consultantTitle,
  clientName,
}: {
  assignments: DbConsultantFull["assignments"];
  consultantTitle: string;
  clientName: string;
}) {
  const rows: AssignmentRow[] = assignments.map((a) => ({
    id: a.id,
    client: clientName,
    role: a.jobTitle ?? consultantTitle,
    start: a.startDate?.toLocaleDateString() ?? "—",
    end: a.endDate?.toLocaleDateString() ?? "Present",
    status:
      a.status === "active"
        ? "Active"
        : a.status === "extended"
          ? "Extended"
          : "Completed",
  }));

  if (!rows.length) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        No assignments on file yet.
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="border-b px-4 py-3">
        <h3 className="text-card-heading">Assignment history</h3>
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead>
            <tr className="text-muted-foreground border-b">
              {["Client", "Role", "Start", "End", "Status"].map((h, i) => (
                <th
                  key={i}
                  className="px-4 font-medium whitespace-nowrap"
                  style={{ height: "var(--row-h)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a.id}
                className="border-b last:border-0"
                style={{ height: "var(--row-h)" }}
              >
                <td className="px-4 font-medium whitespace-nowrap">{a.client}</td>
                <td className="text-muted-foreground px-4 whitespace-nowrap">{a.role}</td>
                <td className="text-muted-foreground px-4 tabular-nums whitespace-nowrap">{a.start}</td>
                <td className="text-muted-foreground px-4 tabular-nums whitespace-nowrap">{a.end}</td>
                <td className="px-4">
                  <StatusBadge tone={ASSIGNMENT_STATUS_TONE[a.status]}>
                    {a.status}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mock assignment history (fallback)
// ─────────────────────────────────────────────────────────

function MockAssignments({ c }: { c: Consultant }) {
  const a1Status: AssignmentRow["status"] =
    c.status === "Active" || c.status === "Extension Pending" ? "Active" : "Completed";
  const a2Status: AssignmentRow["status"] = c.extensions > 0 ? "Extended" : "Completed";
  const all: AssignmentRow[] = [
    { id: "a1", client: c.client, role: c.role, start: c.startDate, end: c.endDate ?? "Present", status: a1Status },
    { id: "a2", client: c.assignments >= 2 ? "Vertex Financial" : c.client, role: c.role, start: "2023-04-01", end: "2023-12-15", status: a2Status },
    { id: "a3", client: "Cobalt Systems", role: c.role, start: "2022-08-10", end: "2023-03-28", status: "Completed" },
  ];
  const rows = all.slice(0, Math.min(c.assignments, 3));

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="border-b px-4 py-3">
        <h3 className="text-card-heading">Assignment history</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
          <thead>
            <tr className="text-muted-foreground border-b">
              {["Client", "Role", "Start", "End", "Status"].map((h, i) => (
                <th key={i} className="px-4 font-medium whitespace-nowrap" style={{ height: "var(--row-h)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b last:border-0" style={{ height: "var(--row-h)" }}>
                <td className="px-4 font-medium whitespace-nowrap">{a.client}</td>
                <td className="text-muted-foreground px-4 whitespace-nowrap">{a.role}</td>
                <td className="text-muted-foreground px-4 tabular-nums whitespace-nowrap">{a.start}</td>
                <td className="text-muted-foreground px-4 tabular-nums whitespace-nowrap">{a.end}</td>
                <td className="px-4"><StatusBadge tone={ASSIGNMENT_STATUS_TONE[a.status]}>{a.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DB-backed Documents tab
// ─────────────────────────────────────────────────────────

function DbDocuments({
  documents,
}: {
  documents: DbConsultantFull["documents"];
}) {
  const rows = documents.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    status: d.status,
    uploadedAt: d.uploadedAt,
    reviewedAt: d.reviewedAt,
    reviewedBy: d.reviewedBy,
    expiresAt: d.expiresAt,
    aiScore: d.aiScore,
    rejectedReason: d.rejectedReason,
  }));
  return (
    <DocumentsTable
      documents={rows}
      emptyLabel="No documents have been recorded for this consultant yet."
    />
  );
}

// ─────────────────────────────────────────────────────────
// DB-backed Communications tab
// ─────────────────────────────────────────────────────────

const DB_CHANNEL_ICON: Record<string, typeof Mail> = {
  EMAIL: Mail,
  SMS: MessageSquare,
  PORTAL: Globe,
  VOICE: Phone,
  INTERNAL: User,
};

const DB_COMM_STATUS_TONE: Record<string, StatusTone> = {
  sent: "info",
  delivered: "success",
  opened: "success",
  replied: "success",
  bounced: "warning",
  failed: "danger",
  scheduled: "neutral",
};

function DbCommunications({
  communications,
}: {
  communications: DbConsultantFull["communications"];
}) {
  if (!communications.length) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        <MessageSquare className="text-muted-foreground mx-auto mb-2 size-6" />
        No communications recorded for this consultant yet.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-card-heading">Communication timeline</h3>
        <span className="text-metadata">
          {communications.length} message
          {communications.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ol className="flex flex-col">
        {communications.map((c, i) => {
          const Icon = DB_CHANNEL_ICON[c.channel] ?? Mail;
          const last = i === communications.length - 1;
          const statusKey = (c.status ?? "sent").toLowerCase();
          const tone = DB_COMM_STATUS_TONE[statusKey] ?? "neutral";
          const when = c.sentAt ?? c.createdAt;
          return (
            <li key={c.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="bg-info-muted text-info-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </span>
                {!last && <span className="bg-border my-1 w-0.5 flex-1" />}
              </div>
              <div className={cn("min-w-0 pb-5", last && "pb-0")}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">
                    {c.subject ?? "(no subject)"}
                  </p>
                  <StatusBadge tone={tone}>{statusKey}</StatusBadge>
                  {c.nudgeLevel != null && c.nudgeLevel > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Nudge level {c.nudgeLevel}
                    </Badge>
                  )}
                </div>
                {c.body && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
                    {c.body}
                  </p>
                )}
                <p className="text-metadata mt-1">
                  <span className="capitalize">
                    {c.channel.toLowerCase()}
                  </span>
                  {c.sentBy && <> · by {c.sentBy}</>}
                  {when && (
                    <span className="tabular-nums"> · {relativeTime(when)}</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mock fallback — Documents
// ─────────────────────────────────────────────────────────

function matchByName<T extends { candidateName: string }>(
  records: T[],
  consultantName: string,
): T[] {
  const target = consultantName.trim().toLowerCase();
  return records.filter((r) => r.candidateName.trim().toLowerCase() === target);
}

const MOCK_STATUS_TO_ENUM: Record<MockDocument["status"], string> = {
  pending: "PENDING",
  submitted: "SUBMITTED",
  "ai-review": "AI_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  expired: "EXPIRED",
  "correction-required": "CORRECTION_REQUIRED",
};

function MockDocuments({ consultantName }: { consultantName: string }) {
  const docs: MockDocument[] = matchByName(DOCUMENTS, consultantName).sort(
    (a, b) => {
      const ad = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
      const bd = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
      return bd - ad;
    },
  );

  const rows = docs.map((d) => ({
    id: d.id,
    name: d.docType,
    category: d.category,
    status: MOCK_STATUS_TO_ENUM[d.status] ?? "PENDING",
    uploadedAt: d.submittedDate ?? null,
    reviewedAt: d.reviewedDate ?? null,
    reviewedBy: d.reviewer ?? null,
    expiresAt: d.expiresDate ?? null,
    aiScore: d.aiScore ?? null,
    rejectedReason: d.rejectionReason ?? null,
  }));

  return (
    <DocumentsTable
      documents={rows}
      emptyLabel="Onboarding documents from this consultant's onboarding will appear here. Migrate this consultant to the live database to populate."
    />
  );
}

// ─────────────────────────────────────────────────────────
// Mock fallback — Communications
// ─────────────────────────────────────────────────────────

const MOCK_CHANNEL_ICON: Record<CommChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  portal: Globe,
  voice: Phone,
};

function MockCommunications({ consultantName }: { consultantName: string }) {
  const comms: CommunicationRecord[] = matchByName(
    COMMUNICATIONS,
    consultantName,
  ).sort((a, b) => {
    const ad = a.sentAt ?? a.scheduledFor ?? "";
    const bd = b.sentAt ?? b.scheduledFor ?? "";
    return bd.localeCompare(ad);
  });

  if (!comms.length) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        <MessageSquare className="text-muted-foreground mx-auto mb-2 size-6" />
        <p className="mb-1">
          Onboarding documents and communications from this consultant&rsquo;s
          onboarding will appear here.
        </p>
        <p className="text-metadata">
          Migrate this consultant to the live database to populate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-card-heading">Communication timeline</h3>
        <span className="text-metadata">
          {comms.length} message{comms.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ol className="flex flex-col">
        {comms.map((c, i) => {
          const Icon = MOCK_CHANNEL_ICON[c.channel] ?? Mail;
          const meta = COMM_STATUS_META[c.status];
          const channelMeta = CHANNEL_META[c.channel];
          const last = i === comms.length - 1;
          return (
            <li key={c.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="bg-info-muted text-info-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </span>
                {!last && <span className="bg-border my-1 w-0.5 flex-1" />}
              </div>
              <div className={cn("min-w-0 pb-5", last && "pb-0")}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{c.subject}</p>
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  {c.isNudge && c.nudgeLevel != null && c.nudgeLevel > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Nudge level {c.nudgeLevel}
                    </Badge>
                  )}
                </div>
                {c.templateName && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
                    {c.templateName}
                  </p>
                )}
                <p className="text-metadata mt-1">
                  {channelMeta.label}
                  {c.sentBy && <> · by {c.sentBy}</>}
                  {(c.sentAt ?? c.scheduledFor) && (
                    <span className="tabular-nums">
                      {" "}
                      · {c.sentAt ?? `scheduled ${c.scheduledFor}`}
                    </span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function ConsultantRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // DB-first, mock fallback
  const dbFull = await getDbConsultantFull(id).catch(() => null);
  let c: Consultant | undefined;
  if (dbFull) {
    c = dbConsultantToUI(dbFull);
  } else {
    c = getConsultant(id);
  }
  if (!c) notFound();

  const meta = CONSULTANT_STATUS_META[c.status];
  const initials = c.name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="flex flex-col">
      {/* Sticky context header */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 border-b backdrop-blur">
        <PageContainer className="py-3">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            nativeButton={false}
            render={<Link href="/consultants" />}
          >
            <ArrowLeft className="size-4" /> Consultants
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-workspace-title">{c.name}</h1>
                {dbFull && (
                  <Badge variant="secondary" className="text-[10px] text-success">
                    ● Live
                  </Badge>
                )}
                <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                <Badge variant="secondary">{c.employmentType}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {c.role} · {c.client} · {c.location}
              </p>
            </div>
            {dbFull && (
              <div className="ml-auto flex items-center gap-2">
                <EditConsultantSheet
                  consultant={{
                    id: dbFull.id,
                    firstName: dbFull.firstName,
                    lastName: dbFull.lastName,
                    email: dbFull.email,
                    phone: dbFull.phone,
                    title: dbFull.title,
                    status: dbFull.status,
                    employmentType: dbFull.employmentType,
                    billRate: dbFull.billRate,
                    payRate: dbFull.payRate,
                    startDate: dbFull.startDate,
                    endDate: dbFull.endDate,
                    location: dbFull.location,
                    notes: dbFull.notes,
                  }}
                />
              </div>
            )}
          </div>
        </PageContainer>
      </div>

      <PageContainer className="flex flex-col gap-5 pt-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={DollarSign} label="Bill Rate" value={fmt(c.billRate)} tone="default" />
          <StatTile icon={DollarSign} label="Pay Rate" value={fmt(c.payRate)} tone="default" />
          <StatTile icon={Briefcase} label="Total Assignments" value={c.assignments} tone="info" />
          <StatTile icon={Star} label="Satisfaction" value={c.satisfactionScore.toFixed(1)} suffix="/ 5" tone="success" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks
              <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                0
              </span>
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {(() => {
                const count = dbFull
                  ? dbFull.documents.length
                  : matchByName(DOCUMENTS, c.name).length;
                return count > 0 ? (
                  <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                    {count}
                  </span>
                ) : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="communications">
              Communications
              {(() => {
                const count = dbFull
                  ? dbFull.communications.length
                  : matchByName(COMMUNICATIONS, c.name).length;
                return count > 0 ? (
                  <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                    {count}
                  </span>
                ) : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="screening">
              Screening
              {dbFull && dbFull.screenings.length > 0 && (
                <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                  {dbFull.screenings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="equipment">
              Equipment
              {dbFull && dbFull.equipment.length > 0 && (
                <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                  {dbFull.equipment.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="training">
              Training
              {dbFull && dbFull.training.length > 0 && (
                <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                  {dbFull.training.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments">
              Assignments
              {dbFull && (
                <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                  {dbFull.assignments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit">
              Audit
              {dbFull && dbFull.auditEvents.length > 0 && (
                <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                  {dbFull.auditEvents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <h3 className="text-card-heading mb-2">Contact information</h3>
                  <InfoRow icon={Mail} label="Email" value={c.email} />
                  <InfoRow icon={Phone} label="Phone" value={c.phone} />
                  <InfoRow icon={MapPin} label="Location" value={c.location} />
                </div>
                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <h3 className="text-card-heading mb-2">Assignment details</h3>
                  <InfoRow icon={Calendar} label="Start date" value={c.startDate} />
                  {c.endDate && (
                    <InfoRow icon={Calendar} label="End date" value={c.endDate} />
                  )}
                  <InfoRow icon={Building2} label="Client" value={c.client} />
                  <InfoRow icon={User} label="Account Mgr" value={c.accountManager} />
                  <InfoRow icon={User} label="Recruiter" value={c.recruiter} />
                  {c.vendor && (
                    <InfoRow
                      icon={Handshake}
                      label="Vendor"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          {c.vendor}
                          <Badge variant="secondary" className="text-[10px]">C2C</Badge>
                        </span>
                      }
                    />
                  )}
                  <InfoRow
                    icon={DollarSign}
                    label="Bill rate"
                    value={<span className="tabular-nums">{fmt(c.billRate)}</span>}
                  />
                  <InfoRow
                    icon={DollarSign}
                    label="Pay rate"
                    value={<span className="tabular-nums">{fmt(c.payRate)}</span>}
                  />
                  <InfoRow icon={Briefcase} label="Rate type" value={c.rateType} />
                  <div className="mt-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-data-label">Status</span>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {c.tags.length > 0 && (
                  <div className="bg-card rounded-xl border p-4 shadow-xs">
                    <h3 className="text-card-heading mb-2 flex items-center gap-1.5">
                      <Tag className="size-4" /> Tags / Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <h3 className="text-card-heading mb-3">Extension history</h3>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm">Total assignments</span>
                    <span className="font-semibold tabular-nums">{c.assignments}</span>
                  </div>
                  {c.endDate && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-sm">Current end date</span>
                      <span className="font-semibold tabular-nums">{c.endDate}</span>
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <h3 className="text-card-heading mb-3">Satisfaction score</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold tabular-nums">
                      {c.satisfactionScore.toFixed(1)}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-4",
                              star <= Math.round(c.satisfactionScore)
                                ? "text-warning fill-current"
                                : "text-muted-foreground",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-metadata mt-0.5">
                        Based on {c.assignments} assignment{c.assignments !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {dbFull?.notes && (
                  <div className="bg-card rounded-xl border p-4 shadow-xs">
                    <h3 className="text-card-heading mb-2">Notes</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{dbFull.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Timeline — built from merged audit events */}
          <TabsContent value="timeline" className="mt-4">
            {dbFull && dbFull.auditEvents.length > 0 ? (
              <div className="bg-card rounded-xl border p-4 shadow-xs">
                <h3 className="text-card-heading mb-3">Activity timeline</h3>
                <Timeline events={auditEventsToTimeline(dbFull.auditEvents)} />
              </div>
            ) : (
              <Placeholder module="Activity timeline" version="v0.6" />
            )}
          </TabsContent>

          {/* Tasks — consultants don't yet have a task source */}
          <TabsContent value="tasks" className="mt-4">
            <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
              No open tasks for this consultant.
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-4">
            {dbFull ? (
              <DbDocuments documents={dbFull.documents} />
            ) : (
              <MockDocuments consultantName={c.name} />
            )}
          </TabsContent>

          {/* Communications */}
          <TabsContent value="communications" className="mt-4">
            {dbFull ? (
              <DbCommunications communications={dbFull.communications} />
            ) : (
              <MockCommunications consultantName={c.name} />
            )}
          </TabsContent>

          {/* Screening */}
          <TabsContent value="screening" className="mt-4">
            {dbFull ? (
              <DbScreening screenings={dbFull.screenings} />
            ) : (
              <Placeholder module="Background check & screening" version="v0.5" />
            )}
          </TabsContent>

          {/* Payroll */}
          <TabsContent value="payroll" className="mt-4">
            {dbFull ? (
              <DbPayroll payroll={dbFull.payroll} />
            ) : (
              <Placeholder module="Payroll readiness" version="v0.5" />
            )}
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="mt-4">
            {dbFull ? (
              <DbBilling billing={dbFull.billing} />
            ) : (
              <Placeholder module="Billing readiness" version="v0.5" />
            )}
          </TabsContent>

          {/* Equipment */}
          <TabsContent value="equipment" className="mt-4">
            {dbFull ? (
              <DbEquipment equipment={dbFull.equipment} />
            ) : (
              <Placeholder module="Equipment & IT provisioning" version="v0.5" />
            )}
          </TabsContent>

          {/* Training */}
          <TabsContent value="training" className="mt-4">
            {dbFull ? (
              <DbTraining training={dbFull.training} />
            ) : (
              <Placeholder module="Training & certifications" version="v0.6" />
            )}
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="mt-4">
            {dbFull ? (
              <DbAssignments
                assignments={dbFull.assignments}
                consultantTitle={dbFull.title ?? "Consultant"}
                clientName={dbFull.clientName ?? "Unknown"}
              />
            ) : (
              <MockAssignments c={c} />
            )}
          </TabsContent>

          {/* Audit */}
          <TabsContent value="audit" className="mt-4">
            {dbFull ? (
              <DbAudit events={dbFull.auditEvents} />
            ) : (
              <Placeholder module="Audit & evidence" version="v0.2" />
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
