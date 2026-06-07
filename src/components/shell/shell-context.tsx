"use client";

import { createContext, useContext } from "react";

export type ShellContextValue = {
  /** Desktop sidebar pinned open. When unpinned it collapses to an icon rail
   *  that expands on hover. */
  pinned: boolean;
  togglePinned: () => void;
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
