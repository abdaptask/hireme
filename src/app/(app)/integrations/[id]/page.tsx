/**
 * Integration Detail — §84 Integration Monitoring Dashboard.
 * Server component: reads integration data, renders sticky header + 3-column layout.
 */

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Settings,
  XCircle,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  INTEGRATION_STATUS_META,
  getIntegration,
  type IntegrationEvent,
  type FieldMapping,
} from "@/lib/integrations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CRITICALITY_TONE: Record<string, string> = {
  critical: "bg-danger-muted text-danger-muted-foreground",
  high: "bg-warning-muted text-warning-muted-foreground",
  medium: "bg-info-muted text-info-muted-foreground",
  low: "bg-neutral-muted text-neutral-muted-foreground",
};

const AUTH_TYPE_LABEL: Record<string, string> = {
  oauth2: "OAuth 2.0",
  "api-key": "API Key",
  saml: "SAML",
  basic: "Basic Auth",
  mtls: "mTLS",
  "webhook-secret": "Webhook Secret",
};

function eventStatusIcon(status: IntegrationEvent["status"]) {
  if (status === "success") return <CheckCircle2 className="size-3.5 shrink-0 text-success" />;
  if (status === "failed") return <XCircle className="size-3.5 shrink-0 text-danger" />;
  if (status === "retrying") return <RefreshCcw className="size-3.5 shrink-0 text-warning" />;
  return <AlertTriangle className="size-3.5 shrink-0 text-warning" />;
}

function directionArrow(direction: "inbound" | "outbound") {
  return direction === "inbound" ? (
    <span className="font-mono text-xs font-bold text-info">↓</span>
  ) : (
    <span className="font-mono text-xs font-bold text-success">↑</span>
  );
}

function nextSyncLabel(freq: string): string {
  switch (freq) {
    case "real-time": return "Continuous (event-driven)";
    case "5min": return "In ~4 minutes";
    case "hourly": return "In ~38 minutes";
    case "daily": return "Today at 06:00 UTC";
    case "on-demand": return "Manual trigger only";
    default: return "—";
  }
}

