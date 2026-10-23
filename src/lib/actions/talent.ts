"use server";

/**
 * Talent intelligence actions (§20). Re-runs resume analysis — e.g. after an
 * Anthropic API key is added, or the built-in taxonomy grows.
 */

import { revalidatePath } from "next/cache";
import { staffActor } from "@/lib/onboarding/session";
import { can } from "@/lib/onboarding/permissions";
import { ResumeFileError, reanalyzeResume } from "@/lib/talent/service";

export async function reanalyzeResumeAction(
  candidateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await staffActor();
  if (!actor || !(can(actor.role, "initiate") || can(actor.role, "review")))
    return { ok: false, error: "Only the Recruiting Manager, Onboarder or a Super Admin can re-run analysis." };
  try {
    await reanalyzeResume(candidateId, actor);
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    if (e instanceof ResumeFileError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Couldn't analyze the resume. Please try again." };
  }
}
