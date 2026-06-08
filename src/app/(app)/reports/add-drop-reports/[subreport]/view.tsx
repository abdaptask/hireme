"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Download,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { DrillDownSheet } from "@/components/reports/drill-down-sheet";
import { cn } from "@/lib/utils";

/* ---------------------------- Config & datasets --------------------------- */

export type SubReportRow = {
  dimension: string;
  adds: number;
  drops: number;
  net: number;
  active: number;
};

type SubReportConfig = {
  title: string;
  dimensionLabel: string;
  description: string;
  data: SubReportRow[];
};

export const SUB_REPORT_CONFIG: Record<string, SubReportConfig> = {
  weekly: {
    title: "Weekly Add/Drop",
    dimensionLabel: "Week",
    description: "Trailing 13 weeks of workforce movement.",
    data: [
      { dimension: "W23 · Jun 2", adds: 5, drops: 1, net: 4, active: 184 },
      { dimension: "W22 · May 26", adds: 4, drops: 2, net: 2, active: 180 },
      { dimension: "W21 · May 19", adds: 6, drops: 1, net: 5, active: 178 },
      { dimension: "W20 · May 12", adds: 3, drops: 2, net: 1, active: 173 },
      { dimension: "W19 · May 5", adds: 4, drops: 3, net: 1, active: 172 },
      { dimension: "W18 · Apr 28", adds: 5, drops: 1, net: 4, active: 171 },
      { dimension: "W17 · Apr 21", adds: 2, drops: 2, net: 0, active: 167 },
      { dimension: "W16 · Apr 14", adds: 6, drops: 2, net: 4, active: 167 },
      { dimension: "W15 · Apr 7", adds: 3, drops: 1, net: 2, active: 163 },
      { dimension: "W14 · Mar 31", adds: 4, drops: 3, net: 1, active: 161 },
      { dimension: "W13 · Mar 24", adds: 5, drops: 2, net: 3, active: 160 },
      { dimension: "W12 · Mar 17", adds: 4, drops: 2, net: 2, active: 157 },
      { dimension: "W11 · Mar 10", adds: 3, drops: 1, net: 2, active: 155 },
    ],
  },
  monthly: {
    title: "Monthly Add/Drop",
    dimensionLabel: "Month",
    description: "Monthly trend across the trailing 12 months.",
    data: [
      { dimension: "Jun 2026", adds: 18, drops: 6, net: 12, active: 184 },
      { dimension: "May 2026", adds: 16, drops: 4, net: 12, active: 172 },
      { dimension: "Apr 2026", adds: 13, drops: 7, net: 6, active: 160 },
      { dimension: "Mar 2026", adds: 17, drops: 8, net: 9, active: 154 },
      { dimension: "Feb 2026", adds: 11, drops: 5, net: 6, active: 145 },
      { dimension: "Jan 2026", adds: 14, drops: 9, net: 5, active: 139 },
      { dimension: "Dec 2025", adds: 9, drops: 7, net: 2, active: 134 },
      { dimension: "Nov 2025", adds: 12, drops: 6, net: 6, active: 132 },
      { dimension: "Oct 2025", adds: 15, drops: 5, net: 10, active: 126 },
      { dimension: "Sep 2025", adds: 11, drops: 8, net: 3, active: 116 },
      { dimension: "Aug 2025", adds: 13, drops: 6, net: 7, active: 113 },
      { dimension: "Jul 2025", adds: 10, drops: 4, net: 6, active: 106 },
    ],
  },
  "by-client": {
    title: "By Client",
    dimensionLabel: "Client",
    description: "Per-client adds, drops, net, and active headcount this month.",
    data: [
      { dimension: "Meridian Health", adds: 6, drops: 1, net: 5, active: 42 },
      { dimension: "Cobalt Systems", adds: 4, drops: 1, net: 3, active: 35 },
      { dimension: "Vertex Financial", adds: 3, drops: 2, net: 1, active: 28 },
      { dimension: "Northwind Logistics", adds: 2, drops: 1, net: 1, active: 24 },
      { dimension: "Atlas Manufacturing", adds: 3, drops: 1, net: 2, active: 31 },
      { dimension: "Other", adds: 0, drops: 0, net: 0, active: 24 },
    ],
  },
  "by-recruiter": {
    title: "By Recruiter",
    dimensionLabel: "Recruiter",
    description: "Recruiter-attributed adds and drops this month.",
    data: [
      { dimension: "Devon Hughes", adds: 6, drops: 1, net: 5, active: 38 },
      { dimension: "Aaron Flores", adds: 5, drops: 2, net: 3, active: 32 },
      { dimension: "Lena Ortiz", adds: 4, drops: 2, net: 2, active: 29 },
      { dimension: "Priya Ramesh", adds: 2, drops: 1, net: 1, active: 19 },
      { dimension: "Jordan Pratt", adds: 1, drops: 0, net: 1, active: 14 },
    ],
  },
  "by-reason": {
    title: "By Reason",
    dimensionLabel: "Drop reason",
    description: "Root-cause classification across drops this month.",
    data: [
      { dimension: "End of assignment", adds: 0, drops: 2, net: -2, active: 0 },
      { dimension: "Voluntary resignation", adds: 0, drops: 1, net: -1, active: 0 },
      { dimension: "Performance", adds: 0, drops: 1, net: -1, active: 0 },
      { dimension: "Converted to FTE", adds: 0, drops: 1, net: -1, active: 0 },
      { dimension: "Client cancellation", adds: 0, drops: 1, net: -1, active: 0 },
    ],
  },
};

