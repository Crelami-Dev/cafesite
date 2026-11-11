import Link from "next/link";

/** Angka besar + label pendek. `primary` = kartu terang (satu per layar). */
export default function StatTile({
  label,
  value,
  href,
  primary = false,
  className = "",
}: {
  label: string;
  value: string;
  href?: string;
  primary?: boolean;
  className?: string;
}): React.JSX.Element {
  const tone = primary
    ? "border-offwhite bg-offwhite text-charcoal"
    : "border-offwhite/10 bg-charcoal-light text-offwhite";
  const muted = primary ? "text-charcoal-muted" : "text-offwhite-muted";
  const body = (
    <>
      <p className={`text-xs font-medium sm:text-sm ${muted}`}>{label}</p>
      <p
        className={`mt-1.5 truncate font-sans font-semibold leading-none tabular-nums sm:mt-2 ${
          primary ? "text-4xl xl:text-3xl" : "text-3xl"
        }`}
      >
        {value}
      </p>
    </>
  );
  const cls = `block min-w-0 rounded-lg border p-3.5 sm:p-5 ${tone} ${className}`;
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
