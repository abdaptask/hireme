"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Download,
  Minus,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { DrillDownSheet } from "@/components/reports/drill-down-sheet";
import { cn } from "@/lib/utils";

/* --------------------------------- Mocks ---------------------------------- */

type ClientRow = {
  client: string;
  addsMtd: number;
  dropsMtd: number;
  totalActive: number;
};

const CLIENTS: ClientRow[] = [
  { client: "Meridian Health", addsMtd: 6, dropsMtd: 1, totalActive: 42 },
  { client: "Cobalt Systems", addsMtd: 4, dropsMtd: 1, totalActive: 35 },
  { client: "Vertex Financial", addsMtd: 3, dropsMtd: 2, totalActive: 28 },
  { client: "Atlas Manufacturing", addsMtd: 3, dropsMtd: 1, totalActive: 31 },
  { client: "Northwind Logistics", addsMtd: 2, dropsMtd: 1, totalActive: 24 },
  { client: "Brightlane Retail", addsMtd: 1, dropsMtd: 1, totalActive: 12 },
  { client: "Helix Biotech", addsMtd: 1, dropsMtd: 0, totalActive: 8 },
  { client: "Orion Aerospace", addsMtd: 0, dropsMtd: 2, totalActive: 14 },
  { client: "Summit Energy", addsMtd: 0, dropsMtd: 1, totalActive: 9 },
];

type Movement = {
  name: string;
  role: string;
  action: "Added" | "Dropped";
  date: string;
  reason?: string;
};

const MOVEMENT_BY_CLIENT: Record<string, Movement[]> = {
  "Meridian Health": [
    { name: "Elena Vasquez", role: "Sr Data Analyst", action: "Added", date: "Jun 1" },
    { name: "Sarah Chen", role: "Clinical Nurse", action: "Added", date: "Jun 3" },
    { name: "James Okonkwo", role: "Clinical Coord.", action: "Dropped", date: "Jun 4", reason: "End of assignment" },
    { name: "Rachel Stone", role: "RN ICU", action: "Added", date: "Jun 5" },
    { name: "Marcus Park", role: "Pharmacy Tech", action: "Added", date: "Jun 6" },
    { name: "Nina Petrov", role: "Data Engineer", action: "Added", date: "Jun 6" },
    { name: "Liam Foster", role: "RN", action: "Added", date: "Jun 7" },
  ],
  "Cobalt Systems": [
    { name: "Kai Nakamura", role: "DevOps Engineer", action: "Added", date: "Jun 2" },
    { name: "Brendan Walsh", role: "Backend Eng", action: "Added", date: "Jun 3" },
    { name: "Asha Patel", role: "SRE", action: "Added", date: "Jun 5" },
    { name: "Tom Reilly", role: "Platform Eng", action: "Added", date: "Jun 6" },
    { name: "Mei Lin", role: "Security Eng", action: "Dropped", date: "Jun 4", reason: "Voluntary" },
  ],
  "Vertex Financial": [
    { name: "Priya Sharma", role: "Fin Analyst", action: "Added", date: "Jun 2" },
    { name: "Owen Brooks", role: "Risk Analyst", action: "Added", date: "Jun 4" },
    { name: "Carla Diaz", role: "Auditor", action: "Added", date: "Jun 6" },
    { name: "Chidi Eze", role: "Accountant", action: "Dropped", date: "Jun 1", reason: "End of assignment" },
    { name: "Hannah Lee", role: "Compliance", action: "Dropped", date: "Jun 5", reason: "Performance" },
  ],
  "Atlas Manufacturing": [
    { name: "Lucia Herrera", role: "Product Designer", action: "Added", date: "Jun 1" },
    { name: "Amara Diallo", role: "QA Engineer", action: "Added", date: "Jun 3" },
    { name: "Niko Berg", role: "Mfg Engineer", action: "Added", date: "Jun 5" },
    { name: "Pat Wexler", role: "QA Lead", action: "Dropped", date: "Jun 4", reason: "Converted to FTE" },
  ],
  "Northwind Logistics": [
    { name: "Derek Olsen", role: "Solutions Arch", action: "Added", date: "Jun 2" },
    { name: "Marcus Bell", role: "Field Tech", action: "Added", date: "Jun 5" },
    { name: "Jen Vargas", role: "Ops Analyst", action: "Dropped", date: "Jun 3", reason: "Client cancellation" },
  ],
  "Brightlane Retail": [
    { name: "Riya Kapoor", role: "Merch Analyst", action: "Added", date: "Jun 4" },
    { name: "Dan Mercer", role: "Store Systems", action: "Dropped", date: "Jun 2", reason: "End of assignment" },
  ],
  "Helix Biotech": [
    { name: "Sven Holm", role: "Lab Tech", action: "Added", date: "Jun 6" },
  ],
  "Orion Aerospace": [
    { name: "Trish Bauer", role: "Systems Eng", action: "Dropped", date: "Jun 2", reason: "Voluntary" },
    { name: "Mo Karim", role: "Test Eng", action: "Dropped", date: "Jun 5", reason: "Performance" },
  ],
  "Summit Energy": [
    { name: "Iris Cole", role: "Project Mgr", action: "Dropped", date: "Jun 3", reason: "End of assignment" },
  ],
};

