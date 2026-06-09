"use client";

/**
 * MasterDataClient — the two-pane editor for the master-data registry
 * (CLAUDE.md §2.4 configurable, §30 MDM, §99 advanced data grid, §111 system
 * states, §120 design system). Left pane: searchable, grouped category list.
 * Right pane: dense value table with inline editing, soft-delete toggle, and
 * preset-aware row actions.
 *
 * Subscribes to per-category storage events via useSyncExternalStore so the
 * table stays in sync across tabs and after writes — mirrors the pattern
 * used by saved-views-menu.tsx.
 */

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MASTER_CATEGORIES,
  MASTER_GROUPS,
  type MasterCategory,
  type MasterValue,
  deleteMasterValue,
  getMasterValues,
  newMasterValueId,
  resetMasterCategory,
  saveMasterValue,
} from "@/lib/master-data";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Stable references for useSyncExternalStore serverSnapshot
   --------------------------------------------------------------------------- */

const EMPTY_VALUES: MasterValue[] = [];
const getEmptyValues = (): MasterValue[] => EMPTY_VALUES;

/* ---------------------------------------------------------------------------
   Hook — subscribe to a single category's storage events
   --------------------------------------------------------------------------- */

function useCategoryValues(categoryId: string): MasterValue[] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const storageKey = `hireme.master-data.${categoryId}`;
      const evt = `ls:${storageKey}`;
      const onStorage = (e: StorageEvent) => {
        if (e.key === null || e.key === storageKey) onChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(evt, onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(evt, onChange);
      };
    },
    [categoryId],
  );

  return useSyncExternalStore(
    subscribe,
    useCallback(() => getMasterValues(categoryId), [categoryId]),
    getEmptyValues,
  );
}

/* ---------------------------------------------------------------------------
   Component
   --------------------------------------------------------------------------- */

