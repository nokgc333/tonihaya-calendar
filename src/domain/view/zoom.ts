import { clampYear } from "./yearRange";

export interface ZoomState {
  readonly level: "overview" | "month";
  readonly year: number;
  readonly month?: number;
}

export function parseZoom(params: URLSearchParams, fallbackYear: number): ZoomState {
  const yRaw = params.get("y");
  const yNum = yRaw !== null ? Number(yRaw) : NaN;
  const year = clampYear(Number.isFinite(yNum) ? Math.trunc(yNum) : fallbackYear);

  const mRaw = params.get("m");
  const mNum = mRaw !== null ? Number(mRaw) : NaN;
  if (Number.isInteger(mNum) && mNum >= 1 && mNum <= 12) {
    return { level: "month", year, month: mNum };
  }
  return { level: "overview", year };
}

export function zoomToQuery(state: ZoomState): string {
  const base = `?y=${state.year}`;
  return state.level === "month" && state.month !== undefined
    ? `${base}&m=${state.month}`
    : base;
}
