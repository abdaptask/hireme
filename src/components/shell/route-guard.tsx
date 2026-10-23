"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { ALL_NAV_ITEMS, getPersona } from "@/lib/nav";
import { ADMIN_ROLE, getRole } from "@/lib/roles";

/** Most specific nav item owning a path (longest href prefix), ignoring "home". */
function owningItem(pathname: string) {
  let best: (typeof ALL_NAV_ITEMS)[number] | undefined;
  for (const item of ALL_NAV_ITEMS) {
    if (item.id === "home") continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}

/**
 * Route-level entitlement check (§42, §121.7). A module hidden from a role's
 * navigation can't be reached by typing its URL either. Uses the same
 * visibility map as the sidebar, including admin overrides.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { viewAs, isVisible } = useEntitlements();

  // The Super Admin Command Center is the admin's workspace only.
  const adminOnly = pathname === "/command-center" && viewAs !== ADMIN_ROLE;
  const item = owningItem(pathname);
  const blocked = adminOnly || (item && !isVisible(item.id));
  if (!blocked) return <>{children}</>;

  const persona = getPersona(viewAs);
  const area = adminOnly ? "the Super Admin Command Center" : item?.label;
  return (
    <div className="mx-auto mt-12 max-w-lg rounded-2xl border p-8 text-center shadow-xs sm:p-10">
      <span className="bg-warning-muted text-warning-muted-foreground mx-auto flex size-12 items-center justify-center rounded-xl">
        <Lock className="size-6" />
      </span>
      <h1 className="text-section-heading mt-4">Not available for your role</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        <strong className="text-foreground">{getRole(viewAs).label}</strong> doesn&apos;t have access to{" "}
        <strong className="text-foreground">{area}</strong>. An administrator can change this under Administration →
        Navigation visibility.
      </p>
      <Button className="mt-6" variant="outline" nativeButton={false} render={<Link href={persona.home} />}>
        <ArrowLeft className="size-4" /> Go to {persona.workspace}
      </Button>
    </div>
  );
}
