"use client";

import { createContext, useContext } from "react";

export type ShellContextValue = {
  /** Desktop sidebar collapsed (icon-only) state. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile navigation sheet. */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  /** Command palette (Cmd/Ctrl+K). */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within <AppShell>");
  return ctx;
}
