"use server";

/**
 * Server action — persist Consultant 360 edits and emit an AuditEvent.
 *
 * Wraps the consultant.update and auditEvent.create in a single transaction so
 * the field diff is always co-recorded with the mutation (§26 audit, §15 360).
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  ConsultantStatus,
  EmploymentType,
} from "@/generated/prisma/enums";

export type UpdateConsultantInput = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  title?: string | null;
  status?: ConsultantStatus;
  startDate?: string | null; // ISO date "YYYY-MM-DD" or null
  endDate?: string | null;
  billRate?: number | null;
  payRate?: number | null;
  location?: string | null;
  notes?: string | null;
  employmentType?: EmploymentType | null;
};

type FieldDiff = Record<string, { before: unknown; after: unknown }>;

/** Coerce a date input value into Date | null for Prisma. */
function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

/** Normalise a Date|null to an ISO date string for diff comparison. */
function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export async function updateConsultantAction(
  input: UpdateConsultantInput,
): Promise<{ ok: boolean; error?: string }> {
  const existing = await db.consultant.findUnique({ where: { id: input.id } });
  if (!existing) {
    return { ok: false, error: "Consultant not found" };
  }

  // Build the update payload + diff in lockstep so we only persist actual changes.
  const diff: FieldDiff = {};
  const data: Record<string, unknown> = {};

  // Helper for scalar fields that map 1-to-1.
  const compare = <K extends keyof typeof existing>(
    key: K,
    next: (typeof existing)[K] | undefined,
  ) => {
    if (next === undefined) return;
    const before = existing[key];
    if (before === next) return;
    diff[key as string] = { before, after: next };
    data[key as string] = next;
  };

  compare("firstName", input.firstName);
  compare("lastName", input.lastName);
  compare("email", input.email);
  compare("phone", input.phone === undefined ? undefined : input.phone);
  compare("title", input.title === undefined ? undefined : input.title);
  compare("status", input.status);
  compare(
    "employmentType",
    input.employmentType === undefined ? undefined : input.employmentType,
  );
  compare("location", input.location === undefined ? undefined : input.location);
  compare("notes", input.notes === undefined ? undefined : input.notes);
  compare(
    "billRate",
    input.billRate === undefined ? undefined : input.billRate,
  );
  compare("payRate", input.payRate === undefined ? undefined : input.payRate);

  // Dates need string-form comparison.
  const startDate = parseDate(input.startDate);
  if (startDate !== undefined) {
    const beforeIso = dateToIso(existing.startDate);
    const afterIso = dateToIso(startDate);
    if (beforeIso !== afterIso) {
      diff.startDate = { before: beforeIso, after: afterIso };
      data.startDate = startDate;
    }
  }
  const endDate = parseDate(input.endDate);
  if (endDate !== undefined) {
    const beforeIso = dateToIso(existing.endDate);
    const afterIso = dateToIso(endDate);
    if (beforeIso !== afterIso) {
      diff.endDate = { before: beforeIso, after: afterIso };
      data.endDate = endDate;
    }
  }

  if (Object.keys(diff).length === 0) {
    return { ok: true };
  }

  try {
    await db.$transaction([
      db.consultant.update({
        where: { id: input.id },
        data,
      }),
      db.auditEvent.create({
        data: {
          action: "UPDATED",
          entityType: "consultant",
          entityId: input.id,
          entityLabel: `${existing.firstName} ${existing.lastName}`,
          actor: "Abdulla",
          actorRole: "super-admin",
          newValue: JSON.stringify(diff),
          reason: "Manual edit",
          sourceSystem: "HireMe",
          consultantId: input.id,
        },
      }),
    ]);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update consultant";
    return { ok: false, error: message };
  }

  revalidatePath(`/consultants/${input.id}`);
  return { ok: true };
}
