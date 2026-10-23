/**
 * Candidate portal entry (§28 "do not require a complex password before
 * urgent onboarding tasks"). The onboarding link carries the candidate id and
 * opens a portal session; real one-time-password auth replaces this later.
 */

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { PORTAL_COOKIE } from "@/lib/onboarding/session";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("c");
  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = "/portal";
  const res = NextResponse.redirect(url);

  if (!id) {
    res.cookies.delete(PORTAL_COOKIE); // ?c= empty → back to the demo portal
    return res;
  }
  const exists = await db.candidate.findUnique({ where: { id }, select: { id: true } });
  if (exists) res.cookies.set(PORTAL_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
