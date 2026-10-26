// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { EventProvider, useEvents } from "@/hooks/useEvents";
import {
  MemoryRepository,
  makeEvent,
} from "../../tests/support/calendarHarness";

class FailingRepository extends MemoryRepository {
  async update(): Promise<void> {
    throw new Error("disk full");
  }
  async remove(): Promise<void> {
    throw new Error("disk full");
  }
}

afterEach(cleanup);

const setup = async () => {
  const event = makeEvent("a", [2026, 7, 1], [2026, 7, 1]);
  const repo = new FailingRepository([event]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EventProvider repository={repo}>{children}</EventProvider>
  );
  const hook = renderHook(() => useEvents(), { wrapper });
  await act(async () => {});
  return { hook, event, repo };
};

describe("useEvents when saving fails", () => {
  it("returns false and keeps the event unchanged when an update fails", async () => {
    const { hook, event } = await setup();
    let ok = true;
    await act(async () => {
      ok = await hook.result.current.updateEvent({
        ...event,
        title: "changed",
      });
    });
    expect(ok).toBe(false);
    expect(hook.result.current.events[0].title).toBe("a");
  });

  it("returns false and keeps the event when a removal fails", async () => {
    const { hook, event } = await setup();
    let ok = true;
    await act(async () => {
      ok = await hook.result.current.removeEvent(event.id);
    });
    expect(ok).toBe(false);
    expect(hook.result.current.events).toHaveLength(1);
  });
});
