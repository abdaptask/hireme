"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  MapPin,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, MiniBars } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import {
  FilterBar,
  FilterSelect,
} from "@/components/reports/report-ui";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Headcount mock data (§7 vitals, §55 manager throughput).
   --------------------------------------------------------------------------- */

const KPIS = {
  total: 247,
  active: 218,
  onLeave: 9,
  onboarding: 20,
  pendingStart: 12,
};

const TREND_12MO: { month: string; total: number }[] = [
  { month: "Jul", total: 198 },
  { month: "Aug", total: 204 },
  { month: "Sep", total: 211 },
  { month: "Oct", total: 215 },
  { month: "Nov", total: 219 },
  { month: "Dec", total: 213 },
  { month: "Jan", total: 220 },
  { month: "Feb", total: 226 },
  { month: "Mar", total: 232 },
  { month: "Apr", total: 235 },
  { month: "May", total: 240 },
  { month: "Jun", total: 247 },
];

type DepartmentRow = {
  department: string;
  active: number;
  onboarding: number;
  onLeave: number;
  total: number;
  trend: number[];
};

const DEPARTMENTS: DepartmentRow[] = [
  { department: "Engineering", active: 81, onboarding: 6, onLeave: 2, total: 89, trend: [72, 74, 75, 78, 80, 79, 82, 84, 85, 86, 88, 89] },
  { department: "Data & Analytics", active: 30, onboarding: 3, onLeave: 1, total: 34, trend: [26, 27, 28, 29, 30, 30, 31, 32, 33, 33, 34, 34] },
  { department: "Product & Design", active: 20, onboarding: 1, onLeave: 1, total: 22, trend: [16, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22] },
  { department: "Sales & Account Mgmt", active: 37, onboarding: 3, onLeave: 1, total: 41, trend: [32, 33, 35, 36, 37, 38, 38, 39, 40, 40, 41, 41] },
  { department: "Operations", active: 33, onboarding: 4, onLeave: 1, total: 38, trend: [30, 31, 31, 32, 33, 33, 34, 35, 36, 37, 38, 38] },
  { department: "Finance & Accounting", active: 12, onboarding: 1, onLeave: 1, total: 14, trend: [11, 11, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14] },
  { department: "Healthcare Services", active: 5, onboarding: 2, onLeave: 2, total: 9, trend: [6, 7, 7, 8, 8, 8, 9, 9, 9, 9, 9, 9] },
];

const LOCATIONS: { name: string; count: number }[] = [
  { name: "New York, NY", count: 67 },
  { name: "Dallas / Austin, TX", count: 54 },
  { name: "San Francisco / SJ, CA", count: 47 },
  { name: "Remote", count: 51 },
  { name: "Chicago, IL", count: 28 },
];

const EMP_TYPES: { type: string; count: number; tone: string }[] = [
  { type: "W-2", count: 168, tone: "bg-info" },
  { type: "C2C", count: 54, tone: "bg-ai" },
  { type: "1099", count: 25, tone: "bg-warning" },
];

const DEPT_LIST = ["All", ...DEPARTMENTS.map((d) => d.department)];
const LOC_LIST = ["All", ...LOCATIONS.map((l) => l.name)];
const TYPE_LIST = ["All", "W-2", "C2C", "1099"];

type DeptDrillRow = { status: string; count: number; share: string };

const DEPT_DRILL_COLUMNS: DrillDownColumn<DeptDrillRow>[] = [
  { key: "status", label: "Status", accessor: (r) => r.status },
  { key: "count", label: "Headcount", accessor: (r) => r.count, sortValue: (r) => r.count, align: "right" },
  { key: "share", label: "Share", accessor: (r) => r.share, align: "right" },
];

function buildDeptDrill(d: DepartmentRow): DeptDrillRow[] {
  const pct = (n: number) => `${Math.round((n / d.total) * 100)}%`;
  return [
    { status: "Active", count: d.active, share: pct(d.active) },
    { status: "Onboarding", count: d.onboarding, share: pct(d.onboarding) },
    { status: "On Leave", count: d.onLeave, share: pct(d.onLeave) },
  ];
}

