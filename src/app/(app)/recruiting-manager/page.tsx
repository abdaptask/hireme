import type { Metadata } from "next";
import { Clock, Gauge, TrendingDown, TriangleAlert, Users, UsersRound } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  managerRollup,
  stageBottlenecks,
  teamStats,
  type ManagerRollup,
  type OwnerWorkload,
} from "@/lib/ops-data";

export const metadata: Metadata = { title: "Team Performance" };

function MemberRow({ m, lead }: { m: OwnerWorkload; lead?: boolean }) {
  const max = 8;
  return (
    <li className="flex items-center gap-3">
      <span className="flex w-32 shrink-0 items-center gap-1.5 truncate text-sm">
        <span className="truncate font-medium">{m.name}</span>
        {lead && (
          <Badge variant="secondary" className="px-1 py-0 text-[9px]">
            Lead
          </Badge>
        )}
      </span>
      <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
        <span
          className="bg-info absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.max((m.active / max) * 100, 4)}%` }}
        />
      </div>
      <span className="text-muted-foreground w-6 text-right text-xs tabular-nums">{m.active}</span>
      <span
        className={cn(
          "w-12 text-right text-xs tabular-nums",
          m.atRisk > 0 ? "text-danger-muted-foreground" : "text-muted-foreground/50",
        )}
      >
        {m.atRisk} risk
      </span>
    </li>
  );
}

function OrgRollup({ title, rollup }: { title: string; rollup: ManagerRollup }) {
  return (
    <WidgetCard
      title={title}
      description={`Manager: ${rollup.manager}`}
      action={<UsersRound className="text-muted-foreground size-4" />}
    >
      <div className="flex flex-col gap-4">
        {rollup.teams.map((t) => (
          <div key={t.lead}>
            <p className="text-data-label mb-1.5">Team · {t.lead}</p>
            <ul className="flex flex-col gap-2">
              {t.members.map((m) => (
                <MemberRow key={m.name} m={m} lead={m.name === t.lead} />
              ))}
            </ul>
          </div>
        ))}
        {rollup.directs.length > 0 && (
          <div>
            <p className="text-data-label mb-1.5">Direct to manager · no team lead</p>
            <ul className="flex flex-col gap-2">
              {rollup.directs.map((m) => (
                <MemberRow key={m.name} m={m} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export default function RecruitingManagerWorkspacePage() {
  const stats = teamStats();
  const recruiting = managerRollup("recruiting");
  const onboarding = managerRollup("onboarding");
  const bottlenecks = stageBottlenecks();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Team Performance"
        description="Org workload, throughput, and bottlenecks — manager → team lead → IC."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Users} label="Active onboardings" value={stats.total} />
        <StatTile icon={Clock} label="Avg time-to-board" value={stats.avgTimeToBoard} suffix="d" tone="info" />
        <StatTile icon={Gauge} label="Avg progress" value={`${stats.avgProgress}%`} tone="success" />
        <StatTile icon={TriangleAlert} label="At risk" value={stats.atRisk} tone="danger" />
        <StatTile icon={Clock} label="Starting ≤ 7d" value={stats.startingSoon} tone="warning" />
        <StatTile icon={TrendingDown} label="Drop-off rate" value={`${stats.dropOffRate}%`} tone="warning" />
      </div>

      {/* Org hierarchy — manager → optional team lead → ICs (§55, §36) */}
      <div className="grid gap-5 lg:grid-cols-2">
        <OrgRollup title="Recruiting org" rollup={recruiting} />
        <OrgRollup title="Onboarding org" rollup={onboarding} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
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
