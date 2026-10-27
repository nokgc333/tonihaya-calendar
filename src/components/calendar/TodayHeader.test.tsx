// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TodayHeader } from "@/components/calendar/TodayHeader";

afterEach(cleanup);

const countdowns = {
  toSaturday: 3,
  toMonthEnd: 16,
  remainingBusinessDays: 12,
  toYearEnd: 169,
};

describe("TodayHeader", () => {
  it("shows today with the era year and the weekday", () => {
    render(
      <TodayHeader
        today={{ year: 2026, month: 7, day: 15 }}
        countdowns={null}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "2026年(令和8年) 7月15日 水曜日",
    );
  });

  it("has no readable text until today is known", () => {
    render(<TodayHeader today={null} countdowns={null} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "" }),
    ).toBeInTheDocument();
  });

  it("holds the room of the date with hidden text until today is known, so that the page does not move when it arrives", () => {
    const { container } = render(
      <TodayHeader today={null} countdowns={null} />,
    );
    const placeholder = container.querySelector("h1 span")!;
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder.className).toContain("invisible");
    expect(placeholder.textContent).toMatch(/年.*月.*日.*曜日/);
  });

  it("replaces the hidden text with the date once today is known", () => {
    render(
      <TodayHeader
        today={{ year: 2026, month: 7, day: 15 }}
        countdowns={null}
      />,
    );
    expect(document.querySelector("h1 span")).toBeNull();
  });

  it("shows the countdown chips only when there are countdowns", () => {
    const { rerender } = render(
      <TodayHeader today={null} countdowns={countdowns} />,
    );
    expect(screen.getByText("土曜まで")).toBeInTheDocument();
    rerender(<TodayHeader today={null} countdowns={null} />);
    expect(screen.queryByText("土曜まで")).not.toBeInTheDocument();
  });

  it("hides the chips on narrow screens, where the month view shows them as blocks", () => {
    const { container } = render(
      <TodayHeader today={null} countdowns={countdowns} />,
    );
    expect(
      container.querySelector("[class*='max-[712px]:hidden']"),
    ).not.toBeNull();
  });
});