export default function HeadcountView() {
  const [dept, setDept] = useState("All");
  const [loc, setLoc] = useState("All");
  const [type, setType] = useState("All");
  const [drill, setDrill] = useState<DepartmentRow | null>(null);

  const filtered = useMemo(
    () => DEPARTMENTS.filter((d) => dept === "All" || d.department === dept),
    [dept],
  );

  const maxLoc = Math.max(...LOCATIONS.map((l) => l.count));
  const totalEmp = EMP_TYPES.reduce((s, e) => s + e.count, 0);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Headcount Report"
          description="Total workforce composition across departments, locations, and employment types."
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

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Users} label="Total Headcount" value={KPIS.total} />
        <StatTile icon={UserCheck} label="Active" value={KPIS.active} tone="success" />
        <StatTile icon={UserMinus} label="On Leave" value={KPIS.onLeave} tone="warning" />
        <StatTile icon={UsersRound} label="Onboarding" value={KPIS.onboarding} tone="info" />
        <StatTile icon={UserPlus} label="Pending Start" value={KPIS.pendingStart} tone="ai" />
      </section>

      <FilterBar>
        <FilterSelect label="Department" value={dept} options={DEPT_LIST} onChange={setDept} />
        <FilterSelect label="Location" value={loc} options={LOC_LIST} onChange={setLoc} />
        <FilterSelect label="Employment Type" value={type} options={TYPE_LIST} onChange={setType} />
      </FilterBar>

      {/* Trend */}
      <WidgetCard title="Headcount trend" description="Last 12 months · total workforce">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {TREND_12MO[TREND_12MO.length - 1].total}
            </p>
            <p className="text-metadata">
              +{TREND_12MO[TREND_12MO.length - 1].total - TREND_12MO[0].total} vs 12mo ago
            </p>
          </div>
          <div className="w-3/4">
            <MiniBars data={TREND_12MO.map((m) => m.total)} tone="info" />
            <div className="text-muted-foreground mt-1 flex justify-between text-[10px] tabular-nums">
              {TREND_12MO.map((m) => <span key={m.month}>{m.month}</span>)}
            </div>
          </div>
        </div>
      </WidgetCard>

      {/* Department breakdown + Location heatmap */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <WidgetCard title="By department" description="Click a row to drill into headcount detail">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Department</th>
                  <th className="px-2 py-2 text-right font-medium">Active</th>
                  <th className="px-2 py-2 text-right font-medium">Onboarding</th>
                  <th className="px-2 py-2 text-right font-medium">On Leave</th>
                  <th className="px-2 py-2 text-right font-medium">Total</th>
                  <th className="px-2 py-2 font-medium">12mo trend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.department}
                    onClick={() => setDrill(d)}
                    className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                  >
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{d.department}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{d.active}</td>
                    <td className="text-info-muted-foreground px-2 py-2 text-right tabular-nums">{d.onboarding}</td>
                    <td className="text-warning-muted-foreground px-2 py-2 text-right tabular-nums">{d.onLeave}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{d.total}</td>
                    <td className="px-2 py-2">
                      <div className="w-24"><MiniBars data={d.trend} tone="success" /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="By location" description="Where we work">
            <ul className="flex flex-col gap-2.5">
              {LOCATIONS.map((l) => (
                <li key={l.name} className="flex items-center gap-3">
                  <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                  <span className="w-32 shrink-0 truncate text-sm">{l.name}</span>
                  <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-info absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${(l.count / maxLoc) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">{l.count}</span>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard title="Employment type" description="Workforce mix">
            <div className="flex flex-col gap-3">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                {EMP_TYPES.map((e) => (
                  <span
                    key={e.type}
                    className={cn(e.tone, "h-full")}
                    style={{ width: `${(e.count / totalEmp) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {EMP_TYPES.map((e) => (
                  <li key={e.type} className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={cn(e.tone, "size-2 rounded-full")} />
                      {e.type}
                    </span>
                    <span className="text-lg font-semibold tabular-nums">{e.count}</span>
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {Math.round((e.count / totalEmp) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </WidgetCard>
        </div>
      </div>

      <DrillDownSheet
        open={!!drill}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill ? `${drill.department} headcount` : ""}
        description="Status breakdown for this department"
        columns={DEPT_DRILL_COLUMNS}
        rows={drill ? buildDeptDrill(drill) : []}
      />
    </PageContainer>
  );
}
