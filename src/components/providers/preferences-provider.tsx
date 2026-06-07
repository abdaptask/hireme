"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_DENSITY,
  DEFAULT_THEME,
  DENSITY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type Density,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/preferences";

type PreferencesContextValue = {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
  toggleTheme: () => void;
  density: Density;
  setDensity: (density: Density) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The bootstrap script already applied the right values to <html>; we mirror
  // them into React state on mount to keep the UI in sync.
  const [theme, setThemeState] = useState<ThemeChoice>(DEFAULT_THEME);
  const [density, setDensityState] = useState<Density>(DEFAULT_DENSITY);
  const [systemResolved, setSystemResolved] =
    useState<ResolvedTheme>("light");

  useEffect(() => {
    const storedTheme =
      (localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null) ??
      DEFAULT_THEME;
    const storedDensity =
      (localStorage.getItem(DENSITY_STORAGE_KEY) as Density | null) ??
      DEFAULT_DENSITY;
    setThemeState(storedTheme);
    setDensityState(storedDensity);
    setSystemResolved(systemTheme());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemResolved(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemResolved : theme;

  // Apply theme to <html> whenever it changes.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", resolvedTheme === "dark");
    el.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Apply density to <html> whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable; in-memory state still updates */
    }
  }, []);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      density,
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
