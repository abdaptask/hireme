"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  formatUsdValue,
} from "@/components/reports/report-ui";
import {
  CONSULTANTS,
  CONSULTANT_STATUS_META,
  type Consultant,
  type ConsultantStatus,
} from "@/lib/consultants";
import { cn } from "@/lib/utils";

const KPIS = {
  active: 154,
  startingThisMonth: 12,
  endingThisMonth: 8,
  avgTenureMonths: 18,
  conversionsYtd: 4,
};

const STATUS_FILTERS = ["all", "active", "ending", "inactive"] as const;

const TOP_CLIENTS: { client: string; count: number }[] = [
  { client: "Meridian Health", count: 38 },
  { client: "Cobalt Systems", count: 31 },
  { client: "Vertex Financial", count: 27 },
  { client: "Northwind Logistics", count: 22 },
  { client: "Atlas Manufacturing", count: 19 },
  { client: "Other", count: 17 },
];

const CLIENT_FILTER = [
  "All",
  ...Array.from(new Set(CONSULTANTS.map((c) => c.client))),
];

const DRILL_COLUMNS: DrillDownColumn<Consultant>[] = [
  { key: "name", label: "Name", accessor: (r) => r.name },
  { key: "client", label: "Client", accessor: (r) => r.client },
  { key: "role", label: "Role", accessor: (r) => r.role },
  { key: "status", label: "Status", accessor: (r) => r.status },
  {
    key: "billRate",
    label: "Bill",
    accessor: (r) => `$${r.billRate}/hr`,
    sortValue: (r) => r.billRate,
    align: "right",
  },
];

export default function ConsultantReportView() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [client, setClient] = useState("All");
  const [search, setSearch] = useState("");
  const [drill, setDrill] = useState<{ title: string; rows: Consultant[] } | null>(null);

  const filtered = useMemo(() => {
    return CONSULTANTS.filter((c) => {
      if (client !== "All" && c.client !== client) return false;
      if (search && !`${c.name} ${c.role} ${c.client}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter === "active" && c.status !== "Active") return false;
      if (
        statusFilter === "ending" &&
        c.status !== "Extension Pending" &&
        c.status !== "Offboarding"
      ) {
        return false;
      }
      if (
        statusFilter === "inactive" &&
        (c.status === "Active" || c.status === "Extension Pending")
      ) {
        return false;
      }
      return true;
    });
  }, [statusFilter, client, search]);

  const maxClient = Math.max(...TOP_CLIENTS.map((t) => t.count));

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Consultant Report"
          description="Active workforce roster across clients and assignment lifecycles."
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
        <StatTile icon={Users} label="Active Consultants" value={KPIS.active} />
        <StatTile icon={UserPlus} label="Starting This Month" value={KPIS.startingThisMonth} tone="info" />
        <StatTile icon={UserMinus} label="Ending This Month" value={KPIS.endingThisMonth} tone="warning" />
        <StatTile icon={TrendingUp} label="Avg Tenure" value={KPIS.avgTenureMonths} suffix="mo" />
        <StatTile icon={UserCheck} label="Conversions YTD" value={KPIS.conversionsYtd} tone="success" />
      </section>

      <FilterBar>
        <FilterSelect label="Client" value={client} options={CLIENT_FILTER} onChange={setClient} />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_FILTERS as readonly string[]}
          onChange={(v) => setStatusFilter(v as (typeof STATUS_FILTERS)[number])}
        />
        <FilterSearch
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder="Name, role, client…"
        />
        <FilterSelect
          label="Start range"
          value="last-12mo"
          options={["last-12mo", "ytd", "qtd", "mtd"]}
          onChange={() => {}}
        />
      </FilterBar>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <WidgetCard
          title="Consultants"
          description={`${filtered.length} record${filtered.length === 1 ? "" : "s"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium">Role</th>
                  <th className="px-2 py-2 font-medium">Start</th>
                  <th className="px-2 py-2 font-medium">End</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 text-right font-medium">Bill</th>
                  <th className="px-2 py-2 text-right font-medium">Pay</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 border-b last:border-0">
                    <td className="px-2 py-2 font-medium whitespace-nowrap">
                      <Link href={`/consultants/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{c.client}</td>
                    <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">{c.role}</td>
                    <td className="text-muted-foreground px-2 py-2 tabular-nums whitespace-nowrap">{c.startDate}</td>
                    <td className="text-muted-foreground px-2 py-2 tabular-nums whitespace-nowrap">
                      {c.endDate ?? "—"}
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge tone={CONSULTANT_STATUS_META[c.status].tone}>
                        {CONSULTANT_STATUS_META[c.status].label}
                      </StatusBadge>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatUsdValue(c.billRate)}</td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                      {formatUsdValue(c.payRate)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-muted-foreground px-2 py-8 text-center text-sm">
                      No consultants match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Top clients by consultant count" description="Click to drill into roster">
            <ul className="flex flex-col gap-2.5">
              {TOP_CLIENTS.map((t) => {
                const rows = CONSULTANTS.filter((c) => c.client === t.client);
                return (
                  <li key={t.client}>
                    <button
                      type="button"
                      onClick={() => setDrill({ title: `${t.client} consultants`, rows })}
                      className="hover:bg-muted/50 focus-visible:ring-ring -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="w-32 shrink-0 truncate text-sm">{t.client}</span>
                      <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
                        <span
                          className={cn("absolute inset-y-0 left-0 rounded-full bg-primary")}
                          style={{ width: `${(t.count / maxClient) * 100}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">{t.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </WidgetCard>

          <WidgetCard title="Lifecycle distribution" description="Across all active records">
            <ul className="flex flex-col gap-1.5">
              {(Object.keys(CONSULTANT_STATUS_META) as ConsultantStatus[]).map((s) => {
                const count = CONSULTANTS.filter((c) => c.status === s).length;
                if (count === 0) return null;
                return (
                  <li key={s} className="flex items-center justify-between text-sm">
                    <StatusBadge tone={CONSULTANT_STATUS_META[s].tone}>
                      {CONSULTANT_STATUS_META[s].label}
                    </StatusBadge>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </li>
                );
              })}
            </ul>
          </WidgetCard>
        </div>
      </div>

      <DrillDownSheet
        open={!!drill}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill?.title ?? ""}
        description="Underlying consultant records"
        columns={DRILL_COLUMNS}
        rows={drill?.rows ?? []}
      />
    </PageContainer>
  );
}
