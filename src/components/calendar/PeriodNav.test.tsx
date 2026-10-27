// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PeriodNav } from "@/components/calendar/PeriodNav";
import { StepButton } from "@/components/common/StepButton";
import { ViewActions } from "@/components/calendar/ViewActions";
import { renderInApp } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

const handlers = () => ({
  onBack: vi.fn(),
  onShift: vi.fn(),
  onJump: vi.fn(),
  onWeekStartChange: vi.fn(),
});

const show = (over: Partial<Parameters<typeof PeriodNav>[0]> = {}) => {
  const h = handlers();
  const view = renderInApp(
    <PeriodNav
      level="week"
      navLabel="週の表示の操作"
      backLabel="月に戻る（Escでも戻れます）"
      prevLabel="前の週"
      nextLabel="次の週"
      title="2026年 7月12日 〜 7月18日"
      titleClassName="min-w-[15rem]"
      className="shrink-0"
      addDate={{ year: 2026, month: 7, day: 15 }}
      weekStart="sun"
      {...h}
      {...over}
    />,
  );
  return { h, view };
};

describe("PeriodNav", () => {
  it("is a navigation landmark with the name it is given", async () => {
    await show().view;
    expect(
      screen.getByRole("navigation", { name: "週の表示の操作" }),
    ).toBeInTheDocument();
  });

  it("shows the title between the two step buttons", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月12日 〜 7月18日")).toBeInTheDocument();
    expect(screen.getByLabelText("前の週")).toBeInTheDocument();
    expect(screen.getByLabelText("次の週")).toBeInTheDocument();
  });

  it("goes back, and one step each way", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByLabelText("月に戻る（Escでも戻れます）"));
    fireEvent.click(screen.getByLabelText("前の週"));
    fireEvent.click(screen.getByLabelText("次の週"));
    expect(h.onBack).toHaveBeenCalledTimes(1);
    expect(h.onShift.mock.calls).toEqual([[-1], [1]]);
  });

  it("marks its own level as current in the level switcher", async () => {
    const { view } = show({ level: "month" });
    await view;
    expect(screen.getByRole("button", { name: "月" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "週" })).toBeEnabled();
  });

  it("puts the extra classes on the bar and on the title", async () => {
    const { view } = show();
    const { container } = await view;
    expect(container.querySelector("nav")!.className).toContain("shrink-0");
    expect(screen.getByText("2026年 7月12日 〜 7月18日").className).toContain(
      "min-w-[15rem]",
    );
  });
});

describe("ViewActions", () => {
  it("offers adding an event on the date, switching the level and the settings", async () => {
    await renderInApp(
      <ViewActions
        level="day"
        addDate={{ year: 2026, month: 12, day: 5 }}
        weekStart="mon"
        onJump={vi.fn()}
        onWeekStartChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-12-05");
    expect(screen.getByRole("button", { name: "設定" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "日" })).toBeDisabled();
  });

  it("shows what it is given before the other actions", async () => {
    const { container } = await renderInApp(
      <ViewActions
        level="overview"
        addDate={{ year: 2026, month: 1, day: 1 }}
        weekStart="sun"
        onJump={vi.fn()}
        onWeekStartChange={vi.fn()}
      >
        <span data-testid="first">first</span>
      </ViewActions>,
    );
    const first = screen.getByTestId("first");
    expect(container.querySelector("div")!.firstElementChild).toBe(first);
  });
});

describe("StepButton", () => {
  it("is a labeled button that calls the handler", () => {
    const onClick = vi.fn();
    render(<StepButton label="前の日" glyph="‹" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "前の日" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.textContent).toBe("‹");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
