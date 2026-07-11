// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EventChip } from "@/components/EventChip";
import type { CalendarEvent } from "@/domain/event";

const timedEvent = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1",
  title: "会議",
  allDay: false,
  start: { date: { year: 2026, month: 7, day: 11 }, time: { hour: 9, minute: 5 } },
  end: { date: { year: 2026, month: 7, day: 11 }, time: { hour: 10, minute: 0 } },
  colorKey: "blue",
  priority: "normal",
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe("EventChip", () => {
  it("時間イベントは時刻をゼロ埋めしてタイトルとともに表示する", () => {
    render(<EventChip event={timedEvent()} />);
    const btn = screen.getByRole("button", { name: /会議/ });
    expect(btn.textContent).toContain("09:05");
    expect(btn.textContent).toContain("会議");
  });

  it("終日イベントは時刻を表示しない", () => {
    const allDay = timedEvent({
      allDay: true,
      start: { date: { year: 2026, month: 7, day: 11 } },
      end: { date: { year: 2026, month: 7, day: 11 } },
    });
    render(<EventChip event={allDay} />);
    const btn = screen.getByRole("button", { name: /会議/ });
    expect(btn.textContent).not.toMatch(/\d{2}:\d{2}/);
  });

  it("クリックすると onSelect が id で呼ばれ、親要素へ伝播しない", async () => {
    const onSelect = vi.fn();
    const onParent = vi.fn();
    const user = userEvent.setup();
    render(
      <div onClick={onParent}>
        <EventChip event={timedEvent()} onSelect={onSelect} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: /会議/ }));
    expect(onSelect).toHaveBeenCalledWith("e1");
    expect(onParent).not.toHaveBeenCalled();
  });
});
