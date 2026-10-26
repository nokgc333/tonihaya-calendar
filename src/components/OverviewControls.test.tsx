// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayoutToggle, NavButton } from "@/components/OverviewControls";

afterEach(cleanup);

describe("NavButton", () => {
  it("calls the click handler", () => {
    const onClick = vi.fn();
    render(<NavButton label="1 ›" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "1 ›" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is dimmed and does not call the handler when disabled", () => {
    const onClick = vi.fn();
    render(<NavButton label="今年" onClick={onClick} disabled />);
    const button = screen.getByRole("button", { name: "今年" });
    expect(button).toBeDisabled();
    expect(button.className).toContain("opacity-40");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("adds extra classes", () => {
    render(<NavButton label="x" onClick={vi.fn()} className="ml-1" />);
    expect(screen.getByRole("button").className).toContain("ml-1");
  });
});

describe("LayoutToggle", () => {
  it("marks only the current layout as pressed", () => {
    render(<LayoutToggle layout="4x3" onLayoutChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "4×3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "3×4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the layout that was picked", () => {
    const onLayoutChange = vi.fn();
    render(<LayoutToggle layout="3x4" onLayoutChange={onLayoutChange} />);
    fireEvent.click(screen.getByRole("button", { name: "4×3" }));
    expect(onLayoutChange).toHaveBeenCalledWith("4x3");
  });

  it("is shown only on wide screens", () => {
    const { container } = render(
      <LayoutToggle layout="3x4" onLayoutChange={vi.fn()} />,
    );
    expect(container.firstElementChild!.className).toContain("hidden");
    expect(container.firstElementChild!.className).toContain(
      "min-[1288px]:flex",
    );
  });
});
