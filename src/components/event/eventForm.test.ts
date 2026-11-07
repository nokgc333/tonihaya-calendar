import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import { initialFormValues } from "./eventForm";

const DATE = { year: 2026, month: 7, day: 5 };

const timed: CalendarEvent = {
  id: "e1",
  title: "Meeting",
  allDay: false,
  start: { date: DATE, time: { hour: 13, minute: 5 } },
  end: { date: { ...DATE, day: 6 }, time: { hour: 15, minute: 30 } },
  colorKey: "rose",
  priority: "high",
  url: "https://example.test/a",
  note: "bring slides",
  createdAt: 1,
  updatedAt: 2,
};

describe("initialFormValues", () => {
  it("starts a new event as an all-day blue event on the given day, from 9:00 to 10:00 once times are on", () => {
    expect(initialFormValues(null, DATE)).toEqual({
      title: "",
      allDay: true,
      startDate: "2026-07-05",
      endDate: "2026-07-05",
      startTime: "09:00",
      endTime: "10:00",
      colorKey: "blue",
      priority: "normal",
      url: "",
      note: "",
    });
  });

  it("fills every field from the event that is being edited", () => {
    expect(initialFormValues(timed, DATE)).toEqual({
      title: "Meeting",
      allDay: false,
      startDate: "2026-07-05",
      endDate: "2026-07-06",
      startTime: "13:05",
      endTime: "15:30",
      colorKey: "rose",
      priority: "high",
      url: "https://example.test/a",
      note: "bring slides",
    });
  });
});
