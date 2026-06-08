/**
 * DB query helpers for Billing Readiness (§16 — Payroll and Billing Readiness).
 * Maps Prisma BillingReadiness rows → the UI's BillingRecord type from
 * lib/billing.ts so the page can merge DB + mock data seamlessly.
 *
 * Schema reference (prisma/schema.prisma → model BillingReadiness):
 *   - status                : ReadinessStatus (READY | NOT_READY | PENDING)
 *   - billRate, markup, purchaseOrder, costCenter, clientWorkerId, vmsId,
 *     invoiceFrequency, timesheetMethod, expensePolicy, billingEntity,
 *     approvedStartDate  → Boolean check flags
 *   - poNumber, clientWorkerId2, vmsWorkerId  → String identifier fields
 *   - candidate (firstName, lastName, employmentType, startDate, clientName)
 *   - candidate.assignments[0] (billRate, currency, …)
 *
 * Server-only — never import in client components.
 */

import { db } from "@/lib/db";
import type {
  BillingCheck,
  BillingReadinessStatus,
  BillingRecord,
} from "@/lib/billing";
import { mapEmploymentType } from "@/lib/db-candidates";

// ─────────────────────────────────────────────────────────
// Enum + formatting helpers
// ─────────────────────────────────────────────────────────

function mapStatus(s: string): BillingReadinessStatus {
  if (s === "READY") return "ready";
  if (s === "PENDING") return "pending";
  return "not-ready";
}

function formatStartDate(date: Date | null): string {
  if (!date) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntilStart(date: Date | null): number {
  if (!date) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

// Build a single check row: pass/pending/fail with a contextual note.
function check(
  label: string,
  flag: boolean,
  detail?: string | null,
  pendingHint?: string,
): BillingCheck {
  if (flag) {
    return { label, status: "pass", note: detail ?? undefined };
  }
  if (pendingHint) {
    return { label, status: "pending", note: pendingHint };
  }
  return { label, status: "fail", note: detail ?? "Not configured" };
}

// ─────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────

type BillingRow = Awaited<ReturnType<typeof fetchBillingRows>>[number];

async function fetchBillingRows() {
  return db.billingReadiness.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      candidate: {
        include: {
          assignments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { client: true },
          },
        },
      },
    },
  });
}

function rowToRecord(b: BillingRow): BillingRecord {
  const c = b.candidate;
  const assignment = c.assignments[0];
  const clientName =
    assignment?.client?.name ?? c.clientName ?? "Unassigned";

  // Bill rate / markup: prefer assignment.billRate when configured, else
  // fall back to a sensible display number (0) when the flag is false.
  const billRate = Math.round(assignment?.billRate ?? 0);
  const payRate = Math.round(assignment?.payRate ?? 0);
  const markup =
    payRate > 0 && billRate > 0
      ? Math.round(((billRate - payRate) / payRate) * 100)
      : 0;

  const overallStatus = mapStatus(b.status);

  // §16.3 — eleven checks. Map the boolean flags + string identifiers in
  // BillingReadiness into the shape BillingRecord.checks expects.
  const checks: BillingCheck[] = [
    check(
      "Bill Rate Configured",
      b.billRate,
      billRate > 0 ? `$${billRate}/hr approved` : null,
      "Bill rate approval pending",
    ),
    check(
      "Markup Applied",
      b.markup,
      markup > 0 ? `${markup}% markup confirmed` : null,
      "Markup calculation pending",
    ),
    check(
      "Purchase Order",
      b.purchaseOrder,
      b.poNumber ? `${b.poNumber} active` : null,
      "PO request outstanding",
    ),
    check(
      "Cost Center",
      b.costCenter,
      null,
      "Cost center assignment pending",
    ),
    check(
      "Client Worker ID",
      b.clientWorkerId,
      b.clientWorkerId2 ? `${b.clientWorkerId2} issued` : null,
      "Worker ID not yet issued",
    ),
    check(
      "VMS ID",
      b.vmsId,
      b.vmsWorkerId
        ? `${b.vmsWorkerId} — VMS active`
        : "Not applicable — direct engagement",
      "VMS worker record pending",
    ),
    check(
      "Invoice Frequency",
      b.invoiceFrequency,
      null,
      "Invoice cadence not configured",
    ),
    check(
      "Timesheet Method",
      b.timesheetMethod,
      null,
      "Timesheet method pending setup",
    ),
    check(
      "Expense Policy",
      b.expensePolicy,
      null,
      "Expense policy not yet attached",
    ),
    check(
      "Billing Entity",
      b.billingEntity,
      null,
      "Billing entity not selected",
    ),
    check(
      "Approved Start Date",
      b.approvedStartDate,
      c.startDate ? `${formatStartDate(c.startDate)} confirmed` : null,
      "Start date awaiting client approval",
    ),
  ];

  return {
    candidateId: c.id,
    candidateName: `${c.firstName} ${c.lastName}`,
    client: clientName,
    employmentType: mapEmploymentType(c.employmentType),
    startDate: formatStartDate(c.startDate),
    startInDays: daysUntilStart(c.startDate),
    overallStatus,
    billRate,
    markup,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: b.poNumber ?? undefined,
    costCenter: undefined,
    clientWorkerId: b.clientWorkerId2 ?? undefined,
    vmsId: b.vmsWorkerId ?? undefined,
    invoiceFrequency: assignment?.client?.invoiceFrequency ?? "Weekly",
    timesheetMethod: "Portal",
    checks,
  };
}

/** Returns all billing readiness rows from the DB as BillingRecord[]. */
export async function getDbBillingRecords(): Promise<BillingRecord[]> {
  const rows = await fetchBillingRows();
  return rows.map(rowToRecord);
}
