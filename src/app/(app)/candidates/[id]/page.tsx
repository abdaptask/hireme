import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Handshake,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PipelineStatusBadge,
  RiskBadge,
  StatusBadge,
  StatusDot,
} from "@/components/status-badge";
import { ProgressRing } from "@/components/portal/progress-ring";
import {
  getCandidate,
  type CandidateDetail,
  type ReadinessDimension,
  type TimelineEvent,
} from "@/lib/candidates";
import {
  getDbCandidateFull,
  dbToSummary,
  mapDocStatus,
  relativeTime,
  type DbCandidateFull,
} from "@/lib/db-candidates";
import { getCandidateAiSummary, getRecommendations } from "@/lib/ai";
import { CandidateAiPanel } from "@/components/ai/candidate-ai-panel";
import { InitiateOnboardingButton } from "@/app/(app)/candidates/[id]/initiate-button";
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
  // Try DB first, then mock
  const db = await getDbCandidateFull(id).catch(() => null);
  if (db) return { title: `${db.firstName} ${db.lastName}` };
  const mock = getCandidate(id);
  return { title: mock ? mock.name : "Candidate" };
}

// ─────────────────────────────────────────────────────────
// Static display maps
// ─────────────────────────────────────────────────────────

const TONE_BAR: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  ai: "bg-ai",
  neutral: "bg-neutral",
};

const DOC_STATUS_META = {
  approved: { tone: "success" as const, label: "Approved" },
  "in-review": { tone: "info" as const, label: "In review" },
  rejected: { tone: "danger" as const, label: "Rejected" },
  pending: { tone: "neutral" as const, label: "Pending" },
};

const TRAINING_STATUS_META: Record<string, { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  COMPLETED: { tone: "success", label: "Completed" },
  STARTED: { tone: "info", label: "In progress" },
  ASSIGNED: { tone: "neutral", label: "Assigned" },
  OVERDUE: { tone: "danger", label: "Overdue" },
  FAILED: { tone: "danger", label: "Failed" },
  WAIVED: { tone: "neutral", label: "Waived" },
  EXPIRING: { tone: "warning", label: "Expiring" },
};

const SCREENING_STATUS_META: Record<string, { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  ORDERED: { tone: "neutral", label: "Ordered" },
  INVITED: { tone: "info", label: "Invited" },
  CONSENTED: { tone: "info", label: "Consented" },
  IN_PROGRESS: { tone: "info", label: "In progress" },
  INFO_REQUIRED: { tone: "warning", label: "Info required" },
  VENDOR_DELAYED: { tone: "warning", label: "Vendor delayed" },
  CLEAR: { tone: "success", label: "Clear" },
  REVIEW_REQUIRED: { tone: "danger", label: "Review required" },
  ADVERSE_PENDING: { tone: "danger", label: "Adverse pending" },
};

const EQUIP_STATUS_META: Record<string, { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  REQUESTED: { tone: "neutral", label: "Requested" },
  APPROVED: { tone: "info", label: "Approved" },
  ASSIGNED: { tone: "info", label: "Assigned" },
  SHIPPED: { tone: "info", label: "Shipped" },
  DELIVERED: { tone: "success", label: "Delivered" },
  ENROLLED: { tone: "success", label: "Enrolled" },
  READY: { tone: "success", label: "Ready" },
  DELAYED: { tone: "warning", label: "Delayed" },
  RETURN_REQUIRED: { tone: "warning", label: "Return required" },
  RETURNED: { tone: "neutral", label: "Returned" },
  LOST: { tone: "danger", label: "Lost" },
  DAMAGED: { tone: "danger", label: "Damaged" },
};

