// @vitest-environment happy-dom
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayHourGrid } from "@/components/day/DayHourGrid";
import { buildDayView } from "@/domain/view";
import { makeEvent, renderInApp } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const show = (
  day: number,
  today: number | null,
  nowOffset = 0,
  events = [] as ReturnType<typeof makeEvent>[],
) =>
  renderInApp(
    <DayHourGrid
      day={
        buildDayView(
          2026,
          7,
          day,
          today === null ? null : { year: 2026, month: 7, day: today },
        ).day
      }
      nowOffset={nowOffset}
      onSelect={vi.fn()}
    />,
    events,
  );

describe("DayHourGrid", () => {
  it("has a label for each of the 24 hours", async () => {
    const { container } = await show(15, null);
    expect(
      [...container.querySelectorAll(".text-right")].map((e) => e.textContent),
    ).toHaveLength(24);
  });

  it("tints the hours of a Sunday, a Saturday and an ordinary day differently", async () => {
    const bg = async (day: number) => {
      const { container, unmount } = await show(day, null);
      const value = (container.querySelector(".border-l") as HTMLElement).style
        .background;
      unmount();
      return value;
    };
    expect(await bg(19)).toBe("var(--sun-bg)");
    expect(await bg(18)).toBe("var(--sat-bg)");
    expect(await bg(15)).toBe("var(--surface)");
  });

  it("draws the time line at the given offset on today only", async () => {
    const today = await show(15, 15, 300);
    expect(
      today.container.querySelector<HTMLElement>("[class*='z-[6]']")!.style.top,
    ).toBe("300px");
    cleanup();
    const other = await show(15, 16, 300);
    expect(other.container.querySelector("[class*='z-[6]']")).toBeNull();
  });

  it("shows the timed events of the day", async () => {
    const { container } = await show(15, null, 0, [
      makeEvent("Standup", [2026, 7, 15, 9], [2026, 7, 15, 10]),
    ]);
    expect(container.querySelector("[data-event-id='Standup']")).not.toBeNull();
  });
});
