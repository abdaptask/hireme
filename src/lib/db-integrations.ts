/**
 * DB query helpers for the Integrations Hub (§74–§95).
 * Maps Prisma Integration rows → the UI Integration type from lib/integrations.ts
 *
 * Server-only — never import in client components.
 */

import { db } from "@/lib/db";
import type { Integration, IntegrationStatus, IntegrationCategory } from "@/lib/integrations";
import { relativeTime } from "@/lib/db-candidates";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

function mapStatus(s: string): IntegrationStatus {
  const m: Record<string, IntegrationStatus> = {
    CONNECTED: "connected",
    DEGRADED: "degraded",
    ERROR: "error",
    DISCONNECTED: "disconnected",
    SCHEDULED: "scheduled",
  };
  return m[s] ?? "disconnected";
}

function mapCategory(s: string): IntegrationCategory {
  const m: Record<string, IntegrationCategory> = {
    ATS: "ats",
    VMS: "vms",
    HRIS: "hris",
    PAYROLL: "payroll",
    SCREENING: "screening",
    ESIGN: "esign",
    COMMUNICATION: "communication",
    IDENTITY: "identity",
    ASSET: "asset",
    LMS: "lms",
    SHIPPING: "shipping",
    ACCOUNTING: "accounting",
    CRM: "crm",
    ANALYTICS: "analytics",
    BENEFITS: "benefits",
  };
  return (m[s] as IntegrationCategory) ?? "ats";
}

// ─────────────────────────────────────────────────────────
// Row type
// ─────────────────────────────────────────────────────────

type IntegrationRow = Awaited<ReturnType<typeof fetchIntegrationRows>>[number];

async function fetchIntegrationRows() {
  return db.integration.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      events: {
        orderBy: { timestamp: "desc" },
        take: 5,
      },
    },
  });
}

function rowToIntegration(r: IntegrationRow): Integration {
  return {
    id: r.id,
    name: r.name,
    vendor: r.vendor,
    category: mapCategory(r.category),
    description: r.description ?? `${r.vendor} integration`,
    status: mapStatus(r.status),
    lastSync: r.lastSync ? relativeTime(r.lastSync) : "Never",
    lastSuccess: r.lastSuccess ? relativeTime(r.lastSuccess) : "Never",
    failedRecords: r.failedRecords,
    successRate: r.successRate,
    avgLatencyMs: r.avgLatencyMs,
    queueDepth: r.queueDepth,
    authExpires: r.authExpires ? r.authExpires.toLocaleDateString() : undefined,
    authType: (r.authType as Integration["authType"]) ?? "api-key",
    owner: r.owner ?? "Platform Team",
    criticality: r.criticality as Integration["criticality"],
    syncDirection: r.syncDirection as Integration["syncDirection"],
    syncFrequency: (r.syncFrequency as Integration["syncFrequency"]) ?? "daily",
    environment: r.environment as Integration["environment"],
    dataExchanged: r.dataExchanged,
    totalRecordsToday: r.totalRecordsToday,
    totalErrorsToday: r.totalErrorsToday,
    uptime30d: r.uptime30d,
    fieldMappings: [],
    recentEvents: r.events.map((e) => ({
      id: e.id,
      timestamp: relativeTime(e.timestamp),
      direction: e.direction as "inbound" | "outbound",
      eventType: e.eventType,
      recordCount: e.recordCount,
      status: (e.status === "error" ? "failed" : e.status) as "success" | "partial" | "failed" | "retrying",
      latencyMs: e.latencyMs,
      errorCode: e.errorCode ?? undefined,
      errorMessage: e.errorMessage ?? undefined,
      retryCount: e.retryCount,
      correlationId: e.id, // use event id as correlation id fallback
    })),
  };
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

export async function getDbIntegrations(): Promise<Integration[]> {
  const rows = await fetchIntegrationRows();
  return rows.map(rowToIntegration);
}
