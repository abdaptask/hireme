"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CircleHelp,
  PanelLeft,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { DensityMenu } from "@/components/shell/density-menu";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { NotificationCenter } from "@/components/shell/notification-center";
import { useShell } from "@/components/shell/shell-context";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { useAiCopilot } from "@/components/ai/ai-provider";
import { getNavItem, type Persona } from "@/lib/nav";

const QUICK_CREATE = [
  { label: "Candidate", navId: "candidates", href: "/planned/candidates" },
  { label: "Consultant", navId: "consultants", href: "/planned/consultants" },
  { label: "Client", navId: "clients", href: "/planned/clients" },
  { label: "Task", navId: "my-work", href: "/planned/my-work" },
  { label: "Package", navId: "packages", href: "/planned/packages" },
  { label: "Exception", navId: "exceptions", href: "/planned/exceptions" },
];

/** Unread count shown on the bell badge — kept in sync with NotificationCenter mock data */
const UNREAD_NOTIFICATION_COUNT = 6;

function NotificationCenterButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Notifications, ${UNREAD_NOTIFICATION_COUNT} unread`}
        onClick={() => setOpen(true)}
      >
        <Bell className="size-4.5" />
        <span className="bg-danger absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white">
          {UNREAD_NOTIFICATION_COUNT}
        </span>
      </Button>
      <NotificationCenter open={open} onOpenChange={setOpen} />
    </>
  );
}

function useBreadcrumb(persona: Persona) {
  const pathname = usePathname();
  if (pathname === "/command-center") {
    return [{ label: persona.workspace }];
  }
  if (pathname.startsWith("/planned/")) {
    const id = pathname.split("/")[2];
    const item = getNavItem(id);
    return [
      { label: persona.workspace, href: persona.home },
      { label: item?.label ?? "Planned" },
    ];
  }
  return [{ label: persona.workspace }];
}

export function AppHeader({ persona }: { persona: Persona }) {
  const { pinned, togglePinned, setMobileNavOpen, setPaletteOpen } = useShell();
  const { isVisible } = useEntitlements();
  const { openCopilot } = useAiCopilot();
  const router = useRouter();
  const crumbs = useBreadcrumb(persona);
  const quickCreate = QUICK_CREATE.filter((q) => isVisible(q.navId));

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur">
      {/* Skip navigation link — visually hidden until focused (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-3 focus:py-1 focus:rounded focus:text-sm focus:font-medium focus:ring-2 ring-primary"
      >
        Skip to main content
      </a>
      {/* Left cluster */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileNavOpen(true)}
      >
        <PanelLeft className="size-4.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
        aria-pressed={pinned}
        onClick={togglePinned}
      >
        <PanelLeft className="size-4.5" />
      </Button>

      <WorkspaceSwitcher current={persona} />

      <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              {c.href ? (
                <Link
                  href={c.href}
                  className="text-muted-foreground hover:text-foreground truncate"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-medium">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Search — opens the command palette */}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="bg-muted/60 text-muted-foreground hover:bg-muted hidden h-9 w-56 items-center gap-2 rounded-lg border px-3 text-sm transition-colors md:flex xl:w-72"
          aria-label="Search (Command palette)"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="bg-background rounded border px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Search"
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="size-4.5" />
        </Button>

        {/* Quick create (§121.4) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Create new" />
            }
          >
            <Plus className="size-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Create</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {quickCreate.map((q) => (
              <DropdownMenuItem
                key={q.label}
                onClick={() => router.push(q.href)}
              >
                {q.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications (§106) */}
        <NotificationCenterButton />

        {/* AI Copilot (§105) */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="AI Copilot"
          onClick={() => openCopilot()}
        >
          <Sparkles className="text-ai size-4.5" />
        </Button>

        {/* Help (§118) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                aria-label="Help and support"
              />
            }
          >
            <CircleHelp className="size-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Help & support</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPaletteOpen(true)}>
              Command palette
              <span className="text-muted-foreground ml-auto font-mono text-xs">
                ⌘K
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/planned/reports")}>
              Knowledge base
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Keyboard shortcuts</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <DensityMenu />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="ml-0.5"
                aria-label="Account menu"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                AB
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">Abdulla</p>
              <p className="text-muted-foreground truncate text-xs">
                abdulla@aptask.com
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile & preferences</DropdownMenuItem>
            <DropdownMenuItem disabled>Notification settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}
