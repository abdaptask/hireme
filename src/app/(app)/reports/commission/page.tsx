"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  DollarSign,
  Download,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DrillDownSheet } from "@/components/reports/drill-down-sheet";
import { cn } from "@/lib/utils";

/* --------------------------------- Mocks ---------------------------------- */

type CommissionRow = {
  recruiter: string;
  placementsMtd: number;
  totalBillRateMtd: number; // monthly billable $
  commissionRate: number; // percent
  commissionMtd: number;
  paidYtd: number;
};

const ROWS: CommissionRow[] = [
  {
    recruiter: "Devon Hughes",
    placementsMtd: 6,
    totalBillRateMtd: 312_000,
    commissionRate: 9.5,
    commissionMtd: 29_640,
    paidYtd: 184_200,
  },
  {
    recruiter: "Aaron Flores",
    placementsMtd: 5,
    totalBillRateMtd: 268_000,
    commissionRate: 9.0,
    commissionMtd: 24_120,
    paidYtd: 156_800,
  },
  {
    recruiter: "Lena Ortiz",
    placementsMtd: 4,
    totalBillRateMtd: 198_400,
    commissionRate: 8.5,
    commissionMtd: 16_864,
    paidYtd: 124_300,
  },
  {
    recruiter: "Priya Ramesh",
    placementsMtd: 2,
    totalBillRateMtd: 96_800,
    commissionRate: 8.0,
    commissionMtd: 7_744,
    paidYtd: 78_600,
  },
  {
    recruiter: "Jordan Pratt",
    placementsMtd: 1,
    totalBillRateMtd: 48_000,
    commissionRate: 7.5,
    commissionMtd: 3_600,
    paidYtd: 42_100,
  },
  {
    recruiter: "Casey Wong",
    placementsMtd: 2,
    totalBillRateMtd: 71_200,
    commissionRate: 7.5,
    commissionMtd: 5_340,
    paidYtd: 26_400,
  },
];

const TIERS = [
  { name: "Tier 1 · 7.5%", value: 1 },
  { name: "Tier 2 · 8.0%", value: 1 },
  { name: "Tier 3 · 8.5%", value: 1 },
  { name: "Tier 4 · 9.0%", value: 1 },
  { name: "Tier 5 · 9.5%", value: 1 },
];

const PENDING_PAYOUTS = [
  { recruiter: "Devon Hughes", period: "May 2026", amount: 28_400, status: "Approved · pays Jun 15" },
  { recruiter: "Aaron Flores", period: "May 2026", amount: 23_100, status: "Approved · pays Jun 15" },
  { recruiter: "Lena Ortiz", period: "May 2026", amount: 15_900, status: "Pending review" },
  { recruiter: "Jordan Pratt", period: "Apr 2026", amount: 3_200, status: "Hold · clawback review" },
];

/* -------------------------------- Helpers --------------------------------- */

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtUsdExact(n: number) {
  return `$${n.toLocaleString()}`;
}

/* ---------------------------- Per-row drill-down -------------------------- */

type Placement = {
  consultant: string;
  client: string;
  bill: number;
  pay: number;
  commission: number;
  startDate: string;
};

function placementsFor(row: CommissionRow): Placement[] {
  const seed = row.recruiter.length;
  const clients = ["Meridian Health", "Cobalt Systems", "Vertex Financial", "Atlas Manufacturing", "Northwind Logistics"];
  const consultants = ["Elena Vasquez", "Kai Nakamura", "Priya Sharma", "Derek Olsen", "Brendan Walsh", "Rachel Stone"];
  const out: Placement[] = [];
  for (let i = 0; i < row.placementsMtd; i++) {
    const bill = 90 + ((seed + i * 7) % 80);
    out.push({
      consultant: consultants[(seed + i) % consultants.length],
      client: clients[(seed + i * 2) % clients.length],
      bill,
      pay: Math.round(bill * 0.62),
      commission: Math.round(bill * 173 * (row.commissionRate / 100)), // ~monthly bill * rate
      startDate: `Jun ${3 + i}, 2026`,
    });
  }
  return out;
}

/* ---------------------------------- Page ---------------------------------- */

