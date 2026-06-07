"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage-backed state via useSyncExternalStore — SSR-safe (server
 * snapshot returns the fallback) and free of hydration flash, without the
 * set-state-in-effect anti-pattern. Updates propagate same-tab (custom event)
 * and cross-tab (storage event).
 */
export function useLocalStorage(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === null || e.key === key) onChange();
      };
      const eventName = `ls:${key}`;
      window.addEventListener("storage", onStorage);
      window.addEventListener(eventName, onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(eventName, onChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage unavailable — listeners still fire for in-session sync */
      }
      window.dispatchEvent(new Event(`ls:${key}`));
    },
    [key],
  );

  return [value, setValue];
}

/** Reactive prefers-color-scheme: dark, SSR-safe. */
export function usePrefersDark(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const getSnapshot = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
