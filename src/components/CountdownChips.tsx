import type { Countdown } from "@/domain/countdown";

export function CountdownChips({
  countdowns,
  block = false,
}: {
  readonly countdowns: Countdown;
  readonly block?: boolean;
}) {
  const items = [
    { label: "土曜まで", value: countdowns.toSaturday },
    { label: "残り営業日", value: countdowns.remainingBusinessDays },
    { label: "月末まで", value: countdowns.toMonthEnd },
    { label: "年末まで", value: countdowns.toYearEnd },
  ] as const;

  if (block) {
    return (
      <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-4">
        {items.map((it) => (
          <BlockChip key={it.label} label={it.label} value={it.value} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <CountdownChip key={it.label} label={it.label} value={it.value} />
      ))}
    </div>
  );
}

function CountdownChip({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div
      className="rounded-lg border px-3 py-1.5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="ml-1.5 text-base font-bold tabular-nums">{value}</span>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        日
      </span>
    </div>
  );
}

function BlockChip({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-base font-bold tabular-nums">
        {value}
        <span className="ml-0.5 text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
          日
        </span>
      </span>
    </div>
  );
}
