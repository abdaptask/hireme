/**
 * Document file access (§20, §42 download controls). The candidate who owns a
 * document, or an internal staff role, may view it; external roles may not.
 */

import { type NextRequest } from "next/server";
import { readDocumentFile } from "@/lib/onboarding/service";
import { PORTAL_COOKIE } from "@/lib/onboarding/session";
import { VIEW_AS_COOKIE, parseRole } from "@/lib/report-engine/access";

const STAFF = new Set(["super-admin", "onboarder", "recruiter", "recruiting-manager", "team-lead", "account-manager"]);

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const file = await readDocumentFile(id);
  if (!file) return new Response("Not found", { status: 404 });

  const portal = request.cookies.get(PORTAL_COOKIE)?.value;
  const role = parseRole(request.cookies.get(VIEW_AS_COOKIE)?.value);
  const fromPortal = request.nextUrl.searchParams.get("as") === "candidate";
  const allowed = fromPortal ? portal === file.candidateId : STAFF.has(role) || portal === file.candidateId;
  if (!allowed) return new Response("Forbidden", { status: 403 });

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${file.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
