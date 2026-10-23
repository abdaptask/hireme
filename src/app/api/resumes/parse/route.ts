/**
 * Resume preview (§10.3 form data extraction). Parses an uploaded resume
 * without storing it so the NHR form can pre-fill and show the skills found.
 */

import { NextResponse, type NextRequest } from "next/server";
import { staffActor } from "@/lib/onboarding/session";
import { can } from "@/lib/onboarding/permissions";
import { PARSER_LABEL } from "@/lib/talent/profile";
import { ResumeFileError, previewResume } from "@/lib/talent/service";

export async function POST(request: NextRequest) {
  const actor = await staffActor();
  if (!actor || !can(actor.role, "initiate")) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose a resume file." }, { status: 400 });
  try {
    const { profile, parser, note } = await previewResume({ name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
    return NextResponse.json({ ok: true, profile, parser: PARSER_LABEL[parser], note: note ?? null });
  } catch (e) {
    if (e instanceof ResumeFileError) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Couldn't read that resume." }, { status: 500 });
  }
}
