"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * A cover or poster image fetched from an allowed remote host (or a local
 * file under public/), inside its 2:3 frame. `object-contain` rather than
 * `object-cover`: a poster that is not exactly 2:3 is shown whole, with the
 * page's own ivory showing either side, rather than having its edges or any
 * text on it cropped away.
 *
 * If the image fails to load — a bad URL, a host that stops serving it, a
 * network error — this quietly falls back to the typographic cover passed
 * in as `fallback`, the same one shown when no image was given at all. This
 * has to be a Client Component because only the browser knows when an
 * <img> has failed; the fallback itself still renders identically to its
 * server-rendered counterpart.
 */
export function RemoteCover({
  src,
  alt,
  eager,
  sizes,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  eager: boolean;
  sizes: string;
  className: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <div className={`relative aspect-2/3 overflow-hidden border border-rule-soft bg-surface ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={eager}
        loading={eager ? undefined : "lazy"}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
