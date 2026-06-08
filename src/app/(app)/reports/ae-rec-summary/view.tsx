"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Crown,
  Download,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, MiniBars } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import {
  FilterBar,
  FilterSelect,
  formatUsdCompact,
} from "@/components/reports/report-ui";
import { cn } from "@/lib/utils";

type AeRecRow = {
  id: string;
  name: string;
  role: "AE" | "Recruiter" | "Recruiting Manager";
  team: string;
  activeReqs: number;
  submissions: number;
  placementsMtd: number;
  revenueMtd: number;
  marginMtd: number;
  marginPct: number;
  weeklyPlacements: number[];
};

const ROWS: AeRecRow[] = [
  { id: "devon-hughes", name: "Devon Hughes", role: "Recruiter", team: "Healthcare", activeReqs: 22, submissions: 84, placementsMtd: 9, revenueMtd: 412_000, marginMtd: 168_000, marginPct: 41, weeklyPlacements: [2, 3, 2, 4, 3, 4] },
  { id: "aaron-flores", name: "Aaron Flores", role: "AE", team: "Tech", activeReqs: 31, submissions: 102, placementsMtd: 12, revenueMtd: 524_000, marginMtd: 218_000, marginPct: 42, weeklyPlacements: [3, 4, 3, 5, 4, 5] },
  { id: "lena-ortiz", name: "Lena Ortiz", role: "Recruiter", team: "Healthcare", activeReqs: 18, submissions: 71, placementsMtd: 7, revenueMtd: 318_000, marginMtd: 124_000, marginPct: 39, weeklyPlacements: [1, 2, 3, 2, 3, 3] },
  { id: "marcus-king", name: "Marcus King", role: "AE", team: "Finance", activeReqs: 26, submissions: 88, placementsMtd: 8, revenueMtd: 386_000, marginMtd: 152_000, marginPct: 39, weeklyPlacements: [2, 3, 3, 2, 3, 4] },
  { id: "priya-iyer", name: "Priya Iyer", role: "Recruiter", team: "Tech", activeReqs: 24, submissions: 95, placementsMtd: 10, revenueMtd: 442_000, marginMtd: 184_000, marginPct: 42, weeklyPlacements: [3, 4, 3, 4, 4, 5] },
  { id: "sebastian-ng", name: "Sebastian Ng", role: "Recruiter", team: "Tech", activeReqs: 19, submissions: 68, placementsMtd: 6, revenueMtd: 281_000, marginMtd: 109_000, marginPct: 39, weeklyPlacements: [1, 2, 2, 3, 2, 3] },
  { id: "harper-quinn", name: "Harper Quinn", role: "AE", team: "Logistics", activeReqs: 14, submissions: 52, placementsMtd: 5, revenueMtd: 198_000, marginMtd: 74_000, marginPct: 37, weeklyPlacements: [1, 1, 2, 2, 1, 2] },
  { id: "isabel-rojas", name: "Isabel Rojas", role: "Recruiter", team: "Finance", activeReqs: 20, submissions: 76, placementsMtd: 7, revenueMtd: 296_000, marginMtd: 116_000, marginPct: 39, weeklyPlacements: [2, 2, 3, 2, 3, 3] },
  { id: "elena-park", name: "Elena Park", role: "Recruiting Manager", team: "Tech", activeReqs: 12, submissions: 38, placementsMtd: 4, revenueMtd: 168_000, marginMtd: 71_000, marginPct: 42, weeklyPlacements: [1, 1, 2, 1, 2, 2] },
];

const ROLE_FILTER = ["All", "AE", "Recruiter", "Recruiting Manager"];
const TEAM_FILTER = ["All", ...Array.from(new Set(ROWS.map((r) => r.team)))];

const WEEKLY_TOTALS = [0, 1, 2, 3, 4, 5].map((w) =>
  ROWS.reduce((s, r) => s + r.weeklyPlacements[w], 0),
);

const TEAM_TOTALS = {
  activeReqs: ROWS.reduce((s, r) => s + r.activeReqs, 0),
  submissions: ROWS.reduce((s, r) => s + r.submissions, 0),
  placementsMtd: ROWS.reduce((s, r) => s + r.placementsMtd, 0),
  revenueMtd: ROWS.reduce((s, r) => s + r.revenueMtd, 0),
  marginMtd: ROWS.reduce((s, r) => s + r.marginMtd, 0),
};

const TOP_PERFORMERS = [...ROWS]
  .sort((a, b) => b.placementsMtd - a.placementsMtd)
  .slice(0, 5);

const DRILL_COLUMNS: DrillDownColumn<AeRecRow>[] = [
  { key: "name", label: "Name", accessor: (r) => r.name },
  { key: "role", label: "Role", accessor: (r) => r.role },
  { key: "team", label: "Team", accessor: (r) => r.team },
  {
    key: "placements",
    label: "Placements MTD",
    accessor: (r) => r.placementsMtd,
    sortValue: (r) => r.placementsMtd,
    align: "right",
  },
  {
    key: "revenue",
    label: "Revenue MTD",
    accessor: (r) => formatUsdCompact(r.revenueMtd),
    sortValue: (r) => r.revenueMtd,
    align: "right",
  },
  {
    key: "margin",
    label: "Margin MTD",
    accessor: (r) => formatUsdCompact(r.marginMtd),
    sortValue: (r) => r.marginMtd,
    align: "right",
  },
];

