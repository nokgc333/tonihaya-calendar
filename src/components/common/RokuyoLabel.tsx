import type { Rokuyo } from "@/domain/kyureki";

export function RokuyoLabel({
  rokuyo,
  id,
  className = "",
}: {
  readonly rokuyo: Rokuyo;
  readonly id?: string;
  readonly className?: string;
}) {
  return (
    <span
      id={id}
      className={`text-[10px] leading-none ${className}`}
      style={{ color: "var(--text-muted)" }}
    >
      {rokuyo}
    </span>
  );
}
