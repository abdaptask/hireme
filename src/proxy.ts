/**
 * Proxy (Next 16's middleware) — optimistic report access check (§42).
 *
 * The legacy hand-built report pages under /reports/* are client pages with
 * their own routes, so they're gated here by the viewer's "view as" role
 * cookie. Engine reports (/reports/[slug]) also enforce access server-side.
 */

import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_REPORT_ACCESS, VIEW_AS_COOKIE, canViewLegacy, parseRole } from "@/lib/report-engine/access";

export function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.split("/")[2];
  if (!segment || !(segment in LEGACY_REPORT_ACCESS)) return NextResponse.next();

  const role = parseRole(request.cookies.get(VIEW_AS_COOKIE)?.value);
  if (canViewLegacy(role, segment)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/reports";
  url.search = `?denied=${encodeURIComponent(segment)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/reports/:path+",
};
