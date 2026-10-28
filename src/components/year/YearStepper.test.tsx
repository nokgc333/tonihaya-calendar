// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { YearStepper } from "@/components/year/YearStepper";

const today = { year: 2026, month: 7, day: 15 };
const setup = (year = 2026) => {
  const onYearChange = vi.fn();
  render(<YearStepper year={year} today={today} onYearChange={onYearChange} />);
  return { onYearChange, user: userEvent.setup() };
};
const input = () => screen.getByLabelText("表示する年（Enterで確定）");

describe("YearStepper", () => {
  it("steps by one and by ten", async () => {
    const { user, onYearChange } = setup();
    await user.click(screen.getByRole("button", { name: "1 ›" }));
    await user.click(screen.getByRole("button", { name: "‹ 1" }));
    await user.click(screen.getByRole("button", { name: "10 ››" }));
    await user.click(screen.getByRole("button", { name: "‹‹ 10" }));
    expect(onYearChange.mock.calls).toEqual([[2027], [2025], [2036], [2016]]);
  });

  it("clamps the steps to the supported range", async () => {
    const { user, onYearChange } = setup(2150);
    await user.click(screen.getByRole("button", { name: "10 ››" }));
    expect(onYearChange).toHaveBeenCalledWith(2150);
  });

  it("commits the typed year on Enter and leaves the field", async () => {
    const { user, onYearChange } = setup();
    await user.clear(input());
    await user.type(input(), "2031{Enter}");
    expect(onYearChange).toHaveBeenCalledWith(2031);
    expect(document.activeElement).not.toBe(input());
  });

  it("commits the typed year on blur and falls back for invalid input", async () => {
    const { user, onYearChange } = setup();
    await user.clear(input());
    await user.type(input(), "2040");
    await user.tab();
    expect(onYearChange).toHaveBeenLastCalledWith(2040);
    await user.clear(input());
    await user.tab();
    expect(onYearChange).toHaveBeenLastCalledWith(2026);
  });

  it("disables the this-year button only in the current year", () => {
    const { unmount } = render(
      <YearStepper year={2026} today={today} onYearChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "今年" })).toBeDisabled();
    unmount();
    render(<YearStepper year={2030} today={today} onYearChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "今年" })).toBeEnabled();
  });

  it("goes to the year of the clock when today is not known yet", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2031, 0, 5));
    const onYearChange = vi.fn();
    render(
      <YearStepper year={2026} today={null} onYearChange={onYearChange} />,
    );
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getByRole("button", { name: "今年" }));
    expect(onYearChange).toHaveBeenCalledWith(2031);
    vi.useRealTimers();
  });

  it("follows the year when it changes from outside, replacing a draft that was never committed", async () => {
    const onYearChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <YearStepper year={2026} today={today} onYearChange={onYearChange} />,
    );
    expect(input()).toHaveValue(2026);

    await user.clear(input());
    await user.type(input(), "2040");
    expect(input()).toHaveValue(2040);

    rerender(
      <YearStepper year={2030} today={today} onYearChange={onYearChange} />,
    );
    expect(input()).toHaveValue(2030);
    expect(onYearChange).not.toHaveBeenCalled();
  });
});
