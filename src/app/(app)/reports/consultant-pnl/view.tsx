"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  DollarSign,
  Download,
  Percent,
  Star,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  FilterBar,
  FilterSelect,
  formatUsdCompact,
  formatUsdValue,
} from "@/components/reports/report-ui";
import { CONSULTANTS, type Consultant } from "@/lib/consultants";
import { cn } from "@/lib/utils";

type ConsultantPnl = {
  c: Consultant;
  ytdHours: number;
  ytdRevenue: number;
  ytdCost: number;
  ytdMargin: number;
  marginPct: number;
};

function daysSince(date: string): number {
  const anchor = new Date("2026-06-07").getTime();
  const start = new Date(date).getTime();
  if (isNaN(start)) return 365;
  return Math.max(30, Math.floor((anchor - start) / (1000 * 60 * 60 * 24)));
}

function buildPnl(c: Consultant): ConsultantPnl {
  const elapsedDays = Math.min(daysSince(c.startDate), 365);
  const billable = Math.round((elapsedDays / 365) * 2080);
  const ytdRevenue = billable * c.billRate;
  const ytdCost = billable * c.payRate;
  const ytdMargin = ytdRevenue - ytdCost;
  const marginPct = ytdRevenue > 0 ? Math.round((ytdMargin / ytdRevenue) * 100) : 0;
  return { c, ytdHours: billable, ytdRevenue, ytdCost, ytdMargin, marginPct };
}

const ALL_PNL: ConsultantPnl[] = CONSULTANTS.map(buildPnl);

const KPIS = {
  totalYtdRevenue: 4_200_000,
  totalYtdMargin: 1_600_000,
  avgMarginPct: 38,
  highMarginCount: 23,
};

const MARGIN_BUCKETS = [
  { label: "< 20%", min: 0, max: 20, tone: "bg-danger" },
  { label: "20–30%", min: 20, max: 30, tone: "bg-warning" },
  { label: "30–40%", min: 30, max: 40, tone: "bg-info" },
  { label: "40–50%", min: 40, max: 50, tone: "bg-success" },
  { label: "> 50%", min: 50, max: 999, tone: "bg-ai" },
];

const CLIENT_FILTER = ["All", ...Array.from(new Set(CONSULTANTS.map((c) => c.client)))];
const MARGIN_BUCKET_FILTER = ["All", ...MARGIN_BUCKETS.map((b) => b.label)];
const STATUS_FILTER = ["All", "Active", "Extension Pending", "Bench", "Offboarding"];

export default function ConsultantPnlView() {
  const [client, setClient] = useState("All");
  const [bucket, setBucket] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    return ALL_PNL.filter((p) => {
      if (client !== "All" && p.c.client !== client) return false;
      if (status !== "All" && p.c.status !== status) return false;
      if (bucket !== "All") {
        const b = MARGIN_BUCKETS.find((x) => x.label === bucket);
        if (b && (p.marginPct < b.min || p.marginPct >= b.max)) return false;
      }
      return true;
    });
  }, [client, bucket, status]);

  const top10 = useMemo(
    () => [...ALL_PNL].sort((a, b) => b.ytdMargin - a.ytdMargin).slice(0, 10),
    [],
  );

  const distribution = MARGIN_BUCKETS.map((b) => ({
    ...b,
    count: ALL_PNL.filter((p) => p.marginPct >= b.min && p.marginPct < b.max).length,
  }));
  const maxBucket = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Consultant with P&L"
          description="Bill / pay rate, gross margin and YTD financials per consultant."
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={DollarSign} label="Total YTD Revenue" value={formatUsdCompact(KPIS.totalYtdRevenue)} tone="info" />
        <StatTile icon={TrendingUp} label="Total YTD Margin" value={formatUsdCompact(KPIS.totalYtdMargin)} tone="success" />
        <StatTile icon={Percent} label="Avg Margin" value={KPIS.avgMarginPct} suffix="%" />
        <StatTile icon={Star} label="Margin > 50%" value={KPIS.highMarginCount} tone="ai" suffix="consultants" />
      </section>

      <FilterBar>
        <FilterSelect label="Client" value={client} options={CLIENT_FILTER} onChange={setClient} />
        <FilterSelect label="Margin range" value={bucket} options={MARGIN_BUCKET_FILTER} onChange={setBucket} />
        <FilterSelect label="Status" value={status} options={STATUS_FILTER} onChange={setStatus} />
        <span className="text-muted-foreground self-end text-xs">
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </span>
      </FilterBar>

      <WidgetCard title="Margin distribution" description="Consultants by margin bucket">
        <div className="flex items-end gap-3">
          {distribution.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-muted-foreground text-xs tabular-nums">{d.count}</span>
              <div
                className={cn(d.tone, "w-full rounded-md")}
                style={{ height: `${Math.max((d.count / maxBucket) * 100, 6)}px` }}
              />
              <span className="text-metadata">{d.label}</span>
            </div>
          ))}
        </div>
      </WidgetCard>

      <WidgetCard title="Consultant financials" description="Bill, pay, gross margin, and YTD financials">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Client</th>
                <th className="px-2 py-2 text-right font-medium">Bill</th>
                <th className="px-2 py-2 text-right font-medium">Pay</th>
                <th className="px-2 py-2 text-right font-medium">Gross Margin</th>
                <th className="px-2 py-2 text-right font-medium">YTD Revenue</th>
                <th className="px-2 py-2 text-right font-medium">YTD Cost</th>
                <th className="px-2 py-2 text-right font-medium">YTD Margin</th>
                <th className="px-2 py-2 text-right font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.c.id} className="hover:bg-muted/50 border-b last:border-0">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">
                    <Link href={`/consultants/${p.c.id}`} className="hover:underline">
                      {p.c.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{p.c.client}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatUsdValue(p.c.billRate)}</td>
                  <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                    {formatUsdValue(p.c.payRate)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatUsdValue(p.c.billRate - p.c.payRate)}/hr
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatUsdCompact(p.ytdRevenue)}</td>
                  <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">
                    {formatUsdCompact(p.ytdCost)}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">
                    {formatUsdCompact(p.ytdMargin)}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2 text-right tabular-nums",
                      p.marginPct >= 40 && "text-success-muted-foreground",
                      p.marginPct < 25 && "text-warning-muted-foreground",
                    )}
                  >
                    {p.marginPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      <WidgetCard title="Top 10 consultants by YTD margin" description="Highest contributors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Rank</th>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Client</th>
                <th className="px-2 py-2 text-right font-medium">YTD Margin</th>
                <th className="px-2 py-2 text-right font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((p, i) => (
                <tr key={p.c.id} className="hover:bg-muted/50 border-b last:border-0">
                  <td className="text-muted-foreground px-2 py-2 tabular-nums">#{i + 1}</td>
                  <td className="px-2 py-2 font-medium whitespace-nowrap">
                    <Link href={`/consultants/${p.c.id}`} className="hover:underline">
                      {p.c.name}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-2 py-2 whitespace-nowrap">{p.c.client}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">
                    {formatUsdCompact(p.ytdMargin)}
                  </td>
                  <td className="text-success-muted-foreground px-2 py-2 text-right tabular-nums">{p.marginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetCard>
    </PageContainer>
  );
}
