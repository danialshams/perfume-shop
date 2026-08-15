"use client";

import type { RefObject } from "react";

type Props = {
  activeIndex: number;
  total: number;
  progressBarRef: RefObject<HTMLDivElement | null>;
  slideCounterInnerRef: RefObject<HTMLDivElement | null>;
};

export default function HeroProgress({
  activeIndex,
  total,
  progressBarRef,
  slideCounterInnerRef,
}: Props) {
  return (
    <div className="mt-3 flex items-center justify-center gap-4 px-1 sm:mt-4 sm:justify-between lg:mt-5">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="h-4 overflow-hidden text-[10px] font-light tracking-[0.28em] text-[#071a3a]/34 sm:text-[11px]"
      >
        <div
          key={activeIndex}
          ref={slideCounterInnerRef}
          className="will-change-transform"
        >
          <span className="text-[#071a3a]/58">
            {(activeIndex + 1).toString().padStart(2, "0")}
          </span>
          <span className="mx-2 text-[#071a3a]/18">/</span>
          <span className="text-[#071a3a]/28">
            {total.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {total > 1 && (
        <div className="w-[74px] sm:w-[96px]">
          <div className="h-px w-full overflow-hidden bg-[#071a3a]/8">
            <div
              ref={progressBarRef}
              className="h-px w-full origin-left scale-x-0 bg-[#1f468b]/44 will-change-transform"
            />
          </div>
        </div>
      )}
    </div>
  );
}
