/**
 * Report registry — the persona-organized enterprise catalog (§49, §50.1, §73).
 */

import type { ReportControl, ReportDef, ReportMeta, ReportPersona, ReportSectionId } from "./types";
import type { Dataset } from "./dataset";
import { operationalReports } from "./reports/operational";
import { peopleReports } from "./reports/people";
import { commercialReports } from "./reports/commercial";
import { readinessReports } from "./reports/readiness";
import { platformReports } from "./reports/platform";
import { addDropReports } from "./reports/add-drop";

export const REPORTS: ReportDef[] = [
  ...operationalReports,
  ...peopleReports,
  ...commercialReports,
  ...readinessReports,
  ...platformReports,
  ...addDropReports,
];

const BY_SLUG = new Map(REPORTS.map((r) => [r.slug, r]));

export function getReport(slug: string): ReportDef | undefined {
  return BY_SLUG.get(slug);
}

export function reportMeta(r: ReportDef): ReportMeta {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { load, controls, ...meta } = r;
  return meta;
}

export const REPORT_SECTIONS: { id: ReportSectionId; label: string }[] = [
  { id: "operational", label: "Operational" },
  { id: "executive", label: "Executive" },
  { id: "onboarder", label: "Onboarder" },
  { id: "recruiter", label: "Recruiter" },
  { id: "manager", label: "Recruiting Manager" },
  { id: "client", label: "Client & Account" },
  { id: "candidate", label: "Candidate" },
  { id: "compliance", label: "Compliance" },
  { id: "screening", label: "Screening" },
  { id: "payroll", label: "Payroll" },
  { id: "billing", label: "Billing" },
  { id: "equipment", label: "Equipment & IT" },
  { id: "training", label: "Training" },
  { id: "communication", label: "Communications" },
  { id: "ai", label: "AI & Automation" },
  { id: "integration", label: "Integrations" },
  { id: "audit", label: "Audit & Security" },
  { id: "lifecycle", label: "Lifecycle & Back Office" },
];

export const REPORT_PERSONAS: { id: ReportPersona; label: string; description: string }[] = [
  { id: "super-admin", label: "Super Admin", description: "Widest catalog: operations, system, audit, AI governance." },
  { id: "executive", label: "Executive", description: "Scorecards, portfolio, financial impact, risk." },
  { id: "onboarder", label: "Onboarder", description: "Workload, review queues, readiness, exceptions." },
  { id: "recruiter", label: "Recruiter", description: "Funnel, handoff, engagement, start-date success." },
  { id: "recruiting-manager", label: "Recruiting Manager", description: "Throughput, capacity, scorecards, coaching." },
  { id: "account-manager", label: "Account Manager", description: "Client pipeline, promises, billing, lifecycle." },
  { id: "candidate", label: "Candidate", description: "Own progress, documents, Day 1 readiness." },
];

export function sectionLabel(id: ReportSectionId): string {
  return REPORT_SECTIONS.find((s) => s.id === id)?.label ?? id;
}

/** Resolve a report's controls against live data (serializable for the client). */
export function resolveControls(r: ReportDef, ds: Dataset): ReportControl[] {
  if (!r.controls) return [];
  return typeof r.controls === "function" ? r.controls(ds) : r.controls;
}
