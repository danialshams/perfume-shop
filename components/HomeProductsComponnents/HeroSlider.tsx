"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler, TouchEventHandler } from "react";

export type Slide = {
  id: number;
  productId?: number;
  image: string;
  detailsLink: string;
};

const NOISE_DATA_URI = `data:image/svg+xml;utf8,
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.72"/>
</svg>`;

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjZThlZmY3Ii8+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IiMxZjQ2OGIiIG9wYWNpdHk9IjAuMTgiLz48L3N2Zz4=";

type Props = {
  loadingHeroSlides: boolean;
  displaySlides: Slide[];
  activeIndex: number;
  activeSlide: Slide;
  setImageRef: (index: number) => (element: HTMLDivElement | null) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchMove: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
  onHeroClick: MouseEventHandler<HTMLAnchorElement>;
};

export default function HeroSlider({
  loadingHeroSlides,
  displaySlides,
  activeIndex,
  activeSlide,
  setImageRef,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onHeroClick,
}: Props) {
  return (
    <>
      <div
        className="group relative h-[52svh] min-h-[380px] max-h-[580px] touch-pan-y overflow-hidden bg-[#eef3f8] shadow-[0_16px_44px_rgba(7,26,58,0.045)] max-sm:border-0 sm:h-[50svh] sm:min-h-[350px] sm:max-h-[600px] sm:border sm:border-[#071a3a]/[0.04] lg:h-[68svh] lg:min-h-[500px] lg:max-h-[820px]"
        style={{ touchAction: "pan-y" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loadingHeroSlides ? (
          <div className="absolute inset-0 overflow-hidden bg-[#edf3fb]">
            <div className="absolute inset-0 animate-[heroShimmer_2.4s_ease-in-out_infinite] bg-gradient-to-l from-transparent via-white/28 to-transparent sm:animate-[heroShimmer_1.8s_ease-in-out_infinite] sm:via-white/38" />
          </div>
        ) : (
          <>
            {displaySlides.map((slide, index) => (
              <div
                key={`${slide.id}-${index}`}
                ref={setImageRef(index)}
                className="hero-slide absolute inset-0 opacity-0 will-change-transform"
                aria-hidden={index !== activeIndex}
              >
                <div className="relative h-full w-full overflow-hidden">
                  <div className="hero-parallax-media absolute inset-[-2%]">
                    <Image
                      src={slide.image}
                      alt=""
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      className="select-none object-cover"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pointer-events-none absolute inset-0 z-[2] bg-[#123f88]/[0.02] mix-blend-multiply" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-16 bg-gradient-to-b from-[#071a3a]/8 via-[#071a3a]/[0.025] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-t from-[#071a3a]/12 via-[#071a3a]/[0.045] to-transparent" />
            <div className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(circle_at_center,transparent_54%,rgba(7,26,58,0.075)_100%)]" />

            <div
              className="pointer-events-none absolute inset-0 z-[5] opacity-[0.02] mix-blend-soft-light"
              style={{
                backgroundImage: `url("${NOISE_DATA_URI}")`,
                backgroundRepeat: "repeat",
                backgroundSize: "180px 180px",
              }}
            />

            <div className="pointer-events-none absolute right-[9%] top-[11%] z-[5] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.05)_34%,rgba(255,255,255,0)_74%)] blur-2xl sm:h-32 sm:w-32" />

            <div className="pointer-events-none absolute inset-0 z-[6] shadow-[inset_0_0_72px_rgba(8,28,62,0.07)]" />

            <Link
              href={activeSlide?.detailsLink ?? "/products"}
              onClick={onHeroClick}
              aria-label="مشاهده جزئیات محصول"
              className="absolute inset-0 z-10 cursor-pointer transition-opacity duration-300 active:opacity-[0.99] md:hover:opacity-[0.995]"
            >
              <span className="sr-only">مشاهده جزئیات محصول</span>
            </Link>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes heroShimmer {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
