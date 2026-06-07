import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  Heart,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import {
  PipelineStatusBadge,
  RiskBadge,
} from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CURRENT_RECRUITER,
  getRecruiterCandidates,
  recruiterFunnel,
} from "@/lib/ops-data";

export const metadata: Metadata = { title: "Candidate Handoff" };

export default function RecruiterWorkspacePage() {
  const mine = getRecruiterCandidates();
  const funnel = recruiterFunnel();
  const readyToStart = mine.filter((c) => c.progress >= 85).length;
  const atRisk = mine.filter((c) => c.risk === "at-risk" || c.risk === "unlikely");

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Candidate Handoff"
        description={`${CURRENT_RECRUITER}'s roster — offer accepted through fully onboarded.`}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Users className="size-3" /> {mine.length} candidates
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="My roster" value={mine.length} />
        <StatTile icon={CheckCircle2} label="Ready to start" value={readyToStart} tone="success" />
        <StatTile icon={TriangleAlert} label="At risk" value={atRisk.length} tone="danger" />
        <StatTile icon={Heart} label="Candidate satisfaction" value="4.6" suffix="/5" tone="success" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <WidgetCard title="My candidates">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Candidate</th>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium">Stage</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Risk</th>
                  <th className="px-2 py-2 font-medium">Start</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 border-b last:border-0">
                    <td className="px-2 py-2">
                      <Link href={`/candidates/${c.id}`} className="hover:text-primary font-medium">
                        {c.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">{c.client}</td>
                    <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">{c.stage}</td>
                    <td className="px-2 py-2"><PipelineStatusBadge status={c.status} /></td>
                    <td className="px-2 py-2"><RiskBadge level={c.risk} /></td>
                    <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                      {c.startDateLabel}<span className="text-muted-foreground"> · {c.startInDays}d</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Handoff funnel">
            <BarList rows={funnel.map((f) => ({ name: f.stage, value: f.count }))} tone="info" />
          </WidgetCard>

          <WidgetCard title="Start-date risk">
            {atRisk.length === 0 ? (
              <p className="text-muted-foreground text-sm">No at-risk candidates.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {atRisk.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <TriangleAlert className="text-danger size-4 shrink-0" />
                    <Link href={`/candidates/${c.id}`} className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium">
                      {c.name}
                    </Link>
                    <Button size="xs" variant="ghost">Nudge</Button>
                    <span className="text-metadata whitespace-nowrap"><Clock className="mr-0.5 inline size-3" />{c.startInDays}d</span>
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
