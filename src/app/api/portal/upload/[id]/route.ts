/**
 * Candidate document upload (§101.3 mobile capture, §20). Multipart POST from
 * the portal; the portal session must own the document.
 */

import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { OnboardingError, uploadDocument } from "@/lib/onboarding/service";
import { PORTAL_COOKIE } from "@/lib/onboarding/session";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const candidateId = request.cookies.get(PORTAL_COOKIE)?.value;
  if (!candidateId) return NextResponse.json({ ok: false, error: "Your portal session has expired — open your onboarding link again." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose a file to upload." }, { status: 400 });

  try {
    const result = await uploadDocument(candidateId, id, { name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) }, String(form.get("expiresAt") ?? "") || undefined);
    revalidatePath("/portal");
    revalidatePath(`/candidates/${candidateId}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof OnboardingError) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Upload failed. Please try again." }, { status: 500 });
  }
}