export default function AeRecSummaryView() {
  const [role, setRole] = useState("All");
  const [team, setTeam] = useState("All");
  const [drill, setDrill] = useState<AeRecRow | null>(null);

  const filtered = useMemo(() => {
    return ROWS.filter((r) => {
      if (role !== "All" && r.role !== role) return false;
      if (team !== "All" && r.team !== team) return false;
      return true;
    });
  }, [role, team]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="AE / Recruiter Summary"
          description="Account Executive and Recruiter performance — combined MTD scorecard."
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="size-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <CalendarClock className="size-3.5" /> Schedule
              </Button>
            </>
          }
        />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Target} label="Active Reqs" value={TEAM_TOTALS.activeReqs} />
        <StatTile icon={Send} label="Submissions" value={TEAM_TOTALS.submissions} tone="info" />
        <StatTile icon={Briefcase} label="Placements MTD" value={TEAM_TOTALS.placementsMtd} tone="success" />
        <StatTile icon={TrendingUp} label="Revenue MTD" value={formatUsdCompact(TEAM_TOTALS.revenueMtd)} />
        <StatTile icon={Sparkles} label="Margin MTD" value={formatUsdCompact(TEAM_TOTALS.marginMtd)} tone="ai" />
      </section>

      <FilterBar>
        <FilterSelect label="Role" value={role} options={ROLE_FILTER} onChange={setRole} />
        <FilterSelect label="Team" value={team} options={TEAM_FILTER} onChange={setTeam} />
      </FilterBar>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <WidgetCard title="AE / Recruiter scorecard" description="Click a row to inspect individual metrics">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Role</th>
                  <th className="px-2 py-2 font-medium">Team</th>
                  <th className="px-2 py-2 text-right font-medium">Active Reqs</th>
                  <th className="px-2 py-2 text-right font-medium">Submissions</th>
                  <th className="px-2 py-2 text-right font-medium">Placements MTD</th>
                  <th className="px-2 py-2 text-right font-medium">Revenue MTD</th>
                  <th className="px-2 py-2 text-right font-medium">Margin MTD</th>
                  <th className="px-2 py-2 text-right font-medium">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setDrill(r)}
                    className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                  >
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{r.name}</td>
                    <td className="px-2 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {r.role}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-2 py-2">{r.team}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{r.activeReqs}</td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">{r.submissions}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{r.placementsMtd}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatUsdCompact(r.revenueMtd)}</td>
                    <td className="text-success-muted-foreground px-2 py-2 text-right tabular-nums">
                      {formatUsdCompact(r.marginMtd)}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right tabular-nums",
                        r.marginPct >= 40 && "text-success-muted-foreground",
                      )}
                    >
                      {r.marginPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/40 font-medium">
                <tr>
                  <td className="px-2 py-2" colSpan={3}>
                    Team total ({filtered.length})
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {filtered.reduce((s, r) => s + r.activeReqs, 0)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {filtered.reduce((s, r) => s + r.submissions, 0)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {filtered.reduce((s, r) => s + r.placementsMtd, 0)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatUsdCompact(filtered.reduce((s, r) => s + r.revenueMtd, 0))}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatUsdCompact(filtered.reduce((s, r) => s + r.marginMtd, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Top performers" description="By placements MTD">
            <ol className="flex flex-col gap-2.5">
              {TOP_PERFORMERS.map((r, i) => (
                <li key={r.id} className="bg-muted/30 flex items-center gap-3 rounded-md p-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                      i === 0
                        ? "bg-warning text-warning-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {i === 0 ? <Crown className="size-3.5" /> : `#${i + 1}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-metadata">
                      {r.role} · {r.team}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{r.placementsMtd}</p>
                    <p className="text-metadata tabular-nums">{formatUsdCompact(r.marginMtd)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </WidgetCard>

          <WidgetCard title="Placements per week" description="Team total — last 6 weeks">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {WEEKLY_TOTALS[WEEKLY_TOTALS.length - 1]}
                </p>
                <p className="text-metadata">this week</p>
              </div>
              <div className="w-40">
                <MiniBars data={WEEKLY_TOTALS} tone="success" />
                <div className="text-muted-foreground mt-1 flex justify-between text-[10px] tabular-nums">
                  {["w-5", "w-4", "w-3", "w-2", "w-1", "now"].map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>

      <DrillDownSheet
        open={!!drill}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill ? `${drill.name} · ${drill.role}` : ""}
        description="Individual scorecard"
        columns={DRILL_COLUMNS}
        rows={drill ? [drill] : []}
      />
    </PageContainer>
  );
}
