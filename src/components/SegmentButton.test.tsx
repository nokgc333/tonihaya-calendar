// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SegmentButton } from "@/components/SegmentButton";

afterEach(cleanup);

describe("SegmentButton", () => {
  it("shows its label as a plain button that does not submit a form", () => {
    render(<SegmentButton label="月" active={false} />);
    expect(screen.getByRole("button", { name: "月" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("calls the click handler", () => {
    const onClick = vi.fn();
    render(<SegmentButton label="月" active={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is bold with the strong border when active", () => {
    render(<SegmentButton label="月" active />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("font-bold");
    expect(button.style.borderColor).toBe("var(--border-strong)");
    expect(button.style.background).toBe("var(--surface)");
  });

  it("uses the muted text color, not opacity, with the light border when inactive", () => {
    render(<SegmentButton label="月" active={false} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("text-[var(--text-muted)]");
    expect(button.className).not.toContain("opacity-60");
    expect(button.className).not.toContain("font-bold");
    expect(button.style.borderColor).toBe("var(--border)");
  });

  it("returns to the main text color on hover when inactive", () => {
    render(<SegmentButton label="月" active={false} />);
    expect(screen.getByRole("button").className).toContain(
      "hover:text-[var(--text)]",
    );
  });

  it("passes the other button attributes through and adds extra classes", () => {
    render(
      <SegmentButton
        label="月"
        active={false}
        disabled
        aria-pressed="true"
        className="extra"
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.className).toContain("extra");
  });
});
