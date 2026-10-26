// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekDayHeaders } from "@/components/WeekDayHeaders";
import { buildWeekView } from "@/domain/view";

afterEach(cleanup);

const week = (
  today: { year: number; month: number; day: number } | null = null,
) =>
  buildWeekView({ year: 2026, month: 7, day: 15 }, today, { weekStart: "sun" })
    .days;

const show = (over: Partial<Parameters<typeof WeekDayHeaders>[0]> = {}) =>
  render(
    <WeekDayHeaders
      days={week()}
      isDayZoom={false}
      isPivot={() => false}
      isJump={() => false}
      onOpen={vi.fn()}
      {...over}
    />,
  );

describe("WeekDayHeaders", () => {
  it("shows seven day buttons with weekday and day number", () => {
    const { container } = show();
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(7);
    expect(buttons[0].textContent).toBe("日12");
    expect(buttons[6].textContent).toBe("土18");
  });

  it("opens the day that is clicked", () => {
    const onOpen = vi.fn();
    show({ onOpen });
    fireEvent.click(screen.getByLabelText("木16 7月16日を開く"));
    expect(onOpen).toHaveBeenCalledWith(2026, 7, 16);
  });

  it("marks today with a ring and aria-current", () => {
    const { container } = show({
      days: week({ year: 2026, month: 7, day: 15 }),
    });
    expect(container.querySelectorAll("[aria-current='date']")).toHaveLength(1);
    expect(
      screen.getByLabelText("水15 7月15日を開く").style.boxShadow,
    ).toContain("var(--today-bg)");
    expect(screen.getByLabelText("木16 7月16日を開く").style.boxShadow).toBe(
      "",
    );
  });

  it("draws a disc behind a holiday only", () => {
    const { container } = show({
      days: buildWeekView({ year: 2026, month: 7, day: 20 }, null, {
        weekStart: "sun",
      }).days,
    });
    expect(container.querySelectorAll("[aria-hidden]")).toHaveLength(1);
  });

  it("names the transition of the picked day, of the jump day and of the whole row for the day zoom", () => {
    const { container } = show({
      isDayZoom: true,
      isPivot: (d) => d.day === 13,
      isJump: (d) => d.day === 14,
    });
    expect(
      screen.getByLabelText("月13 7月13日を開く").style.viewTransitionName,
    ).toBe("hour-zoom");
    expect(
      screen.getByLabelText("火14 7月14日を開く").style.viewTransitionName,
    ).toBe("jump-zoom");
    expect(
      screen.getByLabelText("水15 7月15日を開く").style.viewTransitionName,
    ).toBe("");
    expect(
      (container.firstElementChild as HTMLElement).style.viewTransitionName,
    ).toBe("day-zoom");
  });

  it("does not name the row transition when the day zoom is off", () => {
    const { container } = show();
    expect(
      (container.firstElementChild as HTMLElement).style.viewTransitionName,
    ).toBe("");
  });
});
