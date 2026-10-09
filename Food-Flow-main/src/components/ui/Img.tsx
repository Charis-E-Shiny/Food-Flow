import { useState } from "react";
import { cn } from "@/lib/cn";

// Image with a graceful gradient fallback. If the remote image
// fails (offline, 404), we keep a themed gradient placeholder so
// layouts never collapse or show broken-image glyphs.
export function Img({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-brand-tint", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-tint via-surface-2 to-brand-soft/30" aria-hidden />
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("relative h-full w-full object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
