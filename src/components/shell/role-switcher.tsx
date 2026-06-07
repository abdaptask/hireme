"use client";

import { useRouter } from "next/navigation";
import { Check, Eye, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { ADMIN_ROLE, getRole, ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";

/**
 * Dev role switcher + Role Preview (§121.7). Lets the admin render the app as
 * any role to see exactly what that role is entitled to. Becomes the real
 * session-role indicator once auth is wired.
 */
export function RoleSwitcher() {
  const router = useRouter();
  const { viewAs, setViewAs, isPreviewing } = useEntitlements();
  const current = getRole(viewAs);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="View as role"
            className={cn(
              "hover:bg-sidebar-accent/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            )}
          />
        }
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            isPreviewing
              ? "bg-warning-muted text-warning-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          {isPreviewing ? (
            <Eye className="size-3.5" />
          ) : (
            <ShieldCheck className="size-3.5" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-sidebar-foreground/55 text-[10px] tracking-wide uppercase">
            {isPreviewing ? "Previewing as" : "Signed in as"}
          </span>
          <span className="truncate font-medium">{current.label}</span>
        </span>
        <SlidersHorizontal className="text-sidebar-foreground/50 size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel>View the app as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((r) => (
          <DropdownMenuItem key={r.id} onClick={() => setViewAs(r.id)}>
            {r.isAdmin ? (
              <ShieldCheck className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            <span>{r.label}</span>
            <Check
              className={cn(
                "ml-auto size-4",
                r.id === viewAs ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/administration")}>
          <SlidersHorizontal className="size-4" /> Manage navigation visibility
        </DropdownMenuItem>
        {isPreviewing && (
          <DropdownMenuItem onClick={() => setViewAs(ADMIN_ROLE)}>
            Exit preview
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Banner shown while the admin is previewing as another role. */
export function PreviewBanner() {
  const { viewAs, isPreviewing, setViewAs } = useEntitlements();
  if (!isPreviewing) return null;
  const role = getRole(viewAs);
  return (
    <div className="bg-warning-muted text-warning-muted-foreground flex items-center gap-2 px-4 py-1.5 text-xs sm:px-6">
      <Eye className="size-3.5" />
      <span>
        Previewing the platform as <strong>{role.label}</strong>. Navigation and
        access reflect this role&apos;s entitlements.
      </span>
      <button
        type="button"
        onClick={() => setViewAs(ADMIN_ROLE)}
        className="hover:bg-warning/20 ml-auto rounded px-2 py-0.5 font-medium underline-offset-2 hover:underline"
      >
        Exit preview
      </button>
    </div>
  );
}
