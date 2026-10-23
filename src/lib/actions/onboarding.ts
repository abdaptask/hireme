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

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>, paths: string[]): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    for (const p of paths) revalidatePath(p);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof svc.OnboardingError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong saving that. Please try again." };
  }
}

async function requireStaff() {
  const actor = await staffActor();
  if (!actor) throw new svc.OnboardingError("Your role can't make changes to onboarding records.");
  return actor;
}

async function requirePortal() {
  const id = await portalCandidateId();
  if (!id) throw new svc.OnboardingError("Your portal session has expired — open your onboarding link again.");
  return id;
}

// ── Staff ────────────────────────────────────────────────

export async function getOnboardingOptions() {
  return svc.onboardingOptions();
}

export async function createOnboardingAction(data: OnboardingFormData, draft: boolean) {
  return run(async () => svc.createOnboarding(data, { draft, actor: await requireStaff() }), ["/candidates", "/onboarding", "/reports"]);
}

export async function reviewDocumentAction(candidateId: string, docId: string, decision: "approve" | "reject" | "correction", reason: string) {
  return run(async () => svc.reviewDocument(docId, decision, reason, await requireStaff()), [`/candidates/${candidateId}`, "/portal"]);
}

export async function recordScreeningAction(candidateId: string, screeningId: string, result: "CLEAR" | "REVIEW_REQUIRED") {
  return run(async () => svc.recordScreening(screeningId, result, await requireStaff()), [`/candidates/${candidateId}`, "/portal"]);
}

export async function advanceEquipmentAction(candidateId: string, equipmentId: string) {
  return run(async () => svc.advanceEquipment(equipmentId, await requireStaff()), [`/candidates/${candidateId}`, "/portal"]);
}

export async function completeBillingAction(candidateId: string, input: { poNumber: string; costCenter: string; clientWorkerId: string; vmsWorkerId: string }) {
  return run(async () => svc.completeBillingSetup(candidateId, input, await requireStaff()), [`/candidates/${candidateId}`]);
}

export async function confirmStartAction(candidateId: string) {
  return run(async () => svc.confirmStart(candidateId, await requireStaff()), [`/candidates/${candidateId}`, "/portal", "/candidates"]);
}

// ── Candidate portal ─────────────────────────────────────

export async function submitFormAction(docId: string, values: Record<string, string>, signature: string) {
  return run(async () => svc.submitForm(await requirePortal(), docId, values, signature), ["/portal"]);
}

export async function completeTrainingAction(trainingId: string, score: number) {
  return run(async () => svc.completeTraining(await requirePortal(), trainingId, score), ["/portal"]);
}

export async function consentScreeningAction(screeningId: string, signature: string) {
  return run(async () => svc.consentScreening(await requirePortal(), screeningId, signature), ["/portal"]);
}

export async function confirmEquipmentAction(equipmentId: string) {
  return run(async () => svc.confirmEquipment(await requirePortal(), equipmentId), ["/portal"]);
}
