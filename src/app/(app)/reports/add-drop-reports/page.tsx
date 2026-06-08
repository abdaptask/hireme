"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Download,
  TrendingUp,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* --------------------------------- Mocks ---------------------------------- */

const KPIS = [
  { label: "Adds this month", value: 18, tone: "success" as const, delta: 4 },
  { label: "Drops this month", value: 6, tone: "danger" as const, delta: -2 },
  { label: "Net this month", value: "+12", tone: "info" as const, delta: 6 },
  { label: "YTD net", value: "+47", tone: "info" as const, delta: 12 },
];

const TREND = [
  { month: "Jan", adds: 14, drops: 9 },
  { month: "Feb", adds: 11, drops: 5 },
  { month: "Mar", adds: 17, drops: 8 },
  { month: "Apr", adds: 13, drops: 7 },
  { month: "May", adds: 16, drops: 4 },
  { month: "Jun", adds: 18, drops: 6 },
];

const SUB_REPORTS = [
  {
    slug: "weekly",
    name: "Weekly Add/Drop",
    description: "Week-by-week movement across the trailing 13 weeks.",
  },
  {
    slug: "monthly",
    name: "Monthly Add/Drop",
    description: "Monthly trend across the trailing 12 months with YoY compare.",
  },
  {
    slug: "by-client",
    name: "By Client",
    description: "Per-client adds, drops, net, and active headcount.",
  },
  {
    slug: "by-recruiter",
    name: "By Recruiter",
    description: "Recruiter-attributed adds and drops with placement ratio.",
  },
  {
    slug: "by-reason",
    name: "By Reason",
    description: "Root-cause breakdown of drops — voluntary, performance, end-of-assignment.",
  },
];

/* --------------------------------- Chart ---------------------------------- */

function StackedTrend({ data }: { data: typeof TREND }) {
  const max = Math.max(...data.map((d) => d.adds + d.drops), 1);
  return (
    <div className="flex items-end gap-3 px-1 pb-2 pt-2">
      {data.map((d) => {
        const addPct = (d.adds / max) * 100;
        const dropPct = (d.drops / max) * 100;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="text-muted-foreground text-[10px] tabular-nums">
              {d.adds}/{d.drops}
            </div>
            <div
              className="bg-muted relative flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-md"
              style={{ height: 120 }}
              title={`${d.month}: +${d.adds} / -${d.drops} = net ${d.adds - d.drops}`}
            >
              <span className="bg-success/80 block" style={{ height: `${addPct}%` }} />
              <span className="bg-danger/80 block" style={{ height: `${dropPct}%` }} />
            </div>
            <span className="text-metadata">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function AddDropReportsPage() {
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
          title="Add Drop Reports"
          description="Workforce movement — adds, drops, and net change across multiple lenses."
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
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPIS.map((k) => {
            const Icon = k.delta >= 0 ? ArrowUpRight : ArrowDownRight;
            const goodDir = k.label === "Drops this month" ? "down" : "up";
            const isGood = goodDir === "up" ? k.delta > 0 : k.delta < 0;
            return (
              <div
                key={k.label}
                className="bg-card flex flex-col gap-1.5 rounded-xl border p-3.5 shadow-xs"
              >
                <span className="text-data-label">{k.label}</span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                  {k.value}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                    isGood
                      ? "text-success-muted-foreground"
                      : "text-danger-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {Math.abs(k.delta)}
                  <span className="text-muted-foreground ml-1">vs last mo</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trend chart */}
      <WidgetCard
        title="Adds vs Drops"
        description="Last 6 months · stacked bars"
        action={
          <span className="text-muted-foreground inline-flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-success/80 inline-block size-2 rounded-sm" /> Adds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-danger/80 inline-block size-2 rounded-sm" /> Drops
            </span>
          </span>
        }
      >
        <StackedTrend data={TREND} />
      </WidgetCard>

      {/* Sub-report tiles */}
      <section>
        <h2 className="text-section-heading mb-2.5 flex items-center gap-1.5">
          <TrendingUp className="size-4" /> Sub-reports
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_REPORTS.map((r) => (
            <Link
              key={r.slug}
              href={`/reports/add-drop-reports/${r.slug}`}
              className="bg-card hover:border-primary/40 focus-visible:ring-ring group flex flex-col gap-2 rounded-xl border p-4 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-card-heading">{r.name}</p>
                <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {r.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
