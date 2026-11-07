// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CalcSection,
  Field,
  SignSelect,
  TextInput,
} from "@/components/calc/CalcFields";

afterEach(cleanup);

describe("CalcFields", () => {
  it("names an input by its label and reports what is typed", async () => {
    const onChange = vi.fn();
    render(
      <Field label="分">
        <TextInput type="number" value="" onChange={onChange} />
      </Field>,
    );
    await userEvent.setup().type(screen.getByLabelText("分"), "5");
    expect(onChange).toHaveBeenCalledWith("5");
    expect(screen.getByLabelText("分")).toHaveAttribute("inputmode", "numeric");
  });

  it("offers plus and minus, and reports the sign as a number", async () => {
    const onChange = vi.fn();
    render(<SignSelect value={1} onChange={onChange} />);
    await userEvent
      .setup()
      .selectOptions(screen.getByLabelText("足す／引く"), "-1");
    expect(onChange).toHaveBeenCalledWith(-1);
  });

  it("shows the result of a section, or a hint while the input is incomplete", () => {
    const { rerender } = render(
      <CalcSection title="例" result={null}>
        <span />
      </CalcSection>,
    );
    const section = screen.getByRole("region", { name: "例" });
    expect(section.querySelector("output")?.textContent).toBe(
      "入力すると、結果が出ます",
    );
    rerender(
      <CalcSection title="例" result="15:15">
        <span />
      </CalcSection>,
    );
    expect(section.querySelector("output")?.textContent).toBe("結果: 15:15");
  });
});
