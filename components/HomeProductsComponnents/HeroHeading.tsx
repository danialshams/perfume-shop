"use client";

const HERO_TITLE = "رایحه‌هایی برای لحظه‌های ماندگار";
const HERO_TITLE_WORDS = HERO_TITLE.split(" ");

export default function HeroHeading() {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:mb-6">
      <div className="flex items-center gap-3">
        <div className="hero-copy-line h-px w-12 bg-[#1f468b]/20 sm:w-16" />

        <span className="hero-eyebrow text-[10px] font-light uppercase tracking-[0.42em] text-[#1f468b]/46 sm:text-[11px]">
          Private Selection
        </span>
      </div>

      <h1
        aria-label={HERO_TITLE}
        className="max-w-3xl text-[1.55rem] font-light leading-[2] tracking-[-0.024em] text-[#071a3a] sm:text-[2.15rem] lg:text-[2.85rem]"
      >
        {HERO_TITLE_WORDS.map((word, index) => {
          const isAccentWord = word === "ماندگار";

          return (
            <span
              key={`${word}-${index}`}
              className={`hero-title-word ml-2 inline-block will-change-transform last:ml-0 ${
                isAccentWord ? "text-[#1f468b]/68" : ""
              }`}
            >
              {word}
            </span>
          );
        })}
      </h1>

      <p className="hero-eyebrow max-w-xl text-xs font-light leading-7 text-[#10213f]/42 sm:text-sm">
        مجموعه‌ای آرام و دقیق از رایحه‌های منتخب، برای تجربه‌ای مینیمال، لوکس و
        ماندگار.
      </p>
    </div>
  );
}
