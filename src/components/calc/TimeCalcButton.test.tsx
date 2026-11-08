// @vitest-environment happy-dom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimeCalcButton } from "@/components/calc/TimeCalcButton";

afterEach(cleanup);

async function open() {
  const user = userEvent.setup();
  render(<TimeCalcButton />);
  const trigger = screen.getByRole("button", { name: "時間計算を開く" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "時間計算" });
  return { user, trigger, dialog };
}

describe("TimeCalcButton", () => {
  it("opens a dialog with the five calculations, and focuses its first field", async () => {
    const { dialog } = await open();
    expect(
      within(dialog)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      "時刻に時間を足す・引く",
      "時刻と時刻の差(終わりが前なら翌日として数える)",
      "日付に日数を足す・引く",
      "日付と日付の日数の差",
      "時間と時間を足す・引く",
    ]);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.tagName).toBe("INPUT");
  });

  it("shows the result of the first calculation as the user types, in a live region", async () => {
    const { user, dialog } = await open();
    const section = within(dialog).getByRole("region", {
      name: "時刻に時間を足す・引く",
    });
    const result = section.querySelector("output")!;
    expect(result.textContent).toBe("入力すると、結果が出ます");
    await user.type(within(section).getByLabelText("時刻"), "14:30");
    await user.type(within(section).getByLabelText("分"), "45");
    expect(result.textContent).toBe("結果: 15:15");
    await user.selectOptions(
      within(section).getByLabelText("足す／引く"),
      "-1",
    );
    expect(result.textContent).toBe("結果: 13:45");
  });

  it("closes on Escape and gives the focus back to the button", async () => {
    const { user, trigger } = await open();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not let Escape reach the handlers that go back a level", async () => {
    const { user } = await open();
    const goBack = vi.fn();
    window.addEventListener("keydown", goBack);
    await user.keyboard("{Escape}");
    window.removeEventListener("keydown", goBack);
    expect(goBack).not.toHaveBeenCalled();
  });

  it("closes with the close button and by a click on the backdrop, not inside the dialog", async () => {
    const { user, dialog } = await open();
    await user.click(dialog);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "時間計算を開く" }));
    const again = await screen.findByRole("dialog");
    await user.click(again.parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
