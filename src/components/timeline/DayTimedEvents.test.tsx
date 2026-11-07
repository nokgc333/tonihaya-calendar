// @vitest-environment happy-dom
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayTimedEvents } from "@/components/timeline/DayTimedEvents";
import { makeEvent, renderInApp } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const show = (
  date: { year: number; month: number; day: number },
  onSelect = vi.fn(),
) =>
  renderInApp(
    <div>
      <DayTimedEvents
        date={date}
        hourHeight={48}
        dayLeft="3.5rem"
        dayWidth="(100% - 3.5rem)"
        onSelect={onSelect}
      />
    </div>,
    [
      makeEvent("Night", [2026, 7, 17, 22], [2026, 7, 18, 2]),
      makeEvent("Standup", [2026, 7, 17, 9], [2026, 7, 17, 10]),
      makeEvent("Allday", [2026, 7, 17], [2026, 7, 17]),
    ],
  );

describe("DayTimedEvents", () => {
  it("places an event by its start time and length", async () => {
    await show({ year: 2026, month: 7, day: 17 });
    const button = screen.getByLabelText("Standup を編集");
    expect(button.style.top).toBe("432px");
    expect(button.style.height).toBe("48px");
  });

  it("leaves out all-day events", async () => {
    await show({ year: 2026, month: 7, day: 17 });
    expect(screen.queryByLabelText("Allday を編集")).not.toBeInTheDocument();
  });

  it("marks an event that runs on into the next day", async () => {
    await show({ year: 2026, month: 7, day: 17 });
    expect(screen.getByLabelText("Night を編集").textContent).toBe("Night ›");
  });

  it("marks an event that came over from the previous day", async () => {
    await show({ year: 2026, month: 7, day: 18 });
    expect(screen.getByLabelText("Night を編集").textContent).toBe("‹ Night");
  });

  it("tells which event was picked", async () => {
    const onSelect = vi.fn();
    await show({ year: 2026, month: 7, day: 17 }, onSelect);
    fireEvent.click(screen.getByLabelText("Standup を編集"));
    expect(onSelect).toHaveBeenCalledWith("Standup");
  });

  it("splits the width between events that overlap", async () => {
    await renderInApp(
      <DayTimedEvents
        date={{ year: 2026, month: 7, day: 17 }}
        hourHeight={48}
        dayLeft="0px"
        dayWidth="100%"
      />,
      [
        makeEvent("A", [2026, 7, 17, 9], [2026, 7, 17, 11]),
        makeEvent("B", [2026, 7, 17, 10], [2026, 7, 17, 12]),
      ],
    );
    expect(screen.getByLabelText("A を編集").style.width).toContain("* 0.5");
    expect(screen.getByLabelText("B を編集").style.left).toContain("* 0.5");
  });
});
