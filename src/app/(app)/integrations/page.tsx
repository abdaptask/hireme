"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  CheckCircle2,
  Plug,
  Plus,
  RefreshCcw,
  Search,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  INTEGRATION_STATUS_META,
  INTEGRATIONS,
  getIntegrationsByCategory,
  integrationStats,
} from "@/lib/integrations";
import type { IntegrationCategory, IntegrationStatus } from "@/lib/integrations";

const CRITICALITY_TONE: Record<string, string> = {
  critical: "bg-danger-muted text-danger-muted-foreground",
  high: "bg-warning-muted text-warning-muted-foreground",
  medium: "bg-info-muted text-info-muted-foreground",
  low: "bg-neutral-muted text-neutral-muted-foreground",
};

const STATUS_DOT: Record<IntegrationStatus, string> = {
  connected: "bg-success",
  degraded: "bg-warning",
  error: "bg-danger",
  disconnected: "bg-neutral",
  scheduled: "bg-info",
};

type FilterKey = IntegrationCategory | "all";

const CATEGORY_FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ats", label: "ATS" },
  { key: "vms", label: "VMS / MSP" },
  { key: "hris", label: "HRIS" },
  { key: "payroll", label: "Payroll" },
  { key: "screening", label: "Screening" },
  { key: "esign", label: "E-Sign" },
  { key: "communication", label: "Communications" },
  { key: "identity", label: "Identity" },
  { key: "asset", label: "Assets" },
  { key: "lms", label: "LMS" },
  { key: "shipping", label: "Shipping" },
  { key: "accounting", label: "Accounting" },
  { key: "crm", label: "CRM" },
  { key: "analytics", label: "Analytics" },
  { key: "benefits", label: "Benefits" },
];

export default function IntegrationsPage() {
  const stats = integrationStats();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = filter === "all" ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.vendor.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, search]);

  const categoryCount = (key: FilterKey): number => {
    if (key === "all") return INTEGRATIONS.length;
    return getIntegrationsByCategory(key as IntegrationCategory).length;
  };

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Integration Hub"
        description="Real-time connector health, sync monitoring, and operational visibility across all platform integrations (§29, §74–§95)."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="size-3.5" />
            Add Integration
          </button>
        }
      />

      {/* KPI tiles — 4-col: Total / Connected / Degraded / Critical Issues */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Wifi} label="Total Integrations" value={stats.total} />
        <StatTile icon={CheckCircle2} label="Connected" value={stats.connected} tone="success" />
        <StatTile icon={TriangleAlert} label="Degraded" value={stats.degraded} tone="warning" />
        <StatTile icon={AlertOctagon} label="Critical Issues" value={stats.criticalDown} tone="danger" />
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search integrations by name, vendor, or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-card py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Category filter — horizontal scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_FILTER_OPTIONS.map((f) => {
          const count = categoryCount(f.key);
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  filter === f.key
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
          {filtered.length} integrations
        </span>
      </div>

      {/* Integration cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((integration) => {
          const statusMeta = INTEGRATION_STATUS_META[integration.status];
          const isHealthy = integration.status === "connected";
          const successBarColor =
            integration.successRate >= 95
              ? "bg-success"
              : integration.successRate >= 80
                ? "bg-warning"
                : "bg-danger";

          return (
            <article
              key={integration.id}
              className={cn(
                "bg-card flex flex-col rounded-xl border shadow-xs transition-shadow hover:shadow-sm",
                integration.status === "error" && "border-danger/30",
                integration.status === "disconnected" && "opacity-75",
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0">
                  <h3 className="text-card-heading truncate">{integration.name}</h3>
                  <p className="text-metadata mt-0.5">
                    {integration.vendor} · {CATEGORY_META[integration.category].label}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        STATUS_DOT[integration.status],
                      )}
                    />
                    {statusMeta.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      CRITICALITY_TONE[integration.criticality],
                    )}
                  >
                    {integration.criticality.charAt(0).toUpperCase() +
                      integration.criticality.slice(1)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground line-clamp-2 px-4 pt-3 text-xs leading-relaxed">
                {integration.description}
              </p>

              {/* Card body */}
              <div className="flex flex-1 flex-col gap-3 px-4 py-3">
                {/* Success rate bar */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">Success rate</span>
                    <span className="tabular-nums text-xs font-semibold">
                      {isHealthy || integration.successRate > 0
                        ? `${integration.successRate}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full", successBarColor)}
                      style={{ width: `${Math.max(integration.successRate, 0)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-metadata">Failed</p>
                    <p
                      className={cn(
                        "tabular-nums text-sm font-semibold",
                        integration.failedRecords > 0
                          ? "text-danger-muted-foreground"
                          : "text-success-muted-foreground",
                      )}
                    >
                      {integration.failedRecords}
                    </p>
                  </div>
                  <div>
                    <p className="text-metadata">Queue</p>
                    <p
                      className={cn(
                        "tabular-nums text-sm font-semibold",
                        integration.queueDepth > 5 ? "text-warning-muted-foreground" : "",
                      )}
                    >
                      {integration.queueDepth}
                    </p>
                  </div>
                  <div>
                    <p className="text-metadata">Latency</p>
                    <p className="tabular-nums text-sm font-semibold">
                      {integration.avgLatencyMs > 0 ? `${integration.avgLatencyMs}ms` : "—"}
                    </p>
                  </div>
                </div>

                {/* Sync direction + last sync */}
                <div className="flex items-center justify-between">
                  <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                    {integration.syncDirection}
                  </span>
                  <span className="text-metadata truncate">
                    {integration.lastSync !== "—"
                      ? `Last sync ${integration.lastSync.split(" ")[1]}`
                      : "Not synced"}
                  </span>
                </div>

                {/* Auth expiry warning */}
                {integration.authExpires && (
                  <div
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs",
                      new Date(integration.authExpires) < new Date("2026-09-07")
                        ? "bg-warning-muted text-warning-muted-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    Auth expires {integration.authExpires}
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="flex items-center gap-2 border-t px-4 py-2.5">
                <button
                  disabled={isHealthy}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isHealthy
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  <RefreshCcw className="size-3.5" />
                  {isHealthy ? "Healthy" : "Retry"}
                </button>
                <Link
                  href={`/integrations/${integration.id}`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Plug className="size-3.5" />
                  View Details
                </Link>
                <span className="text-metadata ml-auto">{integration.owner}</span>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center">
          <span className="bg-muted text-muted-foreground mb-3 flex size-11 items-center justify-center rounded-full">
            <Plug className="size-5" />
          </span>
          <p className="text-section-heading">No integrations found</p>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
        </div>
      )}
    </PageContainer>
  );
}
