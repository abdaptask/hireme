/**
 * DB query helpers — maps Prisma PayrollReadiness rows to the UI's
 * PayrollRecord shape so the Payroll Readiness page stays type-stable.
 *
 * Server-only (imports `db` which uses pg). Do NOT import in client components.
 *
 * Schema reference (prisma/schema.prisma):
 *   model PayrollReadiness { id, candidateId, status, classification, payRate,
 *     overtimeRules, taxJurisdiction, directDeposit, w4, stateTax, i9,
 *     benefitsEligibility, payrollEntity, startDateSet, updatedAt }
 *   enum  ReadinessStatus  { READY | NOT_READY | PENDING }
 */

import { db } from "@/lib/db";
import type {
  PayrollRecord,
  PayrollReadinessStatus,
  PayrollCheck,
} from "@/lib/payroll";
import { mapEmploymentType } from "@/lib/db-candidates";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

function mapReadinessStatus(s: string | null | undefined): PayrollReadinessStatus {
  if (s === "READY") return "ready";
  if (s === "NOT_READY") return "not-ready";
  if (s === "PENDING") return "pending";
  // Defensive: WAIVED (if ever added to the enum) → treat as ready
  if (s === "WAIVED") return "ready";
  return "pending";
}

function boolToStatus(b: boolean | null | undefined): "pass" | "pending" {
  return b ? "pass" : "pending";
}

function formatStartDate(date: Date | null | undefined): string {
  if (!date) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntilStart(date: Date | null | undefined): number {
  if (!date) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

// ─────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────

type PayrollRow = Awaited<ReturnType<typeof fetchPayrollRows>>[number];

async function fetchPayrollRows() {
  return db.payrollReadiness.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      candidate: {
        include: {
          assignments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              client: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────
// Row → PayrollRecord
// ─────────────────────────────────────────────────────────

function rowToRecord(row: PayrollRow): PayrollRecord {
  const c = row.candidate;
  const assignment = c?.assignments?.[0] ?? null;

  // Prefer Assignment.client.name; fall back to Candidate.clientName; then "—"
  const client =
    assignment?.client?.name ?? c?.clientName ?? "—";

  const candidateName = c
    ? `${c.firstName} ${c.lastName}`.trim()
    : "Unknown Candidate";

  // Pay rate: assignment first, then 0 (UI shows $0/hr — acceptable null-safe display)
  const payRate = assignment?.payRate ?? 0;

  const startDate = assignment?.startDate ?? c?.startDate ?? null;

  // Build the eleven §16.2 checks from the boolean columns.
  // Note: schema stores booleans (true=pass, false=pending). There's no
  // explicit "fail" state — surfacing fails would require a separate column,
  // so we map false→pending which is the safe, conservative interpretation.
  const checks: PayrollCheck[] = [
    {
      label: "Employment Classification",
      status: boolToStatus(row.classification),
    },
    {
      label: "Pay Rate Configured",
      status: boolToStatus(row.payRate),
    },
    {
      label: "Overtime Rules",
      status: boolToStatus(row.overtimeRules),
    },
    {
      label: "Tax Jurisdiction",
      status: boolToStatus(row.taxJurisdiction),
    },
    {
      label: "Direct Deposit",
      status: boolToStatus(row.directDeposit),
    },
    {
      label: "W-4 / Federal Tax",
      status: boolToStatus(row.w4),
    },
    {
      label: "State Tax Form",
      status: boolToStatus(row.stateTax),
    },
    {
      label: "I-9 Verified",
      status: boolToStatus(row.i9),
    },
    {
      label: "Benefits Eligibility",
      status: boolToStatus(row.benefitsEligibility),
    },
    {
      label: "Payroll Entity",
      status: boolToStatus(row.payrollEntity),
    },
    {
      label: "Start Date Confirmed",
      status: boolToStatus(row.startDateSet),
    },
  ];

  return {
    // Use the candidate id so this lines up with mock candidateId-based dedup
    // and the existing /candidates/[id] route in the row links.
    candidateId: c?.id ?? row.candidateId,
    candidateName,
    client,
    employmentType: mapEmploymentType(c?.employmentType ?? null),
    startDate: formatStartDate(startDate),
    startInDays: daysUntilStart(startDate),
    overallStatus: mapReadinessStatus(row.status),
    payRate,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: assignment?.msp ?? "ApTask LLC",
    timekeepingMethod: "Portal",
    checks,
  };
}

/** Returns all PayrollReadiness rows from the DB as PayrollRecord[]. */
export async function getDbPayrollRecords(): Promise<PayrollRecord[]> {
  const rows = await fetchPayrollRows();
  return rows.map(rowToRecord);
}
