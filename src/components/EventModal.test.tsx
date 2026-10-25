// @vitest-environment happy-dom
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventModal } from "@/components/EventModal";
import type { CalendarEvent } from "@/domain/event";

const defaultDate = { year: 2026, month: 7, day: 11 };

const existing = (): CalendarEvent => ({
  id: "e1",
  title: "Existing event",
  allDay: true,
  start: { date: defaultDate },
  end: { date: defaultDate },
  colorKey: "blue",
  priority: "normal",
  createdAt: 0,
  updatedAt: 0,
});

describe("EventModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an error and does not call onSubmit when saving with an empty title", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/タイトルを入力してください/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid URL", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "Meeting");
    await user.type(screen.getByLabelText("URL"), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/URLは http\/https のみ使用できます/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error when the end date is before the start date", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "Meeting");
    fireEvent.change(screen.getByLabelText("開始日"), { target: { value: "2026-07-11" } });
    fireEvent.change(screen.getByLabelText("終了日"), { target: { value: "2026-07-10" } });
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/終了日は開始日以降にしてください/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows an error when the end time is not after the start time on the same day", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "Meeting");
    await user.click(screen.getByLabelText("終日"));
    fireEvent.change(screen.getByLabelText("開始時刻"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText("終了時刻"), { target: { value: "09:00" } });
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/終了時刻は開始時刻より後にしてください/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with an EventDraft when saving valid input", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "Meeting");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Meeting", allDay: true }));
  });

  it("shows an error when saving fails (onSubmit returns false)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "Meeting");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/保存できませんでした/)).toBeInTheDocument();
  });

  it("calls onDelete after confirmation when deleting while editing", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(
      <EventModal
        initial={existing()}
        defaultDate={defaultDate}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
