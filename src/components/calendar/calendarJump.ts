import type { CivilDate } from "@/domain/shared/date";
import type { JumpLevel } from "@/domain/view";

const LEVEL_ORDER: Record<JumpLevel, number> = {
  overview: 0,
  month: 1,
  week: 2,
  day: 3,
};

const FAR_JUMP_DISTANCE = 2;

export interface PivotPlan {
  readonly pivotDay: CivilDate | null;
  readonly dayPivot: CivilDate | null;
  readonly jumpPivot: CivilDate | null;
  readonly markJumped: boolean;
}

export function planJump(
  from: JumpLevel,
  to: JumpLevel,
  anchor: CivilDate,
): PivotPlan {
  const distance = Math.abs(LEVEL_ORDER[to] - LEVEL_ORDER[from]);
  const involves = (level: JumpLevel): boolean =>
    from === level || to === level;

  if (distance >= FAR_JUMP_DISTANCE) {
    return {
      pivotDay: null,
      dayPivot: null,
      jumpPivot: anchor,
      markJumped: true,
    };
  }
  if (involves("week") && involves("day")) {
    return {
      pivotDay: null,
      dayPivot: anchor,
      jumpPivot: null,
      markJumped: false,
    };
  }
  if (involves("month") && involves("week")) {
    return {
      pivotDay: anchor,
      dayPivot: null,
      jumpPivot: null,
      markJumped: false,
    };
  }
  return { pivotDay: null, dayPivot: null, jumpPivot: null, markJumped: false };
}
