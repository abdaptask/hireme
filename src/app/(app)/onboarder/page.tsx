import Link from "next/link";
import type { Metadata } from "next";
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSearch,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import {
  PipelineStatusBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/status-badge";
import { BarList } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CURRENT_ONBOARDER,
  getDocReviewQueue,
  getOnboarderCandidates,
  getStageCounts,
  getStartDateRisks,
  getWorkQueue,
} from "@/lib/candidates";

export const metadata: Metadata = { title: "HR Operations" };

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger" | "info";
}) {
  const toneCls =
    tone === "danger"
      ? "bg-danger-muted text-danger-muted-foreground"
      : tone === "warning"
        ? "bg-warning-muted text-warning-muted-foreground"
        : tone === "info"
          ? "bg-info-muted text-info-muted-foreground"
          : "bg-primary/10 text-primary";
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-3.5 shadow-xs">
      <span className={cn("flex size-9 items-center justify-center rounded-lg", toneCls)}>
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-metadata leading-tight">{label}</p>
      </div>
    </div>
  );
}

function WidgetCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card flex flex-col rounded-xl border shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="text-card-heading">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function OnboarderWorkspacePage() {
  const mine = getOnboarderCandidates();
  const queue = getWorkQueue();
  const stageCounts = getStageCounts();
  const risks = getStartDateRisks();
  const docReview = getDocReviewQueue();

  const startingSoon = mine.filter((c) => c.startInDays <= 7).length;
  const waitingExternal = mine.filter((c) => c.status === "waiting-external").length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="HR Operations"
        description={`${CURRENT_ONBOARDER}'s active onboardings and exceptions.`}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Users className="size-3" /> {mine.length} active
          </Badge>
        }
      />

      {/* Workload vitals (§53.1) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users} label="Active onboardings" value={mine.length} />
        <StatCard
          icon={TriangleAlert}
          label="At risk"
          value={risks.length}
          tone="danger"
        />
        <StatCard
          icon={Clock}
          label="Starting ≤ 7 days"
          value={startingSoon}
          tone="warning"
        />
        <StatCard
          icon={FileSearch}
          label="Awaiting review"
          value={docReview.length}
          tone="info"
        />
        <StatCard icon={Bell} label="Waiting external" value={waitingExternal} />
        <StatCard
          icon={ClipboardCheck}
          label="In my queue"
          value={queue.length}
          tone="warning"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Work queue (§5.3) */}
        <WidgetCard
          title="Work queue — needs attention"
          action={
            <span className="text-muted-foreground text-xs tabular-nums">
              {queue.length} items
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-left"
              style={{ fontSize: "var(--table-font)" }}
            >
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Candidate</th>
                  <th className="px-2 py-2 font-medium">Stage</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Risk</th>
                  <th className="px-2 py-2 font-medium">Start</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 border-b last:border-0">
                    <td className="px-2 py-2">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="hover:text-primary block font-medium"
                      >
                        {c.name}
                      </Link>
                      <span className="text-metadata">{c.client}</span>
                    </td>
                    <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">
                      {c.stage}
                    </td>
                    <td className="px-2 py-2">
                      <PipelineStatusBadge status={c.status} />
                    </td>
                    <td className="px-2 py-2">
                      <RiskBadge level={c.risk} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                      {c.startDateLabel}
                      <span className="text-muted-foreground"> · {c.startInDays}d</span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end gap-1">
                        <Button size="xs" variant="ghost" render={<Link href={`/candidates/${c.id}`} />}>
                          Open
                        </Button>
                        <Button size="xs" variant="ghost">Remind</Button>
                        <Button size="xs" variant="ghost">Escalate</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted-foreground px-2 py-8 text-center">
                      <CheckCircle2 className="text-success mx-auto mb-1 size-5" />
                      Your queue is clear.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        {/* Right rail */}
        <div className="flex flex-col gap-5">
          <WidgetCard title="Pipeline by stage">
            <BarList
              rows={stageCounts.map((s) => ({ name: s.stage, value: s.count }))}
              tone="info"
            />
          </WidgetCard>

          <WidgetCard title="Start-date risk">
            {risks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No at-risk starts.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {risks.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <TriangleAlert className="text-danger size-4 shrink-0" />
                    <Link
                      href={`/candidates/${c.id}`}
                      className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium"
                    >
                      {c.name}
                    </Link>
                    <span className="text-metadata whitespace-nowrap">
                      {c.startInDays}d
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>

          <WidgetCard
            title="Document review"
            action={
              <span className="text-muted-foreground text-xs tabular-nums">
                {docReview.length}
              </span>
            }
          >
            {docReview.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing to review.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {docReview.map(({ candidate, document, tone }) => (
                  <li key={candidate.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="hover:text-primary block truncate text-sm font-medium"
                      >
                        {candidate.name}
                      </Link>
                      <span className="text-metadata">{document}</span>
                    </span>
                    <StatusBadge tone={tone} withDot={false}>
                      Review
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        </div>
      </div>
    </PageContainer>
  );
}
