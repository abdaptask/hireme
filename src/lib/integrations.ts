/**
 * Integration Hub data (CLAUDE.md §29, §74–§95).
 * Connector health, sync status, and operational metrics for all platform integrations.
 */
import type { StatusTone } from "@/lib/types";

export type IntegrationStatus =
  | "connected"
  | "degraded"
  | "error"
  | "disconnected"
  | "scheduled";

export type IntegrationCategory =
  | "ats"
  | "vms"
  | "hris"
  | "payroll"
  | "screening"
  | "esign"
  | "communication"
  | "identity"
  | "asset"
  | "lms";

export type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  lastSync: string;
  lastSuccess: string;
  failedRecords: number;
  successRate: number;
  avgLatencyMs: number;
  queueDepth: number;
  authExpires?: string;
  owner: string;
  criticality: "critical" | "high" | "medium" | "low";
  syncDirection: "inbound" | "outbound" | "bidirectional";
  environment: "production" | "sandbox";
};

export const INTEGRATION_STATUS_META: Record<
  IntegrationStatus,
  { label: string; tone: StatusTone }
> = {
  connected: { label: "Connected", tone: "success" },
  degraded: { label: "Degraded", tone: "warning" },
  error: { label: "Error", tone: "danger" },
  disconnected: { label: "Disconnected", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "info" },
};

export const CATEGORY_META: Record<
  IntegrationCategory,
  { label: string }
> = {
  ats: { label: "ATS" },
  vms: { label: "VMS / MSP" },
  hris: { label: "HRIS / HCM" },
  payroll: { label: "Payroll" },
  screening: { label: "Background Check" },
  esign: { label: "E-Signature" },
  communication: { label: "Communications" },
  identity: { label: "Identity / IAM" },
  asset: { label: "Asset Management" },
  lms: { label: "LMS" },
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "int-001",
    name: "Bullhorn ATS",
    category: "ats",
    status: "connected",
    lastSync: "2026-06-07 14:15:00",
    lastSuccess: "2026-06-07 14:15:00",
    failedRecords: 0,
    successRate: 99.4,
    avgLatencyMs: 210,
    queueDepth: 0,
    authExpires: "2026-09-30",
    owner: "IT Ops",
    criticality: "critical",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-002",
    name: "SAP Fieldglass",
    category: "vms",
    status: "connected",
    lastSync: "2026-06-07 13:00:00",
    lastSuccess: "2026-06-07 13:00:00",
    failedRecords: 2,
    successRate: 97.8,
    avgLatencyMs: 430,
    queueDepth: 1,
    authExpires: "2026-12-01",
    owner: "Jordan Lee",
    criticality: "critical",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-003",
    name: "ADP Payroll",
    category: "payroll",
    status: "error",
    lastSync: "2026-06-07 09:44:00",
    lastSuccess: "2026-06-06 18:00:00",
    failedRecords: 3,
    successRate: 71.2,
    avgLatencyMs: 880,
    queueDepth: 3,
    authExpires: "2026-08-15",
    owner: "IT Ops",
    criticality: "critical",
    syncDirection: "outbound",
    environment: "production",
  },
  {
    id: "int-004",
    name: "HireRight Screening",
    category: "screening",
    status: "connected",
    lastSync: "2026-06-07 12:30:00",
    lastSuccess: "2026-06-07 12:30:00",
    failedRecords: 0,
    successRate: 100,
    avgLatencyMs: 350,
    queueDepth: 0,
    authExpires: "2026-11-01",
    owner: "Riya Kim",
    criticality: "high",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-005",
    name: "DocuSign",
    category: "esign",
    status: "connected",
    lastSync: "2026-06-07 14:00:00",
    lastSuccess: "2026-06-07 14:00:00",
    failedRecords: 0,
    successRate: 99.9,
    avgLatencyMs: 180,
    queueDepth: 0,
    authExpires: "2027-01-15",
    owner: "Riya Kim",
    criticality: "high",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-006",
    name: "Twilio SMS",
    category: "communication",
    status: "degraded",
    lastSync: "2026-06-07 13:50:00",
    lastSuccess: "2026-06-07 11:00:00",
    failedRecords: 8,
    successRate: 84.3,
    avgLatencyMs: 620,
    queueDepth: 12,
    authExpires: "2026-10-01",
    owner: "IT Ops",
    criticality: "high",
    syncDirection: "outbound",
    environment: "production",
  },
  {
    id: "int-007",
    name: "Okta Identity",
    category: "identity",
    status: "connected",
    lastSync: "2026-06-07 14:10:00",
    lastSuccess: "2026-06-07 14:10:00",
    failedRecords: 0,
    successRate: 100,
    avgLatencyMs: 95,
    queueDepth: 0,
    authExpires: "2027-03-01",
    owner: "IT Ops",
    criticality: "critical",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-008",
    name: "ServiceNow / Jamf Asset",
    category: "asset",
    status: "connected",
    lastSync: "2026-06-07 08:00:00",
    lastSuccess: "2026-06-07 08:00:00",
    failedRecords: 1,
    successRate: 96.5,
    avgLatencyMs: 540,
    queueDepth: 0,
    authExpires: "2026-09-01",
    owner: "IT Ops",
    criticality: "medium",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-009",
    name: "Workday HCM",
    category: "hris",
    status: "degraded",
    lastSync: "2026-06-07 06:00:00",
    lastSuccess: "2026-06-06 06:00:00",
    failedRecords: 14,
    successRate: 88.1,
    avgLatencyMs: 1100,
    queueDepth: 7,
    authExpires: "2026-07-31",
    owner: "Jordan Lee",
    criticality: "high",
    syncDirection: "bidirectional",
    environment: "production",
  },
  {
    id: "int-010",
    name: "SendGrid Email",
    category: "communication",
    status: "disconnected",
    lastSync: "2026-06-05 10:00:00",
    lastSuccess: "2026-06-05 10:00:00",
    failedRecords: 0,
    successRate: 0,
    avgLatencyMs: 0,
    queueDepth: 0,
    authExpires: "2026-06-01",
    owner: "IT Ops",
    criticality: "medium",
    syncDirection: "outbound",
    environment: "production",
  },
];

export function integrationStats(): {
  connected: number;
  degraded: number;
  errors: number;
  criticalDown: number;
} {
  const connected = INTEGRATIONS.filter((i) => i.status === "connected").length;
  const degraded = INTEGRATIONS.filter((i) => i.status === "degraded").length;
  const errors = INTEGRATIONS.filter((i) => i.status === "error").length;
  const criticalDown = INTEGRATIONS.filter(
    (i) =>
      i.criticality === "critical" &&
      ["error", "disconnected", "degraded"].includes(i.status),
  ).length;
  return { connected, degraded, errors, criticalDown };
}