/* ---------------------------------- Page ---------------------------------- */

export default function ClientAddDropSummaryPage() {
  const [drill, setDrill] = useState<ClientRow | null>(null);

  const rows = [...CLIENTS]
    .map((c) => ({ ...c, net: c.addsMtd - c.dropsMtd }))
    .sort((a, b) => b.net - a.net);

  const netGrowing = rows.filter((r) => r.net > 0).length;
  const withDrops = rows.filter((r) => r.dropsMtd > 0).length;
  const topAdd = [...rows].sort((a, b) => b.addsMtd - a.addsMtd)[0];
  const topDrop = [...rows].sort((a, b) => b.dropsMtd - a.dropsMtd)[0];

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
          title="Client Add Drop Summary"
          description="Workforce movement broken out by client · month-to-date."
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

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Net-growth clients" value={netGrowing} sub={`of ${rows.length}`} />
        <Kpi label="Clients with drops" value={withDrops} sub={`of ${rows.length}`} />
        <Kpi label="Top adds" value={topAdd.client} sub={`+${topAdd.addsMtd} MTD`} small />
        <Kpi label="Top drops" value={topDrop.client} sub={`-${topDrop.dropsMtd} MTD`} small />
      </div>

      {/* Per-client table */}
      <WidgetCard
        title="By client · month-to-date"
        description="Click any client to drill into the underlying adds and drops."
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Client</th>
                <th className="px-2 py-2 font-medium text-right">Adds MTD</th>
                <th className="px-2 py-2 font-medium text-right">Drops MTD</th>
                <th className="px-2 py-2 font-medium text-right">Net</th>
                <th className="px-2 py-2 font-medium text-right">Total active</th>
                <th className="px-2 py-2 font-medium text-center">Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const TrendIcon =
                  r.net > 0 ? ArrowUpRight : r.net < 0 ? ArrowDownRight : Minus;
                return (
                  <tr
                    key={r.client}
                    className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                    onClick={() => setDrill(r)}
                  >
                    <td className="px-2 py-2 font-medium whitespace-nowrap">
                      {r.client}
                    </td>
                    <td className="text-success-muted-foreground px-2 py-2 text-right tabular-nums">
                      +{r.addsMtd}
                    </td>
                    <td className="text-danger-muted-foreground px-2 py-2 text-right tabular-nums">
                      −{r.dropsMtd}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right font-medium tabular-nums",
                        r.net > 0 && "text-success-muted-foreground",
                        r.net < 0 && "text-danger-muted-foreground",
                      )}
                    >
                      {r.net > 0 ? "+" : ""}
                      {r.net}
                    </td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                      {r.totalActive}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <TrendIcon
                        className={cn(
                          "inline size-4",
                          r.net > 0 && "text-success-muted-foreground",
                          r.net < 0 && "text-danger-muted-foreground",
                          r.net === 0 && "text-muted-foreground",
                        )}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      <DrillDownSheet<Movement>
        open={!!drill}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill ? `${drill.client} · adds & drops` : ""}
        description="Underlying month-to-date movement."
        columns={[
          { key: "name", label: "Consultant", accessor: (r) => r.name },
          { key: "role", label: "Role", accessor: (r) => r.role },
          {
            key: "action",
            label: "Movement",
            accessor: (r) => (
              <span
                className={cn(
                  "text-xs font-medium",
                  r.action === "Added"
                    ? "text-success-muted-foreground"
                    : "text-danger-muted-foreground",
                )}
              >
                {r.action}
              </span>
            ),
            sortValue: (r) => r.action,
          },
          { key: "reason", label: "Reason", accessor: (r) => r.reason ?? "—" },
          { key: "date", label: "Date", accessor: (r) => r.date, align: "right" },
        ]}
        rows={drill ? MOVEMENT_BY_CLIENT[drill.client] ?? [] : []}
      />
    </PageContainer>
  );
}

function Kpi({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: string | number;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label">{label}</span>
      <span
        className={cn(
          "font-semibold tracking-tight",
          small ? "text-base" : "text-2xl tabular-nums",
        )}
      >
        {value}
      </span>
      {sub && <span className="text-metadata">{sub}</span>}
    </div>
  );
}
