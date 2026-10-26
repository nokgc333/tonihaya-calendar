// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthCard } from "@/components/MonthCard";
import { buildMonthView } from "@/domain/view";

afterEach(cleanup);

const month = (weekStart: "sun" | "mon" = "sun") =>
  buildMonthView(2026, 7, null, weekStart);

describe("MonthCard keyboard use", () => {
  it.each(["Enter", " "])("opens the card with the %j key", (key) => {
    const onClick = vi.fn();
    const { container } = render(
      <MonthCard month={month()} weekStart="sun" onClick={onClick} />,
    );
    fireEvent.keyDown(container.querySelector("section")!, { key });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MonthCard month={month()} weekStart="sun" onClick={onClick} />,
    );
    fireEvent.keyDown(container.querySelector("section")!, { key: "a" });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not a button without a click handler", () => {
    const { container } = render(<MonthCard month={month()} weekStart="sun" />);
    expect(container.querySelector("section")!.getAttribute("role")).toBeNull();
  });

  it.each(["Enter", " "])("opens a day cell with the %j key", (key) => {
    const onDayClick = vi.fn();
    const { container } = render(
      <MonthCard
        month={month()}
        weekStart="sun"
        year={2026}
        onDayClick={onDayClick}
      />,
    );
    const cell = [
      ...container.querySelectorAll<HTMLElement>("[role='button']"),
    ].find((e) => e.textContent?.startsWith("20"))!;
    fireEvent.keyDown(cell, { key });
    expect(onDayClick).toHaveBeenCalledWith(2026, 7, 20);
  });

  it("colors Sunday red and Saturday blue in the header for both week starts", () => {
    const sun = render(<MonthCard month={month()} weekStart="sun" />);
    const colors = (c: HTMLElement) =>
      [...c.querySelectorAll<HTMLElement>(".h-5")].map((e) => e.style.color);
    expect(colors(sun.container)[0]).toBe("var(--accent-red)");
    expect(colors(sun.container)[6]).toBe("var(--accent-sat)");
    cleanup();
    const mon = render(<MonthCard month={month("mon")} weekStart="mon" />);
    expect(colors(mon.container)[6]).toBe("var(--accent-red)");
    expect(colors(mon.container)[5]).toBe("var(--accent-sat)");
  });

  it("draws the day-zoom copy of the week that holds the pivot day", () => {
    const { container } = render(
      <MonthCard
        month={month()}
        weekStart="sun"
        year={2026}
        pivotDay={{ year: 2026, month: 7, day: 15 }}
      />,
    );
    expect(container.querySelectorAll("[style*='day-zoom']")).toHaveLength(1);
  });
});
