// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { EventProvider, useEvents } from "@/hooks/useEvents";
import type { EventRepository } from "@/data/eventRepository";
import type { CalendarEvent, EventDraft } from "@/domain/event";

// 注入用の in-memory リポジトリ（localStorage に依存しない＝決定論的）。
class FakeRepo implements EventRepository {
  store: CalendarEvent[];
  constructor(seed: CalendarEvent[] = []) {
    this.store = [...seed];
  }
  async list() {
    return [...this.store];
  }
  async add(e: CalendarEvent) {
    this.store.push(e);
  }
  async update(e: CalendarEvent) {
    this.store = this.store.map((x) => (x.id === e.id ? e : x));
  }
  async remove(id: string) {
    this.store = this.store.filter((x) => x.id !== id);
  }
}

// add が必ず失敗するリポジトリ（error path 用）。
class ThrowingAddRepo extends FakeRepo {
  async add(): Promise<void> {
    throw new Error("save failed");
  }
}

const draft = (title: string): EventDraft => ({
  title,
  allDay: true,
  start: { date: { year: 2026, month: 7, day: 11 } },
  end: { date: { year: 2026, month: 7, day: 11 } },
  colorKey: "blue",
  priority: "normal",
});

const seeded = (title: string): CalendarEvent => ({
  ...draft(title),
  id: "seed-" + title,
  createdAt: 0,
  updatedAt: 0,
});

// useEvents を読み、操作ボタンと状態を露出する検証用ハーネス。
function Harness() {
  const { events, loading, addEvent, updateEvent, removeEvent } = useEvents();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="count">{events.length}</span>
      <span data-testid="titles">{events.map((e) => e.title).join(",")}</span>
      <button onClick={() => addEvent(draft("新規"))}>add</button>
      <button onClick={() => events[0] && updateEvent({ ...events[0], title: "更新後" })}>update</button>
      <button onClick={() => events[0] && removeEvent(events[0].id)}>remove</button>
    </div>
  );
}

const renderWith = (repo: EventRepository) =>
  render(
    <EventProvider repository={repo}>
      <Harness />
    </EventProvider>,
  );

describe("useEvents", () => {
  it("初期化時にリポジトリの一覧を読み込み loading を解除する", async () => {
    renderWith(new FakeRepo([seeded("A")]));
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("addEvent で楽観更新しリポジトリにも保存される", async () => {
    const repo = new FakeRepo();
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await user.click(screen.getByRole("button", { name: "add" }));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    expect(repo.store).toHaveLength(1);
    expect(repo.store[0].id).toBeTruthy();
  });

  it("updateEvent で該当予定が置換される", async () => {
    const repo = new FakeRepo([seeded("A")]);
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    await user.click(screen.getByRole("button", { name: "update" }));
    await waitFor(() => expect(screen.getByTestId("titles")).toHaveTextContent("更新後"));
  });

  it("removeEvent で該当予定が除外される", async () => {
    const repo = new FakeRepo([seeded("A")]);
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    await user.click(screen.getByRole("button", { name: "remove" }));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
  });

  it("保存が失敗したときは楽観更新せず状態を変えない", async () => {
    const repo = new ThrowingAddRepo();
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await user.click(screen.getByRole("button", { name: "add" }));
    // add は失敗し握られる。保存も表示も増えない。
    await waitFor(() => expect(repo.store).toHaveLength(0));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
