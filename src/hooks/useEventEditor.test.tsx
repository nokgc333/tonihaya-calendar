// @vitest-environment happy-dom
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddEventButton } from "@/components/event/AddEventButton";
import { useEventEditor } from "@/hooks/useEventEditor";
import {
  MemoryRepository,
  makeEvent,
  renderInApp,
} from "../../tests/support/calendarHarness";

function EditExisting({ id }: { readonly id: string }) {
  const { openEdit } = useEventEditor();
  return (
    <button type="button" onClick={() => openEdit(id)}>
      edit {id}
    </button>
  );
}

const date = { year: 2026, month: 7, day: 20 };
const existing = makeEvent("Planning", [2026, 7, 20], [2026, 7, 20]);

describe("the event editor", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens an empty form on the given date and saves the new event", async () => {
    const repo = new MemoryRepository();
    await renderInApp(<AddEventButton date={date} />, [], repo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "予定を作成" }));
    expect(
      screen.getByRole("dialog", { name: "予定を作成" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("開始日")).toHaveValue("2026-07-20");
    await user.type(screen.getByLabelText("タイトル"), "Kickoff");
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(repo.store).toHaveLength(1));
    expect(repo.store[0].title).toBe("Kickoff");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the existing event and saves the change as an update", async () => {
    const repo = new MemoryRepository([existing]);
    await renderInApp(<EditExisting id="Planning" />, [existing], repo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "edit Planning" }));
    expect(
      screen.getByRole("dialog", { name: "予定を編集" }),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText("タイトル"));
    await user.type(screen.getByLabelText("タイトル"), "Planning v2");
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(repo.store[0].title).toBe("Planning v2"));
    expect(repo.store).toHaveLength(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes the event after the user confirms", async () => {
    const repo = new MemoryRepository([existing]);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    await renderInApp(<EditExisting id="Planning" />, [existing], repo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "edit Planning" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    await waitFor(() => expect(repo.store).toHaveLength(0));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the event when the user declines the deletion", async () => {
    const repo = new MemoryRepository([existing]);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );
    await renderInApp(<EditExisting id="Planning" />, [existing], repo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "edit Planning" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(repo.store).toHaveLength(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes without saving on cancel", async () => {
    const repo = new MemoryRepository();
    await renderInApp(<AddEventButton date={date} />, [], repo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "予定を作成" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(repo.store).toHaveLength(0);
  });
});