export default function CommissionReportPage() {
  const [drill, setDrill] = useState<CommissionRow | null>(null);

  const totalCommissionMtd = ROWS.reduce((s, r) => s + r.commissionMtd, 0);
  const paidYtd = ROWS.reduce((s, r) => s + r.paidYtd, 0);
  const avgRate =
    Math.round(
      (ROWS.reduce((s, r) => s + r.commissionRate, 0) / ROWS.length) * 10,
    ) / 10;
  const topEarner = [...ROWS].sort((a, b) => b.commissionMtd - a.commissionMtd)[0];

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
          title="Commission Report"
          description="Recruiter commissions · current month, paid YTD, and pending payouts."
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
        <Kpi
          label="Total MTD commission"
          value={fmtUsd(totalCommissionMtd)}
          icon={<DollarSign className="size-4" />}
          tone="success"
        />
        <Kpi label="Paid YTD" value={fmtUsd(paidYtd)} icon={<TrendingUp className="size-4" />} tone="info" />
        <Kpi label="Avg comm. rate" value={`${avgRate}%`} tone="neutral" />
        <Kpi label="Top earner" value={topEarner.recruiter} sub={fmtUsd(topEarner.commissionMtd)} small />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Recruiter table */}
        <WidgetCard
          title="By recruiter · this month"
          description="Click a recruiter to view placements driving the commission."
        >
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-left"
              style={{ fontSize: "var(--table-font)" }}
            >
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Recruiter</th>
                  <th className="px-2 py-2 font-medium text-right">Placements MTD</th>
                  <th className="px-2 py-2 font-medium text-right">Bill rate (mo)</th>
                  <th className="px-2 py-2 font-medium text-right">Comm. rate</th>
                  <th className="px-2 py-2 font-medium text-right">Earned MTD</th>
                  <th className="px-2 py-2 font-medium text-right">Paid YTD</th>
                </tr>
              </thead>
              <tbody>
                {[...ROWS].sort((a, b) => b.commissionMtd - a.commissionMtd).map((r) => (
                  <tr
                    key={r.recruiter}
                    className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                    onClick={() => setDrill(r)}
                  >
                    <td className="px-2 py-2 font-medium whitespace-nowrap">
                      {r.recruiter}
                    </td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                      {r.placementsMtd}
                    </td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                      {fmtUsd(r.totalBillRateMtd)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      <Badge variant="outline" className="text-[10px]">
                        {r.commissionRate}%
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right font-medium tabular-nums",
                        r.commissionMtd >= 20_000 && "text-success-muted-foreground",
                      )}
                    >
                      {fmtUsdExact(r.commissionMtd)}
                    </td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                      {fmtUsdExact(r.paidYtd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Commission tiers" description="Recruiters per tier">
            <BarList
              rows={TIERS.map((t) => ({ name: t.name, value: t.value }))}
              tone="info"
              formatValue={(v) => `${v}`}
            />
            <p className="text-muted-foreground mt-3 text-xs">
              Tiers advance with rolling 12-month placement volume. Top tier
              earns 9.5% of monthly bill rate.
            </p>
          </WidgetCard>

          <WidgetCard title="Pending payouts" description="Awaiting next pay run">
            <ul className="flex flex-col">
              {PENDING_PAYOUTS.map((p, i) => (
                <li
                  key={i}
                  className="hover:bg-muted/40 -mx-1.5 flex items-center gap-3 rounded-md px-1.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.recruiter}</p>
                    <p className="text-muted-foreground text-xs">
                      {p.period} · {p.status}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {fmtUsdExact(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </WidgetCard>
        </div>
      </div>

      <DrillDownSheet<Placement>
        open={!!drill}
        onOpenChange={(o) => !o && setDrill(null)}
        title={drill ? `${drill.recruiter} · placements driving commission` : ""}
        description={
          drill
            ? `${drill.placementsMtd} placements · ${drill.commissionRate}% rate · ${fmtUsdExact(
                drill.commissionMtd,
              )} earned MTD`
            : undefined
        }
        columns={[
          { key: "consultant", label: "Consultant", accessor: (r) => r.consultant },
          { key: "client", label: "Client", accessor: (r) => r.client },
          {
            key: "bill",
            label: "Bill",
            accessor: (r) => `$${r.bill}/h`,
            sortValue: (r) => r.bill,
            align: "right",
          },
          {
            key: "pay",
            label: "Pay",
            accessor: (r) => `$${r.pay}/h`,
            sortValue: (r) => r.pay,
            align: "right",
          },
          {
            key: "commission",
            label: "Commission",
            accessor: (r) => fmtUsdExact(r.commission),
            sortValue: (r) => r.commission,
            align: "right",
          },
          { key: "start", label: "Start", accessor: (r) => r.startDate, align: "right" },
        ]}
        rows={drill ? placementsFor(drill) : []}
      />
    </PageContainer>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: "success" | "info" | "neutral";
  small?: boolean;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tracking-tight",
          small ? "text-base" : "text-2xl tabular-nums",
          tone === "success" && "text-success-muted-foreground",
          tone === "info" && "text-foreground",
        )}
      >
        {value}
      </span>
      {sub && <span className="text-metadata">{sub}</span>}
    </div>
  );
}
