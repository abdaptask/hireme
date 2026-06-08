"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Download,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList, MiniBars } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DrillDownSheet } from "@/components/reports/drill-down-sheet";
import { cn } from "@/lib/utils";
import { recruiterWorkload } from "@/lib/ops-data";

/* --------------------------------- Mocks ---------------------------------- */

type RecruiterRow = {
  name: string;
  reqs: number;
  subs: number;
  placements: number;
  avgTto: number; // days
  dropOffPct: number;
  satisfaction: number; // /5
  trend: number[];
};

/** Pulls weighted workload from ops-data to keep names consistent across reports. */
function buildRecruiterRows(): RecruiterRow[] {
  const baseline = recruiterWorkload();
  const baseNames = baseline.map((w) => w.name);
  // Augment with the cross-report roster so this page lists the full team.
  const extra = ["Priya Ramesh", "Jordan Pratt", "Casey Wong"].filter(
    (n) => !baseNames.includes(n),
  );
  const names = [...baseNames, ...extra];

  // Deterministic synthesis per recruiter.
  return names.map((name, i) => {
    const seed = name.length + i;
    return {
      name,
      reqs: 8 + ((seed * 3) % 9),
      subs: 24 + ((seed * 7) % 22),
      placements: 4 + ((seed * 2) % 6),
      avgTto: 9 + ((seed * 11) % 7),
      dropOffPct: 3 + ((seed * 5) % 9),
      satisfaction: Math.round((4.0 + ((seed * 13) % 9) * 0.1) * 10) / 10,
      trend: Array.from({ length: 8 }, (_, k) => 2 + ((seed + k * 4) % 9)),
    };
  });
}

const ROWS = buildRecruiterRows();

const CLIENTS = [
  "All clients",
  "Meridian Health",
  "Cobalt Systems",
  "Vertex Financial",
  "Atlas Manufacturing",
  "Northwind Logistics",
];

const DATE_RANGES = ["Last 30 days", "Last 90 days", "QTD", "YTD", "Trailing 12 months"];

const DROP_OFF_REASONS = [
  { name: "Compensation", value: 14 },
  { name: "Counter-offer", value: 11 },
  { name: "Doc friction", value: 9 },
  { name: "Background delay", value: 6 },
  { name: "Client cancellation", value: 5 },
  { name: "Candidate unresponsive", value: 8 },
];

/* ---------------------------------- Page ---------------------------------- */

