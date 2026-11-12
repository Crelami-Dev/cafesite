"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

export interface ProgressiveImageProps extends Omit<ImageProps, "placeholder"> {
  /** Matikan skeleton untuk gambar above-the-fold (Hero / lead utama). */
  disableSkeleton?: boolean;
  /** Kelas tambahan untuk lapisan skeleton agar menyatu dengan bentuk bingkai. */
  skeletonClassName?: string;
}

/**
 * Pembungkus next/image dengan lazy loading bawaan dan skeleton 3-warna presisi.
 * Merender Fragment langsung ke container parent (`relative overflow-hidden`) agar
 * tidak menambah node DOM ekstra dan tidak menggeser rasio layout (CLS = 0).
 */
export function ProgressiveImage({
  disableSkeleton = false,
  skeletonClassName = "",
  className = "",
  loading,
  decoding = "async",
  priority,
  preload,
  onLoad,
  onError,
  ...props
}: ProgressiveImageProps): React.JSX.Element {
  const srcKey = typeof props.src === "string" ? props.src : "";
  const eager = Boolean(priority || preload || disableSkeleton);

  const [loadedSrc, setLoadedSrc] = useState<string | null>(() =>
    eager && srcKey ? srcKey : null,
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const isLoaded = eager || (Boolean(srcKey) && loadedSrc === srcKey);
  const isFailed = Boolean(srcKey) && failedSrc === srcKey;

  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || eager || !srcKey) return;
      if (node.complete && node.naturalWidth > 0) {
        setLoadedSrc(srcKey);
      }
    },
    [eager, srcKey],
  );

  return (
    <>
      {!disableSkeleton && !isLoaded && !isFailed && (
        <span
          aria-hidden="true"
          className={`cafe-img-skeleton pointer-events-none absolute inset-0 z-10 ${skeletonClassName}`}
        />
      )}
      <Image
        ref={imgRef}
        {...props}
        priority={priority}
        preload={preload}
        loading={eager ? undefined : (loading ?? "lazy")}
        decoding={decoding}
        onLoad={(event) => {
          if (srcKey) setLoadedSrc(srcKey);
          onLoad?.(event);
        }}
        onError={(event) => {
          if (srcKey) setFailedSrc(srcKey);
          onError?.(event);
        }}
        className={`cafe-img-media ${isLoaded || disableSkeleton ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </>
  );
}

