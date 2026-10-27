// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MonthCard } from "@/components/month/MonthCard";
import { buildMonthView } from "@/domain/view";
import type { CalendarEvent } from "@/domain/event";

const july = buildMonthView(2026, 7, null, "sun");

const allDayOn = (
  day: number,
  id: string,
  createdAt: number,
): CalendarEvent => ({
  id,
  title: id,
  allDay: true,
  start: { date: { year: 2026, month: 7, day } },
  end: { date: { year: 2026, month: 7, day } },
  colorKey: "blue",
  priority: "normal",
  createdAt,
  updatedAt: createdAt,
});

describe("MonthCard", () => {
  it('L1 (month card) shows 3 chips and "+1" for 4 events on the same day', () => {
    const events = [
      allDayOn(15, "e1", 1),
      allDayOn(15, "e2", 2),
      allDayOn(15, "e3", 3),
      allDayOn(15, "e4", 4),
    ];
    render(
      <MonthCard
        month={july}
        weekStart="sun"
        size="lg"
        spacious
        year={2026}
        events={events}
        onEventSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByText("+1件")).toBeInTheDocument();
  });

  it("L1 calls onEventSelect with the id when a chip is clicked", async () => {
    const onEventSelect = vi.fn();
    const user = userEvent.setup();
    const events = [allDayOn(15, "e1", 1), allDayOn(15, "e2", 2)];
    render(
      <MonthCard
        month={july}
        weekStart="sun"
        size="lg"
        spacious
        year={2026}
        events={events}
        onEventSelect={onEventSelect}
      />,
    );
    await user.click(screen.getAllByRole("button")[0]);
    expect(onEventSelect).toHaveBeenCalledWith("e1");
  });

  it("L0 (overview) shows one dot per event (max 3)", () => {
    const events = [allDayOn(15, "e1", 1), allDayOn(15, "e2", 2)];
    const { container } = render(
      <MonthCard
        month={july}
        weekStart="sun"
        size="sm"
        year={2026}
        events={events}
        onEventSelect={vi.fn()}
      />,
    );
    expect(
      container.querySelectorAll("span.h-1.w-1.rounded-full"),
    ).toHaveLength(2);
  });
});
