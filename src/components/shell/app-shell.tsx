"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShellContext } from "@/components/shell/shell-context";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { AppHeader } from "@/components/shell/app-header";
import { CommandPalette } from "@/components/shell/command-palette";
import { DEFAULT_PERSONA } from "@/lib/nav";
import { useLocalStorage } from "@/lib/use-stored";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "hireme.sidebar.collapsed";

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/command-center"
      className="flex h-14 items-center gap-2 border-b px-3.5 focus-visible:outline-none"
      aria-label="HireMe home"
    >
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <Sparkles className="size-4.5" />
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">
            HireMe
          </span>
          <span className="text-muted-foreground text-[10px] tracking-wide">
            Workforce Lifecycle
          </span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsedRaw, setCollapsedRaw] = useLocalStorage(
    SIDEBAR_STORAGE_KEY,
    "0",
  );
  const collapsed = collapsedRaw === "1";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsedRaw(collapsed ? "0" : "1");
  }, [collapsed, setCollapsedRaw]);

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

  return (
    <ShellContext.Provider
      value={{
        collapsed,
        toggleCollapsed,
        mobileNavOpen,
        setMobileNavOpen,
        paletteOpen,
        setPaletteOpen,
      }}
    >
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "bg-sidebar text-sidebar-foreground hidden shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
            collapsed ? "w-16" : "w-64",
          )}
        >
          <Brand collapsed={collapsed} />
          <ScrollArea className="flex-1">
            <SidebarNav collapsed={collapsed} />
          </ScrollArea>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Brand />
            <ScrollArea className="h-[calc(100dvh-3.5rem)]">
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader persona={DEFAULT_PERSONA} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </ShellContext.Provider>
  );
}
