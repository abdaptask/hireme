"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { PERSONAS, type Persona } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher({ current }: { current: Persona }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto gap-2 px-2 py-1.5"
            aria-label="Switch workspace"
          />
        }
      >
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
          <current.icon className="size-4" />
        </span>
        <span className="hidden text-left leading-tight sm:flex sm:flex-col">
          <span className="text-[13px] font-semibold">{current.label}</span>
          <span className="text-muted-foreground text-[11px]">
            {current.workspace}
          </span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {PERSONAS.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => router.push(p.home)}
            className="gap-2.5 py-2"
          >
            <span className="bg-muted text-foreground flex size-8 items-center justify-center rounded-md">
              <p.icon className="size-4" />
            </span>
            <span className="flex flex-1 flex-col leading-tight">
              <span className="flex items-center gap-1.5 text-[13px] font-medium">
                {p.label}
                {p.status === "planned" && (
                  <Badge
                    variant="secondary"
                    className="px-1 py-0 text-[10px] font-normal"
                  >
                    {p.roadmap}
                  </Badge>
                )}
              </span>
              <span className="text-muted-foreground text-[11px]">
                {p.workspace}
              </span>
            </span>
            <Check
              className={cn(
                "size-4",
                p.id === current.id ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
