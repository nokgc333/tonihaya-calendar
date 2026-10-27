// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventModal } from "@/components/event/EventModal";
import type { CalendarEvent } from "@/domain/event";

afterEach(cleanup);

const date = { year: 2026, month: 7, day: 11 };

const open = (initial: CalendarEvent | null = null) => {
  const onSubmit = vi.fn();
  render(
    <EventModal
      initial={initial}
      defaultDate={date}
      onSubmit={onSubmit}
      onClose={vi.fn()}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
};

describe("event form fields", () => {
  it("starts as an all-day event without time fields", () => {
    open();
    expect(screen.getByLabelText("終日")).toBeChecked();
    expect(screen.queryByLabelText("開始時刻")).not.toBeInTheDocument();
  });

  it("shows the time fields when all-day is turned off and hides them again", async () => {
    const { user } = open();
    await user.click(screen.getByLabelText("終日"));
    expect(screen.getByLabelText("開始時刻")).toBeInTheDocument();
    expect(screen.getByLabelText("終了時刻")).toBeInTheDocument();
    await user.click(screen.getByLabelText("終日"));
    expect(screen.queryByLabelText("開始時刻")).not.toBeInTheDocument();
  });

  it("submits the times of a timed event", async () => {
    const { onSubmit, user } = open();
    await user.type(screen.getByLabelText("タイトル"), "Standup");
    await user.click(screen.getByLabelText("終日"));
    await user.clear(screen.getByLabelText("開始時刻"));
    await user.type(screen.getByLabelText("開始時刻"), "09:30");
    await user.clear(screen.getByLabelText("終了時刻"));
    await user.type(screen.getByLabelText("終了時刻"), "10:15");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      allDay: false,
      start: { time: { hour: 9, minute: 30 } },
      end: { time: { hour: 10, minute: 15 } },
    });
  });

  it("offers all eight colors, with the first one chosen by default", () => {
    open();
    const colors = screen.getAllByRole("button", { name: /^色 / });
    expect(colors).toHaveLength(8);
    expect(
      colors.filter((b) => b.getAttribute("aria-pressed") === "true"),
    ).toHaveLength(1);
  });

  it("offers the three priorities with the middle one chosen by default", () => {
    open();
    const select = screen.getByLabelText("優先度") as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toEqual([
      "low",
      "normal",
      "high",
    ]);
    expect(select.value).toBe("normal");
  });

  it("limits the length of the title and the note", () => {
    open();
    expect(screen.getByLabelText("タイトル")).toHaveAttribute("maxlength");
    expect(screen.getByLabelText("備考")).toHaveAttribute("maxlength");
  });

  it("fills the form with the event that is edited", () => {
    open({
      id: "e1",
      title: "Planning",
      allDay: false,
      start: { date, time: { hour: 14, minute: 0 } },
      end: { date, time: { hour: 15, minute: 0 } },
      colorKey: "green",
      priority: "high",
      url: "https://example.com",
      note: "Room 3",
      createdAt: 1,
      updatedAt: 1,
    });
    expect(screen.getByLabelText("タイトル")).toHaveValue("Planning");
    expect(screen.getByLabelText("終日")).not.toBeChecked();
    expect(screen.getByLabelText("開始時刻")).toHaveValue("14:00");
    expect(screen.getByLabelText("優先度")).toHaveValue("high");
    expect(screen.getByLabelText("URL")).toHaveValue("https://example.com");
    expect(screen.getByLabelText("備考")).toHaveValue("Room 3");
    expect(screen.getByRole("button", { name: "色 green" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
