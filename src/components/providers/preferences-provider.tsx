"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import {
  DEFAULT_DENSITY,
  DEFAULT_THEME,
  DENSITY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type Density,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/preferences";
import { useLocalStorage, usePrefersDark } from "@/lib/use-stored";

type PreferencesContextValue = {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
  toggleTheme: () => void;
  density: Density;
  setDensity: (density: Density) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeRaw] = useLocalStorage(THEME_STORAGE_KEY, DEFAULT_THEME);
  const [density, setDensityRaw] = useLocalStorage(
    DENSITY_STORAGE_KEY,
    DEFAULT_DENSITY,
  );
  const prefersDark = usePrefersDark();

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : (theme as ResolvedTheme);

  // Apply resolved theme to <html> (updates an external system — allowed).
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", resolvedTheme === "dark");
    el.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Apply density to <html>.
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  const setTheme = useCallback(
    (next: ThemeChoice) => setThemeRaw(next),
    [setThemeRaw],
  );
  const setDensity = useCallback(
    (next: Density) => setDensityRaw(next),
    [setDensityRaw],
  );
  const toggleTheme = useCallback(
    () => setThemeRaw(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme, setThemeRaw],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme: theme as ThemeChoice,
      resolvedTheme,
      setTheme,
      toggleTheme,
      density: density as Density,
      setDensity,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, density, setDensity],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
