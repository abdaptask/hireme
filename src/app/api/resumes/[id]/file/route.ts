/**
 * Resume file access (§42 download controls). Internal staff only — resumes
 * are never served to the candidate portal or external users.
 */

import { type NextRequest } from "next/server";
import { readResumeFile } from "@/lib/talent/service";
import { VIEW_AS_COOKIE, parseRole } from "@/lib/report-engine/access";

const STAFF = new Set(["super-admin", "onboarder", "recruiter", "recruiting-manager", "team-lead", "account-manager"]);

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!STAFF.has(parseRole(request.cookies.get(VIEW_AS_COOKIE)?.value))) return new Response("Forbidden", { status: 403 });
  const { id } = await ctx.params;
  const file = await readResumeFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  const download = request.nextUrl.searchParams.get("download") === "1";
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${file.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