function authExpiryWarning(authExpires?: string): boolean {
  if (!authExpires) return false;
  // Warn if expiry is within 90 days of 2026-06-07
  const today = new Date("2026-06-07");
  const expiry = new Date(authExpires);
  const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 90;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NextBestActionStrip({ message, cta }: { message: string; cta: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ai/30 bg-ai-muted/30 px-4 py-2.5">
      <Zap className="size-4 shrink-0 text-ai" />
      <span className="flex-1 text-xs">
        <span className="font-semibold text-ai">Next Best Action: </span>
        <span className="text-foreground/80">{message}</span>
      </span>
      <button className="shrink-0 rounded-md bg-ai px-3 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity">
        {cta}
      </button>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b last:border-0">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap shrink-0">
        {label}
      </span>
      <span className="text-right text-xs font-medium">{children}</span>
    </div>
  );
}

function FieldMappingRow({ mapping }: { mapping: FieldMapping }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-0">
      <span className="font-mono text-[10px] text-muted-foreground min-w-0 flex-1 truncate">
        {mapping.sourceField}
      </span>
      <span className="text-muted-foreground text-[10px] shrink-0">→</span>
      <span className="font-mono text-[10px] min-w-0 flex-1 truncate text-right">
        {mapping.targetField}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {mapping.transformation && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground max-w-[80px] truncate">
            {mapping.transformation}
          </span>
        )}
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
            mapping.required
              ? "bg-danger-muted text-danger-muted-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {mapping.required ? "Req" : "Opt"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const integration = getIntegration(id);

  if (!integration) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-xl font-semibold">Integration not found</p>
        <p className="text-muted-foreground mt-2 text-sm">
          No integration exists with ID <code className="font-mono">{id}</code>.
        </p>
        <Link
          href="/integrations"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Integration Hub
        </Link>
      </div>
    );
  }

  const statusMeta = INTEGRATION_STATUS_META[integration.status];
  const categoryMeta = CATEGORY_META[integration.category];
  const expiryIsWarn = authExpiryWarning(integration.authExpires);

  // Next Best Action logic based on status
  const nba = (() => {
    if (integration.status === "error") {
      return {
        message: `Retry failed sync — ${integration.failedRecords} record${integration.failedRecords !== 1 ? "s" : ""} stuck in queue. Auth may need rotation.`,
        cta: "Retry Now",
      };
    }
    if (integration.status === "degraded") {
      return {
        message: `${integration.failedRecords} records in dead-letter queue. Review failed events and trigger a bulk retry.`,
        cta: "Review Queue",
      };
    }
    if (integration.status === "disconnected") {
      return {
        message: "Connector is not configured. Complete authentication setup to enable sync.",
        cta: "Configure",
      };
    }
    if (expiryIsWarn && integration.authExpires) {
      return {
        message: `Auth credential expires ${integration.authExpires} — rotate before expiry to avoid service disruption.`,
        cta: "Rotate Credentials",
      };
    }
    return {
      message: "Connector is healthy. No action required at this time.",
      cta: "View Logs",
    };
  })();

  const visibleMappings = integration.fieldMappings.slice(0, 6);
  const hasMoreMappings = integration.fieldMappings.length > 6;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/integrations" className="hover:text-foreground transition-colors">
              Integration Hub
            </Link>
            <span>/</span>
            <span className="text-foreground truncate">{integration.name}</span>
          </div>

          {/* Title row */}
          <div className="flex flex-wrap items-start gap-3 sm:items-center">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate">{integration.name}</h1>
                <p className="text-muted-foreground text-xs">{integration.vendor}</p>
              </div>
              {/* Category badge */}
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {categoryMeta.label}
              </span>
              {/* Status */}
              <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
              {/* Criticality */}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  CRITICALITY_TONE[integration.criticality],
                )}
              >
                {integration.criticality.charAt(0).toUpperCase() + integration.criticality.slice(1)} Priority
              </span>
              {/* Sync direction */}
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {integration.syncDirection}
              </span>
              {/* Auth expiry */}
              {integration.authExpires && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    expiryIsWarn
                      ? "bg-warning-muted text-warning-muted-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  Auth expires {integration.authExpires}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                <RefreshCcw className="size-3.5" />
                Retry Now
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                <Settings className="size-3.5" />
                Configure
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                View Logs
              </button>
            </div>
          </div>

          {/* NBA strip */}
          <div className="mt-3">
            <NextBestActionStrip message={nba.message} cta={nba.cta} />
          </div>
        </div>
      </div>

      {/* ── Main 3-column layout ─────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-0 px-4 py-4 sm:px-6">

        {/* ── Left column — Connection Info ─────────────────────────────── */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-[200px] space-y-4 pr-4">

            {/* Connection Info */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Connection Info</h2>
              </div>
              <div className="px-3 py-2">
                <InfoRow label="Endpoint">
                  <span className="font-mono text-[10px]">https://api.*****.com/v3</span>
                </InfoRow>
                <InfoRow label="Auth Type">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                    {AUTH_TYPE_LABEL[integration.authType] ?? integration.authType}
                  </span>
                </InfoRow>
                <InfoRow label="Environment">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                      integration.environment === "production"
                        ? "bg-success-muted text-success-muted-foreground"
                        : "bg-info-muted text-info-muted-foreground",
                    )}
                  >
                    {integration.environment}
                  </span>
                </InfoRow>
                <InfoRow label="Owner">{integration.owner}</InfoRow>
                <InfoRow label="Last Success">
                  <span className="text-muted-foreground text-[10px]">
                    {integration.lastSuccess !== "—" ? integration.lastSuccess : "Never"}
                  </span>
                </InfoRow>
                <InfoRow label="Frequency">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize">
                    {integration.syncFrequency}
                  </span>
                </InfoRow>
                {/* Uptime bar */}
                <div className="pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Uptime 30d
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums">
                      {integration.uptime30d > 0 ? `${integration.uptime30d}%` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        integration.uptime30d >= 99
                          ? "bg-success"
                          : integration.uptime30d >= 95
                            ? "bg-warning"
                            : integration.uptime30d > 0
                              ? "bg-danger"
                              : "bg-muted-foreground/20",
                      )}
                      style={{ width: `${Math.max(integration.uptime30d, 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Data Exchanged */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Data Exchanged</h2>
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 py-3">
                {integration.dataExchanged.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
                {integration.dataExchanged.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">Not configured</span>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* ── Center column — Recent Events ─────────────────────────────── */}
        <main className="min-w-0 flex-1 lg:px-4">

          {/* Recent Events */}
          <div className="mb-4 rounded-lg border bg-card">
            <div className="border-b px-3 py-2">
              <h2 className="text-xs font-semibold">Recent Events</h2>
            </div>

            {integration.recentEvents.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
                <Clock className="size-4" />
                No events recorded. Connector has not synced yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  style={{ "--table-font": "0.72rem" } as React.CSSProperties}
                >
                  <thead>
                    <tr className="border-b bg-muted/30 text-left">
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Timestamp</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dir</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Event Type</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Records</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap">Latency</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Error</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Retries</th>
                      <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integration.recentEvents.map((evt) => (
                      <tr
                        key={evt.id}
                        style={{ "--row-h": "2.25rem" } as React.CSSProperties}
                        className={cn(
                          "border-b transition-colors hover:bg-muted/20",
                          evt.status === "failed" && "bg-danger/5",
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                          {evt.timestamp.split(" ")[1]}
                        </td>
                        <td className="px-2 py-2">
                          {directionArrow(evt.direction)}
                        </td>
                        <td className="px-2 py-2 font-medium whitespace-nowrap">
                          {evt.eventType}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {evt.recordCount}
                        </td>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center gap-1">
                            {eventStatusIcon(evt.status)}
                            <span className="capitalize">{evt.status}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                          {evt.latencyMs > 0 ? `${evt.latencyMs}ms` : "—"}
                        </td>
                        <td className="px-2 py-2 max-w-[140px]">
                          {evt.errorCode ? (
                            <span
                              className="font-mono text-[10px] text-danger-muted-foreground truncate block"
                              title={evt.errorMessage}
                            >
                              {evt.errorCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {evt.retryCount}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            {(evt.status === "failed" || evt.status === "retrying") && (
                              <button className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap">
                                Retry
                              </button>
                            )}
                            <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                              Payload
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dead-Letter Queue */}
          <div className="rounded-lg border bg-card">
            <div className="border-b px-3 py-2">
              <h2 className="text-xs font-semibold">Dead-Letter Queue</h2>
            </div>
            <div className="px-3 py-3">
              {integration.failedRecords > 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-muted/30 px-4 py-3">
                  <AlertTriangle className="size-4 shrink-0 text-warning" />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-warning">
                      {integration.failedRecords} record{integration.failedRecords !== 1 ? "s" : ""}
                    </span>{" "}
                    <span className="text-foreground/80">
                      are stuck in the dead-letter queue and require attention.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="inline-flex items-center gap-1 rounded-md bg-warning px-2.5 py-1.5 text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
                      <RefreshCcw className="size-3" />
                      Bulk Retry
                    </button>
                    <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[10px] font-medium hover:bg-muted transition-colors">
                      Review
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  Queue is clear — no records in dead-letter state.
                </div>
              )}
            </div>
          </div>

        </main>

        {/* ── Right column — Health, Mappings, Schedule ─────────────────── */}
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-[200px] space-y-4 pl-4">

            {/* Health Metrics */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Health Metrics</h2>
              </div>
              <div className="px-3 py-3 space-y-3">
                {/* Success rate large */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">Success Rate</span>
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        integration.successRate >= 95
                          ? "text-success"
                          : integration.successRate >= 80
                            ? "text-warning"
                            : "text-danger",
                      )}
                    >
                      {integration.successRate > 0 ? `${integration.successRate}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        integration.successRate >= 95
                          ? "bg-success"
                          : integration.successRate >= 80
                            ? "bg-warning"
                            : integration.successRate > 0
                              ? "bg-danger"
                              : "bg-muted-foreground/20",
                      )}
                      style={{ width: `${Math.max(integration.successRate, 0)}%` }}
                    />
                  </div>
                </div>

                {/* Records / Errors today */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/40 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground">Records Today</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {integration.totalRecordsToday}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground">Errors Today</p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm font-semibold tabular-nums",
                        integration.totalErrorsToday > 0 ? "text-danger" : "",
                      )}
                    >
                      {integration.totalErrorsToday}
                    </p>
                  </div>
                </div>

                {/* Avg latency */}
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] text-muted-foreground">Avg Latency</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {integration.avgLatencyMs > 0 ? `${integration.avgLatencyMs}ms` : "—"}
                  </p>
                </div>

                {/* Queue depth */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md px-2.5 py-2",
                    integration.queueDepth > 5
                      ? "bg-warning-muted/50"
                      : "bg-muted/40",
                  )}
                >
                  <p className="text-[10px] text-muted-foreground">Queue Depth</p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      integration.queueDepth > 5 ? "text-warning-muted-foreground" : "",
                    )}
                  >
                    {integration.queueDepth}
                    {integration.queueDepth > 5 && (
                      <span className="ml-1 text-[10px] font-normal">High</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Field Mappings */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Field Mappings</h2>
              </div>
              <div className="px-3 py-2">
                {integration.fieldMappings.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">
                    No field mappings configured.
                  </p>
                ) : (
                  <>
                    {visibleMappings.map((mapping) => (
                      <FieldMappingRow key={mapping.sourceField} mapping={mapping} />
                    ))}
                    {hasMoreMappings && (
                      <button className="mt-2 text-[10px] font-medium text-primary hover:opacity-80 transition-opacity">
                        View all {integration.fieldMappings.length} mappings →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sync Schedule */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Sync Schedule</h2>
              </div>
              <div className="px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Frequency</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                    {integration.syncFrequency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Next sync</span>
                  <span className="text-[10px] font-medium">
                    {nextSyncLabel(integration.syncFrequency)}
                  </span>
                </div>
                <button className="mt-2 w-full rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  Trigger Manual Sync
                </button>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
