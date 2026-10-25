import { daysInMonth, type CivilDate } from "../shared/date";
import type { ZoomState } from "./zoom";

export type JumpLevel = "overview" | "month" | "week" | "day";

export function resolveJumpTarget(
  target: JumpLevel,
  zoom: ZoomState,
  today: CivilDate | null,
): ZoomState {
  const year = zoom.year;
  if (target === "overview") {
    return { level: "overview", year };
  }

  const month = zoom.month ?? today?.month ?? 1;
  if (target === "month") {
    return { level: "month", year, month };
  }

  const rawDay = zoom.day ?? today?.day ?? 1;
  const day = Math.min(rawDay, daysInMonth(year, month));
  return { level: target, year, month, day };
}
