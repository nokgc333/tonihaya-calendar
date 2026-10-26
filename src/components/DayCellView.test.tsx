// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayCellView } from "@/components/DayCellView";
import { buildMonthView, type DayCell } from "@/domain/view";
import { makeEvent } from "../../tests/support/calendarHarness";

afterEach(cleanup);

const cells = buildMonthView(
  2026,
  7,
  { year: 2026, month: 7, day: 15 },
  "sun",
).weeks.flat();
const cellOf = (day: number, inMonth = true): DayCell =>
  cells.find((c) => c.day === day && c.inMonth === inMonth)!;

const many = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    makeEvent(`e${i}`, [2026, 7, 15], [2026, 7, 15]),
  );

const show = (
  cell: DayCell,
  over: Partial<Parameters<typeof DayCellView>[0]> = {},
) =>
  render(
    <DayCellView
      cell={cell}
      size="sm"
      spacious={false}
      jump={false}
      {...over}
    />,
  );

describe("DayCellView", () => {
  it("shows the day number and marks today", () => {
    const { container } = show(cellOf(15));
    expect(container.textContent).toBe("15");
    expect(container.querySelector("[aria-current='date']")).not.toBeNull();
  });

  it("does not mark an ordinary day as today", () => {
    const { container } = show(cellOf(16));
    expect(container.querySelector("[aria-current]")).toBeNull();
  });

  it("draws a disc and a title for a holiday", () => {
    const { container } = show(cellOf(20));
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
    expect(container.firstElementChild!.getAttribute("title")).toBe("海の日");
  });

  it("shows a day of the neighboring month in the faint text color, not through opacity, and keeps its events out", () => {
    const outside = cells.find((c) => !c.inMonth)!;
    const { container } = show(outside, { dayEvents: many(2) });
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe("");
    expect(
      (container.querySelector("span.relative span.relative") as HTMLElement)
        .style.color,
    ).toBe("var(--text-faint)");
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
  });

  it("shows a day of the month in its own color, never in the faint one", () => {
    const { container } = show(cellOf(16));
    expect(
      (container.querySelector("span.relative span.relative") as HTMLElement)
        .style.color,
    ).not.toBe("var(--text-faint)");
  });

  it("names the jump transition only when it is the jump target", () => {
    expect(
      (
        show(cellOf(15), { jump: true }).container
          .firstElementChild as HTMLElement
      ).style.viewTransitionName,
    ).toBe("jump-zoom");
    cleanup();
    expect(
      (show(cellOf(15)).container.firstElementChild as HTMLElement).style
        .viewTransitionName,
    ).toBe("");
  });

  it("has no button for the day without a click handler, a year and a month", () => {
    expect(
      show(cellOf(15), { onDayClick: vi.fn() }).container.querySelector(
        "button",
      ),
    ).toBeNull();
    cleanup();
    expect(
      show(cellOf(15), {
        cellYear: 2026,
        cellMonth: 7,
      }).container.querySelector("button"),
    ).toBeNull();
  });

  it("has one button, named after the date, that is the only tab stop of the cell", () => {
    const { container } = show(cellOf(15), {
      onDayClick: vi.fn(),
      cellYear: 2026,
      cellMonth: 7,
    });
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "7月15日を開く" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[role='button'], [tabindex]")).toBeNull();
  });

  it("reports the day when the cell or its button is clicked", () => {
    const onDayClick = vi.fn();
    const { container } = show(cellOf(15), {
      onDayClick,
      cellYear: 2026,
      cellMonth: 7,
    });
    fireEvent.click(container.firstElementChild as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "7月15日を開く" }));
    expect(onDayClick.mock.calls).toEqual([
      [2026, 7, 15],
      [2026, 7, 15],
    ]);
  });

  it.each(["{Enter}", " "])(
    "opens the day from the keyboard with %j, once",
    async (key) => {
      const onDayClick = vi.fn();
      show(cellOf(15), { onDayClick, cellYear: 2026, cellMonth: 7 });
      const user = userEvent.setup();
      await user.tab();
      await user.keyboard(key);
      expect(onDayClick.mock.calls).toEqual([[2026, 7, 15]]);
    },
  );

  it("does not open the day with other keys", async () => {
    const onDayClick = vi.fn();
    show(cellOf(15), { onDayClick, cellYear: 2026, cellMonth: 7 });
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("a");
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("keeps the event chips as separate buttons beside the day button, not inside it", () => {
    show(cellOf(15), {
      spacious: true,
      dayEvents: many(1),
      onDayClick: vi.fn(),
      cellYear: 2026,
      cellMonth: 7,
    });
    const dayButton = screen.getByRole("button", { name: "7月15日を開く" });
    expect(dayButton.contains(screen.getByTitle("e0"))).toBe(false);
  });
});

describe("DayCellView events", () => {
  it("shows up to three chips and the number of the rest when spacious", () => {
    const { container } = show(cellOf(15), {
      spacious: true,
      dayEvents: many(5),
    });
    expect(container.querySelectorAll("[data-event-id]")).toHaveLength(3);
    expect(screen.getByText("+2件")).toBeInTheDocument();
  });

  it("shows no overflow note for three events or fewer", () => {
    show(cellOf(15), { spacious: true, dayEvents: many(3) });
    expect(screen.queryByText(/件$/)).not.toBeInTheDocument();
  });

  it("tells which chip was picked without opening the day", () => {
    const onSelect = vi.fn();
    const onDayClick = vi.fn();
    show(cellOf(15), {
      spacious: true,
      dayEvents: many(1),
      onEventSelect: onSelect,
      onDayClick,
      cellYear: 2026,
      cellMonth: 7,
    });
    fireEvent.click(screen.getByTitle("e0"));
    expect(onSelect).toHaveBeenCalledWith("e0");
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("shows dots instead of chips when not spacious, up to six", () => {
    const { container } = show(cellOf(15), { dayEvents: many(6) });
    expect(container.querySelectorAll(".h-1.w-1.rounded-full")).toHaveLength(6);
    expect(container.querySelector("[data-event-id]")).toBeNull();
  });

  it("shows five dots and a plus mark for more than six events", () => {
    const { container } = show(cellOf(15), { dayEvents: many(8) });
    expect(container.querySelectorAll(".h-1.w-1.rounded-full")).toHaveLength(5);
    expect(screen.getByText("＋")).toBeInTheDocument();
  });

  it("shows no dots for a day without events", () => {
    const { container } = show(cellOf(15));
    expect(container.querySelector(".h-1.w-1")).toBeNull();
  });
});
