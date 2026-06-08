"use server";

/**
 * Server action — persist Candidate 360 edits and emit an AuditEvent.
 *
 * Wraps candidate.update + auditEvent.create in a single transaction so the
 * field diff travels with the mutation (§26 audit, §100 candidate 360).
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type {
  CandidateStatus,
  EmploymentType,
  RiskLevel,
} from "@/generated/prisma/enums";

export type UpdateCandidateInput = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  status?: CandidateStatus;
  risk?: RiskLevel;
  stage?: string | null;
  employmentType?: EmploymentType | null;
  workLocation?: string | null;
  startDate?: string | null;
  clientName?: string | null;
  recruiter?: string | null;
  onboarder?: string | null;
  vendor?: string | null;
  tags?: string[];
  notes?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type FieldDiff = Record<string, { before: unknown; after: unknown }>;

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export async function updateCandidateAction(
  input: UpdateCandidateInput,
): Promise<{ ok: boolean; error?: string }> {
  const existing = await db.candidate.findUnique({ where: { id: input.id } });
  if (!existing) {
    return { ok: false, error: "Candidate not found" };
  }

  const diff: FieldDiff = {};
  const data: Record<string, unknown> = {};

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
  compare("status", input.status);
  compare("risk", input.risk);
  compare("stage", input.stage === undefined ? undefined : input.stage);
  compare(
    "employmentType",
    input.employmentType === undefined ? undefined : input.employmentType,
  );
  compare(
    "workLocation",
    input.workLocation === undefined ? undefined : input.workLocation,
  );
  compare(
    "clientName",
    input.clientName === undefined ? undefined : input.clientName,
  );
  compare(
    "recruiter",
    input.recruiter === undefined ? undefined : input.recruiter,
  );
  compare(
    "onboarder",
    input.onboarder === undefined ? undefined : input.onboarder,
  );
  compare("vendor", input.vendor === undefined ? undefined : input.vendor);
  compare("notes", input.notes === undefined ? undefined : input.notes);
  compare("street", input.street === undefined ? undefined : input.street);
  compare("city", input.city === undefined ? undefined : input.city);
  compare("state", input.state === undefined ? undefined : input.state);
  compare("zip", input.zip === undefined ? undefined : input.zip);

  // Tags (string[])
  if (input.tags !== undefined) {
    if (!arraysEqual(existing.tags, input.tags)) {
      diff.tags = { before: existing.tags, after: input.tags };
      data.tags = input.tags;
    }
  }

  const startDate = parseDate(input.startDate);
  if (startDate !== undefined) {
    const beforeIso = dateToIso(existing.startDate);
    const afterIso = dateToIso(startDate);
    if (beforeIso !== afterIso) {
      diff.startDate = { before: beforeIso, after: afterIso };
      data.startDate = startDate;
    }
  }

  if (Object.keys(diff).length === 0) {
    return { ok: true };
  }

  try {
    await db.$transaction([
      db.candidate.update({
        where: { id: input.id },
        data,
      }),
      db.auditEvent.create({
        data: {
          action: "UPDATED",
          entityType: "candidate",
          entityId: input.id,
          entityLabel: `${existing.firstName} ${existing.lastName}`,
          actor: "Abdulla",
          actorRole: "super-admin",
          newValue: JSON.stringify(diff),
          reason: "Manual edit",
          sourceSystem: "HireMe",
          candidateId: input.id,
        },
      }),
    ]);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update candidate";
    return { ok: false, error: message };
  }

  revalidatePath(`/candidates/${input.id}`);
  return { ok: true };
}
