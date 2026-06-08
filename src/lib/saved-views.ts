/**
 * Saved views — column selection + filter persistence for high-density tables
 * (CLAUDE.md §32, §99, §121.1). Stored client-side under a single localStorage
 * key, namespaced by `tableId` so every grid in the platform can share the
 * same primitive. Preset views ship as seeds with `createdAt: 0` and an
 * `id` prefix of `preset:` — they cannot be deleted, only superseded by a
 * user view marked as default.
 */

export type SavedViewFilters = Record<
  string,
  string | string[] | boolean | undefined
>;

export type SavedView = {
  id: string;
  name: string;
  tableId: string; // "candidates" | "exceptions" | "consultants" | ...
  filters: SavedViewFilters;
  columns: string[]; // visible column ids
  sortBy?: { col: string; dir: "asc" | "desc" };
  isDefault?: boolean;
  /** Epoch ms. Presets use 0 so they always sort below user views. */
  createdAt: number;
};

export const SAVED_VIEWS_STORAGE_KEY = "hireme-saved-views";

/* ---------------------------------------------------------------------------
   Preset seed views (§121.1 favorites / §32 published views).
   Always available — never persisted — merged in on every read.
   --------------------------------------------------------------------------- */

const CANDIDATE_DEFAULT_COLUMNS = [
  "candidate",
  "client",
  "type",
  "stage",
  "status",
  "risk",
  "start",
  "progress",
  "owner",
];

const PRESET_VIEWS: SavedView[] = [
  {
    id: "preset:candidates:at-risk",
    name: "At Risk Only",
    tableId: "candidates",
    filters: { risk: "at-risk" },
    columns: CANDIDATE_DEFAULT_COLUMNS,
    createdAt: 0,
  },
  {
    id: "preset:candidates:starts-this-week",
    name: "Starting This Week",
    tableId: "candidates",
    filters: { startsThisWeek: true },
    columns: CANDIDATE_DEFAULT_COLUMNS,
    createdAt: 0,
  },
  {
    id: "preset:candidates:c2c-vendor",
    name: "C2C Vendor Pipeline",
    tableId: "candidates",
    filters: { employmentType: "C2C" },
    columns: CANDIDATE_DEFAULT_COLUMNS,
    createdAt: 0,
  },
];

/* ---------------------------------------------------------------------------
   Persistence — all reads/writes go through here so the storage shape and
   the cross-tab broadcast event stay in lockstep.
   --------------------------------------------------------------------------- */

function readAll(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
  } catch {
    return [];
  }
}

function writeAll(views: SavedView[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(views));
  } catch {
    /* storage unavailable — best effort */
  }
  // Same-tab + cross-tab notification (mirrors the pattern in use-stored.ts).
  window.dispatchEvent(new Event(`ls:${SAVED_VIEWS_STORAGE_KEY}`));
}

/** All views for a table — presets first, then user views, newest first. */
export function getViews(tableId: string): SavedView[] {
  const user = readAll().filter((v) => v.tableId === tableId);
  const presets = PRESET_VIEWS.filter((v) => v.tableId === tableId);
  const sortedUser = [...user].sort((a, b) => b.createdAt - a.createdAt);
  return [...presets, ...sortedUser];
}

/** Insert or update a view (matched by id). Presets are read-only. */
export function saveView(view: SavedView): SavedView {
  if (view.id.startsWith("preset:")) return view; // presets are immutable
  const all = readAll();
  const idx = all.findIndex((v) => v.id === view.id);
  if (idx >= 0) all[idx] = view;
  else all.push(view);
  writeAll(all);
  return view;
}

/** Remove a user view. Presets cannot be deleted. */
export function deleteView(id: string): void {
  if (id.startsWith("preset:")) return;
  const all = readAll().filter((v) => v.id !== id);
  writeAll(all);
}

/**
 * Mark a view as default within its table. Only one default per tableId.
 * Works for both preset and user views — for presets we record the choice
 * against the preset id by writing a sentinel user view of the same id is
 * not possible (presets aren't persisted), so instead we clear all defaults
 * and let the caller drive the chosen one from PRESET_VIEWS at read time.
 *
 * Strategy: defaults are tracked on user-view rows. If the chosen id is a
 * preset, we persist a parallel marker row so the UI can resolve it.
 */
export function setDefault(id: string, tableId: string): void {
  const all = readAll();
  // Clear existing defaults for this table.
  for (const v of all) if (v.tableId === tableId) v.isDefault = false;

  if (id.startsWith("preset:")) {
    // Persist a marker so we remember which preset is the default.
    const markerId = `default-marker:${tableId}`;
    const filtered = all.filter((v) => v.id !== markerId);
    filtered.push({
      id: markerId,
      name: id, // store the preset id we're pointing at
      tableId,
      filters: {},
      columns: [],
      isDefault: true,
      createdAt: Date.now(),
    });
    writeAll(filtered);
    return;
  }

  const target = all.find((v) => v.id === id);
  if (target) target.isDefault = true;
  // Also clear any preset marker — a user view now owns default.
  const cleaned = all.filter((v) => v.id !== `default-marker:${tableId}`);
  writeAll(cleaned);
}

/** Resolve the default view for a table, if any. */
export function getDefaultView(tableId: string): SavedView | undefined {
  const all = readAll();
  const marker = all.find(
    (v) => v.id === `default-marker:${tableId}` && v.isDefault,
  );
  if (marker) {
    const preset = PRESET_VIEWS.find((p) => p.id === marker.name);
    if (preset) return preset;
  }
  return all.find((v) => v.tableId === tableId && v.isDefault);
}

/** Stable id generator for new user views. */
export function newViewId(tableId: string): string {
  return `${tableId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}
