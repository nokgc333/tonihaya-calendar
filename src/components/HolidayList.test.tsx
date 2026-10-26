// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HolidayList } from "@/components/HolidayList";

afterEach(cleanup);

describe("HolidayList", () => {
  it("lists the holidays of the year with their count", () => {
    render(<HolidayList year={2026} today={null} onMonthClick={vi.fn()} />);
    expect(screen.getByText("祝日一覧")).toBeInTheDocument();
    expect(screen.getByText("元日")).toBeInTheDocument();
    expect(screen.getByText("海の日")).toBeInTheDocument();
  });

  it("opens the month of the row that is clicked", () => {
    const onMonthClick = vi.fn();
    render(
      <HolidayList year={2026} today={null} onMonthClick={onMonthClick} />,
    );
    fireEvent.click(screen.getByText("海の日"));
    expect(onMonthClick).toHaveBeenCalledWith(7);
  });

  it("does not mark rows as past or current in another year", () => {
    const { container } = render(
      <HolidayList
        year={2030}
        today={{ year: 2026, month: 7, day: 15 }}
        onMonthClick={vi.fn()}
      />,
    );
    expect(container.querySelector("[aria-current]")).toBeNull();
  });
});
