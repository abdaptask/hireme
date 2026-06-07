"use client";

import { useRouter } from "next/navigation";
import {
  Command as CommandIcon,
  Monitor,
  Moon,
  Rows2,
  Rows3,
  Rows4,
  Sun,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_SECTIONS, PERSONAS } from "@/lib/nav";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import type { Density, ThemeChoice } from "@/lib/preferences";

const DENSITY_OPTIONS: { value: Density; label: string; icon: typeof Rows2 }[] =
  [
    { value: "comfortable", label: "Comfortable", icon: Rows2 },
    { value: "compact", label: "Compact", icon: Rows3 },
    { value: "ultra-compact", label: "Ultra-Compact", icon: Rows4 },
  ];

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] =
  [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme, setDensity } = usePreferences();
  const { isVisible } = useEntitlements();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isVisible(item.id)),
  })).filter((section) => section.items.length > 0);

  function run(action: () => void) {
    onOpenChange(false);
    // Defer so the dialog close animation doesn't fight navigation.
    requestAnimationFrame(action);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search records, navigate, and run actions."
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Switch workspace">
          {PERSONAS.map((p) => (
            <CommandItem
              key={p.id}
              value={`workspace ${p.label} ${p.workspace}`}
              onSelect={() => run(() => router.push(p.home))}
            >
              <p.icon />
              <span>{p.label}</span>
              <span className="text-muted-foreground ml-1 text-xs">
                {p.workspace}
              </span>
              {p.status === "planned" && (
                <span className="text-muted-foreground ml-auto text-[10px]">
                  {p.roadmap}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {sections.map((section) => (
          <CommandGroup key={section.id} heading={section.label}>
            {section.items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${section.label} ${item.label}`}
                onSelect={() => run(() => router.push(item.href))}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.status === "planned" && (
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    {item.roadmap}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Theme">
          {THEME_OPTIONS.map((t) => (
            <CommandItem
              key={t.value}
              value={`theme ${t.label}`}
              onSelect={() => run(() => setTheme(t.value))}
            >
              <t.icon />
              <span>Switch to {t.label} theme</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Density">
          {DENSITY_OPTIONS.map((d) => (
            <CommandItem
              key={d.value}
              value={`density ${d.label}`}
              onSelect={() => run(() => setDensity(d.value))}
            >
              <d.icon />
              <span>{d.label} density</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="text-muted-foreground flex items-center gap-1.5 border-t px-3 py-2 text-[11px]">
        <CommandIcon className="size-3" />
        <span>Tip: press</span>
        <kbd className="bg-muted rounded px-1 font-mono">⌘K</kbd>
        <span>/</span>
        <kbd className="bg-muted rounded px-1 font-mono">Ctrl K</kbd>
        <span>anywhere to open this palette.</span>
      </div>
    </CommandDialog>
  );
}
