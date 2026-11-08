"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalcSection,
  Field,
  SignSelect,
  TextInput,
} from "@/components/calc/CalcFields";
import {
  dateDifference,
  datePlusMinus,
  durationPlusMinus,
  timeDifference,
  timePlusMinus,
  type Sign,
} from "@/components/calc/calcModel";

function TimePlusMinus() {
  const [time, setTime] = useState("");
  const [sign, setSign] = useState<Sign>(1);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  return (
    <CalcSection
      title="時刻に時間を足す・引く"
      result={timePlusMinus(time, sign, hours, minutes)}
    >
      <Field label="時刻">
        <TextInput type="time" value={time} onChange={setTime} />
      </Field>
      <SignSelect value={sign} onChange={setSign} />
      <Field label="時間">
        <TextInput
          type="number"
          value={hours}
          onChange={setHours}
          width="w-20"
        />
      </Field>
      <Field label="分">
        <TextInput
          type="number"
          value={minutes}
          onChange={setMinutes}
          width="w-20"
        />
      </Field>
    </CalcSection>
  );
}

function TimeDifference() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  return (
    <CalcSection
      title="時刻と時刻の差(終わりが前なら翌日として数える)"
      result={timeDifference(start, end)}
    >
      <Field label="はじめ">
        <TextInput type="time" value={start} onChange={setStart} />
      </Field>
      <Field label="おわり">
        <TextInput type="time" value={end} onChange={setEnd} />
      </Field>
    </CalcSection>
  );
}

function DatePlusMinus() {
  const [date, setDate] = useState("");
  const [sign, setSign] = useState<Sign>(1);
  const [days, setDays] = useState("");
  return (
    <CalcSection
      title="日付に日数を足す・引く"
      result={datePlusMinus(date, sign, days)}
    >
      <Field label="日付">
        <TextInput type="date" value={date} onChange={setDate} width="w-40" />
      </Field>
      <SignSelect value={sign} onChange={setSign} />
      <Field label="日数">
        <TextInput type="number" value={days} onChange={setDays} width="w-24" />
      </Field>
    </CalcSection>
  );
}

function DateDifference() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return (
    <CalcSection title="日付と日付の日数の差" result={dateDifference(from, to)}>
      <Field label="はじめ">
        <TextInput type="date" value={from} onChange={setFrom} width="w-40" />
      </Field>
      <Field label="おわり">
        <TextInput type="date" value={to} onChange={setTo} width="w-40" />
      </Field>
    </CalcSection>
  );
}

function DurationPlusMinus() {
  const [aHours, setAHours] = useState("");
  const [aMinutes, setAMinutes] = useState("");
  const [sign, setSign] = useState<Sign>(1);
  const [bHours, setBHours] = useState("");
  const [bMinutes, setBMinutes] = useState("");
  return (
    <CalcSection
      title="時間と時間を足す・引く"
      result={durationPlusMinus({ hours: aHours, minutes: aMinutes }, sign, {
        hours: bHours,
        minutes: bMinutes,
      })}
    >
      <Field label="時間(1つ目)">
        <TextInput
          type="number"
          value={aHours}
          onChange={setAHours}
          width="w-20"
        />
      </Field>
      <Field label="分(1つ目)">
        <TextInput
          type="number"
          value={aMinutes}
          onChange={setAMinutes}
          width="w-20"
        />
      </Field>
      <SignSelect value={sign} onChange={setSign} />
      <Field label="時間(2つ目)">
        <TextInput
          type="number"
          value={bHours}
          onChange={setBHours}
          width="w-20"
        />
      </Field>
      <Field label="分(2つ目)">
        <TextInput
          type="number"
          value={bMinutes}
          onChange={setBMinutes}
          width="w-20"
        />
      </Field>
    </CalcSection>
  );
}

export default function TimeCalcDialog({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const firstRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    firstRef.current?.querySelector<HTMLElement>("input")?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="時間計算"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border p-4 shadow-xl"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">時間計算</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-md px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
        <div ref={firstRef} className="space-y-3">
          <TimePlusMinus />
          <TimeDifference />
          <DatePlusMinus />
          <DateDifference />
          <DurationPlusMinus />
        </div>
      </div>
    </div>
  );
}
