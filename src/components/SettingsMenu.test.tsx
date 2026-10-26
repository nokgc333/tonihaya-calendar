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

  it("keeps focus where the user moved it when the parent re-renders", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "設定" }));
    const second = screen.getByRole("button", { name: "月" });
    second.focus();
    rerender(<SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />);
    expect(document.activeElement).toBe(second);
  });

  it("closes when the pointer goes down outside and stays open for inside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">outside</button>
        <SettingsMenu weekStart="sun" onWeekStartChange={vi.fn()} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "設定" }));
    await user.click(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports the week start that is chosen", async () => {
    const user = userEvent.setup();
    const onWeekStartChange = vi.fn();
    render(
      <SettingsMenu weekStart="sun" onWeekStartChange={onWeekStartChange} />,
    );
    await user.click(screen.getByRole("button", { name: "設定" }));
    await user.click(screen.getByRole("button", { name: "月" }));
    await user.click(screen.getByRole("button", { name: "日" }));
    expect(onWeekStartChange.mock.calls).toEqual([["mon"], ["sun"]]);
  });

  it("marks the current week start", async () => {
    const user = userEvent.setup();
    render(<SettingsMenu weekStart="mon" onWeekStartChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "設定" }));
    expect(screen.getByRole("button", { name: "月" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "日" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
