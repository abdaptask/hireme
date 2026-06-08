"use client";

/**
 * Quick Actions launchpad slide-out.
 *
 * Hosts the persona-specific `LaunchpadGrid` inside a right-side sheet, opened
 * via the header "Quick Actions" button or the `Cmd/Ctrl+J` shortcut. The
 * visible content follows the current viewer's role (via `useEntitlements`),
 * so role-switching automatically re-skins the launchpad.
 *
 * External roles (candidate / vendor / client) intentionally render an empty
 * state — the operational launchpad is an internal power-user surface
 * (CLAUDE.md §2.6, §5.2 — candidate UX is mobile-first concierge).
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LaunchpadGrid } from "@/components/launchpad/launchpad-grid";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { getLaunchpad } from "@/lib/launchpad";
import { getRole } from "@/lib/roles";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Roles that don't get an operational launchpad. */
const NO_LAUNCHPAD_ROLES = new Set(["candidate", "vendor", "client"]);

export function LaunchpadSheet({ open, onOpenChange }: Props) {
  const { viewAs } = useEntitlements();
  const role = getRole(viewAs);
  const config = NO_LAUNCHPAD_ROLES.has(viewAs) ? undefined : getLaunchpad(viewAs);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Quick actions</SheetTitle>
          <SheetDescription>
            {config ? (
              <>
                {role.label} workspace · Press{" "}
                <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">
                  ⌘J
                </kbd>{" "}
                anytime to open this.
              </>
            ) : (
              <>Press{" "}
                <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">
                  ⌘J
                </kbd>{" "}
                anytime to open this.
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {config ? (
              <LaunchpadGrid config={config} />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
                <p className="text-sm font-medium">
                  Quick actions aren&apos;t available for this role
                </p>
                <p className="text-muted-foreground max-w-xs text-xs">
                  The {role.label} role uses a dedicated portal. Switch to an
                  internal role to access the launchpad.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">
            Don&apos;t see what you need? Press{" "}
            <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">
              ⌘K
            </kbd>{" "}
            to search the command palette.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
