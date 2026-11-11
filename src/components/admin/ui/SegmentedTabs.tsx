"use client";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Tab segmen (mobile): satu pilihan aktif, tap target 44px. */
export default function SegmentedTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}): React.JSX.Element {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid gap-1 rounded-lg border border-offwhite/10 bg-charcoal-darkest p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition ${
              active ? "bg-terracotta text-offwhite-pure" : "text-offwhite-muted hover:text-offwhite"
            }`}
          >
            <span className="truncate">{o.label}</span>
            {o.count !== undefined && (
              <span className="tabular-nums text-xs opacity-80">{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
