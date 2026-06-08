"use client";

/**
 * Saved-views menu (§32, §99) — a reusable dropdown that lets users persist
 * column selections and filter preferences against any table identified by a
 * `tableId`. Preset views (defined in `saved-views.ts`) appear at the top and
 * cannot be deleted; user-saved views can be made default or removed.
 *
 * The menu owns its own subscription to the saved-views storage event so it
 * stays in sync across tabs and after a save without prop drilling.
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  Bookmark,
  ChevronDown,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteView,
  getDefaultView,
  getViews,
  newViewId,
  saveView,
  setDefault,
  SAVED_VIEWS_STORAGE_KEY,
  type SavedView,
  type SavedViewFilters,
} from "@/lib/saved-views";
import { cn } from "@/lib/utils";

// Module-level stable references for useSyncExternalStore's serverSnapshot.
// Must be stable across calls or React fires "getSnapshot should be cached".
const EMPTY_VIEWS: SavedView[] = [];
const getEmptyViews = (): SavedView[] => EMPTY_VIEWS;
const getUndefinedView = (): SavedView | undefined => undefined;

type Props = {
  tableId: string;
  currentFilters: SavedViewFilters;
  currentColumns: string[];
  /** Optional default column set used by "Reset to default". */
  defaultColumns?: string[];
  onApply: (view: SavedView) => void;
};

export function SavedViewsMenu({
  tableId,
  currentFilters,
  currentColumns,
  defaultColumns,
  onApply,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingName, setSavingName] = useState<string | null>(null); // null = closed
  const [draftName, setDraftName] = useState("");

  // Subscribe to storage changes (same-tab via custom event, cross-tab via
  // the native storage event) — mirrors useLocalStorage's useSyncExternalStore
  // pattern so we never setState inside an effect.
  const subscribe = useCallback((onChange: () => void) => {
    const evt = `ls:${SAVED_VIEWS_STORAGE_KEY}`;
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === SAVED_VIEWS_STORAGE_KEY) onChange();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(evt, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(evt, onChange);
    };
  }, []);

  const views = useSyncExternalStore(
    subscribe,
    useCallback(() => getViews(tableId), [tableId]),
    getEmptyViews,
  );
  const defaultView = useSyncExternalStore(
    subscribe,
    useCallback(() => getDefaultView(tableId), [tableId]),
    getUndefinedView,
  );

  const handleApply = (view: SavedView) => {
    setActiveId(view.id);
    onApply(view);
  };

  const handleReset = () => {
    setActiveId(null);
    onApply({
      id: `__reset__:${tableId}`,
      name: "Default",
      tableId,
      filters: {},
      columns: defaultColumns ?? currentColumns,
      createdAt: 0,
    });
  };

  const handleSave = () => {
    const name = draftName.trim();
    if (!name) return;
    const view: SavedView = {
      id: newViewId(tableId),
      name,
      tableId,
      filters: currentFilters,
      columns: currentColumns,
      createdAt: Date.now(),
    };
    saveView(view);
    setActiveId(view.id);
    setDraftName("");
    setSavingName(null);
  };

  const handleDelete = (id: string) => {
    deleteView(id);
    if (activeId === id) setActiveId(null);
  };

  const handleSetDefault = (id: string) => {
    setDefault(id, tableId);
  };

  const triggerLabel = activeId
    ? (views.find((v) => v.id === activeId)?.name ?? "Views")
    : (defaultView?.name ?? "Views");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="size-3.5" />
            <span className="truncate max-w-[140px]">{triggerLabel}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Saved views</DropdownMenuLabel>

        {views.length === 0 && (
          <div className="text-muted-foreground px-2 py-2 text-xs">
            No saved views yet.
          </div>
        )}

        {views.map((v) => {
          const isPreset = v.id.startsWith("preset:");
          const isActive = v.id === activeId;
          const isDefault =
            v.isDefault || (defaultView && defaultView.id === v.id);
          return (
            <DropdownMenuItem
              key={v.id}
              onClick={() => handleApply(v)}
              className={cn(
                "group/view flex items-center gap-2",
                isActive && "bg-accent/60",
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                {isDefault && <Pin className="size-3 text-primary" />}
                <span className="truncate">{v.name}</span>
                {isPreset && (
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                    preset
                  </span>
                )}
              </span>

              <span className="flex items-center gap-0.5 opacity-0 group-hover/view:opacity-100">
                <button
                  type="button"
                  aria-label={
                    isDefault ? "Already default" : "Set as default"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(v.id);
                  }}
                  className="hover:text-primary text-muted-foreground p-0.5"
                >
                  {isDefault ? (
                    <PinOff className="size-3" />
                  ) : (
                    <Pin className="size-3" />
                  )}
                </button>
                {!isPreset && (
                  <button
                    type="button"
                    aria-label="Delete view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(v.id);
                    }}
                    className="hover:text-destructive text-muted-foreground p-0.5"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {savingName === null ? (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setSavingName("");
            }}
          >
            <Plus className="size-3.5" />
            Save current view as…
          </DropdownMenuItem>
        ) : (
          <div className="flex items-center gap-1.5 px-1.5 py-1">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setSavingName(null);
                  setDraftName("");
                }
              }}
              placeholder="View name"
              className="bg-muted/60 focus-within:ring-ring h-7 min-w-0 flex-1 rounded-md border px-2 text-xs outline-none focus-within:ring-2"
            />
            <Button size="xs" onClick={handleSave} disabled={!draftName.trim()}>
              Save
            </Button>
          </div>
        )}

        <DropdownMenuItem onClick={handleReset}>
          <RotateCcw className="size-3.5" />
          Reset to default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
