/**
 * The three choices in the theme switcher. "system" is not persisted as a
 * distinct marker — it is simply the absence of a stored preference, so a
 * visitor who never touches the control always follows their OS setting.
 */
export type ThemeSetting = "system" | "light" | "dark";
export const THEME_SETTINGS: readonly ThemeSetting[] = ["system", "light", "dark"];

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs before React hydrates (see the inline `<script>` first in `<body>`
 * in app/layout.tsx) so the very first paint already has the right colours
 * — otherwise a page set to dark by a returning visitor would flash light
 * for a frame. Only ever sets `data-theme` for an explicit "light" or
 * "dark" choice; for "system" (the default) it leaves the attribute unset,
 * so the `prefers-color-scheme` rule in globals.css governs on its own and
 * keeps responding live to OS changes without any JavaScript involved.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

/** Reads the stored preference, defensively — never throws, never invents a value. */
export function readStoredTheme(): ThemeSetting {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* localStorage can throw (private mode, disabled storage); fall through */
  }
  return "system";
}

/** Applies a setting to the document and persists it (or clears it, for "system"). */
export function applyTheme(setting: ThemeSetting): void {
  if (setting === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", setting);
  }
  try {
    if (setting === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, setting);
  } catch {
    /* non-fatal: the attribute above already controls this tab's appearance */
  }
}
