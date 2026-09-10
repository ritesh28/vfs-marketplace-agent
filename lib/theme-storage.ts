export type ThemeMode = "light" | "dark";

const THEME_KEY = "vfs-marketplace:theme";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadTheme(): ThemeMode {
  if (!canUseStorage()) {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function saveTheme(theme: ThemeMode) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}
