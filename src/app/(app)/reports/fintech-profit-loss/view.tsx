"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Download,
  LineChart,
  PiggyBank,
  Receipt,
  Scale,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList, MiniBars } from "@/components/dashboard/widgets";
import { StatTile } from "@/components/workspace/stat-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import { cn } from "@/lib/utils";

type Dept = "all" | "lending" | "payments" | "wealth";

type LineItem = {
  category: string;
  type: "revenue" | "cogs" | "opex";
  budget: number; // USD
  actual: number; // USD
  department: Exclude<Dept, "all">;
};

const LINE_ITEMS: LineItem[] = [
  // Revenue
  { category: "Interest & lending revenue", type: "revenue", budget: 9_800_000, actual: 10_420_000, department: "lending" },
  { category: "Payments & interchange", type: "revenue", budget: 7_400_000, actual: 7_690_000, department: "payments" },
  { category: "Wealth & advisory fees", type: "revenue", budget: 6_900_000, actual: 6_690_000, department: "wealth" },
  // COGS
  { category: "Cost of funds", type: "cogs", budget: 4_100_000, actual: 4_280_000, department: "lending" },
  { category: "Payment network fees", type: "cogs", budget: 2_900_000, actual: 3_020_000, department: "payments" },
  { category: "Custody & clearing fees", type: "cogs", budget: 1_950_000, actual: 1_900_000, department: "wealth" },
  // OpEx
  { category: "Personnel", type: "opex", budget: 5_600_000, actual: 5_820_000, department: "lending" },
  { category: "Tech infrastructure", type: "opex", budget: 2_300_000, actual: 2_410_000, department: "payments" },
  { category: "Marketing", type: "opex", budget: 1_400_000, actual: 1_240_000, department: "payments" },
  { category: "Compliance & legal", type: "opex", budget: 1_100_000, actual: 1_290_000, department: "lending" },
  { category: "G&A", type: "opex", budget: 680_000, actual: 640_000, department: "wealth" },
];

const QUARTERLY = [
  { name: "Q1 2025", value: 5_800_000 },
  { name: "Q2 2025", value: 6_100_000 },
  { name: "Q3 2025", value: 6_300_000 },
  { name: "Q4 2025", value: 6_600_000 },
];

const DEPT_BREAKDOWN: Record<Exclude<Dept, "all">, { label: string; pct: number; revenue: number }> = {
  lending: { label: "Lending", pct: 42, revenue: 10_420_000 },
  payments: { label: "Payments", pct: 31, revenue: 7_690_000 },
  wealth: { label: "Wealth", pct: 27, revenue: 6_690_000 },
};

