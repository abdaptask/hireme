import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  ListTodo,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard } from "@/components/dashboard/widgets";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  coachingFlags,
  getPodCandidates,
  getWorkItems,
  podMemberWorkload,
  POD_MEMBERS,
  TEAM_LEAD,
  type OwnerWorkload,
} from "@/lib/ops-data";

export const metadata: Metadata = { title: "Pod Performance" };

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-danger",
  High: "bg-warning",
  Medium: "bg-info",
  Low: "bg-neutral",
};

function MemberRow({ m }: { m: OwnerWorkload }) {
  const max = 8;
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm font-medium">{m.name}</span>
      <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
        <span
          className="bg-info absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.max((m.active / max) * 100, 6)}%` }}
        />
      </div>
      <span className="text-muted-foreground w-6 text-right text-xs tabular-nums">
        {m.active}
      </span>
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

export default function TeamLeadWorkspacePage() {
  const pod = getPodCandidates();
  const members = podMemberWorkload();
  const flags = coachingFlags();
  const priorities = getWorkItems()
    .filter((i) => POD_MEMBERS.includes(i.candidate.recruiter))
    .slice(0, 8);

  const atRisk = pod.filter((c) => c.risk === "at-risk" || c.risk === "unlikely").length;
  const startingSoon = pod.filter((c) => c.startInDays <= 7).length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Pod Performance"
        description={`${TEAM_LEAD}'s pod — today's priorities and coaching.`}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Users className="size-3" /> {members.length} recruiters · {pod.length} candidates
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="Pod pipeline" value={pod.length} />
        <StatTile icon={TriangleAlert} label="At risk" value={atRisk} tone="danger" />
        <StatTile icon={Clock} label="Starting ≤ 7d" value={startingSoon} tone="warning" />
        <StatTile icon={ListTodo} label="Today's priorities" value={priorities.length} tone="info" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <WidgetCard
          title="Today's priorities"
          action={<span className="text-muted-foreground text-xs tabular-nums">{priorities.length}</span>}
        >
          {priorities.length === 0 ? (
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="text-success size-4" /> Pod is clear for today.
            </p>
          ) : (
            <ul className="flex flex-col">
              {priorities.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 border-b py-2.5 last:border-0"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[item.priority])} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.type}</span>
                      <StatusBadge tone={item.tone} withDot={false}>
                        {item.priority}
                      </StatusBadge>
                    </span>
                    <span className="text-metadata">
                      <Link href={`/candidates/${item.candidate.id}`} className="hover:text-primary font-medium">
                        {item.candidate.name}
                      </Link>{" "}
                      · {item.candidate.recruiter} · {item.due}
                    </span>
                  </span>
                  <Button size="xs" variant="outline">{item.action}</Button>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Pod members" description="Active · weighted by risk">
            <ul className="flex flex-col gap-2.5">
              {members.map((m) => (
                <MemberRow key={m.name} m={m} />
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard title="Coaching flags">
            {flags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No coaching flags — nice work.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {flags.map((f) => (
                  <li key={f.name} className="flex items-start gap-2">
                    <GraduationCap className="text-warning-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="text-metadata">{f.reason}</span>
                    </span>
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
