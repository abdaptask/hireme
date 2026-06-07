"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/command-center") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex flex-col gap-4 px-2.5 py-3"
    >
      {NAV_SECTIONS.map((section) => (
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
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/navitem relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                  "focus-visible:ring-sidebar-ring focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <span className="bg-sidebar-primary absolute inset-y-1 left-0 w-0.5 rounded-full" />
                )}
                <item.icon className="size-4.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {planned && (
                      <span className="border-sidebar-border text-sidebar-foreground/50 ml-auto rounded border px-1 py-px text-[9px] font-medium tracking-wide">
                        {item.roadmap?.replace(".0", "")}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
