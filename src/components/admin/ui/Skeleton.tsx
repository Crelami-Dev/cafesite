/** Placeholder pemuatan: blok berdenyut halus (diam bila reduced-motion). */
export default function Skeleton({ className = "h-24" }: { className?: string }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Memuat"
      className={`animate-pulse rounded-lg bg-charcoal-light motion-reduce:animate-none ${className}`}
    />
  );
}
