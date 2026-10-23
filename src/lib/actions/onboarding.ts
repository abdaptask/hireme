"use server";

/**
 * Server actions for the live onboarding loop. Thin wrappers: resolve who is
 * acting, call the onboarding service, refresh affected pages, and return a
 * plain result (never throw to the client).
 */

import { revalidatePath } from "next/cache";
import type { OnboardingFormData } from "@/lib/onboarding-form";
import * as svc from "@/lib/onboarding/service";
import { portalCandidateId, staffActor } from "@/lib/onboarding/session";
import { can, type OnboardingPermission } from "@/lib/onboarding/permissions";
import { getRole } from "@/lib/roles";

export type ActionResult<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: string };

async function run<T>(
  fn: () => Promise<T>,
  paths: string[],
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    for (const p of paths) revalidatePath(p);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof svc.OnboardingError)
      return { ok: false, error: e.message };
    console.error(e);
    return {
      ok: false,
      error: "Something went wrong saving that. Please try again.",
    };
  }
}

const DENIED: Record<OnboardingPermission, string> = {
  initiate: "Only a Recruiting Manager can start onboarding.",
  review: "Only the Onboarder can review and move onboarding forward.",
  billing: "Only the Onboarder or Account Manager can complete billing setup.",
  approve: "Only a Super Admin can approve NHR exceptions.",
  editNhr: "Only the Recruiting Manager can edit a New Hire Request.",
};

/** Resolve the acting staff member and enforce segregation of duties (§25). */
async function requireStaff(permission: OnboardingPermission) {
  const actor = await staffActor();
  if (!actor || !can(actor.role, permission)) {
    throw new svc.OnboardingError(
      `${DENIED[permission]} You're signed in as ${getRole(actor?.role ?? "candidate").label}.`,
    );
  }
  return actor;
}

async function requirePortal() {
  const id = await portalCandidateId();
  if (!id)
    throw new svc.OnboardingError(
      "Your portal session has expired — open your onboarding link again.",
    );
  return id;
}

// ── Staff ────────────────────────────────────────────────

export async function getOnboardingOptions() {
  return svc.onboardingOptions();
}

export async function createOnboardingAction(
  data: OnboardingFormData,
  draft: boolean,
) {
  return run(
    async () =>
      svc.createOnboarding(data, {
        draft,
        actor: await requireStaff("initiate"),
      }),
    ["/candidates", "/onboarding", "/reports"],
  );
}

export async function reviewDocumentAction(
  candidateId: string,
  docId: string,
  decision: "approve" | "reject" | "correction",
  reason: string,
) {
  return run(
    async () =>
      svc.reviewDocument(docId, decision, reason, await requireStaff("review")),
    [`/candidates/${candidateId}`, "/portal"],
  );
}

export async function recordScreeningAction(
  candidateId: string,
  screeningId: string,
  result: "CLEAR" | "REVIEW_REQUIRED",
) {
  return run(
    async () =>
      svc.recordScreening(screeningId, result, await requireStaff("review")),
    [`/candidates/${candidateId}`, "/portal"],
  );
}

export async function advanceEquipmentAction(
  candidateId: string,
  equipmentId: string,
) {
  return run(
    async () => svc.advanceEquipment(equipmentId, await requireStaff("review")),
    [`/candidates/${candidateId}`, "/portal"],
  );
}

export async function completeBillingAction(
  candidateId: string,
  input: {
    poNumber: string;
    costCenter: string;
    clientWorkerId: string;
    vmsWorkerId: string;
  },
) {
  return run(
    async () =>
      svc.completeBillingSetup(
        candidateId,
        input,
        await requireStaff("billing"),
      ),
    [`/candidates/${candidateId}`],
  );
}

export async function confirmStartAction(candidateId: string) {
  return run(
    async () => svc.confirmStart(candidateId, await requireStaff("review")),
    [`/candidates/${candidateId}`, "/portal", "/candidates"],
  );
}

// ── Candidate portal ─────────────────────────────────────

export async function submitFormAction(
  docId: string,
  values: Record<string, string>,
  signature: string,
  confirmed: boolean,
) {
  return run(
    async () => svc.submitForm(await requirePortal(), docId, values, signature, confirmed),
    ["/portal"],
  );
}

export async function completeTrainingAction(
  trainingId: string,
  score: number,
) {
  return run(
    async () => svc.completeTraining(await requirePortal(), trainingId, score),
    ["/portal"],
  );
}

export async function consentScreeningAction(
  screeningId: string,
  signature: string,
) {
  return run(
    async () =>
      svc.consentScreening(await requirePortal(), screeningId, signature),
    ["/portal"],
  );
}

export async function confirmEquipmentAction(equipmentId: string) {
  return run(
    async () => svc.confirmEquipment(await requirePortal(), equipmentId),
    ["/portal"],
  );
}

// ── New Hire Request (Recruiting Manager intake) ─────────

// NHR submission goes through POST /api/nhr (multipart, with the resumes).

export async function decideNhrExceptionAction(candidateId: string, decision: "approve" | "reject", note: string) {
  return run(async () => svc.decideNhrException(candidateId, decision, note, await requireStaff("approve")), [`/candidates/${candidateId}`, "/candidates", "/approvals"]);
}

export async function updateNhrAction(candidateId: string, patch: svc.NhrEdit) {
  return run(async () => svc.updateNhr(candidateId, patch, await requireStaff("editNhr")), [`/candidates/${candidateId}`, "/candidates"]);
}