const TIMELINE_ICON: Record<TimelineEvent["kind"], typeof User> = {
  candidate: User,
  human: User,
  ai: Bot,
  integration: ArrowRight,
  document: FileText,
  approval: CheckCircle2,
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function ReadinessRadar({ dims }: { dims: ReadinessDimension[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {dims.map((d) => (
        <div key={d.label} className="bg-muted/40 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-data-label">{d.label}</span>
            <StatusDot tone={d.tone} />
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums">{d.value}%</p>
          <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
            <span
              className={cn("block h-full rounded-full", TONE_BAR[d.tone])}
              style={{ width: `${d.value}%` }}
            />
          </div>
          <p className="text-metadata mt-1 truncate">{d.note}</p>
        </div>
      ))}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground w-24 shrink-0 text-xs">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function Placeholder({ module, version }: { module: string; version: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-sm">
      <Sparkles className="mb-2 size-5" />
      <p className="text-foreground font-medium">{module}</p>
      <p className="mt-1">Full detail arrives with this module ({version}).</p>
    </div>
  );
}

function TaskList({ tasks }: { tasks: CandidateDetail["tasks"] }) {
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{t.title}</span>
            <span className="text-metadata">
              {t.owner} · {t.due}
            </span>
          </span>
          <PipelineStatusBadge status={t.status} />
          <ChevronRight className="text-muted-foreground size-4" />
        </li>
      ))}
    </ul>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const Icon = TIMELINE_ICON[e.kind];
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  e.kind === "ai"
                    ? "bg-ai-muted text-ai-muted-foreground border-transparent"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              {!last && <span className="bg-border my-0.5 w-0.5 flex-1" />}
            </div>
            <div className={cn("pb-4", last && "pb-0")}>
              <p className="text-sm font-medium">{e.title}</p>
              {e.detail && (
                <p className="text-muted-foreground text-xs">{e.detail}</p>
              )}
              <p className="text-metadata mt-0.5">{e.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────
// DB-backed tab sections
// ─────────────────────────────────────────────────────────

function DbDocuments({ docs }: { docs: DbCandidateFull["documents"] }) {
  if (!docs.length) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        No documents on file yet.
      </div>
    );
  }
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="px-4 py-2 font-medium">Document</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => {
            const meta = DOC_STATUS_META[mapDocStatus(d.status)];
            const uploaded = d.uploadedAt
              ? relativeTime(d.uploadedAt)
              : "—";
            return (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">{d.name}</td>
                <td className="text-muted-foreground px-4 py-2.5 capitalize">
                  {d.category}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">{uploaded}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DbScreening({ screenings }: { screenings: DbCandidateFull["screenings"] }) {
  if (!screenings.length) return <Placeholder module="Background check & screening" version="v0.5" />;
  return (
    <div className="flex flex-col gap-3">
      {screenings.map((s) => {
        const meta = SCREENING_STATUS_META[s.status] ?? { tone: "neutral" as const, label: s.status };
        return (
          <div key={s.id} className="bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{s.packageType ?? "Background Check"}</p>
                <p className="text-muted-foreground text-xs">Vendor: {s.vendor}</p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            {s.notes && (
              <p className="text-muted-foreground mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                {s.notes}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {s.orderedAt && (
                <div>
                  <p className="text-data-label">Ordered</p>
                  <p className="font-medium">{s.orderedAt.toLocaleDateString()}</p>
                </div>
              )}
              {s.estimatedCompletion && (
                <div>
                  <p className="text-data-label">Est. completion</p>
                  <p className="font-medium">{s.estimatedCompletion.toLocaleDateString()}</p>
                </div>
              )}
              {s.cost != null && (
                <div>
                  <p className="text-data-label">Cost</p>
                  <p className="font-medium">${s.cost.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DbTraining({ training }: { training: DbCandidateFull["training"] }) {
  if (!training.length) return <Placeholder module="Training & certifications" version="v0.6" />;
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="px-4 py-2 font-medium">Course</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Due / Completed</th>
          </tr>
        </thead>
        <tbody>
          {training.map((t) => {
            const meta = TRAINING_STATUS_META[t.status] ?? { tone: "neutral" as const, label: t.status };
            const dateLabel = t.completedAt
              ? t.completedAt.toLocaleDateString()
              : t.dueDate
                ? t.dueDate.toLocaleDateString()
                : "—";
            return (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">{t.title}</td>
                <td className="text-muted-foreground px-4 py-2.5 capitalize">{t.category}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">{dateLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DbEquipment({ equipment }: { equipment: DbCandidateFull["equipment"] }) {
  if (!equipment.length) return <Placeholder module="Equipment & IT provisioning" version="v0.5" />;
  return (
    <div className="flex flex-col gap-3">
      {equipment.map((e) => {
        const meta = EQUIP_STATUS_META[e.status] ?? { tone: "neutral" as const, label: e.status };
        return (
          <div key={e.id} className="bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{e.label}</p>
                <p className="text-muted-foreground text-xs capitalize">{e.assetType}</p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            {e.trackingNumber && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-data-label">Tracking</p>
                  <p className="font-medium font-mono text-xs">{e.trackingNumber}</p>
                </div>
                {e.carrier && (
                  <div>
                    <p className="text-data-label">Carrier</p>
                    <p className="font-medium">{e.carrier}</p>
                  </div>
                )}
                {e.estimatedDelivery && (
                  <div>
                    <p className="text-data-label">Est. delivery</p>
                    <p className="font-medium">{e.estimatedDelivery.toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
            {/* IT access flags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "Email", ready: e.emailProvisioned },
                { label: "VPN", ready: e.vpnProvisioned },
                { label: "Client access", ready: e.clientCredentials },
                { label: "Enrolled", ready: e.deviceEnrolled },
              ].map(({ label, ready }) => (
                <span
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    ready
                      ? "bg-success-muted text-success-muted-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      ready ? "bg-success" : "bg-muted-foreground/40",
                    )}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DbPayroll({ payroll }: { payroll: DbCandidateFull["payroll"] }) {
  if (!payroll) return <Placeholder module="Payroll readiness" version="v0.5" />;

  const checks: { label: string; done: boolean }[] = [
    { label: "Employment classification", done: payroll.classification },
    { label: "Pay rate", done: payroll.payRate },
    { label: "Overtime rules", done: payroll.overtimeRules },
    { label: "Tax jurisdiction", done: payroll.taxJurisdiction },
    { label: "Direct deposit", done: payroll.directDeposit },
    { label: "Federal W-4", done: payroll.w4 },
    { label: "State tax form", done: payroll.stateTax },
    { label: "I-9", done: payroll.i9 },
    { label: "Benefits eligibility", done: payroll.benefitsEligibility },
    { label: "Payroll entity", done: payroll.payrollEntity },
    { label: "Start date confirmed", done: payroll.startDateSet },
  ];
  const readyCount = checks.filter((c) => c.done).length;
  const pct = Math.round((readyCount / checks.length) * 100);

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-card-heading">Payroll Readiness</h3>
        <StatusBadge tone={payroll.status === "READY" ? "success" : "warning"}>
          {pct}% · {payroll.status === "READY" ? "Ready" : "Not ready"}
        </StatusBadge>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                c.done ? "bg-success" : "bg-danger",
              )}
            />
            <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DbBilling({ billing }: { billing: DbCandidateFull["billing"] }) {
  if (!billing) return <Placeholder module="Billing readiness" version="v0.5" />;

  const checks: { label: string; done: boolean }[] = [
    { label: "Bill rate", done: billing.billRate },
    { label: "Markup", done: billing.markup },
    { label: "Purchase order", done: billing.purchaseOrder },
    { label: "Cost center", done: billing.costCenter },
    { label: "Client worker ID", done: billing.clientWorkerId },
    { label: "VMS ID", done: billing.vmsId },
    { label: "Invoice frequency", done: billing.invoiceFrequency },
    { label: "Timesheet method", done: billing.timesheetMethod },
    { label: "Expense policy", done: billing.expensePolicy },
    { label: "Billing entity", done: billing.billingEntity },
    { label: "Approved start date", done: billing.approvedStartDate },
  ];
  const readyCount = checks.filter((c) => c.done).length;
  const pct = Math.round((readyCount / checks.length) * 100);

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-card-heading">Billing / Client Readiness</h3>
        <StatusBadge tone={billing.status === "READY" ? "success" : "warning"}>
          {pct}% · {billing.status === "READY" ? "Ready" : "Not ready"}
        </StatusBadge>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                c.done ? "bg-success" : "bg-danger",
              )}
            />
            <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
      {billing.clientWorkerId2 && (
        <p className="text-muted-foreground mt-3 text-xs">
          Client worker ID: <span className="font-mono text-foreground">{billing.clientWorkerId2}</span>
        </p>
      )}
    </div>
  );
}

function DbAudit({ events }: { events: DbCandidateFull["auditEvents"] }) {
  if (!events.length) return <Placeholder module="Audit & evidence" version="v0.2" />;
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="px-4 py-2 font-medium">Action</th>
            <th className="px-4 py-2 font-medium">Actor</th>
            <th className="px-4 py-2 font-medium">Detail</th>
            <th className="px-4 py-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b last:border-0">
              <td className="px-4 py-2.5 font-medium capitalize">
                {e.action.toLowerCase().replace("_", " ")}
              </td>
              <td className="text-muted-foreground px-4 py-2.5">{e.actor}</td>
              <td className="text-muted-foreground px-4 py-2.5 max-w-xs truncate">
                {e.newValue ?? e.entityLabel ?? "—"}
              </td>
              <td className="text-muted-foreground px-4 py-2.5 whitespace-nowrap">
                {relativeTime(e.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function CandidateRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── Data resolution: DB-first, mock fallback ──────────
  const dbCandidate = await getDbCandidateFull(id).catch(() => null);

  // Build a CandidateDetail — from DB or mock
  let c: CandidateDetail | undefined;
  if (dbCandidate) {
    const summary = dbToSummary(dbCandidate);
    // Construct CandidateDetail from DB summary + mock-computed sections
    const mockDetail = getCandidate(id); // may return undefined for DB-only candidates
    c = {
      ...summary,
      nextBestAction: mockDetail?.nextBestAction ?? {
        title: "Review candidate progress",
        detail: `${summary.name} is in ${summary.stage}. ${summary.startInDays > 0 ? `Start date is ${summary.startDateLabel}.` : ""}`,
        cta: "Open tasks",
      },
      aiSummary: mockDetail?.aiSummary ??
        `${summary.name.split(" ")[0]} is in ${summary.stage} for ${summary.client} (${summary.employmentType}), starting ${summary.startDateLabel}. Risk is ${summary.risk.replace("-", " ")}; ${summary.progress}% complete.`,
      readiness: mockDetail?.readiness ?? [],
      timeline: mockDetail?.timeline ?? [],
      tasks: mockDetail?.tasks ?? [],
      documents: mockDetail?.documents ?? [],
      openExceptions: dbCandidate.exceptions.map((e) => ({
        id: e.id.slice(0, 8).toUpperCase(),
        title: e.title,
        tone: (e.severity === "HIGH" || e.severity === "CRITICAL" ? "danger" : "warning") as "danger" | "warning",
      })),
      extracted: mockDetail?.extracted ?? {
        family: (summary.role.includes("Engineer") || summary.role.includes("Developer")
          ? "Software & Cloud"
          : "Software & Cloud") as import("@/lib/types").SkillFamily,
        skills: dbCandidate.skills,
        confidence: dbCandidate.skillConfidence ?? 0.8,
      },
    };
  } else {
    c = getCandidate(id);
  }

  if (!c) notFound();

  // ── AI data ───────────────────────────────────────────
  const aiSummary = getCandidateAiSummary(id);
  const candidateRecommendations = getRecommendations().filter(
    (r) => r.candidateId === id,
  );

  const initials = c.name.split(" ").map((n) => n[0]).join("");

  // Open exceptions: prefer DB for DB candidates
  const openExceptions =
    dbCandidate && dbCandidate.exceptions.length > 0
      ? c.openExceptions
      : c.openExceptions;

  return (
    <div className="flex flex-col">
      {/* Context header (§97.3) */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 border-b backdrop-blur">
        <PageContainer className="py-3">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            nativeButton={false}
            render={<Link href="/candidates" />}
          >
            <ArrowLeft className="size-4" /> Candidates
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-workspace-title">{c.name}</h1>
                {dbCandidate && (
                  <Badge variant="secondary" className="text-[10px] text-success">
                    ● Live
                  </Badge>
                )}
                <PipelineStatusBadge status={c.status} />
                <RiskBadge level={c.risk} />
              </div>
              <p className="text-muted-foreground text-sm">
                {c.role} · {c.client} · {c.employmentType} · {c.location}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <InitiateOnboardingButton
                prefill={{
                  firstName: c.name.split(" ")[0],
                  lastName: c.name.split(" ").slice(1).join(" "),
                  candidateEmail: c.email,
                  mobile: c.phone,
                  client: c.client,
                  jobTitle: c.role,
                  employmentType:
                    c.employmentType === "C2C" ? "contract" : "full-time",
                }}
              />
              <Button size="sm">
                {c.nextBestAction.cta}
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="icon-sm" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="flex flex-col gap-5">
        {/* Next Best Action (§41.1) */}
        <section className="border-primary/30 bg-primary/5 mt-5 rounded-xl border p-4">
          <p className="text-data-label text-primary">Next best action</p>
          <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{c.nextBestAction.title}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {c.nextBestAction.detail}
              </p>
            </div>
            <Button className="shrink-0">
              {c.nextBestAction.cta}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>

        {/* Readiness Radar (§41.2) */}
        {c.readiness.length > 0 && (
          <section>
            <h2 className="text-section-heading mb-2.5">Readiness Radar</h2>
            <ReadinessRadar dims={c.readiness} />
          </section>
        )}

        {/* Three-part layout (§100.1) */}
        <div className="grid gap-5 lg:grid-cols-[260px_1fr_300px]">
          {/* Left column */}
          <aside className="flex flex-col gap-4">
            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <ProgressRing value={c.progress} size={64} stroke={7} />
                <div>
                  <p className="text-data-label">Onboarding</p>
                  <p className="text-sm font-medium">{c.stage}</p>
                  <p className="text-metadata">Last activity {c.lastActivity}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <h3 className="text-card-heading mb-1">Details</h3>
              <InfoRow icon={Mail} label="Email" value={c.email} />
              <InfoRow icon={Phone} label="Phone" value={c.phone} />
              <InfoRow icon={MapPin} label="Location" value={c.location} />
              <InfoRow
                icon={Calendar}
                label="Start date"
                value={`${c.startDateLabel} · ${c.startInDays}d`}
              />
              <InfoRow icon={User} label="Recruiter" value={c.recruiter} />
              <InfoRow icon={User} label="Onboarder" value={c.onboarder} />
              {c.vendor && (
                <InfoRow
                  icon={Handshake}
                  label="Vendor"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {c.vendor}
                      <Badge variant="secondary" className="text-[10px]">
                        C2C
                      </Badge>
                    </span>
                  }
                />
              )}
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <h3 className="text-card-heading mb-1 flex items-center gap-1.5">
                <Sparkles className="text-ai size-4" /> Skills
              </h3>
              <p className="text-metadata mb-2">
                AI-extracted · {c.extracted.family} ·{" "}
                {Math.round(c.extracted.confidence * 100)}% confidence
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.extracted.skills.map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            {c.tags.length > 0 && (
              <div className="bg-card rounded-xl border p-4 shadow-xs">
                <h3 className="text-card-heading mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Center workspace */}
          <div className="min-w-0">
            <Tabs defaultValue="overview">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                  {dbCandidate && dbCandidate.documents.length > 0 && (
                    <span className="bg-primary/20 ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums">
                      {dbCandidate.documents.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="screening">Screening</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
                <div className="bg-ai-muted/40 border-ai/20 rounded-xl border p-4">
                  <p className="text-ai-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="size-3.5" /> AI summary
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{c.aiSummary}</p>
                </div>
                {c.tasks.length > 0 && (
                  <div className="bg-card rounded-xl border p-4 shadow-xs">
                    <h3 className="text-card-heading mb-3">Open tasks</h3>
                    <TaskList tasks={c.tasks.slice(0, 3)} />
                  </div>
                )}
              </TabsContent>

              {/* Timeline */}
              <TabsContent value="timeline" className="mt-4">
                {c.timeline.length > 0 ? (
                  <div className="bg-card rounded-xl border p-4 shadow-xs">
                    <Timeline events={c.timeline} />
                  </div>
                ) : (
                  <Placeholder module="Activity timeline" version="v0.4" />
                )}
              </TabsContent>

              {/* Tasks */}
              <TabsContent value="tasks" className="mt-4">
                {c.tasks.length > 0 ? (
                  <div className="bg-card rounded-xl border p-4 shadow-xs">
                    <TaskList tasks={c.tasks} />
                  </div>
                ) : (
                  <Placeholder module="Task management" version="v0.4" />
                )}
              </TabsContent>

              {/* Documents — DB-backed for DB candidates */}
              <TabsContent value="documents" className="mt-4">
                {dbCandidate ? (
                  <DbDocuments docs={dbCandidate.documents} />
                ) : (
                  <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                    <table className="w-full text-left text-sm">
                      <thead className="text-muted-foreground border-b">
                        <tr>
                          <th className="px-4 py-2 font-medium">Document</th>
                          <th className="px-4 py-2 font-medium">Type</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                          <th className="px-4 py-2 font-medium">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.documents.map((d) => {
                          const meta = DOC_STATUS_META[d.status];
                          return (
                            <tr key={d.id} className="border-b last:border-0">
                              <td className="px-4 py-2.5 font-medium">{d.name}</td>
                              <td className="text-muted-foreground px-4 py-2.5">{d.type}</td>
                              <td className="px-4 py-2.5">
                                <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                              </td>
                              <td className="text-muted-foreground px-4 py-2.5">{d.updated}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Screening */}
              <TabsContent value="screening" className="mt-4">
                {dbCandidate ? (
                  <DbScreening screenings={dbCandidate.screenings} />
                ) : (
                  <Placeholder module="Background check & screening" version="v0.5" />
                )}
              </TabsContent>

              {/* Payroll */}
              <TabsContent value="payroll" className="mt-4">
                {dbCandidate ? (
                  <DbPayroll payroll={dbCandidate.payroll} />
                ) : (
                  <Placeholder module="Payroll readiness" version="v0.5" />
                )}
              </TabsContent>

              {/* Billing */}
              <TabsContent value="billing" className="mt-4">
                {dbCandidate ? (
                  <DbBilling billing={dbCandidate.billing} />
                ) : (
                  <Placeholder module="Billing readiness" version="v0.5" />
                )}
              </TabsContent>

              {/* Equipment */}
              <TabsContent value="equipment" className="mt-4">
                {dbCandidate ? (
                  <DbEquipment equipment={dbCandidate.equipment} />
                ) : (
                  <Placeholder module="Equipment & IT provisioning" version="v0.5" />
                )}
              </TabsContent>

              {/* Training */}
              <TabsContent value="training" className="mt-4">
                {dbCandidate ? (
                  <DbTraining training={dbCandidate.training} />
                ) : (
                  <Placeholder module="Training & certifications" version="v0.6" />
                )}
              </TabsContent>

              {/* Audit */}
              <TabsContent value="audit" className="mt-4">
                {dbCandidate ? (
                  <DbAudit events={dbCandidate.auditEvents} />
                ) : (
                  <Placeholder module="Audit & evidence" version="v0.2" />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right context panel (§100.1) */}
          <aside className="flex flex-col gap-4">
            {/* AI Summary & Recommendations (§105, §100.1) */}
            <CandidateAiPanel
              summary={aiSummary}
              recommendations={candidateRecommendations}
            />

            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <h3 className="text-card-heading mb-2">Open exceptions</h3>
              {openExceptions.length === 0 ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="text-success size-4" /> None open
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {openExceptions.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
                    >
                      <TriangleAlert
                        className={cn(
                          "size-4 shrink-0",
                          e.tone === "danger" ? "text-danger" : "text-warning",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {e.title}
                      </span>
                      <span className="text-metadata">{e.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <h3 className="text-card-heading mb-2">Upcoming deadlines</h3>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-center justify-between">
                  <span>Start date</span>
                  <span className="text-muted-foreground tabular-nums">
                    {c.startDateLabel}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Client approval</span>
                  <span className="text-muted-foreground">in 2 days</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Document SLA</span>
                  <span className="text-warning-muted-foreground">in 4 hours</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <h3 className="text-card-heading mb-2">Quick message</h3>
              <p className="text-muted-foreground mb-2 text-xs">
                Reach the candidate or team.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="size-4" /> Send message
              </Button>
            </div>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}
