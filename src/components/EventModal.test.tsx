// @vitest-environment happy-dom
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventModal } from "@/components/EventModal";
import type { CalendarEvent } from "@/domain/event";

const defaultDate = { year: 2026, month: 7, day: 11 };

const existing = (): CalendarEvent => ({
  id: "e1",
  title: "既存予定",
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

  it("タイトルが空のまま保存するとエラーを表示し onSubmit を呼ばない", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/タイトルを入力してください/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("不正な URL はエラーを表示する", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "会議");
    await user.type(screen.getByLabelText("URL"), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/URLは http\/https のみ使用できます/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("終了日が開始日より前だとエラーを表示する", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "会議");
    fireEvent.change(screen.getByLabelText("開始日"), { target: { value: "2026-07-11" } });
    fireEvent.change(screen.getByLabelText("終了日"), { target: { value: "2026-07-10" } });
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/終了日は開始日以降にしてください/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("同日で終了時刻が開始時刻以前だとエラーを表示する", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "会議");
    await user.click(screen.getByLabelText("終日")); // allDay をオフにして時刻欄を出す
    fireEvent.change(screen.getByLabelText("開始時刻"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText("終了時刻"), { target: { value: "09:00" } });
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText(/終了時刻は開始時刻より後にしてください/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("妥当な入力で保存すると onSubmit が EventDraft で呼ばれる", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "会議");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "会議", allDay: true }));
  });

  it("保存に失敗（onSubmitがfalse）するとエラーを表示する", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(
      <EventModal initial={null} defaultDate={defaultDate} onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("タイトル"), "会議");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/保存できませんでした/)).toBeInTheDocument();
  });

  it("編集時に削除すると確認後 onDelete が呼ばれる", async () => {
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
