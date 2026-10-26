import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/domain/event";
import {
  buildDraft,
  fromDateInput,
  fromTimeInput,
  initialFormValues,
  toDateInput,
  toTimeInput,
} from "./eventForm";

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

describe("date and time inputs", () => {
  it("writes a date with zero padding, as the date input expects", () => {
    expect(toDateInput(DATE)).toBe("2026-07-05");
  });

  it("reads a date input back into its parts", () => {
    expect(fromDateInput("2026-07-05")).toEqual(DATE);
  });

  it("writes a time with zero padding and falls back when there is none", () => {
    expect(toTimeInput({ hour: 9, minute: 5 }, "00:00")).toBe("09:05");
    expect(toTimeInput(undefined, "09:00")).toBe("09:00");
  });

  it("reads a time input back into its parts", () => {
    expect(fromTimeInput("13:05")).toEqual({ hour: 13, minute: 5 });
  });
});

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

describe("buildDraft", () => {
  const values = initialFormValues(timed, DATE);

  it("keeps the times of a timed event", () => {
    const draft = buildDraft(values);

    expect(draft.start).toEqual({
      date: DATE,
      time: { hour: 13, minute: 5 },
    });
    expect(draft.end.time).toEqual({ hour: 15, minute: 30 });
  });

  it("drops the times of an all-day event, even if the inputs still hold some", () => {
    const draft = buildDraft({ ...values, allDay: true });

    expect(draft.start.time).toBeUndefined();
    expect(draft.end.time).toBeUndefined();
  });

  it("trims the URL and the note", () => {
    const draft = buildDraft({
      ...values,
      url: "  https://x.test ",
      note: " n ",
    });

    expect(draft.url).toBe("https://x.test");
    expect(draft.note).toBe("n");
  });

  it("leaves out a URL or a note that is only spaces", () => {
    const draft = buildDraft({ ...values, url: "   ", note: "" });

    expect(draft.url).toBeUndefined();
    expect(draft.note).toBeUndefined();
  });

  it("does not trim the title, because the validation decides about it", () => {
    expect(buildDraft({ ...values, title: "  x " }).title).toBe("  x ");
  });
});