function fmtUsdFull(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function FintechProfitLossView() {
  const [period, setPeriod] = useState("Q4 2025");
  const [dept, setDept] = useState<Dept>("all");
  const [currency, setCurrency] = useState("USD");
  const [drillItem, setDrillItem] = useState<LineItem | null>(null);

  const filtered = useMemo(
    () => (dept === "all" ? LINE_ITEMS : LINE_ITEMS.filter((l) => l.department === dept)),
    [dept],
  );

  const netRevenue = 24_800_000;
  const cogs = 9_200_000;
  const grossProfit = netRevenue - cogs;
  const opex = 11_400_000;
  const netIncome = 4_200_000;
  const grossMarginPct = Math.round((grossProfit / netRevenue) * 100);
  const netMarginPct = Math.round((netIncome / netRevenue) * 100);

  const lineCols: DrillDownColumn<{ month: string; budget: number; actual: number; variance: number }>[] = [
    { key: "month", label: "Month", accessor: (r) => r.month },
    { key: "budget", label: "Budget", accessor: (r) => fmtUsdFull(r.budget), sortValue: (r) => r.budget, align: "right" },
    { key: "actual", label: "Actual", accessor: (r) => fmtUsdFull(r.actual), sortValue: (r) => r.actual, align: "right" },
    {
      key: "variance",
      label: "Variance",
      sortValue: (r) => r.variance,
      align: "right",
      accessor: (r) => (
        <span className={cn(r.variance >= 0 ? "text-success-muted-foreground" : "text-danger-muted-foreground")}>
          {r.variance >= 0 ? "+" : ""}{fmtUsdFull(r.variance)}
        </span>
      ),
    },
  ];

  const drillRows = useMemo(() => {
    if (!drillItem) return [];
    // Synthesize monthly rows from the line item's quarterly totals.
    const months = ["Oct 2025", "Nov 2025", "Dec 2025"];
    const monthlyBudget = drillItem.budget / 3;
    const monthlyActual = drillItem.actual / 3;
    return months.map((m, i) => {
      const b = Math.round(monthlyBudget * (1 + (i - 1) * 0.04));
      const a = Math.round(monthlyActual * (1 + (i - 1) * 0.06));
      return { month: m, budget: b, actual: a, variance: a - b };
    });
  }, [drillItem]);

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
          title="Fintech Profit & Loss"
          description="Fintech-specific P&L · revenue, cost of goods, and operating spend across lending, payments, and wealth."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled title="Scheduled delivery lands in v0.9">
                <CalendarClock className="size-3.5" /> Schedule report
              </Button>
            </div>
          }
        />
      </div>

      {/* Filter bar */}
      <section className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3 shadow-xs">
        <FilterSelect
          label="Period"
          value={period}
          onChange={setPeriod}
          options={["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "FY 2025"]}
        />
        <FilterSelect
          label="Department"
          value={dept}
          onChange={(v) => setDept(v as Dept)}
          options={[
            { label: "All departments", value: "all" },
            { label: "Lending", value: "lending" },
            { label: "Payments", value: "payments" },
            { label: "Wealth", value: "wealth" },
          ]}
        />
        <FilterSelect
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={["USD", "EUR", "GBP"]}
        />
        <Badge variant="secondary" className="ml-auto gap-1 text-[10px]">
          <TrendingUp className="size-3" /> data fresh as of today
        </Badge>
      </section>

      {/* 6 KPIs */}
      <section>
        <h2 className="text-section-heading mb-2.5">Headline metrics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile icon={CircleDollarSign} label="Net revenue" value="$24.8M" tone="info" />
          <StatTile icon={Receipt} label="COGS" value="$9.2M" tone="warning" />
          <StatTile icon={PiggyBank} label="Gross profit" value="$15.6M" suffix={`${grossMarginPct}%`} tone="success" />
          <StatTile icon={LineChart} label="OpEx" value="$11.4M" tone="warning" />
          <StatTile icon={TrendingUp} label="Net income" value="$4.2M" tone="success" />
          <StatTile icon={Scale} label="Net margin" value={`${netMarginPct}%`} tone="ai" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <WidgetCard title="Revenue trend" description="Quarterly · 2025">
          <BarList
            rows={QUARTERLY}
            tone="info"
            formatValue={(v) => fmtUsdFull(v)}
          />
        </WidgetCard>
        <WidgetCard title="Department breakdown" description="Share of net revenue (Q4 2025)">
          <ul className="flex flex-col gap-3">
            {Object.entries(DEPT_BREAKDOWN).map(([key, d]) => (
              <li key={key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium">{d.label}</span>
                <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      key === "lending" ? "bg-info" : key === "payments" ? "bg-success" : "bg-ai",
                    )}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-20 shrink-0 text-right text-xs tabular-nums">
                  {d.pct}% · {fmtUsdFull(d.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      </div>

      <WidgetCard
        title="Line items"
        description="Click any row to drill into monthly budget vs actual"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Department</th>
                <th className="px-2 py-2 font-medium text-right">Budget</th>
                <th className="px-2 py-2 font-medium text-right">Actual</th>
                <th className="px-2 py-2 font-medium text-right">Variance</th>
                <th className="px-2 py-2 font-medium text-right">vs Budget</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const variance = l.actual - l.budget;
                const pct = Math.round((variance / l.budget) * 1000) / 10;
                // For revenue, positive variance is good; for cost lines, negative variance is good.
                const isGood = l.type === "revenue" ? variance >= 0 : variance <= 0;
                return (
                  <tr
                    key={l.category}
                    onClick={() => setDrillItem(l)}
                    className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                  >
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{l.category}</td>
                    <td className="px-2 py-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {l.type}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-2 py-2 capitalize">{l.department}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmtUsdFull(l.budget)}</td>
                    <td className="px-2 py-2 text-right tabular-nums font-medium">{fmtUsdFull(l.actual)}</td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right tabular-nums",
                        isGood ? "text-success-muted-foreground" : "text-danger-muted-foreground",
                      )}
                    >
                      {variance >= 0 ? "+" : ""}
                      {fmtUsdFull(variance)}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right tabular-nums",
                        isGood ? "text-success-muted-foreground" : "text-danger-muted-foreground",
                      )}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {variance >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {Math.abs(pct)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <WidgetCard title="Revenue (latest)" description="Quarterly trend">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums">$6.6M</p>
              <p className="text-metadata">Q4 2025</p>
            </div>
            <div className="w-40">
              <MiniBars data={QUARTERLY.map((q) => q.value)} tone="info" />
            </div>
          </div>
        </WidgetCard>
        <WidgetCard title="Gross margin" description="Q4 2025">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{grossMarginPct}%</p>
              <p className="text-metadata">{fmtUsdFull(grossProfit)} YTD</p>
            </div>
            <div className="w-40">
              <MiniBars data={[58, 60, 61, 63]} tone="success" />
            </div>
          </div>
        </WidgetCard>
        <WidgetCard title="OpEx ratio" description="OpEx / Revenue">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{Math.round((opex / netRevenue) * 100)}%</p>
              <p className="text-metadata">{fmtUsdFull(opex)} YTD</p>
            </div>
            <div className="w-40">
              <MiniBars data={[48, 47, 46, 46]} tone="warning" />
            </div>
          </div>
        </WidgetCard>
      </div>

      <DrillDownSheet
        open={drillItem != null}
        onOpenChange={(o) => !o && setDrillItem(null)}
        title={drillItem ? `${drillItem.category} — monthly detail` : ""}
        description={drillItem ? `${drillItem.type.toUpperCase()} · ${drillItem.department}` : undefined}
        columns={lineCols}
        rows={drillRows}
      />
    </PageContainer>
  );
}

/* ---------------------------- Filter primitives ---------------------------- */

type Option = string | { label: string; value: string };

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background hover:bg-muted h-7 cursor-pointer rounded-md border px-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {options.map((o) => {
          const opt = typeof o === "string" ? { label: o, value: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
