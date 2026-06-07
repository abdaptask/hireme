"use client";

import { useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterDef = { id: string; label: string; options: string[] };

const FILTERS: FilterDef[] = [
  { id: "range", label: "Date range", options: ["Today", "This week", "This month", "This quarter", "Custom…"] },
  { id: "client", label: "Client", options: ["All clients", "Meridian Health", "Vertex Financial", "Northwind Logistics", "Atlas Manufacturing", "Cobalt Systems"] },
  { id: "program", label: "Program", options: ["All programs", "Contingent", "SOW", "Direct"] },
  { id: "employment", label: "Employment type", options: ["All types", "W-2", "1099", "C2C"] },
  { id: "location", label: "Location", options: ["All locations", "Remote", "Hybrid", "Onsite"] },
  { id: "risk", label: "Risk", options: ["All risk", "On Track", "Needs Attention", "At Risk", "Start Unlikely"] },
];

function FilterSelect({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const isDefault = value === def.options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 font-normal",
              !isDefault && "border-primary/50 text-foreground",
            )}
          />
        }
      >
        <span className="text-muted-foreground text-[11px]">{def.label}:</span>
        <span className="font-medium">{value}</span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {def.options.map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => onChange(opt)}>
            <Check
              className={cn(
                "size-4",
                opt === value ? "opacity-100" : "opacity-0",
              )}
            />
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FILTERS.map((f) => [f.id, f.options[0]])),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <FilterSelect
            key={f.id}
            def={f}
            value={values[f.id]}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
          />
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 font-normal">
            <Bookmark className="size-3.5" /> Saved views
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 gap-1.5 font-normal"
            aria-label="Refresh"
          >
            <RefreshCw className="size-3.5" /> Updated 1m ago
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 font-normal">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* AI query bar (§7 top header, §71) */}
      <div className="bg-ai-muted/40 border-ai/20 flex items-center gap-2 rounded-lg border px-3 py-2">
        <Sparkles className="text-ai size-4 shrink-0" />
        <input
          disabled
          placeholder="Ask about your operations — e.g. “Show all background checks delayed by more than five days” (v0.9)"
          className="text-foreground placeholder:text-muted-foreground/70 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}
