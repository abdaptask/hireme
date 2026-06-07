import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, TriangleAlert } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList, MiniBars } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CLIENT_FINANCIALS,
  COST_BREAKDOWN,
  costPerOnboarding,
  FINANCIAL_MONTHLY,
  formatUsd,
  margin,
  marginPct,
  monthOverMonth,
  REVENUE_AT_RISK,
  type FinanceComparison,
} from "@/lib/reporting";

export const metadata: Metadata = { title: "Financial Performance" };

function ComparisonCard({ c }: { c: FinanceComparison }) {
  const fmt = (n: number) =>
    c.format === "usd" ? formatUsd(n) : c.format === "pct" ? `${n}%` : `${n}`;
  const isFlat = c.change === 0;
  const isGood = c.goodDirection === "up" ? c.change > 0 : c.change < 0;
  const Icon = isFlat ? ArrowUpRight : c.change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="bg-card flex flex-col gap-1.5 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label">{c.label}</span>
      <span className="text-2xl font-semibold tabular-nums tracking-tight">
        {fmt(c.current)}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
          isFlat ? "text-muted-foreground" : isGood ? "text-success-muted-foreground" : "text-danger-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
        {Math.abs(c.change)}
        {c.format === "pct" ? "pp" : "%"} <span className="text-muted-foreground ml-1">vs last mo</span>
      </span>
    </div>
  );
}

export default function FinancialReportPage() {
  const comparisons = monthOverMonth();
  const latest = FINANCIAL_MONTHLY[FINANCIAL_MONTHLY.length - 1];
  const ytdRevenue = FINANCIAL_MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const ytdMargin = FINANCIAL_MONTHLY.reduce((s, m) => s + margin(m), 0);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Financial Performance"
          description="Trailing 12 months · historical trend and month-over-month comparison."
        />
      </div>

      {/* Month-over-month comparison (§67.4) */}
      <section>
        <h2 className="text-section-heading mb-2.5">This month vs last month</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {comparisons.map((c) => (
            <ComparisonCard key={c.label} c={c} />
          ))}
        </div>
      </section>

      {/* Historical trends */}
      <section>
        <h2 className="text-section-heading mb-2.5">Historical trend</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <WidgetCard title="Revenue" description={`12-month · YTD ${formatUsd(ytdRevenue)}`}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{formatUsd(latest.revenue)}</p>
                <p className="text-metadata">latest month</p>
              </div>
              <div className="w-40"><MiniBars data={FINANCIAL_MONTHLY.map((m) => m.revenue)} tone="info" /></div>
            </div>
          </WidgetCard>
          <WidgetCard title="Gross margin" description={`YTD ${formatUsd(ytdMargin)}`}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{marginPct(latest)}%</p>
                <p className="text-metadata">{formatUsd(margin(latest))} this month</p>
              </div>
              <div className="w-40"><MiniBars data={FINANCIAL_MONTHLY.map((m) => margin(m))} tone="success" /></div>
            </div>
          </WidgetCard>
          <WidgetCard title="Cost per onboarding" description="Lower is better">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{formatUsd(costPerOnboarding(latest))}</p>
                <p className="text-metadata">{latest.onboardings} onboardings</p>
              </div>
              <div className="w-40"><MiniBars data={FINANCIAL_MONTHLY.map((m) => costPerOnboarding(m))} tone="warning" /></div>
            </div>
          </WidgetCard>
        </div>
      </section>

      {/* By client + cost breakdown */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <WidgetCard title="By client" description="Trailing 12 months">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium text-right">Revenue</th>
                  <th className="px-2 py-2 font-medium text-right">Margin</th>
                  <th className="px-2 py-2 font-medium text-right">Margin %</th>
                  <th className="px-2 py-2 font-medium text-right">Cost / onb.</th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_FINANCIALS.map((c) => (
                  <tr key={c.client} className="hover:bg-muted/50 border-b last:border-0">
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{c.client}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatUsd(c.revenue)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatUsd(margin(c))}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      <span className={cn(marginPct(c) >= 22 ? "text-success-muted-foreground" : "text-warning-muted-foreground")}>
                        {marginPct(c)}%
                      </span>
                    </td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">{formatUsd(costPerOnboarding(c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Cost breakdown" description="Trailing 12 months">
            <BarList
              rows={COST_BREAKDOWN.map((c) => ({ name: c.category, value: c.amount }))}
              tone="neutral"
              formatValue={(v) => formatUsd(v)}
            />
          </WidgetCard>
          <section className="border-danger/30 bg-danger-muted/30 rounded-xl border p-4">
            <p className="text-danger-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <TriangleAlert className="size-3.5" /> Revenue at risk
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatUsd(REVENUE_AT_RISK)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Tied to consultants who may start without complete billing setup.
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
