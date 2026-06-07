"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pin, PinOff, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShellContext } from "@/components/shell/shell-context";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { AppHeader } from "@/components/shell/app-header";
import { CommandPalette } from "@/components/shell/command-palette";
import { RoleSwitcher, PreviewBanner } from "@/components/shell/role-switcher";
import { DEFAULT_PERSONA } from "@/lib/nav";
import { useLocalStorage } from "@/lib/use-stored";
import { cn } from "@/lib/utils";

const PINNED_STORAGE_KEY = "hireme.sidebar.pinned";

function Brand({
  collapsed = false,
  pinControl,
}: {
  collapsed?: boolean;
  pinControl?: React.ReactNode;
}) {
  return (
    <div className="flex h-14 items-center gap-2 border-b px-3.5">
      <Link
        href="/command-center"
        className="flex min-w-0 items-center gap-2 focus-visible:outline-none"
        aria-label="HireMe home"
      >
        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
          <Sparkles className="size-4.5" />
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight">
              HireMe
            </span>
            <span className="text-muted-foreground truncate text-[10px] tracking-wide">
              Workforce Lifecycle
            </span>
          </span>
        )}
      </Link>
      {!collapsed && pinControl && <div className="ml-auto">{pinControl}</div>}
    </div>
  );
}

function SidebarBody({
  collapsed,
  pinControl,
  onNavigate,
}: {
  collapsed: boolean;
  pinControl?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Brand collapsed={collapsed} pinControl={pinControl} />
      <ScrollArea className="flex-1">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </ScrollArea>
      {!collapsed && (
        <div className="border-t p-2">
          <RoleSwitcher />
        </div>
      )}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [pinnedRaw, setPinnedRaw] = useLocalStorage(PINNED_STORAGE_KEY, "1");
  const pinned = pinnedRaw === "1";
  const [hovered, setHovered] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const expanded = pinned || hovered;

  const togglePinned = useCallback(() => {
    setPinnedRaw(pinned ? "0" : "1");
    setHovered(false);
  }, [pinned, setPinnedRaw]);

  // Global command palette shortcut (§110).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pinControl = (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={togglePinned}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            aria-pressed={pinned}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      </TooltipTrigger>
      <TooltipContent side="right">
        {pinned ? "Unpin (collapse to icons)" : "Pin sidebar open"}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <ShellContext.Provider
      value={{
        pinned,
        togglePinned,
        mobileNavOpen,
        setMobileNavOpen,
        paletteOpen,
        setPaletteOpen,
      }}
    >
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop sidebar — pinned: in-flow; unpinned: icon rail with
            hover-expand overlay (content does not reflow). */}
        <div
          className={cn(
            "relative hidden shrink-0 lg:block",
            pinned ? "w-64" : "w-16",
          )}
        >
          <aside
            onMouseEnter={() => !pinned && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
              "bg-sidebar text-sidebar-foreground absolute inset-y-0 left-0 z-40 flex flex-col border-r transition-[width] duration-200",
              expanded ? "w-64" : "w-16",
              !pinned && hovered && "shadow-xl",
            )}
          >
            <SidebarBody collapsed={!expanded} pinControl={pinControl} />
          </aside>
        </div>

        {/* Mobile sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col">
              <SidebarBody
                collapsed={false}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader persona={DEFAULT_PERSONA} />
          <PreviewBanner />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </ShellContext.Provider>
  );
}
