"use client";

/**
 * Clients roster page (CLAUDE.md §27, §30, §56 Account Manager Analytics).
 * Shows the full client portfolio with compliance rates, pipeline counts,
 * and start-date success — click through to any client's 360 detail.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Search,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import {
  CLIENTS,
  CLIENT_STATUS_META,
  clientCandidates,
  clientPortfolioStats,
} from "@/lib/clients";
import { cn } from "@/lib/utils";

function IndustryBadge({ industry }: { industry: string }) {
  const colors: Record<string, string> = {
    Healthcare: "bg-success/10 text-success-muted-foreground",
    "Financial Services": "bg-info/10 text-info-muted-foreground",
    "Logistics & Supply Chain": "bg-warning/10 text-warning-muted-foreground",
    Manufacturing: "bg-ai/10 text-ai-muted-foreground",
    Technology: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        colors[industry] ?? "bg-muted text-muted-foreground",
      )}
    >
      {industry}
    </span>
  );
}

function RateMeter({ value, low = 85 }: { value: number; low?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full",
            value >= 90 ? "bg-success" : value >= low ? "bg-warning" : "bg-danger",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-muted-foreground tabular-nums text-xs">{value}%</span>
    </div>
  );
}

export default function ClientsPage() {
  const [query, setQuery] = useState("");
  const stats = clientPortfolioStats();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CLIENTS;
    return CLIENTS.filter((c) =>
      [c.name, c.industry, c.hq, c.accountManager, ...(c.programs ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description="Client portfolio — compliance rules, onboarding pipeline, and promise tracking (§27, §30)."
        actions={<InitiateOnboardingSheet />}
      />

      {/* ── Portfolio stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Building2} label="Total clients" value={CLIENTS.length} />
        <StatTile
          icon={Users}
          label="Active onboardings"
          value={stats.totalOnboardings}
          tone="info"
        />
        <StatTile
          icon={ShieldCheck}
          label="Avg compliance rate"
          value={`${stats.avgComplianceRate}%`}
          tone="success"
        />
        <StatTile
          icon={TriangleAlert}
          label="At-risk clients"
          value={stats.atRiskClients}
          tone={stats.atRiskClients > 0 ? "danger" : "success"}
        />
      </div>

      {/* ── Client roster table ───────────────────────────────────────── */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-72 focus-within:ring-2">
            <Search className="text-muted-foreground size-3.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, industry, AM…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X className="text-muted-foreground hover:text-foreground size-3.5" />
              </button>
            )}
          </div>
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {rows.length} shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead>
              <tr
                className="text-muted-foreground border-b"
                style={{ height: "var(--row-h)" }}
              >
                {[
                  "Client",
                  "HQ",
                  "Programs",
                  "Account Mgr",
                  "Pipeline",
                  "Consultants",
                  "Compliance",
                  "Start Success",
                  "Status",
                  "",
                ].map((h) => (
                  <th key={h} className="px-3 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => {
                const pipeline = clientCandidates(client.id);
                const meta = CLIENT_STATUS_META[client.status];
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/50 cursor-pointer border-b transition-colors last:border-0"
                    style={{ height: "var(--row-h)" }}
                    onClick={() =>
                      (window.location.href = `/clients/${client.id}`)
                    }
                  >
                    {/* Client name */}
                    <td className="px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-tight">
                          {client.name
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/clients/${client.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary block truncate font-medium"
                          >
                            {client.name}
                          </Link>
                          <IndustryBadge industry={client.industry} />
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 whitespace-nowrap">
                      {client.hq}
                    </td>
                    <td className="px-3">
                      <div className="flex flex-wrap gap-1">
                        {client.programs.slice(0, 2).map((p) => (
                          <span
                            key={p}
                            className="bg-muted text-muted-foreground inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
                          >
                            {p}
                          </span>
                        ))}
                        {client.programs.length > 2 && (
                          <span className="text-muted-foreground/60 text-[10px]">
                            +{client.programs.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 whitespace-nowrap">
                      {client.accountManager}
                    </td>
                    <td className="px-3 tabular-nums">
                      <span
                        className={cn(
                          "font-medium",
                          pipeline.length === 0 && "text-muted-foreground",
                        )}
                      >
                        {pipeline.length}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {" "}active
                      </span>
                    </td>
                    <td className="px-3 tabular-nums">
                      {client.activeConsultants}
                    </td>
                    <td className="px-3">
                      <RateMeter value={client.compliancePassRate} />
                    </td>
                    <td className="px-3">
                      <RateMeter value={client.startDateSuccessRate} />
                    </td>
                    <td className="px-3">
                      <StatusBadge
                        tone={
                          meta.tone as "success" | "danger" | "warning" | "neutral" | "info" | "ai"
                        }
                      >
                        {meta.label}
                      </StatusBadge>
                    </td>
                    <td className="px-3">
                      <ChevronRight className="text-muted-foreground size-4" />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-muted-foreground px-4 py-10 text-center text-sm"
                  >
                    No clients match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}