export default function RecruiterPerformanceReportPage() {
  const [selectedRecruiters, setSelectedRecruiters] = useState<Set<string>>(
    new Set(),
  );
  const [dateRange, setDateRange] = useState("Last 90 days");
  const [client, setClient] = useState("All clients");
  const [drill, setDrill] = useState<string | null>(null);

  const visibleRows = useMemo(() => {
    if (selectedRecruiters.size === 0) return ROWS;
    return ROWS.filter((r) => selectedRecruiters.has(r.name));
  }, [selectedRecruiters]);

  /* KPIs */
  const totals = useMemo(() => {
    const reqs = visibleRows.reduce((s, r) => s + r.reqs, 0);
    const subs = visibleRows.reduce((s, r) => s + r.subs, 0);
    const placements = visibleRows.reduce((s, r) => s + r.placements, 0);
    const avgTto =
      Math.round(
        (visibleRows.reduce((s, r) => s + r.avgTto, 0) /
          Math.max(visibleRows.length, 1)) *
          10,
      ) / 10;
    const dropOff =
      Math.round(
        (visibleRows.reduce((s, r) => s + r.dropOffPct, 0) /
          Math.max(visibleRows.length, 1)) *
          10,
      ) / 10;
    const sat =
      Math.round(
        (visibleRows.reduce((s, r) => s + r.satisfaction, 0) /
          Math.max(visibleRows.length, 1)) *
          10,
      ) / 10;
    return { reqs, subs, placements, avgTto, dropOff, sat };
  }, [visibleRows]);

  function toggleRecruiter(name: string) {
    setSelectedRecruiters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function clearRecruiters() {
    setSelectedRecruiters(new Set());
  }

  /* Chart data */
  const topByPlacements = [...visibleRows]
    .sort((a, b) => b.placements - a.placements)
    .map((r) => ({ name: r.name, value: r.placements }));

  const ttoDistribution = [
    { name: "≤ 7 days", value: visibleRows.filter((r) => r.avgTto <= 7).length },
    {
      name: "8–10 days",
      value: visibleRows.filter((r) => r.avgTto > 7 && r.avgTto <= 10).length,
    },
    {
      name: "11–13 days",
      value: visibleRows.filter((r) => r.avgTto > 10 && r.avgTto <= 13).length,
    },
    { name: "14+ days", value: visibleRows.filter((r) => r.avgTto > 13).length },
  ];

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          nativeButton={false}
          render={<Link href="/reports" />}
        >
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Recruiter Performance Report"
          description="Volume, time-to-onboard, drop-off, and candidate satisfaction across the recruiter team (§54)."
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="size-4" /> Export
              </Button>
              <Button variant="outline" size="sm">
                <CalendarClock className="size-4" /> Schedule
              </Button>
            </>
          }
        />
      </div>

      {/* Filter bar */}
      <section className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-data-label">Recruiters</span>
          {ROWS.map((r) => {
            const active = selectedRecruiters.has(r.name);
            return (
              <button
                key={r.name}
                type="button"
                onClick={() => toggleRecruiter(r.name)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border",
                )}
              >
                {r.name}
              </button>
            );
          })}
          {selectedRecruiters.size > 0 && (
            <button
              type="button"
              onClick={clearRecruiters}
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-background h-8 rounded-md border px-2 text-xs"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            {DATE_RANGES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            className="bg-background h-8 rounded-md border px-2 text-xs"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          >
            {CLIENTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Active reqs" value={totals.reqs} />
        <Kpi label="Submissions" value={totals.subs} />
        <Kpi label="Placements" value={totals.placements} tone="success" />
        <Kpi label="Avg time-to-onboard" value={`${totals.avgTto}d`} />
        <Kpi label="Drop-off rate" value={`${totals.dropOff}%`} tone="danger" />
        <Kpi label="Satisfaction" value={`${totals.sat}/5`} tone="success" />
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetCard
          title="Top recruiters · placements"
          description="Click a recruiter to drill into placements"
        >
          <BarList
            rows={topByPlacements}
            tone="info"
            onRowClick={(name) => setDrill(name)}
          />
        </WidgetCard>

        <WidgetCard
          title="Time-to-onboard distribution"
          description="Recruiters bucketed by their avg TTO"
        >
          <BarList
            rows={ttoDistribution}
            tone="success"
            formatValue={(v) => `${v}`}
          />
        </WidgetCard>

        <WidgetCard
          title="Drop-off reasons"
          description="Pooled across the visible team"
        >
          <BarList rows={DROP_OFF_REASONS} tone="danger" />
        </WidgetCard>

        <WidgetCard
          title="Satisfaction scorecard"
          description="Per-recruiter candidate satisfaction"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visibleRows.map((r) => (
              <div
                key={r.name}
                className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-2.5"
              >
                <p className="truncate text-xs font-medium">{r.name}</p>
                <p
                  className={cn(
                    "inline-flex items-center gap-1 text-lg font-semibold tabular-nums",
                    r.satisfaction >= 4.5
                      ? "text-success-muted-foreground"
                      : r.satisfaction >= 4.0
                        ? "text-foreground"
                        : "text-warning-muted-foreground",
                  )}
                >
                  <Star className="size-3.5" /> {r.satisfaction}
                </p>
              </div>
            ))}
          </div>
        </WidgetCard>
      </div>

      {/* Per-recruiter table */}
      <WidgetCard
        title="Recruiter performance · detail"
        description={`${visibleRows.length} recruiter${visibleRows.length === 1 ? "" : "s"} · ${dateRange.toLowerCase()} · ${client.toLowerCase()}`}
        action={
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Users className="size-3" /> {visibleRows.length}
          </Badge>
        }
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Recruiter</th>
                <th className="px-2 py-2 font-medium text-right">Reqs</th>
                <th className="px-2 py-2 font-medium text-right">Subs</th>
                <th className="px-2 py-2 font-medium text-right">Sub→Hire</th>
                <th className="px-2 py-2 font-medium text-right">Placements</th>
                <th className="px-2 py-2 font-medium text-right">Avg TTO</th>
                <th className="px-2 py-2 font-medium text-right">Drop-off</th>
                <th className="px-2 py-2 font-medium text-right">Satisfaction</th>
                <th className="px-2 py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {[...visibleRows]
                .sort((a, b) => b.placements - a.placements)
                .map((r) => {
                  const subToHire = Math.round((r.placements / Math.max(r.subs, 1)) * 100);
                  return (
                    <tr
                      key={r.name}
                      className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                      onClick={() => setDrill(r.name)}
                    >
                      <td className="px-2 py-2 font-medium whitespace-nowrap">
                        {r.name}
                      </td>
                      <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                        {r.reqs}
                      </td>
                      <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                        {r.subs}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        <span
                          className={cn(
                            subToHire >= 20
                              ? "text-success-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {subToHire}%
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums">
                        {r.placements}
                      </td>
                      <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                        {r.avgTto}d
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        <span
                          className={cn(
                            r.dropOffPct <= 5
                              ? "text-success-muted-foreground"
                              : r.dropOffPct <= 8
                                ? "text-foreground"
                                : "text-danger-muted-foreground",
                          )}
                        >
                          {r.dropOffPct}%
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        <span
                          className={cn(
                            r.satisfaction >= 4.5
                              ? "text-success-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {r.satisfaction}/5
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="w-24">
                          <MiniBars data={r.trend} tone="info" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      <DrillDownSheet
        open={!!drill}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill ? `${drill} · placements` : ""}
        description="Underlying placements driving this recruiter's number."
        columns={[
          { key: "consultant", label: "Consultant", accessor: (r) => r.consultant },
          { key: "client", label: "Client", accessor: (r) => r.client },
          { key: "role", label: "Role", accessor: (r) => r.role },
          { key: "tto", label: "TTO", accessor: (r) => `${r.tto}d`, sortValue: (r) => r.tto, align: "right" },
          { key: "start", label: "Start", accessor: (r) => r.start, align: "right" },
        ]}
        rows={drill ? buildPlacements(drill) : []}
      />

      <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <TrendingUp className="size-3.5" /> Coaching opportunities surface when
        drop-off &gt; 8% or satisfaction &lt; 4.0 — see the Coaching report for
        deeper review.
        <ArrowUpRight className="size-3" />
      </p>
    </PageContainer>
  );
}

/* --------------------------------- Pieces --------------------------------- */

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "success" | "danger" | "neutral";
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          tone === "success" && "text-success-muted-foreground",
          tone === "danger" && "text-danger-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type Placement = {
  consultant: string;
  client: string;
  role: string;
  tto: number;
  start: string;
};

function buildPlacements(recruiter: string): Placement[] {
  const row = ROWS.find((r) => r.name === recruiter);
  if (!row) return [];
  const consultants = [
    "Elena Vasquez",
    "Kai Nakamura",
    "Priya Sharma",
    "Derek Olsen",
    "Amara Diallo",
    "Brendan Walsh",
    "Rachel Stone",
    "Marcus Bell",
  ];
  const clients = [
    "Meridian Health",
    "Cobalt Systems",
    "Vertex Financial",
    "Atlas Manufacturing",
    "Northwind Logistics",
  ];
  const roles = [
    "Sr Data Analyst",
    "DevOps Engineer",
    "Financial Analyst",
    "Solutions Architect",
    "QA Engineer",
    "Backend Engineer",
  ];
  const seed = recruiter.length;
  return Array.from({ length: row.placements }, (_, i) => ({
    consultant: consultants[(seed + i) % consultants.length],
    client: clients[(seed + i * 2) % clients.length],
    role: roles[(seed + i * 3) % roles.length],
    tto: row.avgTto + ((seed + i) % 5) - 2,
    start: `${["May", "Jun"][i % 2]} ${5 + i}, 2026`,
  }));
}
