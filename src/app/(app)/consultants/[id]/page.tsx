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
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Star,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/workspace/stat-tile";
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

type LifecycleEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  kind: "milestone" | "rate" | "extension" | "start" | "end";
};

const ASSIGNMENT_STATUS_TONE: Record<
  AssignmentRow["status"],
  "success" | "info" | "warning"
> = {
  Completed: "success",
  Active: "info",
  Extended: "warning",
};

const LIFECYCLE_COLORS: Record<LifecycleEvent["kind"], string> = {
  start: "bg-success-muted text-success-muted-foreground",
  milestone: "bg-info-muted text-info-muted-foreground",
  extension: "bg-warning-muted text-warning-muted-foreground",
  rate: "bg-neutral-muted text-neutral-muted-foreground",
  end: "bg-danger-muted text-danger-muted-foreground",
};

const LIFECYCLE_ICON: Record<LifecycleEvent["kind"], typeof CheckCircle2> = {
  start: CheckCircle2,
  milestone: Star,
  extension: ArrowUpRight,
  rate: TrendingUp,
  end: Clock,
};

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
// DB-backed Audit/Lifecycle tab
// ─────────────────────────────────────────────────────────

function DbLifecycle({
  auditEvents,
}: {
  auditEvents: DbConsultantFull["auditEvents"];
}) {
  if (!auditEvents.length) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        No lifecycle events recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <h3 className="text-card-heading mb-4">Lifecycle timeline</h3>
      <ol className="flex flex-col">
        {auditEvents.map((ev, i) => {
          const last = i === auditEvents.length - 1;
          const action = ev.action.toLowerCase().replace("_", " ");
          return (
            <li key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="bg-info-muted text-info-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                  <CheckCircle2 className="size-4" />
                </span>
                {!last && <span className="bg-border my-1 w-0.5 flex-1" />}
              </div>
              <div className={cn("pb-5 min-w-0", last && "pb-0")}>
                <p className="text-sm font-semibold capitalize">{action}</p>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                  {ev.newValue ?? ev.entityLabel ?? "System event"}
                  {ev.actor && (
                    <span className="text-metadata"> · by {ev.actor}</span>
                  )}
                </p>
                <p className="text-metadata mt-1 tabular-nums">
                  {relativeTime(ev.timestamp)}
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

function MockLifecycle({ c }: { c: Consultant }) {
  const lifecycle: LifecycleEvent[] = [
    { id: "lc1", date: c.startDate, title: "Onboarding completed", detail: `Successfully onboarded to ${c.client}. Package approved by ${c.accountManager}.`, kind: "start" },
    { id: "lc2", date: "2023-09-15", title: "Day 30 check-in completed", detail: `Satisfaction score recorded: ${c.satisfactionScore}/5. Client feedback positive.`, kind: "milestone" },
    ...(c.extensions > 0 ? [{ id: "lc3", date: "2024-01-08", title: "Assignment extended", detail: `Extension approved by ${c.accountManager}. Duration: +6 months.`, kind: "extension" as const }] : []),
    { id: "lc4", date: "2024-04-01", title: "Rate adjustment", detail: `Bill rate updated to ${fmt(c.billRate)}. Approved by ${c.accountManager}.`, kind: "rate" },
    ...(c.status === "Offboarding" || c.status === "Former" || c.status === "Converted"
      ? [{ id: "lc5", date: c.endDate ?? "2025-06-01", title: c.status === "Converted" ? "Converted to full-time employee" : c.status === "Former" ? "Assignment completed" : "Offboarding initiated", detail: c.status === "Converted" ? "Client conversion finalised. Conversion fee processed." : "Equipment return and access removal in progress.", kind: "end" as const }]
      : []),
  ];

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <h3 className="text-card-heading mb-4">Lifecycle timeline</h3>
      <ol className="flex flex-col">
        {lifecycle.map((ev, i) => {
          const Icon = LIFECYCLE_ICON[ev.kind];
          const last = i === lifecycle.length - 1;
          return (
            <li key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", LIFECYCLE_COLORS[ev.kind])}>
                  <Icon className="size-4" />
                </span>
                {!last && <span className="bg-border my-1 w-0.5 flex-1" />}
              </div>
              <div className={cn("pb-5 min-w-0", last && "pb-0")}>
                <p className="text-sm font-semibold">{ev.title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{ev.detail}</p>
                <p className="text-metadata mt-1 tabular-nums">{ev.date}</p>
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
            <TabsTrigger value="assignments">
              Assignments
              {dbFull && (
                <span className="bg-muted ml-1.5 rounded px-1.5 py-0.5 text-[10px] tabular-nums">
                  {dbFull.assignments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="lifecycle">
              {dbFull ? "Audit & Lifecycle" : "Lifecycle"}
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

          {/* Lifecycle / Audit */}
          <TabsContent value="lifecycle" className="mt-4">
            {dbFull ? (
              <DbLifecycle auditEvents={dbFull.auditEvents} />
            ) : (
              <MockLifecycle c={c} />
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
