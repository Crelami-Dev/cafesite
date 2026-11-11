import Image from "next/image";
import type { CafePhotoProps } from "@/types";
export function CafePhoto({
  src,
  alt,
  className = "",
  moment = false,
  reveal = false,
  priority = false,
  sizes = "(min-width: 1024px) 600px, 100vw",
}: CafePhotoProps): React.JSX.Element {
  const unoptimized = !src.startsWith("/Image/");
  return (
    <figure
      className={`relative overflow-hidden bg-charcoal-light ${className}`}
      data-reveal={reveal && !moment ? "wipe" : undefined}
      data-moment={moment ? "picture-develops" : undefined}
      data-moment-opts={moment ? '{"look":"film"}' : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={priority}
        unoptimized={unoptimized}
        className="object-cover"
      />
    </figure>
  );
}
