"use client";

import { useEffect, useState } from "react";

export default function ProductImageView({
  src,
  alt,
  className = "",
  onClick,
  premiumOverlay = false,
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  premiumOverlay?: boolean;
}) {
  const [imageSrc, setImageSrc] = useState(src || "/images/placeholder.jpg");
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImageSrc(src || "/images/placeholder.jpg");
    setHasError(false);
    setLoaded(false);
  }, [src]);

  return (
    <div
      className={`group relative h-full w-full overflow-hidden ${className}`}
      onClick={onClick}
    >
      {!hasError && (
        <>
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="absolute inset-0 bg-[#eef4fb]" />
            <div className="absolute inset-0 animate-[shimmer_2.35s_linear_infinite] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.42)_45%,transparent_100%)]" />
          </div>

          <img
            src={imageSrc}
            alt={alt}
            className={`h-full w-full select-none object-cover transition-[opacity,transform,filter] duration-700 ease-out ${
              loaded
                ? "scale-100 opacity-100 blur-0"
                : "scale-[1.012] opacity-0 blur-[2px]"
            }`}
            loading="lazy"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (imageSrc !== "/images/placeholder.jpg") {
                setImageSrc("/images/placeholder.jpg");
                return;
              }

              setHasError(true);
            }}
          />

          {premiumOverlay && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_34%,rgba(12,22,36,0.038)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),rgba(255,255,255,0)_68%)]" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
            </>
          )}
        </>
      )}

      {hasError && (
        <div className="flex h-full w-full items-center justify-center bg-[#f4f8fd] text-[12px] font-normal text-[#8da1bb]">
          تصویر موجود نیست
        </div>
      )}
    </div>
  );
}
