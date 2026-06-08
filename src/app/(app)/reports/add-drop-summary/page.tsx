"use client";

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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* --------------------------------- Mocks ---------------------------------- */

const KPIS = [
  { label: "Today's adds", value: 2, tone: "success" as const },
  { label: "Today's drops", value: 0, tone: "neutral" as const },
  { label: "This week net", value: "+5", tone: "success" as const },
  { label: "This month net", value: "+12", tone: "info" as const },
];

const TREND = [9, 12, 7, 14, 10, 16, 11, 13, 15, 18, 14, 17, 19, 12]; // last 14 days net

const RECENT: { name: string; client: string; action: "Added" | "Dropped"; when: string; reason?: string }[] = [
  { name: "Sarah Chen", client: "Meridian Health", action: "Added", when: "2h ago" },
  { name: "Marcus Bell", client: "Northwind Logistics", action: "Added", when: "5h ago" },
  { name: "Nina Petrov", client: "Meridian Health", action: "Dropped", when: "Yesterday", reason: "End of assignment" },
  { name: "James Okonkwo", client: "Meridian Health", action: "Dropped", when: "Yesterday", reason: "End of assignment" },
  { name: "Elena Vasquez", client: "Meridian Health", action: "Added", when: "2 days ago" },
  { name: "Lucia Herrera", client: "Atlas Manufacturing", action: "Dropped", when: "2 days ago", reason: "Converted to FTE" },
  { name: "Brendan Walsh", client: "Cobalt Systems", action: "Added", when: "3 days ago" },
  { name: "Kai Nakamura", client: "Cobalt Systems", action: "Added", when: "4 days ago" },
];

/* --------------------------------- Trend ---------------------------------- */

function TrendLine({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const w = 100;
  const h = 32;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full overflow-visible">
      <polyline
        fill="none"
        stroke="var(--info)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - ((v - min) / range) * h}
          r={i === data.length - 1 ? 1.6 : 0.8}
          fill="var(--info)"
        />
      ))}
    </svg>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function AddDropSummaryPage() {
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
          title="Add Drop Summary"
          description="Compact daily check-in — today's movement at a glance."
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
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs"
          >
            <span className="text-data-label">{k.label}</span>
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums tracking-tight",
                k.tone === "success" && "text-success-muted-foreground",
                k.tone === "neutral" && "text-foreground",
                k.tone === "info" && "text-foreground",
              )}
            >
              {k.value}
            </span>
          </div>
        ))}
      </div>

      {/* Trend */}
      <WidgetCard
        title="Net change · last 14 days"
        description="Daily net (adds − drops)"
        action={<Badge variant="secondary" className="text-[10px]">live</Badge>}
      >
        <TrendLine data={TREND} />
      </WidgetCard>

      {/* Recent list */}
      <WidgetCard title="Recent adds & drops" description="Last 7 days · most recent first">
        <ul className="flex flex-col">
          {RECENT.map((r, i) => {
            const isAdd = r.action === "Added";
            const Icon = isAdd ? ArrowUpRight : ArrowDownRight;
            return (
              <li
                key={i}
                className="hover:bg-muted/40 flex items-center gap-3 rounded-md px-1.5 py-2 -mx-1.5"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    isAdd
                      ? "bg-success/10 text-success-muted-foreground"
                      : "bg-danger/10 text-danger-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-muted-foreground text-xs">→</span>
                    <span className="text-muted-foreground text-sm">{r.client}</span>
                  </div>
                  {r.reason && (
                    <p className="text-muted-foreground text-xs">{r.reason}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isAdd
                      ? "text-success-muted-foreground"
                      : "text-danger-muted-foreground",
                  )}
                >
                  {r.action}
                </span>
                <span className="text-muted-foreground w-20 shrink-0 text-right text-xs tabular-nums">
                  {r.when}
                </span>
              </li>
            );
          })}
        </ul>
      </WidgetCard>
    </PageContainer>
  );
}
