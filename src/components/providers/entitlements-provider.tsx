"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/lib/use-stored";
import {
  ADMIN_ROLE,
  defaultVisibility,
  getRole,
  type RoleId,
  type VisibilityMap,
} from "@/lib/roles";

const VISIBILITY_KEY = "hireme.entitlements";
const VIEW_AS_KEY = "hireme.viewAs";
/** Mirrors the "view as" role so server components can enforce access (§42). */
const VIEW_AS_COOKIE = "hireme.viewAs";

function readRoleCookie(): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${VIEW_AS_COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(VIEW_AS_COOKIE.length + 1)) : null;
}

function writeRoleCookie(role: string) {
  document.cookie = `${VIEW_AS_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=31536000; samesite=lax`;
}

type EntitlementsContextValue = {
  /** The role the app is currently rendered for (real session role later). */
  viewAs: RoleId;
  setViewAs: (role: RoleId) => void;
  /** Whether the logged-in user (admin) is previewing as a non-admin role. */
  isPreviewing: boolean;
  /** Whether the logged-in user may manage entitlements. */
  canManage: boolean;
  visibility: VisibilityMap;
  isVisible: (itemId: string, role?: RoleId) => boolean;
  setVisible: (role: RoleId, itemId: string, value: boolean) => void;
  setRoleAll: (role: RoleId, value: boolean) => void;
  resetRole: (role: RoleId) => void;
  resetAll: () => void;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

function parseVisibility(raw: string): VisibilityMap {
  const defaults = defaultVisibility();
  try {
    const parsed = JSON.parse(raw) as Partial<VisibilityMap>;
    // Merge so newly-added roles/items fall back to their defaults.
    const merged = {} as VisibilityMap;
    for (const role of Object.keys(defaults) as RoleId[]) {
      merged[role] = { ...defaults[role], ...(parsed?.[role] ?? {}) };
    }
    return merged;
  } catch {
    return defaults;
  }
}

export function EntitlementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rawVisibility, setRawVisibility] = useLocalStorage(
    VISIBILITY_KEY,
    JSON.stringify(defaultVisibility()),
  );
  const [viewAs, setViewAsRaw] = useLocalStorage(VIEW_AS_KEY, ADMIN_ROLE);
  const router = useRouter();

  // Keep the server-visible cookie in step with the stored role; re-render
  // server components (report catalog, access checks) when it changes.
  useEffect(() => {
    if (readRoleCookie() !== viewAs) {
      writeRoleCookie(viewAs);
      router.refresh();
    }
  }, [viewAs, router]);

  const visibility = useMemo(
    () => parseVisibility(rawVisibility),
    [rawVisibility],
  );

  const persist = useCallback(
    (next: VisibilityMap) => setRawVisibility(JSON.stringify(next)),
    [setRawVisibility],
  );

  const isVisible = useCallback(
    (itemId: string, role: RoleId = viewAs as RoleId) =>
      visibility[role]?.[itemId] ?? false,
    [visibility, viewAs],
  );

  const setVisible = useCallback(
    (role: RoleId, itemId: string, value: boolean) => {
      persist({
        ...visibility,
        [role]: { ...visibility[role], [itemId]: value },
      });
    },
    [visibility, persist],
  );

  const setRoleAll = useCallback(
    (role: RoleId, value: boolean) => {
      const row: Record<string, boolean> = {};
      for (const id of Object.keys(visibility[role] ?? {})) row[id] = value;
      persist({ ...visibility, [role]: row });
    },
    [visibility, persist],
  );

  const resetRole = useCallback(
    (role: RoleId) => {
      persist({ ...visibility, [role]: defaultVisibility()[role] });
    },
    [visibility, persist],
  );

  const resetAll = useCallback(
    () => persist(defaultVisibility()),
    [persist],
  );

  const setViewAs = useCallback(
    (role: RoleId) => {
      // Write the cookie first so an immediate navigation renders for the new role.
      writeRoleCookie(role);
      setViewAsRaw(role);
    },
    [setViewAsRaw],
  );

  const value = useMemo<EntitlementsContextValue>(() => {
    const role = viewAs as RoleId;
    return {
      viewAs: role,
      setViewAs,
      isPreviewing: role !== ADMIN_ROLE,
      // The logged-in user is the admin; preview never removes management rights.
      canManage: getRole(ADMIN_ROLE).isAdmin,
      visibility,
      isVisible,
      setVisible,
      setRoleAll,
      resetRole,
      resetAll,
    };
  }, [
    viewAs,
    setViewAs,
    visibility,
    isVisible,
    setVisible,
    setRoleAll,
    resetRole,
    resetAll,
  ]);

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) {
    throw new Error(
      "useEntitlements must be used within an EntitlementsProvider",
    );
  }
  return ctx;
}
