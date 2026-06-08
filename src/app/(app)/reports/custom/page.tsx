"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Clock,
  Download,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* --------------------------------- Mocks ---------------------------------- */

const RECENT_REPORTS: {
  name: string;
  description: string;
  updated: string;
  owner: string;
}[] = [
  {
    name: "Q2 Bench Aging by Skill",
    description: "Consultants on bench grouped by skill family, aged into buckets.",
    updated: "2 days ago",
    owner: "Me",
  },
  {
    name: "Vertex Financial · Onboarding SLA",
    description: "Stage-by-stage SLA performance for Vertex assignments.",
    updated: "5 days ago",
    owner: "Me",
  },
  {
    name: "Healthcare Pipeline Forecast",
    description: "Projected starts and revenue across healthcare clients next 60 days.",
    updated: "1 week ago",
    owner: "Me",
  },
  {
    name: "Recruiter Coaching Watchlist",
    description: "Recruiters with rising drop-off or falling satisfaction.",
    updated: "2 weeks ago",
    owner: "Me",
  },
  {
    name: "Expiring Work Authorization · 90 days",
    description: "Consultants with expiring I-9 or visa documents in the next 90 days.",
    updated: "3 weeks ago",
    owner: "Me",
  },
];

/* ---------------------------------- Page ---------------------------------- */

export default function CustomReportPage() {
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
          title="Custom Report"
          description="Build any report from scratch — pick your data, filters, and visualization."
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

      {/* Hero CTA */}
      <section className="border-primary/30 bg-primary/5 relative overflow-hidden rounded-2xl border p-8 sm:p-10">
        <div className="relative max-w-2xl">
          <Badge variant="secondary" className="mb-3 gap-1">
            <Sparkles className="size-3" /> No-code builder
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The Custom Report Builder lets you build any report from scratch.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">
            Pick a data source — candidates, consultants, clients, packages,
            exceptions, screening, training, integrations, audit — then add
            filters, grouping, calculated fields, and the visualization that
            best fits your question. Save it, share it, schedule it, subscribe
            to it (§69).
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/reports/builder" />}
            >
              <Wand2 className="size-4" /> Open Report Builder
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/reports" />}
            >
              Browse catalog
            </Button>
          </div>
        </div>
      </section>

      {/* Recent custom reports */}
      <section>
        <h2 className="text-section-heading mb-2.5 flex items-center gap-1.5">
          <Clock className="size-4" /> Your recent custom reports
        </h2>
        <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
          <ul className="divide-y">
            {RECENT_REPORTS.map((r) => (
              <li key={r.name}>
                <Link
                  href="/reports/builder"
                  className="hover:bg-muted/40 focus-visible:ring-ring flex items-center gap-3 px-4 py-3 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {r.description}
                    </p>
                  </div>
                  <div className="text-muted-foreground hidden flex-col items-end text-xs sm:flex">
                    <span>Updated {r.updated}</span>
                    <span>by {r.owner}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageContainer>
  );
}
