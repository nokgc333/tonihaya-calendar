import { toKyureki } from "./kyureki";

export type Rokuyo = "大安" | "赤口" | "先勝" | "友引" | "先負" | "仏滅";

const ROKUYO: readonly Rokuyo[] = [
  "大安",
  "赤口",
  "先勝",
  "友引",
  "先負",
  "仏滅",
];

export function rokuyoOf(
  year: number,
  month: number,
  day: number,
): Rokuyo | null {
  const lunar = toKyureki(year, month, day);
  if (lunar === null) return null;
  return ROKUYO[(lunar.month + lunar.day) % ROKUYO.length];
}
