import type { Metadata } from "next";
import { Clock, Gauge, TrendingDown, TriangleAlert, Users } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";
import {
  onboarderWorkload,
  recruiterWorkload,
  stageBottlenecks,
  teamStats,
  type OwnerWorkload,
} from "@/lib/ops-data";

export const metadata: Metadata = { title: "Team Performance" };

function WorkloadTable({ rows }: { rows: OwnerWorkload[] }) {
  const max = Math.max(...rows.map((r) => r.active), 1);
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.name} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm">{r.name}</span>
          <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
            <span
              className="bg-info absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${Math.max((r.active / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-muted-foreground w-7 shrink-0 text-right text-xs tabular-nums">
            {r.active}
          </span>
          <span
            className={cn(
              "w-12 shrink-0 text-right text-xs tabular-nums",
              r.atRisk > 0 ? "text-danger-muted-foreground" : "text-muted-foreground/50",
            )}
          >
            {r.atRisk} risk
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function RecruitingManagerWorkspacePage() {
  const stats = teamStats();
  const recruiters = recruiterWorkload();
  const onboarders = onboarderWorkload();
  const bottlenecks = stageBottlenecks();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Team Performance"
        description="Team workload, throughput, and bottlenecks across all active onboardings."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Users} label="Active onboardings" value={stats.total} />
        <StatTile icon={Clock} label="Avg time-to-board" value={stats.avgTimeToBoard} suffix="d" tone="info" />
        <StatTile icon={Gauge} label="Avg progress" value={`${stats.avgProgress}%`} tone="success" />
        <StatTile icon={TriangleAlert} label="At risk" value={stats.atRisk} tone="danger" />
        <StatTile icon={Clock} label="Starting ≤ 7d" value={stats.startingSoon} tone="warning" />
        <StatTile icon={TrendingDown} label="Drop-off rate" value={`${stats.dropOffRate}%`} tone="warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <WidgetCard title="Recruiter workload" description="Active · weighted by risk">
          <WorkloadTable rows={recruiters} />
        </WidgetCard>
        <WidgetCard title="Onboarder workload" description="Active · weighted by risk">
          <WorkloadTable rows={onboarders} />
        </WidgetCard>
        <WidgetCard title="Stage bottlenecks" description="Candidates currently in each stage">
          <BarList rows={bottlenecks} tone="warning" />
        </WidgetCard>
        <WidgetCard title="Throughput trend" description="Onboardings completed / week">
          <BarList
            rows={[
              { name: "5 wks ago", value: 14 },
              { name: "4 wks ago", value: 17 },
              { name: "3 wks ago", value: 15 },
              { name: "2 wks ago", value: 19 },
              { name: "Last week", value: 22 },
            ]}
            tone="success"
          />
        </WidgetCard>
      </div>
    </PageContainer>
  );
}
