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
import { SUB_REPORT_CONFIG, type SubReportRow } from "./config";


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
