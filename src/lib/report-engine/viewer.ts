/**
 * Server-side viewer role for report access checks (§42).
 * Reads the "view as" role mirrored into a cookie by the role switcher.
 *
 * Server-only — never import in client components.
 */

import { cookies } from "next/headers";
import type { RoleId } from "@/lib/roles";
import { VIEW_AS_COOKIE, parseRole } from "./access";

export async function getViewerRole(): Promise<RoleId> {
  const store = await cookies();
  return parseRole(store.get(VIEW_AS_COOKIE)?.value);
}
