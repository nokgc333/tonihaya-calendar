export type ThemeChoice = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "tonihaya.theme";
export const THEME_CHOICES: readonly ThemeChoice[] = [
  "system",
  "light",
  "dark",
];

export function readSavedTheme(storage: Storage): ThemeChoice | null {
  try {
    const saved = storage.getItem(THEME_STORAGE_KEY);
    return THEME_CHOICES.find((choice) => choice === saved) ?? null;
  } catch {
    return null;
  }
}

export function applyTheme(root: HTMLElement, choice: ThemeChoice): void {
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

export function saveTheme(storage: Storage, choice: ThemeChoice): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // The choice still applies for this visit when the storage is full or blocked.
  }
}