export function MasterDataClient() {
  const [selectedId, setSelectedId] = useState<string>(
    MASTER_CATEGORIES[0]?.id ?? "",
  );
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MASTER_CATEGORIES;
    return MASTER_CATEGORIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.usedIn.some((u) => u.toLowerCase().includes(q)),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MasterCategory[]>();
    for (const cat of filteredCategories) {
      const list = map.get(cat.groupId) ?? [];
      list.push(cat);
      map.set(cat.groupId, list);
    }
    return MASTER_GROUPS.map((g) => ({
      group: g,
      categories: map.get(g.id) ?? [],
    })).filter((g) => g.categories.length > 0);
  }, [filteredCategories]);

  const selectedCategory =
    MASTER_CATEGORIES.find((c) => c.id === selectedId) ??
    MASTER_CATEGORIES[0];

  const toggleGroup = (groupId: string) =>
    setCollapsedGroups((s) => ({ ...s, [groupId]: !s[groupId] }));

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[600px] flex-col gap-4 md:flex-row">
      {/* Mobile category picker */}
      <div className="md:hidden">
        <label className="text-data-label">Category</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-background border-input focus-visible:ring-ring mt-1.5 h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
        >
          {MASTER_GROUPS.map((g) => (
            <optgroup key={g.id} label={g.label}>
              {MASTER_CATEGORIES.filter((c) => c.groupId === g.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Left pane — category list */}
      <aside className="bg-card hidden w-72 shrink-0 flex-col overflow-hidden rounded-xl border md:flex">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="h-8 pl-8 pr-7 text-sm"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="text-muted-foreground px-4 py-8 text-center text-xs">
              No categories match &ldquo;{search}&rdquo;.
            </div>
          ) : (
            grouped.map(({ group, categories }) => {
              const collapsed = collapsedGroups[group.id];
              return (
                <div key={group.id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="hover:bg-muted/40 flex w-full items-center gap-1.5 px-3 py-2 text-left"
                  >
                    {collapsed ? (
                      <ChevronRight className="size-3.5 opacity-60" />
                    ) : (
                      <ChevronDown className="size-3.5 opacity-60" />
                    )}
                    <span className="text-data-label flex-1 truncate">
                      {group.label}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {categories.length}
                    </span>
                  </button>
                  {!collapsed && (
                    <ul className="pb-1">
                      {categories.map((cat) => {
                        const active = cat.id === selectedId;
                        return (
                          <li key={cat.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(cat.id)}
                              className={cn(
                                "flex w-full items-center gap-1 border-l-2 border-transparent py-1.5 pl-7 pr-3 text-left text-sm transition-colors",
                                active
                                  ? "bg-primary/10 text-primary border-primary font-medium"
                                  : "hover:bg-muted/40 text-foreground/80",
                              )}
                            >
                              <span className="truncate">{cat.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right pane — value editor */}
      {selectedCategory && (
        <CategoryEditor
          key={selectedCategory.id}
          category={selectedCategory}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Right pane — single category editor
   --------------------------------------------------------------------------- */

type DraftRow = {
  id: string; // stable client id (may match a MasterValue.id while editing)
  source: "new" | MasterValue;
  label: string;
  code: string;
  order: string;
};

function CategoryEditor({ category }: { category: MasterCategory }) {
  const values = useCategoryValues(category.id);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);

  // Local editing state resets implicitly via the `key={category.id}` prop
  // on the parent — switching categories remounts this component.

  const visibleValues = useMemo(
    () => (showInactive ? values : values.filter((v) => v.active)),
    [values, showInactive],
  );

  const handleStartAdd = () => {
    const newId = newMasterValueId(category.id);
    setDraft({
      id: newId,
      source: "new",
      label: "",
      code: "",
      order: String(values.length),
    });
    setEditingId(newId);
    // Focus next tick
    setTimeout(() => addInputRef.current?.focus(), 30);
  };

  const handleStartEdit = (value: MasterValue) => {
    setDraft({
      id: value.id,
      source: value,
      label: value.label,
      code: value.code ?? "",
      order: String(value.order),
    });
    setEditingId(value.id);
  };

  const handleCancel = () => {
    setDraft(null);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!draft) return;
    const label = draft.label.trim();
    if (!label) return;
    const orderNum = Number.parseInt(draft.order, 10);
    const order = Number.isFinite(orderNum) ? orderNum : 0;
    const codeTrim = draft.code.trim();

    if (draft.source === "new") {
      saveMasterValue(category.id, {
        id: draft.id,
        label,
        code: codeTrim ? codeTrim : undefined,
        active: true,
        order,
        isPreset: false,
        createdAt: 0,
        updatedAt: 0,
      });
    } else {
      saveMasterValue(category.id, {
        ...draft.source,
        label,
        code: codeTrim ? codeTrim : undefined,
        order,
      });
    }
    setDraft(null);
    setEditingId(null);
  };

  const handleToggleActive = (value: MasterValue) => {
    saveMasterValue(category.id, { ...value, active: !value.active });
  };

  const handleDelete = (value: MasterValue) => {
    if (value.isPreset) {
      // Preset rows cannot be hard-deleted (soft only)
      deleteMasterValue(category.id, value.id, false);
    } else {
      if (
        typeof window !== "undefined" &&
        !window.confirm(`Delete "${value.label}"? This cannot be undone.`)
      ) {
        return;
      }
      deleteMasterValue(category.id, value.id, true);
    }
  };

  const handleResetCategory = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Reset "${category.label}" to seed defaults? All overrides and user-added values will be removed.`,
      )
    ) {
      return;
    }
    resetMasterCategory(category.id);
    setDraft(null);
    setEditingId(null);
  };

  const formatTimestamp = (ts: number): string => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <section className="bg-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border">
      {/* Header */}
      <header className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Database className="text-muted-foreground size-4" />
            <h2 className="text-section-heading truncate">{category.label}</h2>
            <Badge variant="secondary" className="shrink-0">
              {values.filter((v) => v.active).length} active
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {category.description}
          </p>
          {category.usedIn.length > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              Used in: {category.usedIn.join(" · ")}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetCategory}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <RotateCcw className="size-3.5" /> Reset to defaults
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <Button size="sm" onClick={handleStartAdd} disabled={editingId !== null}>
          <Plus className="size-3.5" /> Add value
        </Button>
        <label className="text-foreground/80 inline-flex cursor-pointer items-center gap-1.5 text-xs select-none">
          <input
            type="checkbox"
            className="accent-primary size-3.5 align-middle"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/30 sticky top-0 z-10">
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium">Value</th>
              <th className="w-32 px-3 py-2 text-left font-medium">Code</th>
              <th className="w-16 px-3 py-2 text-left font-medium">Order</th>
              <th className="w-24 px-3 py-2 text-left font-medium">Status</th>
              <th className="w-32 px-3 py-2 text-left font-medium">
                Last modified
              </th>
              <th className="w-36 px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Inline "add new" row */}
            {draft && draft.source === "new" && (
              <tr className="bg-primary/5 border-b">
                <td className="px-3 py-2">
                  <Input
                    ref={addInputRef}
                    value={draft.label}
                    onChange={(e) =>
                      setDraft({ ...draft, label: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    placeholder="New value label"
                    className="h-7"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={draft.code}
                    onChange={(e) =>
                      setDraft({ ...draft, code: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    placeholder="Optional"
                    className="h-7"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={draft.order}
                    onChange={(e) =>
                      setDraft({ ...draft, order: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    className="h-7"
                  />
                </td>
                <td className="text-muted-foreground px-3 py-2 text-xs">
                  New
                </td>
                <td className="text-muted-foreground px-3 py-2 text-xs">
                  —
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="xs"
                      onClick={handleSave}
                      disabled={!draft.label.trim()}
                    >
                      <Check className="size-3" /> Save
                    </Button>
                    <Button size="xs" variant="ghost" onClick={handleCancel}>
                      <X className="size-3" /> Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {visibleValues.length === 0 && !draft && (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground px-4 py-10 text-center text-sm"
                >
                  No values yet. Click <strong>Add value</strong> to create the
                  first one.
                </td>
              </tr>
            )}

            {visibleValues.map((value) => {
              const isEditing =
                editingId === value.id && draft && draft.source !== "new";
              return (
                <tr
                  key={value.id}
                  className={cn(
                    "hover:bg-muted/30 border-b transition-colors",
                    !value.active && "bg-muted/20 text-muted-foreground",
                    isEditing && "bg-primary/5",
                  )}
                >
                  {isEditing && draft ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          autoFocus
                          value={draft.label}
                          onChange={(e) =>
                            setDraft({ ...draft, label: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                          }}
                          className="h-7"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={draft.code}
                          onChange={(e) =>
                            setDraft({ ...draft, code: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                          }}
                          placeholder="Optional"
                          className="h-7"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={draft.order}
                          onChange={(e) =>
                            setDraft({ ...draft, order: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                          }}
                          className="h-7"
                        />
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-xs">
                        {value.active ? "Active" : "Inactive"}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-xs">
                        {formatTimestamp(value.updatedAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="xs"
                            onClick={handleSave}
                            disabled={!draft.label.trim()}
                          >
                            <Check className="size-3" /> Save
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={handleCancel}
                          >
                            <X className="size-3" /> Cancel
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {value.label}
                          {value.isPreset && (
                            <span className="text-muted-foreground text-[9px] uppercase tracking-wide">
                              preset
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                        {value.code ?? "—"}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-xs">
                        {value.order}
                      </td>
                      <td className="px-3 py-2">
                        {value.active ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="opacity-70">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-xs">
                        {formatTimestamp(value.updatedAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            aria-label="Edit"
                            onClick={() => handleStartEdit(value)}
                            disabled={editingId !== null}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleToggleActive(value)}
                            className="text-xs"
                            disabled={editingId !== null}
                          >
                            {value.active ? "Disable" : "Enable"}
                          </Button>
                          {!value.isPreset && (
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Delete"
                              onClick={() => handleDelete(value)}
                              disabled={editingId !== null}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
