"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Download,
  Landmark,
  Minus,
  PiggyBank,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList, MiniBars } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import { cn } from "@/lib/utils";

type Period = "Q1 2025" | "Q2 2025" | "Q3 2025" | "Q4 2025" | "FY 2025";

type Client = {
  client: string;
  revenue: number;
  contracts: number;
  industry: string;
};

const TOP_CLIENTS: Client[] = [
  { client: "Meridian Health", revenue: 6_820_000, contracts: 14, industry: "Healthcare" },
  { client: "Vertex Financial", revenue: 5_140_000, contracts: 11, industry: "Financial services" },
  { client: "Northwind Logistics", revenue: 4_360_000, contracts: 9, industry: "Logistics" },
  { client: "Atlas Manufacturing", revenue: 3_720_000, contracts: 8, industry: "Manufacturing" },
  { client: "Cobalt Systems", revenue: 2_910_000, contracts: 6, industry: "Technology" },
  { client: "Helix Biotech", revenue: 2_140_000, contracts: 5, industry: "Life sciences" },
];

const MONTHLY_NET_INCOME = [
  { name: "Jan", value: 280_000 },
  { name: "Feb", value: 310_000 },
  { name: "Mar", value: 340_000 },
  { name: "Apr", value: 320_000 },
  { name: "May", value: 360_000 },
  { name: "Jun", value: 390_000 },
  { name: "Jul", value: 370_000 },
  { name: "Aug", value: 380_000 },
  { name: "Sep", value: 360_000 },
  { name: "Oct", value: 380_000 },
  { name: "Nov", value: 350_000 },
  { name: "Dec", value: 360_000 },
];

function fmtUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function ProfitLossSummaryView() {
  const [period, setPeriod] = useState<Period>("FY 2025");
  const [drillClient, setDrillClient] = useState<Client | null>(null);

  // Headline figures.
  const revenue = 28_300_000;
  const cogs = 11_400_000;
  const grossProfit = revenue - cogs; // 16.9
  const opex = 12_700_000;
  const operatingIncome = grossProfit - opex; // 4.2
  const tax = 1_050_000;
  const netIncome = operatingIncome - tax; // 3.15

  const priorNetIncome = 2_780_000;
  const priorRevenue = 24_800_000;
  const priorGrossProfit = 14_400_000;
  const priorOperatingIncome = 3_550_000;

  const pct = (curr: number, prior: number) =>
    prior ? Math.round(((curr - prior) / Math.abs(prior)) * 1000) / 10 : 0;

  const kpis: { label: string; value: string; delta: number; icon: typeof TrendingUp; good: boolean }[] = [
    { label: "Revenue", value: fmtUsd(revenue), delta: pct(revenue, priorRevenue), icon: CircleDollarSign, good: true },
    { label: "Gross profit", value: fmtUsd(grossProfit), delta: pct(grossProfit, priorGrossProfit), icon: PiggyBank, good: true },
    { label: "Operating income", value: fmtUsd(operatingIncome), delta: pct(operatingIncome, priorOperatingIncome), icon: TrendingUp, good: true },
    { label: "Net income", value: fmtUsd(netIncome), delta: pct(netIncome, priorNetIncome), icon: Landmark, good: true },
  ];

  // Waterfall steps — sign indicates whether the step adds (+) or subtracts (-).
  const waterfall: { label: string; value: number; type: "input" | "deduct" | "subtotal"; icon: typeof TrendingUp }[] = [
    { label: "Revenue", value: revenue, type: "input", icon: CircleDollarSign },
    { label: "COGS", value: -cogs, type: "deduct", icon: Receipt },
    { label: "Gross profit", value: grossProfit, type: "subtotal", icon: PiggyBank },
    { label: "OpEx", value: -opex, type: "deduct", icon: Receipt },
    { label: "Operating income", value: operatingIncome, type: "subtotal", icon: TrendingUp },
    { label: "Tax", value: -tax, type: "deduct", icon: Receipt },
    { label: "Net income", value: netIncome, type: "subtotal", icon: Landmark },
  ];

  const clientCols: DrillDownColumn<{
    contract: string;
    start: string;
    revenue: number;
    margin: number;
  }>[] = [
    { key: "contract", label: "Contract", accessor: (r) => r.contract },
    { key: "start", label: "Start", accessor: (r) => r.start },
    { key: "revenue", label: "Revenue", accessor: (r) => fmtUsd(r.revenue), sortValue: (r) => r.revenue, align: "right" },
    { key: "margin", label: "Margin %", accessor: (r) => `${r.margin}%`, sortValue: (r) => r.margin, align: "right" },
  ];

  const drillRows = useMemo(() => {
    if (!drillClient) return [];
    const labels = ["Master MSA", "Onboarding services", "Managed delivery", "Add-on consulting", "Rate uplift"];
    const baseRev = drillClient.revenue / drillClient.contracts;
    return Array.from({ length: drillClient.contracts }, (_, i) => ({
      contract: `${labels[i % labels.length]} #${i + 1}`,
      start: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
      revenue: Math.round(baseRev * (0.7 + ((i * 37) % 60) / 100)),
      margin: 18 + ((i * 7) % 14),
    }));
  }, [drillClient]);

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
          title="Profit & Loss Summary"
          description="High-level P&L summary · revenue down to net income with waterfall, trend, and top-client drill-down."
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

      {/* Filter */}
      <section className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3 shadow-xs">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="bg-background hover:bg-muted h-7 cursor-pointer rounded-md border px-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {(["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "FY 2025"] as Period[]).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Compared to {period === "FY 2025" ? "FY 2024" : `prior ${period.startsWith("Q") ? "quarter" : "period"}`}
        </Badge>
      </section>

      {/* 4 KPI tiles */}
      <section>
        <h2 className="text-section-heading mb-2.5">Headline metrics</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const positive = k.delta >= 0;
            const good = k.good ? positive : !positive;
            const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={k.label} className="bg-card flex flex-col gap-2 rounded-xl border p-3.5 shadow-xs">
                <span className="text-data-label flex items-center gap-1.5">
                  <k.icon className="size-3.5" />
                  {k.label}
                </span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight">{k.value}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                    good ? "text-success-muted-foreground" : "text-danger-muted-foreground",
                  )}
                >
                  <TrendIcon className="size-3.5" />
                  {Math.abs(k.delta)}%
                  <span className="text-muted-foreground ml-1 font-normal">vs prior</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Waterfall */}
      <WidgetCard title="Revenue to net income" description="Waterfall · how each line affects the bottom line">
        <div className="flex flex-wrap items-stretch gap-2">
          {waterfall.map((step, i) => {
            const isSubtotal = step.type === "subtotal";
            const isDeduct = step.type === "deduct";
            const tone = isSubtotal
              ? "border-primary/40 bg-primary/5"
              : isDeduct
                ? "border-warning/30 bg-warning-muted/30"
                : "border-info/30 bg-info-muted/30";
            return (
              <div key={step.label} className="flex items-stretch gap-2">
                <div className={cn("flex min-w-[140px] flex-col justify-between rounded-lg border p-3", tone)}>
                  <span className="text-data-label flex items-center gap-1">
                    {isDeduct ? (
                      <Minus className="size-3" />
                    ) : (
                      <step.icon className="size-3" />
                    )}
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 text-lg font-semibold tabular-nums",
                      isDeduct && "text-warning-muted-foreground",
                    )}
                  >
                    {step.value < 0 ? "-" : ""}
                    {fmtUsd(Math.abs(step.value))}
                  </span>
                </div>
                {i < waterfall.length - 1 && (
                  <ArrowRight className="text-muted-foreground my-auto size-4 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </WidgetCard>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <WidgetCard title="Net income trend" description="12-month · 2025">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{fmtUsd(netIncome)}</p>
              <p className="text-metadata">YTD net income</p>
            </div>
            <div className="w-64">
              <MiniBars data={MONTHLY_NET_INCOME.map((m) => m.value)} tone="success" />
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <BarList
              rows={MONTHLY_NET_INCOME}
              tone="success"
              formatValue={(v) => fmtUsd(v)}
            />
          </div>
        </WidgetCard>

        <WidgetCard title="Top revenue clients" description="Click any client to drill in">
          <ul className="flex flex-col gap-1">
            {TOP_CLIENTS.map((c) => {
              const maxRev = Math.max(...TOP_CLIENTS.map((x) => x.revenue));
              return (
                <li key={c.client}>
                  <button
                    type="button"
                    onClick={() => setDrillClient(c)}
                    className="hover:bg-muted/50 focus-visible:ring-ring -mx-1.5 flex w-[calc(100%+0.75rem)] cursor-pointer flex-col gap-1 rounded-md px-1.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.client}</span>
                      <span className="tabular-nums text-sm">{fmtUsd(c.revenue)}</span>
                    </div>
                    <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
                      <span
                        className="bg-info absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${(c.revenue / maxRev) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {c.industry} · {c.contracts} contracts
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </WidgetCard>
      </div>

      <DrillDownSheet
        open={drillClient != null}
        onOpenChange={(o) => !o && setDrillClient(null)}
        title={drillClient ? `${drillClient.client} — contract detail` : ""}
        description={drillClient ? `${drillClient.industry} · ${drillClient.contracts} contracts · ${fmtUsd(drillClient.revenue)} revenue` : undefined}
        columns={clientCols}
        rows={drillRows}
      />
    </PageContainer>
  );
}
