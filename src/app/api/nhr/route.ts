/**
 * New Hire Request submission with resumes (§8.2, §20). Multipart POST: the
 * NHR as JSON plus the raw and formatted resumes. Both resumes are read before
 * anything is created, and the whole request is rolled back if storing fails.
 */

import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import type { NhrForm } from "@/lib/onboarding/nhr";
import { OnboardingError, createFromNhr, deleteCandidateCascade } from "@/lib/onboarding/service";
import { staffActor } from "@/lib/onboarding/session";
import { can } from "@/lib/onboarding/permissions";
import { ResumeFileError, readResume, storeResume, type ResumeUpload } from "@/lib/talent/service";

async function upload(v: FormDataEntryValue | null): Promise<ResumeUpload | null> {
  return v instanceof File && v.size ? { name: v.name, type: v.type, bytes: new Uint8Array(await v.arrayBuffer()) } : null;
}

export async function POST(request: NextRequest) {
  const actor = await staffActor();
  if (!actor || !can(actor.role, "initiate")) return NextResponse.json({ ok: false, error: "Only a Recruiting Manager can start onboarding." }, { status: 403 });

  const form = await request.formData();
  let nhr: NhrForm;
  try {
    nhr = JSON.parse(String(form.get("nhr") ?? ""));
  } catch {
    return NextResponse.json({ ok: false, error: "The request was incomplete — please submit again." }, { status: 400 });
  }
  const raw = await upload(form.get("rawResume"));
  const formatted = await upload(form.get("formattedResume"));
  if (!raw || !formatted) return NextResponse.json({ ok: false, error: `Upload the ${!raw ? "raw" : "formatted"} resume before submitting.` }, { status: 400 });

  let created: Awaited<ReturnType<typeof createFromNhr>> | null = null;
  try {
    const [rawText, formattedText] = [await readResume(raw, "raw resume"), await readResume(formatted, "formatted resume")];
    created = await createFromNhr(nhr, actor);
    await storeResume(created.id, "formatted", formatted, actor, formattedText);
    await storeResume(created.id, "raw", raw, actor, rawText);
    for (const p of ["/candidates", "/onboarding", "/reports"]) revalidatePath(p);
    return NextResponse.json({ ok: true, data: created });
  } catch (e) {
    if (created) await deleteCandidateCascade(created.id);
    if (e instanceof OnboardingError || e instanceof ResumeFileError) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Something went wrong saving that. Please try again." }, { status: 500 });
  }
}
