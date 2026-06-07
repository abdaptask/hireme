"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAV_SECTIONS, type NavItem } from "@/lib/nav";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/command-center") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ItemInfo({ item }: { item: NavItem }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="button"
            tabIndex={0}
            aria-label={`About ${item.label}`}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground focus-visible:text-sidebar-foreground rounded-sm focus-visible:outline-none"
          />
        }
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-60">
        <p className="font-medium">{item.label}</p>
        <p className="text-popover-foreground/80 mt-0.5">{item.description}</p>
        <p className="text-popover-foreground/60 mt-1 text-[10px]">
          Spec {item.spec}
          {item.status === "planned" && item.roadmap
            ? ` · planned ${item.roadmap}`
            : ""}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { isVisible } = useEntitlements();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isVisible(item.id)),
  })).filter((section) => section.items.length > 0);

  if (sections.length === 0) {
    return (
      <div className="text-sidebar-foreground/60 px-4 py-6 text-center text-xs">
        {collapsed ? "—" : "No navigation is available for this role."}
      </div>
    );
  }

  return (
    <nav aria-label="Primary" className="flex flex-col gap-4 px-2.5 py-3">
      {sections.map((section) => (
        <div key={section.id} className="flex flex-col gap-0.5">
          {!collapsed && (
            <p className="text-sidebar-foreground/55 px-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            const planned = item.status === "planned";
            return (
              <div
                key={item.id}
                className={cn(
                  "group/navitem relative flex items-center rounded-md",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                {active && (
                  <span className="bg-sidebar-primary absolute inset-y-1 left-0 w-0.5 rounded-full" />
                )}
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium",
                    "focus-visible:ring-sidebar-ring focus-visible:ring-2 focus-visible:outline-none",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className="size-4.5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>

                {!collapsed && (
                  <div className="flex items-center gap-1 pr-2">
                    {planned && (
                      <span className="border-sidebar-border text-sidebar-foreground/50 rounded border px-1 py-px text-[9px] font-medium tracking-wide">
                        {item.roadmap?.replace(".0", "")}
                      </span>
                    )}
                    <span className="opacity-0 transition-opacity group-hover/navitem:opacity-100 focus-within:opacity-100">
                      <ItemInfo item={item} />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
