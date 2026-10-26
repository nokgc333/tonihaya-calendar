// @vitest-environment happy-dom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DayScreen,
  MonthScreen,
  OverviewScreen,
  WeekScreen,
  type ScreenShared,
} from "@/components/CalendarScreens";
import { renderInApp } from "../../tests/support/calendarHarness";

const shared: ScreenShared = {
  year: 2026,
  today: { year: 2026, month: 7, day: 15 },
  countdowns: {
    toSaturday: 3,
    toMonthEnd: 16,
    remainingBusinessDays: 12,
    toYearEnd: 169,
  },
  weekStart: "sun",
  onWeekStartChange: vi.fn(),
  jumpPivot: null,
  onJump: vi.fn(),
};

const noop = vi.fn();

describe("CalendarScreens", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the day view under the today header in a full-height frame", async () => {
    const { container } = await renderInApp(
      <DayScreen
        shared={shared}
        month={7}
        day={15}
        nav={{ onBack: noop, onDayChange: noop }}
      />,
    );
    expect(container.querySelector("main")!.className).toContain("h-dvh");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "7月15日",
    );
    expect(
      screen.getByLabelText("週に戻る（Escでも戻れます）"),
    ).toBeInTheDocument();
  });

  it("shows the week view in a full-height frame", async () => {
    const { container } = await renderInApp(
      <WeekScreen
        shared={shared}
        month={7}
        day={15}
        dayPivot={null}
        pivotDay={null}
        nav={{ onBack: noop, onWeekChange: noop, onDayOpen: noop }}
      />,
    );
    expect(container.querySelector("main")!.className).toContain("h-dvh");
    expect(
      screen.getByLabelText("月に戻る（Escでも戻れます）"),
    ).toBeInTheDocument();
  });

  it("shows the month detail in a frame that scrolls with the page", async () => {
    const { container } = await renderInApp(
      <MonthScreen
        shared={shared}
        month={7}
        pivotDay={null}
        nav={{ onBack: noop, onMonthChange: noop, onDayClick: noop }}
      />,
    );
    expect(container.querySelector("main")!.className).not.toContain("h-dvh");
    expect(
      screen.getByLabelText("俯瞰に戻る（Escでも戻れます）"),
    ).toBeInTheDocument();
  });

  it("shows the overview with the layout it is given", async () => {
    const { container } = await renderInApp(
      <OverviewScreen
        shared={shared}
        layout="4x3"
        onLayoutChange={noop}
        nav={{ onYearChange: noop, onMonthClick: noop }}
      />,
    );
    expect(container.querySelectorAll("section[role='button']")).toHaveLength(
      12,
    );
    expect(screen.getByRole("button", { name: "4×3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the countdowns in the header of every screen that has them", async () => {
    await renderInApp(
      <DayScreen
        shared={shared}
        month={7}
        day={15}
        nav={{ onBack: noop, onDayChange: noop }}
      />,
    );
    expect(screen.getByText("土曜まで")).toBeInTheDocument();
  });
});
