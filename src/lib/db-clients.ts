/**
 * DB query helpers for the Clients module (§27, §30, §43, §56).
 * Maps Prisma Client rows → the UI's Client type from lib/clients.ts
 * so the list, detail, and pipeline pages stay type-stable and can merge
 * DB + mock data seamlessly.
 *
 * Server-only — never import in client components.
 */

import { db } from "@/lib/db";
import type {
  Client,
  ClientStatus,
  ClientContact,
  ComplianceRule,
  ClientPromise,
} from "@/lib/clients";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

function mapClientStatus(s: string): ClientStatus {
  if (s === "AT_RISK") return "at-risk";
  if (s === "ON_HOLD") return "on-hold";
  return "active";
}

function mapPromiseStatus(
  s: string,
): "on-track" | "at-risk" | "missed" | "delivered" {
  const m: Record<string, "on-track" | "at-risk" | "missed" | "delivered"> = {
    "on-track": "on-track",
    "at-risk": "at-risk",
    missed: "missed",
    delivered: "delivered",
  };
  return m[s] ?? "on-track";
}

// ─────────────────────────────────────────────────────────
// Row types
// ─────────────────────────────────────────────────────────

export type DbClientFull = NonNullable<Awaited<ReturnType<typeof getDbClientFull>>>;

type DbClientRow = Awaited<ReturnType<typeof fetchClientRows>>[number];

async function fetchClientRows() {
  return db.client.findMany({
    orderBy: { name: "asc" },
    include: {
      contacts: true,
      rules: true,
      promises: true,
    },
  });
}

// ─────────────────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────────────────

function mapContacts(
  rows: DbClientRow["contacts"],
): ClientContact[] {
  return rows.map((c) => ({
    name: c.name,
    title: c.title,
    email: c.email,
    phone: c.phone ?? undefined,
    type: (c.type as ClientContact["type"]) ?? "primary",
  }));
}

function mapRules(rows: DbClientRow["rules"]): ComplianceRule[] {
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    category: (r.category as ComplianceRule["category"]) ?? "document",
    required: r.required,
    condition: r.condition ?? undefined,
  }));
}

function mapPromises(rows: DbClientRow["promises"]): ClientPromise[] {
  return rows.map((p) => ({
    label: p.label,
    promisedDate: p.promisedDate,
    actualDate: p.actualDate ?? undefined,
    status: mapPromiseStatus(p.status),
  }));
}

function rowToClient(c: DbClientRow): Client {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    hq: c.hq,
    accountManager: c.accountManager,
    programs: c.programs,
    msp: c.msp ?? undefined,
    employmentTypesAllowed: c.employmentTypesAllowed,
    status: mapClientStatus(c.status),
    rules: mapRules(c.rules),
    contacts: mapContacts(c.contacts),
    promises: mapPromises(c.promises),
    website: c.website ?? undefined,
    invoiceFrequency: c.invoiceFrequency ?? "Bi-weekly",
    paymentTermsDays: c.paymentTermsDays,
    vmsPlatform: c.vmsPlatform ?? undefined,
    workerIdPrefix: c.workerIdPrefix ?? undefined,
    activeConsultants: c.activeConsultants,
    avgOnboardingDays: c.avgOnboardingDays,
    compliancePassRate: c.compliancePassRate,
    startDateSuccessRate: c.startDateSuccessRate,
    since: c.since ?? "2022-01",
    notes: c.notes ?? "",
  };
}

// ─────────────────────────────────────────────────────────
// Public API — list
// ─────────────────────────────────────────────────────────

/** Returns all clients from the DB as Client[]. */
export async function getDbClients(): Promise<Client[]> {
  const rows = await fetchClientRows();
  return rows.map(rowToClient);
}

// ─────────────────────────────────────────────────────────
// Public API — detail
// ─────────────────────────────────────────────────────────

export async function getDbClientFull(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      contacts: true,
      rules: true,
      promises: true,
      assignments: {
        where: { status: "active" },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              risk: true,
              stage: true,
              progress: true,
              startDate: true,
              recruiter: true,
              onboarder: true,
              employmentType: true,
              vendor: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Maps a full DB client row to the UI Client type. */
export function dbClientToUI(c: DbClientFull): Client {
  return rowToClient(c);
}
