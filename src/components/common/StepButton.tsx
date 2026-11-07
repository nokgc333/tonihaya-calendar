export function StepButton({
  label,
  glyph,
  onClick,
}: {
  readonly label: string;
  readonly glyph: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
      aria-label={label}
    >
      {glyph}
    </button>
  );
}
