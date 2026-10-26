// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddEventButton } from "@/components/AddEventButton";
import { useEventEditor } from "@/hooks/useEventEditor";
import {
  MemoryRepository,
  makeEvent,
  renderInApp,
} from "../../tests/support/calendarHarness";

class FailingRepository extends MemoryRepository {
  async add(): Promise<void> {
    throw new Error("disk full");
  }
  async update(): Promise<void> {
    throw new Error("disk full");
  }
  async remove(): Promise<void> {
    throw new Error("disk full");
  }
}

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

  it("keeps the form open and shows an error when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await renderInApp(
      <AddEventButton date={date} />,
      [],
      new FailingRepository(),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "予定を作成" }));
    await user.type(screen.getByLabelText("タイトル"), "Kickoff");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(
      await screen.findByText(/保存できませんでした|保存に失敗/),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the event and shows an error when deleting fails", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    const repo = new FailingRepository([existing]);
    await renderInApp(<EditExisting id="Planning" />, [existing], repo);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "edit Planning" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(
      await screen.findByText(/削除できませんでした|削除に失敗/),
    ).toBeInTheDocument();
    expect(repo.store).toHaveLength(1);
  });

  it("refuses to be used outside its provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AddEventButton date={date} />)).toThrow(
      "useEventEditor must be used inside EventEditorProvider",
    );
  });

  it("is reachable after an act with no open dialog", async () => {
    await renderInApp(<AddEventButton date={date} />);
    await act(async () => {});
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("announces that a new event was saved, an edited one was saved and a deleted one was removed", async () => {
    const repo = new MemoryRepository([existing]);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    await renderInApp(
      <>
        <AddEventButton date={date} />
        <EditExisting id="Planning" />
      </>,
      [existing],
      repo,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const status = () => screen.getByRole("status").textContent?.trim();
    expect(status()).toBe("");

    await user.click(screen.getByRole("button", { name: "予定を作成" }));
    await user.type(screen.getByLabelText("タイトル"), "Kickoff");
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(status()).toBe("予定を保存しました"));

    await user.click(screen.getByRole("button", { name: "edit Planning" }));
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(status()).toBe("予定を保存しました");

    await user.click(screen.getByRole("button", { name: "edit Planning" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    await waitFor(() => expect(status()).toBe("予定を削除しました"));
  });

  it("announces nothing when saving fails, and shows the error as an alert instead", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await renderInApp(
      <AddEventButton date={date} />,
      [],
      new FailingRepository(),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "予定を作成" }));
    await user.type(screen.getByLabelText("タイトル"), "Kickoff");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /保存できませんでした/,
    );
    expect(screen.getByRole("status").textContent?.trim()).toBe("");
  });
});
