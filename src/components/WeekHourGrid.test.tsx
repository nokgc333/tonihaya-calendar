// @vitest-environment happy-dom
import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekHourGrid } from "@/components/WeekHourGrid";
import { buildWeekView } from "@/domain/view";
import { makeEvent, renderInApp } from "../../tests/support/calendarHarness";

afterEach(cleanup);

const days = buildWeekView({ year: 2026, month: 7, day: 15 }, null, {
  weekStart: "sun",
}).days;

const show = (
  over: Partial<Parameters<typeof WeekHourGrid>[0]> = {},
  events = [] as ReturnType<typeof makeEvent>[],
) =>
  renderInApp(
    <WeekHourGrid
      days={days}
      todayIndex={-1}
      nowOffset={0}
      onOpen={vi.fn()}
      onSelect={vi.fn()}
      {...over}
    />,
    events,
  );

describe("WeekHourGrid", () => {
  it("has a label for each of the 24 hours", async () => {
    const { container } = await show();
    const labels = [...container.querySelectorAll(".text-right")].map(
      (e) => e.textContent,
    );
    expect(labels).toHaveLength(24);
    expect(labels[0]).toBe("0:00");
    expect(labels[23]).toBe("23:00");
  });

  it("has a cell for each hour of each day, hidden from assistive technology", async () => {
    const { container } = await show();
    expect(
      container.querySelectorAll("button[aria-hidden='true']"),
    ).toHaveLength(24 * 7);
  });

  it("opens the day of the cell that is clicked", async () => {
    const onOpen = vi.fn();
    const { container } = await show({ onOpen });
    const cells = container.querySelectorAll("button[aria-hidden='true']");
    fireEvent.click(cells[0]);
    fireEvent.click(cells[8]);
    expect(onOpen.mock.calls).toEqual([
      [2026, 7, 12],
      [2026, 7, 13],
    ]);
  });

  it("draws the current time line at the given offset in the column of today", async () => {
    const { container } = await show({ todayIndex: 3, nowOffset: 120 });
    const line = container.querySelector<HTMLElement>("[class*='z-[6]']")!;
    expect(line.style.top).toBe("120px");
    expect(line.style.left).toContain("3 *");
  });

  it("draws the time line in the first column when today is the first day of the week", async () => {
    const { container } = await show({ todayIndex: 0, nowOffset: 60 });
    expect(container.querySelector("[class*='z-[6]']")).not.toBeNull();
  });

  it("draws no time line when today is not in the week", async () => {
    const { container } = await show();
    expect(container.querySelector("[class*='z-[6]']")).toBeNull();
  });

  it("places the timed events of each day in its own column", async () => {
    const { container } = await show({}, [
      makeEvent("Standup", [2026, 7, 14, 9], [2026, 7, 14, 10]),
    ]);
    const chip = container.querySelector<HTMLElement>(
      "[data-event-id='Standup']",
    )!;
    expect(chip.style.left).toContain("* 2 / 7");
  });
});
