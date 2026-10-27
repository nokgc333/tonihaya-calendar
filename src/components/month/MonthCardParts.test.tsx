// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MonthCardHeader, WeekdayRow } from "@/components/month/MonthCardParts";
import { buildMonthView } from "@/domain/view";

afterEach(cleanup);

const july = buildMonthView(2026, 7, null, "sun");

describe("MonthCardHeader", () => {
  it("shows the three names on one line in the large size", () => {
    const { container } = render(<MonthCardHeader month={july} size="lg" />);
    expect(container.querySelector("h2")!.textContent).toBe("7月");
    expect(container.textContent).toContain("July / ");
    expect(container.querySelector("header")!.className).toContain("mb-3");
  });

  it("puts the traditional name at the right edge in the small size", () => {
    const { container } = render(<MonthCardHeader month={july} size="sm" />);
    expect(container.querySelector("header")!.className).toContain("mb-2");
    expect(container.querySelector(".ml-auto")!.textContent).toBe(
      july.labelWafu,
    );
  });
});

describe("WeekdayRow", () => {
  it("lists the weekdays from Sunday or from Monday", () => {
    const sun = render(<WeekdayRow weekStart="sun" size="sm" />);
    expect(
      [...sun.container.querySelectorAll(".h-5")].map((e) => e.textContent),
    ).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
    cleanup();
    const mon = render(<WeekdayRow weekStart="mon" size="sm" />);
    expect(
      [...mon.container.querySelectorAll(".h-5")].map((e) => e.textContent),
    ).toEqual(["月", "火", "水", "木", "金", "土", "日"]);
  });
});
