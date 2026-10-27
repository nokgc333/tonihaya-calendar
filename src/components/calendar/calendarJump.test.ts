import { describe, it, expect } from "vitest";
import { planJump } from "@/components/calendar/calendarJump";

const anchor = { year: 2026, month: 7, day: 15 };
const none = {
  pivotDay: null,
  dayPivot: null,
  jumpPivot: null,
  markJumped: false,
};

describe("planJump", () => {
  it("anchors a far jump on the jump pivot and marks it as just jumped", () => {
    const far = {
      pivotDay: null,
      dayPivot: null,
      jumpPivot: anchor,
      markJumped: true,
    };
    expect(planJump("overview", "day", anchor)).toEqual(far);
    expect(planJump("day", "overview", anchor)).toEqual(far);
    expect(planJump("overview", "week", anchor)).toEqual(far);
    expect(planJump("month", "day", anchor)).toEqual(far);
  });

  it("anchors a week and day switch on the day pivot", () => {
    const expected = { ...none, dayPivot: anchor };
    expect(planJump("week", "day", anchor)).toEqual(expected);
    expect(planJump("day", "week", anchor)).toEqual(expected);
  });

  it("anchors a month and week switch on the pivot day", () => {
    const expected = { ...none, pivotDay: anchor };
    expect(planJump("month", "week", anchor)).toEqual(expected);
    expect(planJump("week", "month", anchor)).toEqual(expected);
  });

  it("clears every pivot for an overview and month switch", () => {
    expect(planJump("overview", "month", anchor)).toEqual(none);
    expect(planJump("month", "overview", anchor)).toEqual(none);
  });
});