/* ---------------------------------- View ---------------------------------- */

export function SubReportView({ slug }: { slug: string }) {
  const cfg = SUB_REPORT_CONFIG[slug];
  const [drill, setDrill] = useState<SubReportRow | null>(null);

  const totalAdds = cfg.data.reduce((s, r) => s + r.adds, 0);
  const totalDrops = cfg.data.reduce((s, r) => s + r.drops, 0);
  const net = totalAdds - totalDrops;
  const max = Math.max(...cfg.data.map((r) => r.adds + r.drops), 1);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          nativeButton={false}
          render={<Link href="/reports/add-drop-reports" />}
        >
          <ArrowLeft className="size-4" /> Add Drop Reports
        </Button>
        <PageHeader
          title={cfg.title}
          description={cfg.description}
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

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile label="Total adds" value={totalAdds} tone="success" />
        <KpiTile label="Total drops" value={totalDrops} tone="danger" />
        <KpiTile label="Net change" value={`${net >= 0 ? "+" : ""}${net}`} tone="info" />
        <KpiTile label={`${cfg.dimensionLabel}s`} value={cfg.data.length} tone="neutral" />
      </div>

      {/* Detail table */}
      <WidgetCard
        title={`${cfg.title} · breakdown`}
        description={`Click any ${cfg.dimensionLabel.toLowerCase()} to drill down.`}
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">{cfg.dimensionLabel}</th>
                <th className="px-2 py-2 font-medium">Movement</th>
                <th className="px-2 py-2 font-medium text-right">Adds</th>
                <th className="px-2 py-2 font-medium text-right">Drops</th>
                <th className="px-2 py-2 font-medium text-right">Net</th>
                <th className="px-2 py-2 font-medium text-right">Active</th>
              </tr>
            </thead>
            <tbody>
              {cfg.data.map((r) => {
                const addPct = (r.adds / max) * 100;
                const dropPct = (r.drops / max) * 100;
                return (
                  <tr
                    key={r.dimension}
                    className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                    onClick={() => setDrill(r)}
                  >
                    <td className="px-2 py-2 font-medium whitespace-nowrap">
                      {r.dimension}
                    </td>
                    <td className="px-2 py-2">
                      <div className="bg-muted relative flex h-2 w-40 overflow-hidden rounded-full">
                        <span
                          className="bg-success/80 block h-full"
                          style={{ width: `${addPct}%` }}
                        />
                        <span
                          className="bg-danger/80 block h-full"
                          style={{ width: `${dropPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-success-muted-foreground px-2 py-2 text-right tabular-nums">
                      {r.adds}
                    </td>
                    <td className="text-danger-muted-foreground px-2 py-2 text-right tabular-nums">
                      {r.drops}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right font-medium tabular-nums",
                        r.net > 0 && "text-success-muted-foreground",
                        r.net < 0 && "text-danger-muted-foreground",
                      )}
                    >
                      {r.net >= 0 ? "+" : ""}
                      {r.net}
                    </td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                      {r.active || "—"}
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
        title={drill ? `${cfg.dimensionLabel}: ${drill.dimension}` : ""}
        description="Underlying add/drop records — sample data."
        columns={[
          { key: "name", label: "Consultant", accessor: (r) => r.name },
          { key: "client", label: "Client", accessor: (r) => r.client },
          { key: "action", label: "Movement", accessor: (r) => r.action },
          { key: "date", label: "Date", accessor: (r) => r.date, align: "right" },
        ]}
        rows={drill ? buildDrillRows(drill) : []}
      />
    </PageContainer>
  );
}

/* --------------------------------- Pieces --------------------------------- */

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "success" | "danger" | "info" | "neutral";
}) {
  const toneText: Record<typeof tone, string> = {
    success: "text-success-muted-foreground",
    danger: "text-danger-muted-foreground",
    info: "text-foreground",
    neutral: "text-foreground",
  };
  const Icon =
    tone === "danger" ? ArrowDownRight : tone === "success" ? ArrowUpRight : null;
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-2xl font-semibold tabular-nums tracking-tight",
          toneText[tone],
        )}
      >
        {Icon ? <Icon className="size-5" /> : null}
        {value}
      </span>
    </div>
  );
}

type DrillRow = { name: string; client: string; action: string; date: string };

function buildDrillRows(row: SubReportRow): DrillRow[] {
  // Synthetic but consistent sample records per dimension.
  const names = [
    "Sarah Chen",
    "Marcus Bell",
    "Elena Vasquez",
    "Brendan Walsh",
    "Priya Sharma",
    "Kai Nakamura",
    "Amara Diallo",
    "Derek Olsen",
  ];
  const clients = [
    "Meridian Health",
    "Cobalt Systems",
    "Vertex Financial",
    "Northwind Logistics",
    "Atlas Manufacturing",
  ];
  const out: DrillRow[] = [];
  for (let i = 0; i < row.adds; i++) {
    out.push({
      name: names[i % names.length],
      client: clients[i % clients.length],
      action: "Added",
      date: `Jun ${2 + i}, 2026`,
    });
  }
  for (let i = 0; i < row.drops; i++) {
    out.push({
      name: names[(i + 4) % names.length],
      client: clients[(i + 2) % clients.length],
      action: "Dropped",
      date: `Jun ${1 + i}, 2026`,
    });
  }
  return out;
}
