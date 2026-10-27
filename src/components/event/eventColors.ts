import type { EventColorKey } from "@/domain/event";

export const EVENT_COLOR_KEYS: readonly EventColorKey[] = [
  "blue",
  "green",
  "teal",
  "purple",
  "pink",
  "amber",
  "slate",
  "rose",
];

export function eventColor(key: EventColorKey): {
  readonly bg: string;
  readonly fg: string;
  readonly border: string;
} {
  return {
    bg: `var(--ev-${key}-bg)`,
    fg: `var(--ev-${key}-fg)`,
    border: `var(--ev-${key}-border)`,
  };
}
