import { clampYear } from "./yearRange";

export interface ZoomState {
  readonly level: "overview" | "month" | "week" | "day";
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
}

function intInRange(
  raw: string | null,
  min: number,
  max: number,
): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export function parseZoom(
  params: URLSearchParams,
  fallbackYear: number,
): ZoomState {
  const yRaw = params.get("y");
  const yNum = yRaw !== null ? Number(yRaw) : NaN;
  const year = clampYear(
    Number.isFinite(yNum) ? Math.trunc(yNum) : fallbackYear,
  );

  const month = intInRange(params.get("m"), 1, 12);
  const day = intInRange(params.get("d"), 1, 31);
  const v = params.get("v");

  if (month !== null && day !== null && (v === "week" || v === "day")) {
    return { level: v, year, month, day };
  }
  if (month !== null) {
    return { level: "month", year, month };
  }
  return { level: "overview", year };
}

export function zoomToQuery(state: ZoomState): string {
  const base = `?y=${state.year}`;
  if (state.level === "overview") return base;
  if (state.level === "month") return `${base}&m=${state.month}`;
  return `${base}&m=${state.month}&d=${state.day}&v=${state.level}`;
}
