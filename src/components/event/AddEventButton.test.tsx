// @vitest-environment happy-dom
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AddEventButton } from "@/components/event/AddEventButton";
import { renderInApp } from "../../../tests/support/calendarHarness";

afterEach(cleanup);

describe("AddEventButton", () => {
  it("is a labeled button", async () => {
    await renderInApp(
      <AddEventButton date={{ year: 2026, month: 7, day: 20 }} />,
    );
    expect(screen.getByRole("button", { name: "予定を作成" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("opens an empty form on the date it was given", async () => {
    await renderInApp(
      <AddEventButton date={{ year: 2026, month: 12, day: 5 }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(
      screen.getByRole("dialog", { name: "予定を作成" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-12-05");
    expect(screen.getByLabelText("終了日")).toHaveValue("2026-12-05");
    expect(screen.getByLabelText("タイトル")).toHaveValue("");
  });
});
