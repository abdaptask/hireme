/**
 * DB query helpers for the Consultants module (§15 360 record, §38 lifecycle).
 * Maps Prisma Consultant rows → the UI Consultant type from lib/consultants.ts
 *
 * Server-only — never import in client components.
 */

import { db } from "@/lib/db";
import type { Consultant, ConsultantStatus } from "@/lib/consultants";
import { relativeTime } from "@/lib/db-candidates";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

function mapStatus(s: string): ConsultantStatus {
  const m: Record<string, ConsultantStatus> = {
    ACTIVE: "Active",
    BENCH: "Bench",
    EXTENSION_PENDING: "Extension Pending",
    OFFBOARDING: "Offboarding",
    CONVERTED: "Converted",
    FORMER: "Former",
    INELIGIBLE: "Ineligible",
  };
  return m[s] ?? "Active";
}

function mapEmpType(et: string | null): "W-2" | "1099" | "C2C" {
  if (et === "C2C") return "C2C";
  if (et === "INDEPENDENT_1099") return "1099";
  return "W-2";
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────
// Row type
// ─────────────────────────────────────────────────────────

export type DbConsultantFull = NonNullable<
  Awaited<ReturnType<typeof getDbConsultantFull>>
>;

type ConsultantRow = Awaited<ReturnType<typeof fetchConsultantRows>>[number];

async function fetchConsultantRows() {
  return db.consultant.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      assignments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jobTitle: true,
          startDate: true,
          endDate: true,
          status: true,
          billRate: true,
          payRate: true,
          clientId: true,
        },
      },
    },
  });
}

function rowToConsultant(c: ConsultantRow): Consultant {
  const assignCount = c.assignments.length;
  const latestAssignment = c.assignments[0];

  // Use assignment bill/pay rate if set, else consultant-level
  const billRate =
    latestAssignment?.billRate ?? c.billRate ?? 0;
  const payRate =
    latestAssignment?.payRate ?? c.payRate ?? 0;

  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    role: c.title ?? "Consultant",
    client: c.clientName ?? "Unassigned",
    employmentType: mapEmpType(c.employmentType ?? null),
    location: c.location ?? "Remote",
    startDate: fmtDate(c.startDate),
    endDate: c.endDate ? fmtDate(c.endDate) : undefined,
    status: mapStatus(c.status),
    rateType: "Hourly",
    billRate,
    payRate,
    currency: "USD",
    recruiter: c.recruiter ?? "Unassigned",
    accountManager: c.accountManager ?? "Unassigned",
    vendor: c.vendor ?? undefined,
    assignments: assignCount,
    extensions: 0, // DB doesn't store this separately yet
    satisfactionScore: 4.5, // default until survey module is wired
    lastActivity: relativeTime(c.updatedAt),
    tags: c.skills, // skills double as tags for now
    phone: c.phone ?? "",
    email: c.email,
  };
}

// ─────────────────────────────────────────────────────────
// Public API — list
// ─────────────────────────────────────────────────────────

export async function getDbConsultants(): Promise<Consultant[]> {
  const rows = await fetchConsultantRows();
  return rows.map(rowToConsultant);
}

// ─────────────────────────────────────────────────────────
// Public API — detail (one consultant + full assignments + audit)
// ─────────────────────────────────────────────────────────

export async function getDbConsultantFull(id: string) {
  const consultant = await db.consultant.findUnique({
    where: { id },
    include: {
      assignments: {
        orderBy: { createdAt: "desc" },
        include: {
          // Pull client name via client relation if linked
        },
      },
      auditEvents: {
        orderBy: { timestamp: "desc" },
        take: 50,
      },
    },
  });
  if (!consultant) return null;

  // Documents, communications, screenings, payroll, billing, equipment, training,
  // and onboarding-period audit events all hang off the originating Candidate.
  // Resolve via the email join.
  const candidate = consultant.email
    ? await db.candidate
        .findUnique({
          where: { email: consultant.email },
          include: {
            documents: { orderBy: { uploadedAt: "desc" } },
            communications: { orderBy: { sentAt: "desc" } },
            screenings: { orderBy: { createdAt: "desc" } },
            equipment: { orderBy: { createdAt: "desc" } },
            training: { orderBy: { createdAt: "desc" } },
            payroll: true,
            billing: true,
            auditEvents: { orderBy: { timestamp: "desc" }, take: 50 },
          },
        })
        .catch(() => null)
    : null;

  // Merge consultant-period and candidate-period audit events, dedupe, sort.
  const mergedAuditMap = new Map<string, (typeof consultant.auditEvents)[number]>();
  for (const ev of consultant.auditEvents) mergedAuditMap.set(ev.id, ev);
  for (const ev of candidate?.auditEvents ?? []) {
    if (!mergedAuditMap.has(ev.id)) mergedAuditMap.set(ev.id, ev);
  }
  const auditEvents = Array.from(mergedAuditMap.values())
    .sort((a, b) => {
      const at = a.timestamp ? a.timestamp.getTime() : 0;
      const bt = b.timestamp ? b.timestamp.getTime() : 0;
      return bt - at;
    })
    .slice(0, 100);

  return {
    ...consultant,
    candidateId: candidate?.id ?? null,
    documents: candidate?.documents ?? [],
    communications: candidate?.communications ?? [],
    screenings: candidate?.screenings ?? [],
    equipment: candidate?.equipment ?? [],
    training: candidate?.training ?? [],
    payroll: candidate?.payroll ?? null,
    billing: candidate?.billing ?? null,
    auditEvents,
  };
}

/** Maps a full DB consultant to the UI Consultant type. */
export function dbConsultantToUI(c: DbConsultantFull): Consultant {
  const assignCount = c.assignments.length;
  const latest = c.assignments[0];
  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    role: c.title ?? "Consultant",
    client: c.clientName ?? "Unassigned",
    employmentType: mapEmpType(c.employmentType ?? null),
    location: c.location ?? "Remote",
    startDate: fmtDate(c.startDate),
    endDate: c.endDate ? fmtDate(c.endDate) : undefined,
    status: mapStatus(c.status),
    rateType: "Hourly",
    billRate: latest?.billRate ?? c.billRate ?? 0,
    payRate: latest?.payRate ?? c.payRate ?? 0,
    currency: "USD",
    recruiter: c.recruiter ?? "Unassigned",
    accountManager: c.accountManager ?? "Unassigned",
    vendor: c.vendor ?? undefined,
    assignments: assignCount,
    extensions: 0,
    satisfactionScore: 4.5,
    lastActivity: relativeTime(c.updatedAt),
    tags: c.skills,
    phone: c.phone ?? "",
    email: c.email,
  };
}
