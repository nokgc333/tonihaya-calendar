// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DisplaySettingsProvider,
  useDisplaySettings,
} from "@/components/common/DisplaySettings";

function Probe() {
  const settings = useDisplaySettings();
  return (
    <div>
      <span data-testid="state">
        {String(settings.rokuyo)}/{String(settings.wafuMonth)}
      </span>
      <button type="button" onClick={() => settings.onRokuyoChange(false)}>
        rokuyo off
      </button>
      <button type="button" onClick={() => settings.onWafuMonthChange(false)}>
        wafu off
      </button>
      <span data-testid="theme">{settings.theme}</span>
      <button type="button" onClick={() => settings.onThemeChange("dark")}>
        theme dark
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});
afterEach(cleanup);

describe("DisplaySettingsProvider", () => {
  it("shows both the rokuyo and the Japanese month names without a provider and by default", () => {
    render(<Probe />);
    expect(screen.getByTestId("state").textContent).toBe("true/true");
    cleanup();
    render(
      <DisplaySettingsProvider>
        <Probe />
      </DisplaySettingsProvider>,
    );
    expect(screen.getByTestId("state").textContent).toBe("true/true");
  });

  it("reads the saved choices, and ignores a value it does not know", () => {
    localStorage.setItem("tonihaya.rokuyo", "off");
    localStorage.setItem("tonihaya.wafuMonth", "maybe");
    render(
      <DisplaySettingsProvider>
        <Probe />
      </DisplaySettingsProvider>,
    );
    expect(screen.getByTestId("state").textContent).toBe("false/true");
  });

  it("saves a change under its own key and keeps the other choice", async () => {
    const user = userEvent.setup();
    render(
      <DisplaySettingsProvider>
        <Probe />
      </DisplaySettingsProvider>,
    );
    await user.click(screen.getByText("rokuyo off"));
    expect(localStorage.getItem("tonihaya.rokuyo")).toBe("off");
    expect(localStorage.getItem("tonihaya.wafuMonth")).toBeNull();
    await user.click(screen.getByText("wafu off"));
    expect(localStorage.getItem("tonihaya.wafuMonth")).toBe("off");
    expect(screen.getByTestId("state").textContent).toBe("false/false");
  });

  it("follows the system by default, applies a saved theme, and saves and applies a change", async () => {
    const root = document.documentElement;
    const first = render(
      <DisplaySettingsProvider>
        <Probe />
      </DisplaySettingsProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(root.hasAttribute("data-theme")).toBe(false);
    const user = userEvent.setup();
    await user.click(screen.getByText("theme dark"));
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("tonihaya.theme")).toBe("dark");
    first.unmount();
    root.removeAttribute("data-theme");
    render(
      <DisplaySettingsProvider>
        <Probe />
      </DisplaySettingsProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
  });
});
