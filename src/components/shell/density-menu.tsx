"use client";

import { Rows2, Rows3, Rows4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences } from "@/components/providers/preferences-provider";
import { DENSITY_LABELS, type Density } from "@/lib/preferences";

const DENSITY_ICON: Record<Density, typeof Rows2> = {
  comfortable: Rows2,
  compact: Rows3,
  "ultra-compact": Rows4,
};

export function DensityMenu() {
  const { density, setDensity } = usePreferences();
  const Icon = DENSITY_ICON[density];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Display density" />
        }
      >
        <Icon className="size-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Display density</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={density}
          onValueChange={(v) => setDensity(v as Density)}
        >
          {(Object.keys(DENSITY_LABELS) as Density[]).map((d) => {
            const ItemIcon = DENSITY_ICON[d];
            return (
              <DropdownMenuRadioItem key={d} value={d}>
                <ItemIcon className="size-4" /> {DENSITY_LABELS[d]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
