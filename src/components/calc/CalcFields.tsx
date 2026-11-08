"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { Sign } from "@/components/calc/calcModel";

const labelCls = "block text-xs font-medium";
const inputCls = "rounded-md border px-2 py-1.5 text-sm";
const inputStyle = {
  borderColor: "var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};

export function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput({
  type,
  value,
  onChange,
  width = "w-32",
}: {
  readonly type: "time" | "date" | "number";
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly width?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={type === "number" ? 0 : undefined}
      inputMode={type === "number" ? "numeric" : undefined}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className={`${inputCls} ${width}`}
      style={inputStyle}
    />
  );
}

export function SignSelect({
  value,
  onChange,
}: {
  readonly value: Sign;
  readonly onChange: (value: Sign) => void;
}) {
  return (
    <Field label="足す／引く">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as Sign)}
        className={inputCls}
        style={inputStyle}
      >
        <option value={1}>＋ 足す</option>
        <option value={-1}>− 引く</option>
      </select>
    </Field>
  );
}

export function CalcSection({
  title,
  result,
  children,
}: {
  readonly title: string;
  readonly result: string | null;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-lg border p-3"
      style={{ borderColor: "var(--border)" }}
    >
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="flex flex-wrap items-end gap-2">{children}</div>
      <output
        className="mt-2 block text-sm"
        style={{ color: result === null ? "var(--text-muted)" : "var(--text)" }}
      >
        {result === null ? "入力すると、結果が出ます" : `結果: ${result}`}
      </output>
    </section>
  );
}
