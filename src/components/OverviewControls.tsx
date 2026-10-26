import { SegmentButton } from "@/components/SegmentButton";

export function NavButton({
  onClick,
  label,
  disabled = false,
  className = "",
  suppressHydrationWarning = false,
}: {
  readonly onClick: () => void;
  readonly label: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly suppressHydrationWarning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      suppressHydrationWarning={suppressHydrationWarning}
      className={`rounded-md border px-2.5 py-1 text-sm font-medium tabular-nums transition-opacity ${disabled ? "cursor-default opacity-40" : "hover:opacity-70"} ${className}`}
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      {label}
    </button>
  );
}

function LayoutButton({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <SegmentButton
      label={label}
      active={active}
      onClick={onClick}
      aria-pressed={active}
    />
  );
}

export type OverviewLayout = "3x4" | "4x3";

export function LayoutToggle({
  layout,
  onLayoutChange,
}: {
  readonly layout: OverviewLayout;
  readonly onLayoutChange: (layout: OverviewLayout) => void;
}) {
  return (
    <div
      className="hidden items-center gap-1 rounded-lg border px-2 py-1 min-[1288px]:flex"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <span className="mr-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
        表示
      </span>
      <LayoutButton
        label="3×4"
        active={layout === "3x4"}
        onClick={() => onLayoutChange("3x4")}
      />
      <LayoutButton
        label="4×3"
        active={layout === "4x3"}
        onClick={() => onLayoutChange("4x3")}
      />
    </div>
  );
}
