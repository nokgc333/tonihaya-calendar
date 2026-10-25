// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SettingsMenu } from "@/components/SettingsMenu";

describe("SettingsMenu a11y", () => {
  it("the gear button has aria-haspopup and aria-expanded(false)", () => {
    render(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    const gear = screen.getByRole("button", { name: "設定" });
    expect(gear).toHaveAttribute("aria-haspopup");
    expect(gear).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the dialog on open and moves focus inside it", async () => {
    const user = userEvent.setup();
    render(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "設定" }));
    const dialog = screen.getByRole("dialog", { name: "設定" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes on Esc and returns focus to the gear button", async () => {
    const user = userEvent.setup();
    render(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    const gear = screen.getByRole("button", { name: "設定" });
    await user.click(gear);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(gear);
  });
});
