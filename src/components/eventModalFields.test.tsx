// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventModal } from "@/components/EventModal";

afterEach(cleanup);

const date = { year: 2026, month: 7, day: 11 };

const open = () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <EventModal
      initial={null}
      defaultDate={date}
      onSubmit={onSubmit}
      onClose={onClose}
    />,
  );
  return { onSubmit, onClose, user: userEvent.setup() };
};

describe("EventModal fields", () => {
  it("submits the dates, color, priority, link and note that were entered", async () => {
    const { onSubmit, user } = open();
    await user.type(screen.getByLabelText("タイトル"), "Offsite");
    await user.clear(screen.getByLabelText("開始日"));
    await user.type(screen.getByLabelText("開始日"), "2026-07-12");
    await user.clear(screen.getByLabelText("終了日"));
    await user.type(screen.getByLabelText("終了日"), "2026-07-13");
    await user.click(screen.getByRole("button", { name: "色 rose" }));
    await user.selectOptions(screen.getByLabelText("優先度"), "high");
    await user.type(screen.getByLabelText("URL"), "https://example.com/plan");
    await user.type(screen.getByLabelText("備考"), "Bring the badge");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: "Offsite",
      allDay: true,
      start: { date: { year: 2026, month: 7, day: 12 } },
      end: { date: { year: 2026, month: 7, day: 13 } },
      colorKey: "rose",
      priority: "high",
      url: "https://example.com/plan",
      note: "Bring the badge",
    });
  });

  it("marks the chosen color as pressed", async () => {
    const { user } = open();
    await user.click(screen.getByRole("button", { name: "色 teal" }));
    expect(screen.getByRole("button", { name: "色 teal" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "色 blue" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("closes on Escape", async () => {
    const { onClose, user } = open();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
