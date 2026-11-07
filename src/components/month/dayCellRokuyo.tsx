import type { ReactNode } from "react";
import { rokuyoOf } from "@/domain/kyureki";
import type { DayCell } from "@/domain/view";
import { RokuyoLabel } from "@/components/common/RokuyoLabel";

export interface DayRokuyo {
  readonly label: ReactNode;
  readonly describedBy: string | undefined;
}

export function dayRokuyo(
  cell: DayCell,
  spacious: boolean,
  year: number | undefined,
  month: number | undefined,
): DayRokuyo {
  const rokuyo =
    spacious && cell.inMonth && year !== undefined && month !== undefined
      ? rokuyoOf(year, month, cell.day)
      : null;
  if (rokuyo === null) return { label: null, describedBy: undefined };
  const id = `rokuyo-${year}-${month}-${cell.day}`;
  return {
    label: <RokuyoLabel rokuyo={rokuyo} id={id} className="mt-[3px]" />,
    describedBy: id,
  };
}

export function plainLayout(spacious: boolean, hasLabel: boolean): string {
  if (hasLabel) return "flex-col items-center pt-[7px]";
  return `justify-center items-start ${spacious ? "pt-[7px]" : "pt-[5px]"}`;
}
