import Image from "next/image";
import type { CafePhotoProps } from "@/types";
export function CafePhoto({
  src,
  alt,
  className = "",
  moment = false,
  priority = false,
  sizes = "(min-width: 1024px) 600px, 100vw",
}: CafePhotoProps): React.JSX.Element {
  return (
    <figure
      className={`relative overflow-hidden bg-charcoal-light ${className}`}
      data-moment={moment ? "picture-develops" : undefined}
      data-moment-opts={moment ? '{"look":"film"}' : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={priority}
        className="object-cover"
      />
    </figure>
  );
}
