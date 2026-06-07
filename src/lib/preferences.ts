/**
 * User preference primitives — theme & density (CLAUDE.md §3.1, §3.4, §115).
 * Shared between the no-flash bootstrap script and the React provider so the
 * storage keys and resolution logic never drift apart.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type Density = "comfortable" | "compact" | "ultra-compact";

export const THEME_STORAGE_KEY = "hireme.theme";
export const DENSITY_STORAGE_KEY = "hireme.density";

export const DEFAULT_THEME: ThemeChoice = "system";
export const DEFAULT_DENSITY: Density = "comfortable";

export const DENSITY_LABELS: Record<Density, string> = {
  comfortable: "Comfortable",
  compact: "Compact",
  "ultra-compact": "Ultra-Compact",
};

/**
 * Inlined into <head> as a blocking script so the correct theme/density is
 * applied before first paint (no flash of the wrong theme). Kept tiny and
 * dependency-free on purpose.
 */
export function preferencesBootstrapScript(): string {
  return `(function(){try{
  var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||${JSON.stringify(DEFAULT_THEME)};
  var d=localStorage.getItem(${JSON.stringify(DENSITY_STORAGE_KEY)})||${JSON.stringify(DEFAULT_DENSITY)};
  var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  var resolved=(t==='system')?sys:t;
  var el=document.documentElement;
  el.classList.toggle('dark',resolved==='dark');
  el.setAttribute('data-density',d);
  el.style.colorScheme=resolved;
}catch(e){}})();`;
}
