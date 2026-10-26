// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LevelSwitcher } from "@/components/LevelSwitcher";

afterEach(cleanup);

const group = () => screen.getByRole("group", { name: "表示レベルの切替" });

describe("LevelSwitcher", () => {
  it("offers the four levels in order from the year to the day", () => {
    render(<LevelSwitcher current="month" onJump={vi.fn()} />);
    const labels = within(group())
      .getAllByRole("button")
      .map((b) => b.textContent);
    expect(labels).toEqual(["年", "月", "週", "日"]);
  });

  it.each([
    ["年", "overview"],
    ["月", "month"],
    ["週", "week"],
    ["日", "day"],
  ] as const)(
    "jumps to %s when it is not the current level",
    (label, level) => {
      const onJump = vi.fn();
      render(
        <LevelSwitcher
          current={level === "overview" ? "day" : "overview"}
          onJump={onJump}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(onJump).toHaveBeenCalledWith(level);
    },
  );

  it("disables and marks the current level, and does not jump from it", () => {
    const onJump = vi.fn();
    render(<LevelSwitcher current="week" onJump={onJump} />);
    const current = screen.getByRole("button", { name: "週" });
    expect(current).toBeDisabled();
    expect(current).toHaveAttribute("aria-current", "true");
    fireEvent.click(current);
    expect(onJump).not.toHaveBeenCalled();
  });

  it("leaves the other levels enabled and unmarked", () => {
    render(<LevelSwitcher current="week" onJump={vi.fn()} />);
    for (const name of ["年", "月", "日"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeEnabled();
      expect(button).not.toHaveAttribute("aria-current");
    }
  });
});
