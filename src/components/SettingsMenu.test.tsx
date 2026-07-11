// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SettingsMenu } from "@/components/SettingsMenu";

describe("SettingsMenu a11y", () => {
  it("歯車ボタンは aria-haspopup と aria-expanded(false) を持つ", () => {
    render(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    const gear = screen.getByRole("button", { name: "設定" });
    expect(gear).toHaveAttribute("aria-haspopup");
    expect(gear).toHaveAttribute("aria-expanded", "false");
  });

  it("開くとダイアログが表示され、内部にフォーカスが移る", async () => {
    const user = userEvent.setup();
    render(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "設定" }));
    const dialog = screen.getByRole("dialog", { name: "設定" });
    expect(dialog).toBeInTheDocument();
    // フォーカスがポップオーバー内部の要素に移っている
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("Escで閉じ、歯車ボタンにフォーカスが戻る", async () => {
    const user = userEvent.setup();
    render(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    const gear = screen.getByRole("button", { name: "設定" });
    await user.click(gear);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(gear);
  });
});
