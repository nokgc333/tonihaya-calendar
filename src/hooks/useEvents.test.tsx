// @vitest-environment happy-dom
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { EventProvider, useEvents } from "@/hooks/useEvents";
import type { EventRepository } from "@/data/eventRepository";
import type { CalendarEvent, EventDraft } from "@/domain/event";

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

function Harness() {
  const { events, loading, addEvent, updateEvent, removeEvent } = useEvents();
  const [result, setResult] = useState<string>("");
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="count">{events.length}</span>
      <span data-testid="titles">{events.map((e) => e.title).join(",")}</span>
      <span data-testid="result">{result}</span>
      <button onClick={async () => setResult(String(await addEvent(draft("New event"))))}>add</button>
      <button onClick={() => events[0] && updateEvent({ ...events[0], title: "Updated" })}>update</button>
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
  it("loads the repository list on init and clears loading", async () => {
    renderWith(new FakeRepo([seeded("A")]));
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("updates optimistically with addEvent, saves to the repository and returns true", async () => {
    const repo = new FakeRepo();
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await user.click(screen.getByRole("button", { name: "add" }));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    expect(repo.store).toHaveLength(1);
    expect(repo.store[0].id).toBeTruthy();
    expect(screen.getByTestId("result")).toHaveTextContent("true");
  });

  it("updateEvent replaces the matching event", async () => {
    const repo = new FakeRepo([seeded("A")]);
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    await user.click(screen.getByRole("button", { name: "update" }));
    await waitFor(() => expect(screen.getByTestId("titles")).toHaveTextContent("Updated"));
  });

  it("removeEvent removes the matching event", async () => {
    const repo = new FakeRepo([seeded("A")]);
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    await user.click(screen.getByRole("button", { name: "remove" }));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
  });

  it("does not update optimistically and leaves state unchanged when saving fails", async () => {
    const repo = new ThrowingAddRepo();
    const user = userEvent.setup();
    renderWith(repo);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await user.click(screen.getByRole("button", { name: "add" }));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("false"));
    expect(repo.store).toHaveLength(0);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
