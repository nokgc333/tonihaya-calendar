"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePersistedChoice } from "@/components/common/usePersistedChoice";
import {
  applyTheme,
  readSavedTheme,
  saveTheme,
  type ThemeChoice,
} from "@/components/common/theme";

type Switch = "on" | "off";

export interface DisplaySettings {
  readonly rokuyo: boolean;
  readonly wafuMonth: boolean;
  readonly theme: ThemeChoice;
}

interface DisplaySettingsValue extends DisplaySettings {
  readonly onRokuyoChange: (on: boolean) => void;
  readonly onWafuMonthChange: (on: boolean) => void;
  readonly onThemeChange: (theme: ThemeChoice) => void;
}

const ROKUYO_STORAGE_KEY = "tonihaya.rokuyo";
const WAFU_MONTH_STORAGE_KEY = "tonihaya.wafuMonth";
const SWITCHES: readonly Switch[] = ["on", "off"];

const DEFAULTS: DisplaySettingsValue = {
  rokuyo: true,
  wafuMonth: true,
  theme: "system",
  onRokuyoChange: () => undefined,
  onWafuMonthChange: () => undefined,
  onThemeChange: () => undefined,
};

const DisplaySettingsContext = createContext<DisplaySettingsValue>(DEFAULTS);

export function useDisplaySettings(): DisplaySettingsValue {
  return useContext(DisplaySettingsContext);
}

function useThemeChoice(): readonly [ThemeChoice, (next: ThemeChoice) => void] {
  const [theme, setTheme] = useState<ThemeChoice>("system");
  useEffect(() => {
    const saved = readSavedTheme(localStorage);
    if (saved === null) return;
    setTheme(saved);
    applyTheme(document.documentElement, saved);
  }, []);
  const change = (next: ThemeChoice): void => {
    setTheme(next);
    saveTheme(localStorage, next);
    applyTheme(document.documentElement, next);
  };
  return [theme, change];
}

export function DisplaySettingsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [rokuyo, changeRokuyo] = usePersistedChoice<Switch>(
    ROKUYO_STORAGE_KEY,
    "on",
    SWITCHES,
  );
  const [wafu, changeWafu] = usePersistedChoice<Switch>(
    WAFU_MONTH_STORAGE_KEY,
    "on",
    SWITCHES,
  );
  const [theme, changeTheme] = useThemeChoice();
  const value: DisplaySettingsValue = {
    rokuyo: rokuyo === "on",
    wafuMonth: wafu === "on",
    theme,
    onRokuyoChange: (on) => changeRokuyo(on ? "on" : "off"),
    onWafuMonthChange: (on) => changeWafu(on ? "on" : "off"),
    onThemeChange: changeTheme,
  };
  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}
