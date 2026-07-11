// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MonthCard } from "@/components/MonthCard";
import { buildMonthView } from "@/domain/view";
import type { CalendarEvent } from "@/domain/event";

// 2026年7月の月ビュー（today なし = isToday は常に false）。
const july = buildMonthView(2026, 7, null, "sun");

// 指定日の終日イベント（createdAt でソート順を固定）。
const allDayOn = (day: number, id: string, createdAt: number): CalendarEvent => ({
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
  it("L1(月カード)は同日4件でチップ3件と「+1件」を表示する", () => {
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
    // セル・カードは button 化していない（onClick/onDayClick 未指定）ので button = チップのみ。
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByText("+1件")).toBeInTheDocument();
  });

  it("L1のチップをクリックすると onEventSelect が id で呼ばれる", async () => {
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

  it("L0(俯瞰)はイベント数だけドットを表示する（最大3）", () => {
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
    // ドットは非セマンティックな span（h-1 w-1 rounded-full）。L0 では他に rounded-full 要素は無い。
    expect(container.querySelectorAll("span.rounded-full")).toHaveLength(2);
  });
});
