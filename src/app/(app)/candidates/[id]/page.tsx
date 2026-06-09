import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Handshake,
  Info,
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
  StatusDot,
} from "@/components/status-badge";
import { DocumentsTable } from "@/components/documents/documents-table";
import { ProgressRing } from "@/components/portal/progress-ring";
import {
  getCandidate,
  type CandidateDetail,
  type CandidateDocument,
  type ReadinessDimension,
} from "@/lib/candidates";
import {
  getDbCandidateFull,
  dbToSummary,
  type DbCandidateFull,
} from "@/lib/db-candidates";
import { Placeholder } from "@/components/360/placeholder";
import { TaskList } from "@/components/360/task-list";
import { Timeline } from "@/components/360/timeline";
import { DbScreening } from "@/components/360/db-screening";
import { DbTraining } from "@/components/360/db-training";
import { DbEquipment } from "@/components/360/db-equipment";
import { DbPayroll } from "@/components/360/db-payroll";
import { DbBilling } from "@/components/360/db-billing";
import { DbAudit } from "@/components/360/db-audit";
import { getCandidateAiSummary, getRecommendations } from "@/lib/ai";
import { CandidateAiPanel } from "@/components/ai/candidate-ai-panel";
import { InitiateOnboardingButton } from "@/app/(app)/candidates/[id]/initiate-button";
import { EditCandidateSheet } from "@/components/candidates/edit-candidate-sheet";
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

/** Map mock CandidateDocument.status to the Prisma DocumentStatus enum used by DocumentsTable. */
function mockDocStatusToEnum(s: CandidateDocument["status"]): string {
  switch (s) {
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "in-review":
      return "AI_REVIEW";
    case "pending":
    default:
      return "PENDING";
  }
}

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

// ─────────────────────────────────────────────────────────
// DB-backed tab sections
// ─────────────────────────────────────────────────────────

function DbDocuments({ docs }: { docs: DbCandidateFull["documents"] }) {
  const rows = docs.map((d) => ({
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
  return <DocumentsTable documents={rows} />;
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
              {!dbCandidate && (
                <div className="border-warning/30 bg-warning/5 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                  <Info className="text-warning-muted-foreground size-3.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Read-only · mock record (not in database)
                  </span>
                </div>
              )}
              {dbCandidate && (
                <EditCandidateSheet
                  candidate={{
                    id: dbCandidate.id,
                    firstName: dbCandidate.firstName,
                    lastName: dbCandidate.lastName,
                    email: dbCandidate.email,
                    phone: dbCandidate.phone,
                    status: dbCandidate.status,
                    risk: dbCandidate.risk,
                    stage: dbCandidate.stage,
                    employmentType: dbCandidate.employmentType,
                    workLocation: dbCandidate.workLocation,
                    startDate: dbCandidate.startDate,
                    clientName: dbCandidate.clientName,
                    recruiter: dbCandidate.recruiter,
                    onboarder: dbCandidate.onboarder,
                    vendor: dbCandidate.vendor,
                    notes: dbCandidate.notes,
                    street: dbCandidate.street,
                    city: dbCandidate.city,
                    state: dbCandidate.state,
                    zip: dbCandidate.zip,
                  }}
                />
              )}
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
                  <DocumentsTable
                    documents={c.documents.map((d) => ({
                      id: d.id,
                      name: d.name,
                      category: d.type,
                      status: mockDocStatusToEnum(d.status),
                      uploadedAt: d.updated,
                    }))}
                  />
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
