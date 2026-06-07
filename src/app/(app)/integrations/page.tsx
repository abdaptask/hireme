"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Plug,
  RefreshCcw,
  TriangleAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  INTEGRATION_STATUS_META,
  INTEGRATIONS,
  integrationStats,
} from "@/lib/integrations";
import type { IntegrationCategory, IntegrationStatus } from "@/lib/integrations";

const CRITICALITY_TONE: Record<string, string> = {
  critical:
    "bg-danger-muted text-danger-muted-foreground",
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
];

export default function IntegrationsPage() {
  const stats = integrationStats();
  const [filter, setFilter] = useState<FilterKey>("all");

  const cards = useMemo(() => {
    if (filter === "all") return INTEGRATIONS;
    return INTEGRATIONS.filter((i) => i.category === filter);
  }, [filter]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Integration Hub"
        description="Real-time connector health, sync monitoring, and operational visibility across all platform integrations (§29, §74–§95)."
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          label="Connected"
          value={stats.connected}
          tone="success"
        />
        <StatTile
          icon={TriangleAlert}
          label="Degraded"
          value={stats.degraded}
          tone="warning"
        />
        <StatTile
          icon={AlertOctagon}
          label="Errors"
          value={stats.errors}
          tone="danger"
        />
        <StatTile
          icon={WifiOff}
          label="Critical issues"
          value={stats.criticalDown}
          tone="danger"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {cards.length} integrations
        </span>
      </div>

      {/* Integration cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((integration) => {
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
                  <h3 className="text-card-heading truncate">
                    {integration.name}
                  </h3>
                  <p className="text-metadata mt-0.5">
                    {CATEGORY_META[integration.category].label}
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
                      style={{
                        width: `${Math.max(integration.successRate, 0)}%`,
                      }}
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
                        integration.queueDepth > 5
                          ? "text-warning-muted-foreground"
                          : "",
                      )}
                    >
                      {integration.queueDepth}
                    </p>
                  </div>
                  <div>
                    <p className="text-metadata">Latency</p>
                    <p className="tabular-nums text-sm font-semibold">
                      {integration.avgLatencyMs > 0
                        ? `${integration.avgLatencyMs}ms`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Sync direction + last sync */}
                <div className="flex items-center justify-between">
                  <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                    {integration.syncDirection}
                  </span>
                  <span className="text-metadata truncate">
                    Last sync {integration.lastSync.split(" ")[1]}
                  </span>
                </div>

                {/* Auth expiry warning */}
                {integration.authExpires && (
                  <div
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs",
                      new Date(integration.authExpires) <
                        new Date("2026-09-01")
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
                <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                  <Plug className="size-3.5" />
                  Configure
                </button>
                <span className="text-metadata ml-auto">{integration.owner}</span>
              </div>
            </article>
          );
        })}
      </div>
    </PageContainer>
  );
}
