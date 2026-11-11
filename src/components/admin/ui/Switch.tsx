"use client";

/** Saklar on/off yang bisa dibaca: kata + posisi, bukan warna saja. */
export default function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex min-h-11 min-w-11 items-center justify-center disabled:opacity-50"
    >
      <span
        className={`relative h-6 w-11 rounded-full border transition ${
          checked ? "border-terracotta bg-terracotta" : "border-offwhite/30 bg-charcoal-darkest"
        }`}
      >
        <span
          className={`absolute top-0.5 rounded-full transition-all ${
            checked ? "left-[22px] bg-offwhite-pure" : "left-0.5 bg-offwhite-muted"
          }`}
          style={{ height: 18, width: 18 }}
        />
      </span>
    </button>
  );
}
