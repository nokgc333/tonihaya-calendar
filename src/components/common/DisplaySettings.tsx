"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePersistedChoice } from "@/components/common/usePersistedChoice";

type Switch = "on" | "off";

export interface DisplaySettings {
  readonly rokuyo: boolean;
  readonly wafuMonth: boolean;
}

interface DisplaySettingsValue extends DisplaySettings {
  readonly onRokuyoChange: (on: boolean) => void;
  readonly onWafuMonthChange: (on: boolean) => void;
}

const ROKUYO_STORAGE_KEY = "tonihaya.rokuyo";
const WAFU_MONTH_STORAGE_KEY = "tonihaya.wafuMonth";
const SWITCHES: readonly Switch[] = ["on", "off"];

const DEFAULTS: DisplaySettingsValue = {
  rokuyo: true,
  wafuMonth: true,
  onRokuyoChange: () => undefined,
  onWafuMonthChange: () => undefined,
};

const DisplaySettingsContext = createContext<DisplaySettingsValue>(DEFAULTS);

export function useDisplaySettings(): DisplaySettingsValue {
  return useContext(DisplaySettingsContext);
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
  const value: DisplaySettingsValue = {
    rokuyo: rokuyo === "on",
    wafuMonth: wafu === "on",
    onRokuyoChange: (on) => changeRokuyo(on ? "on" : "off"),
    onWafuMonthChange: (on) => changeWafu(on ? "on" : "off"),
  };
  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}
