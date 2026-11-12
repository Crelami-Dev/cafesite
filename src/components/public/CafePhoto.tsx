import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import type { CafePhotoProps } from "@/types";

export function CafePhoto({
  src,
  alt,
  className = "",
  reveal = false,
  priority = false,
  sizes = "(min-width: 1024px) 600px, 100vw",
}: CafePhotoProps): React.JSX.Element {
  const unoptimized = !src.startsWith("/Image/");
  return (
    <figure
      className={`relative overflow-hidden bg-charcoal-light ${className}`}
      data-reveal={reveal ? "wipe" : undefined}
    >
      <ProgressiveImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        disableSkeleton={priority}
        unoptimized={unoptimized}
        className="object-cover"
      />
    </figure>
  );
}
