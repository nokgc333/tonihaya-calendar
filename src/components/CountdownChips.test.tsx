// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CountdownChips } from "@/components/CountdownChips";

afterEach(cleanup);

const countdowns = {
  toSaturday: 3,
  toMonthEnd: 16,
  remainingBusinessDays: 12,
  toYearEnd: 169,
};

const pairs = (root: HTMLElement): string[] =>
  [...root.querySelectorAll("span")]
    .map((s) => s.textContent ?? "")
    .filter((t) => t !== "日")
    .reduce<string[]>(
      (acc, t, i, all) =>
        i % 2 === 0 ? [...acc, `${t}=${all[i + 1]?.replace("日", "")}`] : acc,
      [],
    );

describe("CountdownChips", () => {
  it("shows the four countdowns in a fixed order", () => {
    const { container } = render(<CountdownChips countdowns={countdowns} />);
    expect(pairs(container)).toEqual([
      "土曜まで=3",
      "残り営業日=12",
      "月末まで=16",
      "年末まで=169",
    ]);
  });

  it("lays the chips out in a wrapping row by default", () => {
    const { container } = render(<CountdownChips countdowns={countdowns} />);
    expect(container.firstElementChild!.className).toContain("flex-wrap");
  });

  it("lays the chips out as a grid in the block form, with the same values", () => {
    const { container } = render(
      <CountdownChips countdowns={countdowns} block />,
    );
    expect(container.firstElementChild!.className).toContain("grid-cols-2");
    expect(container.textContent).toContain("土曜まで3日");
    expect(container.textContent).toContain("年末まで169日");
  });

  it("shows zero as a value, not as a missing one", () => {
    const { container } = render(
      <CountdownChips countdowns={{ ...countdowns, toSaturday: 0 }} />,
    );
    expect(container.textContent).toContain("土曜まで");
    expect(pairs(container)[0]).toBe("土曜まで=0");
  });
});
