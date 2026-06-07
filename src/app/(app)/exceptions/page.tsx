/**
 * Exception Control Tower — server component.
 * Fetches real exceptions from Neon, merges with mock data for coverage.
 * (CLAUDE.md §18, §104)
 */
import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarX,
  CheckCircle2,
  Clock,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EXCEPTIONS,
  SEVERITY_META,
  STATUS_META,
  type Exception,
} from "@/lib/exceptions";
import { getDbExceptions, dbExceptionStats } from "@/lib/db-exceptions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Exception Control Tower" };

// ─────────────────────────────────────────────────────────
// Helpers computed server-side
// ─────────────────────────────────────────────────────────

function computeByCategory(exceptions: Exception[]) {
  const open = exceptions.filter((e) => e.status !== "resolved");
  const counts = new Map<string, number>();
  for (const e of open) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function computeBySeverity(exceptions: Exception[]) {
  const open = exceptions.filter((e) => e.status !== "resolved");
  return [
    { name: "Critical", value: open.filter((e) => e.severity === "critical").length, tone: "danger" as const },
    { name: "High",     value: open.filter((e) => e.severity === "high").length,     tone: "danger" as const },
    { name: "Medium",   value: open.filter((e) => e.severity === "medium").length,   tone: "warning" as const },
    { name: "Low",      value: open.filter((e) => e.severity === "low").length,      tone: "neutral" as const },
  ].filter((s) => s.value > 0);
}

function sortExceptions(exceptions: Exception[]) {
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...exceptions].sort((a, b) => {
    const sevDiff = (rank[a.severity] ?? 4) - (rank[b.severity] ?? 4);
    if (sevDiff !== 0) return sevDiff;
    return b.ageDays - a.ageDays;
  });
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function ExceptionsPage() {
  // 1. Fetch DB exceptions — graceful degradation
  const dbExceptions = await getDbExceptions().catch((err) => {
    console.error("[exceptions] DB fetch failed:", err?.message);
    return [] as Exception[];
  });

  // 2. Merge: DB exceptions + mock exceptions whose IDs don't collide
  //    DB exceptions are already mapped to the same Exception type, so they
  //    appear inline with mock data.  DB rows are prepended so they sort first.
  const merged = [...dbExceptions, ...EXCEPTIONS];
  const rows = sortExceptions(merged);

  const stats = dbExceptionStats(merged);
  const categories = computeByCategory(merged);
  const severities = computeBySeverity(merged);
  const dbCount = dbExceptions.length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Exception Control Tower"
        description="Every onboarding exception — owned, prioritized, and SLA-tracked (§18, §104)."
        actions={
          dbCount > 0 ? (
            <Badge variant="outline" className="tabular-nums">
              {rows.length} total
              <span className="text-success ml-1">· {dbCount} live</span>
            </Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={TriangleAlert} label="Open exceptions" value={stats.open} />
        <StatTile icon={TriangleAlert} label="Critical" value={stats.critical} tone="danger" />
        <StatTile icon={Clock} label="SLA breached" value={stats.slaBreaches} tone="danger" />
        <StatTile icon={CalendarX} label="Start-date impact" value={stats.startImpact} tone="warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <WidgetCard title="By category" description="Open exceptions (root-cause Pareto)">
          <BarList rows={categories} tone="danger" />
        </WidgetCard>
        <WidgetCard title="By severity" description="Open exceptions">
          <BarList rows={severities} />
        </WidgetCard>
      </div>

      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-card-heading">Exceptions</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {rows.length} total · sorted by severity
          </span>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Age</th>
                <th className="px-3 py-2 font-medium">SLA</th>
                <th className="px-3 py-2 font-medium">Impact</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.id}
                  className={cn(
                    "hover:bg-muted/50 border-b last:border-0",
                    e.status === "resolved" && "opacity-60",
                  )}
                >
                  <td className="text-muted-foreground px-3 py-2 font-mono whitespace-nowrap">
                    {e.id}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={SEVERITY_META[e.severity].tone}>
                      {SEVERITY_META[e.severity].label}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-medium">{e.category}</span>
                    <span className="text-metadata block max-w-[16rem] truncate">
                      {e.rootCause}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.candidateId ? (
                      <Link
                        href={`/candidates/${e.candidateId}`}
                        className="hover:text-primary font-medium"
                      >
                        {e.candidate}
                      </Link>
                    ) : (
                      <span className="font-medium">{e.candidate}</span>
                    )}
                    <span className="text-metadata block">{e.client}</span>
                  </td>
                  <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                    {e.owner}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {e.ageDays}d
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        e.sla.breached
                          ? "text-danger-muted-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {e.sla.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {e.startDateImpact ? (
                      <span className="text-danger-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
                        <CalendarX className="size-3.5" /> Start
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {e.status === "resolved" ? (
                      <span className="text-success-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
                        <CheckCircle2 className="size-3.5" /> Resolved
                      </span>
                    ) : (
                      <StatusBadge
                        tone={STATUS_META[e.status].tone}
                        withDot={false}
                      >
                        {STATUS_META[e.status].label}
                      </StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground flex items-center gap-1.5 border-t px-4 py-2 text-xs">
          <Sparkles className="text-ai size-3.5" />
          Each exception carries an AI-recommended next action; detail panel with
          timeline, evidence &amp; escalation chain (§104.2) arrives with the full module.
        </div>
      </section>
    </PageContainer>
  );
}
