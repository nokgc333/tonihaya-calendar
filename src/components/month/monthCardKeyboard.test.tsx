// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthCard } from "@/components/month/MonthCard";
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
