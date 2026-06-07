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
import { InitiateOnboardingButton } from "@/app/(app)/candidates/[id]/initiate-button";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = getCandidate(id);
  return { title: c ? c.name : "Candidate" };
}

const TONE_BAR: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  ai: "bg-ai",
  neutral: "bg-neutral",
};

const DOC_STATUS = {
  approved: { tone: "success" as const, label: "Approved" },
  "in-review": { tone: "info" as const, label: "In review" },
  rejected: { tone: "danger" as const, label: "Rejected" },
  pending: { tone: "neutral" as const, label: "Pending" },
};

const TIMELINE_ICON: Record<TimelineEvent["kind"], typeof User> = {
  candidate: User,
  human: User,
  ai: Bot,
  integration: ArrowRight,
  document: FileText,
  approval: CheckCircle2,
};

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

export default async function CandidateRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c: CandidateDetail | undefined = getCandidate(id);
  if (!c) notFound();

  const initials = c.name.split(" ").map((n) => n[0]).join("");

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
                    c.employmentType === "C2C"
                      ? "contract"
                      : "full-time",
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
        <section>
          <h2 className="text-section-heading mb-2.5">Readiness Radar</h2>
          <ReadinessRadar dims={c.readiness} />
        </section>

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
              <InfoRow icon={Calendar} label="Start date" value={`${c.startDateLabel} · ${c.startInDays}d`} />
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
                AI-extracted from résumé · {c.extracted.family} ·{" "}
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
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="screening">Screening</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
                <div className="bg-ai-muted/40 border-ai/20 rounded-xl border p-4">
                  <p className="text-ai-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="size-3.5" /> AI summary
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{c.aiSummary}</p>
                </div>
                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <h3 className="text-card-heading mb-3">Open tasks</h3>
                  <TaskList tasks={c.tasks.slice(0, 3)} />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <Timeline events={c.timeline} />
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <div className="bg-card rounded-xl border p-4 shadow-xs">
                  <TaskList tasks={c.tasks} />
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
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
                        const meta = DOC_STATUS[d.status];
                        return (
                          <tr key={d.id} className="border-b last:border-0">
                            <td className="px-4 py-2.5 font-medium">{d.name}</td>
                            <td className="text-muted-foreground px-4 py-2.5">
                              {d.type}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge tone={meta.tone}>
                                {meta.label}
                              </StatusBadge>
                            </td>
                            <td className="text-muted-foreground px-4 py-2.5">
                              {d.updated}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="screening" className="mt-4">
                <Placeholder module="Background check & screening" version="v0.5" />
              </TabsContent>
              <TabsContent value="payroll" className="mt-4">
                <Placeholder module="Payroll readiness" version="v0.5" />
              </TabsContent>
              <TabsContent value="billing" className="mt-4">
                <Placeholder module="Billing readiness" version="v0.5" />
              </TabsContent>
              <TabsContent value="equipment" className="mt-4">
                <Placeholder module="Equipment & IT provisioning" version="v0.5" />
              </TabsContent>
              <TabsContent value="training" className="mt-4">
                <Placeholder module="Training & certifications" version="v0.6" />
              </TabsContent>
              <TabsContent value="audit" className="mt-4">
                <Placeholder module="Audit & evidence" version="v0.2" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right context panel (§100.1) */}
          <aside className="flex flex-col gap-4">
            <div className="bg-card rounded-xl border p-4 shadow-xs">
              <h3 className="text-card-heading mb-2">Open exceptions</h3>
              {c.openExceptions.length === 0 ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="text-success size-4" /> None open
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {c.openExceptions.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
                    >
                      <TriangleAlert
                        className={cn(
                          "size-4 shrink-0",
                          e.tone === "danger"
                            ? "text-danger"
                            : "text-warning",
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
