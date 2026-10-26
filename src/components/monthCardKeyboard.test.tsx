// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthCard } from "@/components/MonthCard";
import { buildMonthView } from "@/domain/view";

afterEach(cleanup);

const month = (weekStart: "sun" | "mon" = "sun") =>
  buildMonthView(2026, 7, null, weekStart);

describe("MonthCard keyboard use", () => {
  it("is a group named after its month, not a button", () => {
    render(<MonthCard month={month()} weekStart="sun" onClick={vi.fn()} />);
    expect(screen.getByRole("group", { name: "7月" })).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "7月" })!.getAttribute("tabindex"),
    ).toBeNull();
  });

  it.each(["{Enter}", " "])(
    "opens the card from its title button with %j, once",
    async (key) => {
      const onClick = vi.fn();
      render(<MonthCard month={month()} weekStart="sun" onClick={onClick} />);
      const user = userEvent.setup();
      await user.tab();
      expect(screen.getByRole("button", { name: "7月を開く" })).toHaveFocus();
      await user.keyboard(key);
      expect(onClick).toHaveBeenCalledTimes(1);
    },
  );

  it("ignores other keys", async () => {
    const onClick = vi.fn();
    render(<MonthCard month={month()} weekStart="sun" onClick={onClick} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("a");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("opens the card when any part of it is clicked", async () => {
    const onClick = vi.fn();
    render(<MonthCard month={month()} weekStart="sun" onClick={onClick} />);
    await userEvent.setup().click(screen.getByRole("group", { name: "7月" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no title button without a click handler", () => {
    render(<MonthCard month={month()} weekStart="sun" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["{Enter}", " "])(
    "opens a day with %j from its own button",
    async (key) => {
      const onDayClick = vi.fn();
      render(
        <MonthCard
          month={month()}
          weekStart="sun"
          year={2026}
          onDayClick={onDayClick}
        />,
      );
      const user = userEvent.setup();
      await user.tab();
      expect(
        screen.getByRole("button", { name: "7月1日を開く" }),
      ).toHaveFocus();
      screen.getByRole("button", { name: "7月20日を開く" }).focus();
      await user.keyboard(key);
      expect(onDayClick).toHaveBeenCalledWith(2026, 7, 20);
    },
  );

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

describe("MonthCard day grid keys", () => {
  const grid = (
    today: { year: number; month: number; day: number } | null = null,
  ) =>
    render(
      <MonthCard
        month={buildMonthView(2026, 7, today, "sun")}
        weekStart="sun"
        year={2026}
        onDayClick={vi.fn()}
      />,
    );
  const day = (label: string) =>
    screen.getByRole("button", { name: `${label}を開く` });

  it("makes only one day a tab stop, the first of the month by default", () => {
    grid();
    const stops = screen
      .getAllByRole("button", { name: /日を開く$/ })
      .filter((b) => b.getAttribute("tabindex") === "0");
    expect(stops).toEqual([day("7月1日")]);
  });

  it("makes today the tab stop when it is in the month", () => {
    grid({ year: 2026, month: 7, day: 15 });
    expect(day("7月15日")).toHaveAttribute("tabindex", "0");
    expect(day("7月1日")).toHaveAttribute("tabindex", "-1");
  });

  it("reaches the grid with one Tab and leaves it with the next", async () => {
    grid();
    const user = userEvent.setup();
    await user.tab();
    expect(day("7月1日")).toHaveFocus();
    await user.tab();
    expect(day("7月1日")).not.toHaveFocus();
  });

  it("moves the focus a day or a week with the arrow keys", async () => {
    grid();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(day("7月2日")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(day("7月9日")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(day("7月8日")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(day("7月1日")).toHaveFocus();
  });

  it("goes on into the days of the neighboring months", async () => {
    grid();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(day("6月30日")).toHaveFocus();
  });

  it("goes to the ends of the row with Home and End", async () => {
    grid();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}{End}");
    expect(day("7月4日")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(day("6月28日")).toHaveFocus();
  });

  it("makes the day that has the focus the tab stop, so that coming back lands on it", async () => {
    grid();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(day("7月15日")).toHaveAttribute("tabindex", "0");
    expect(day("7月1日")).toHaveAttribute("tabindex", "-1");
  });

  it("opens the day the focus was moved to", async () => {
    const onDayClick = vi.fn();
    render(
      <MonthCard
        month={month()}
        weekStart="sun"
        year={2026}
        onDayClick={onDayClick}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onDayClick).toHaveBeenCalledWith(2026, 7, 8);
  });

  it("keeps the page from scrolling for the keys that move the focus, and only for those", () => {
    grid();
    const button = day("7月15日");
    expect(fireEvent.keyDown(button, { key: "ArrowDown" })).toBe(false);
    expect(fireEvent.keyDown(button, { key: "ArrowLeft" })).toBe(false);
    expect(fireEvent.keyDown(button, { key: "a" })).toBe(true);
    expect(fireEvent.keyDown(button, { key: "Enter" })).toBe(true);
  });

  it("leaves the keys alone while a modifier is held", async () => {
    grid();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(day("7月1日")).toHaveFocus();
  });
});
