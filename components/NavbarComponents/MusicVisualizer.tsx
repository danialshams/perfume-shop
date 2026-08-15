"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getMusicAnalyser } from "./BackgroundMusic";

const BAR_COUNT = 3;

/*
 * این مقادیر خارج از کامپوننت نگهداری می‌شوند تا هنگام
 * تغییر Route و Mount مجدد Visualizer از بین نروند.
 */
let persistedHasPlayed = false;
let persistedIsPlaying = false;

type FrequencyBand = {
  minHz: number;
  maxHz: number;
  gain: number;
};

type VisualizerPhase =
  | "hidden"
  | "intro"
  | "playing"
  | "pausing"
  | "paused";

/*
 * چیدمان متقارن:
 *
 * High ← Bass | Bass → High
 *
 * در نتیجه، حرکت اصلی از دو میله مرکزی آغاز می‌شود
 * و به دو طرف گسترش پیدا می‌کند.
 */
const FREQUENCY_BANDS: FrequencyBand[] = [
  {
    minHz: 50,
    maxHz: 150,
    gain: 1.35,  // bass — سنگین‌ترین حرکت
  },
  {
    minHz: 150,
    maxHz: 500,
    gain: 1.25,  // low-mid
  },
  {
    minHz: 500,
    maxHz: 2500,
    gain: 1.2,   // mid
  },
  {
    minHz: 2500,
    maxHz: 12000,
    gain: 1.1,   // high — ریزترین حرکت
  },
];




/*
 * در حالت Pause، هر میله به یک نقطه 4×4 تبدیل می‌شود.
 */
const DOT_SIZE = 4;

/*
 * بیشترین ارتفاع میله‌ها.
 */
const MAX_BAR_H = 42;

/*
 * ضخامت میله هنگام پخش.
 */
const PLAYING_BAR_WIDTH = 3.5;

/*
 * رنگ میله‌ها هنگام پخش و رنگ نقاط هنگام Pause.
 */
const VISUALIZER_RGB = "51, 56, 60";

const BAR_COLOR_ALPHA = 0.95;
const DOT_COLOR_ALPHA = 0.59;

const BAR_COLOR = `rgba(${VISUALIZER_RGB}, ${BAR_COLOR_ALPHA})`;
const DOT_COLOR = `rgba(${VISUALIZER_RGB}, ${DOT_COLOR_ALPHA})`;

/*
 * حساسیت کلی Visualizer.
 */
const VISUALIZER_GAIN = 1.1;


/*
 * Attack:
 * سرعت افزایش ارتفاع هنگام دریافت ضربه صوتی.
 *
 * Release:
 * سرعت کاهش معمولی ارتفاع هنگام پخش موزیک.
 */
const ATTACK_TIME_MS = 14;
const RELEASE_TIME_MS = 80;

/*
 * مدت تبدیل نرم میله‌ها به نقطه هنگام Pause.
 */
const PAUSE_MORPH_DURATION_MS = 650;

/*
 * زمان سقوط هر نقطه در ورود اولیه.
 */
const INTRO_DROP_DURATION_MS = 460;

/*
 * فاصله زمانی سقوط نقطه‌ها از چپ به راست.
 */
const INTRO_STAGGER_MS = 105;

/*
 * فاصله کوتاه بعد از قرارگرفتن آخرین نقطه
 * و قبل از شروع حرکت میله‌ها.
 */
const INTRO_END_DELAY_MS = 160;

/*
 * ترکیب انرژی میانگین و Peak.
 */
const AVERAGE_WEIGHT = 0.68;
const PEAK_WEIGHT = 0.32;

/*
 * افزایش حساسیت به صداهای ضعیف و متوسط.
 */
const RESPONSE_CURVE = 0.58;

/*
 * حذف لرزش‌های بسیار ضعیف ناشی از Noise Floor.
 */
const NOISE_GATE = 0.025;

type MusicVisualizerProps = {
  className?: string;
};

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export default function MusicVisualizer({
  className,
}: MusicVisualizerProps) {
  const pathname = usePathname();

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const [hasPlayed, setHasPlayed] = useState(
    persistedHasPlayed,
  );

  const [isPlaying, setIsPlaying] = useState(
    persistedIsPlaying,
  );

  const [phase, setPhase] =
    useState<VisualizerPhase>(() => {
      if (!persistedHasPlayed) {
        return "hidden";
      }

      return persistedIsPlaying
        ? "playing"
        : "paused";
    });

  /*
   * با آماده‌شدن مجدد Analyser، حلقه تحلیل صدا
   * دوباره راه‌اندازی می‌شود.
   */
  const [analyserVersion, setAnalyserVersion] =
    useState(0);

  /*
   * وضعیت‌هایی که داخل Event Listener و RAF باید
   * همیشه بدون تأخیر State در دسترس باشند.
   */
  const phaseRef =
    useRef<VisualizerPhase>(
      !persistedHasPlayed
        ? "hidden"
        : persistedIsPlaying
          ? "playing"
          : "paused",
    );

  const hasPlayedRef = useRef(
    persistedHasPlayed,
  );

  /*
   * اگر قبلاً پخش انجام شده، Intro را در Mount مجدد
   * تکرار نمی‌کنیم.
   */
  const introCompletedRef = useRef(
    persistedHasPlayed,
  );

  /*
   * جلوگیری از اجرای چندباره Intro در صورت دریافت
   * چند رویداد Play پشت‌سرهم.
   */
  const introStartedRef = useRef(false);

  /*
   * مقدار نرم‌شده هر میله.
   */
  const smoothedRef = useRef<number[]>(
    new Array(BAR_COUNT).fill(0),
  );

  const barRefs =
    useRef<Array<HTMLSpanElement | null>>([]);

  const rafRef = useRef<number | null>(null);

  const introTimeoutsRef =
    useRef<number[]>([]);

  const introAnimationsRef =
    useRef<Animation[]>([]);

  const lastFrameTimeRef =
    useRef<number | null>(null);

  const dataRef =
    useRef<Float32Array | null>(null);

  const changePhase = (
    nextPhase: VisualizerPhase,
  ) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  };

  const stopAnimationFrame = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastFrameTimeRef.current = null;
  };

  const clearIntroEffects = () => {
    introTimeoutsRef.current.forEach(
      (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    );

    introTimeoutsRef.current = [];

    introAnimationsRef.current.forEach(
      (animation) => {
        animation.cancel();
      },
    );

    introAnimationsRef.current = [];
  };

  /*
   * مسیر Admin:
   * Visualizer کاملاً غیرفعال می‌شود.
   */
  useEffect(() => {
    if (!isAdminRoute) {
      return;
    }

    stopAnimationFrame();
    clearIntroEffects();

    persistedIsPlaying = false;
    setIsPlaying(false);

    smoothedRef.current.fill(0);
    lastFrameTimeRef.current = null;
    dataRef.current = null;

    if (hasPlayedRef.current) {
      changePhase("paused");
    } else {
      changePhase("hidden");
    }
  }, [isAdminRoute]);

  /*
   * گوش‌دادن به وضعیت پخش موسیقی.
   */
  useEffect(() => {
    const handleStateChange = (
      event: WindowEventMap["background-music:state-change"],
    ) => {
      if (isAdminRoute) {
        persistedIsPlaying = false;
        setIsPlaying(false);

        if (hasPlayedRef.current) {
          changePhase("paused");
        } else {
          changePhase("hidden");
        }

        return;
      }

      const playing = event.detail.isPlaying;

      persistedIsPlaying = playing;
      setIsPlaying(playing);

      if (playing) {
        if (!hasPlayedRef.current) {
          persistedHasPlayed = true;
          hasPlayedRef.current = true;
          setHasPlayed(true);
        }

        if (
          !introCompletedRef.current &&
          !introStartedRef.current
        ) {
          introStartedRef.current = true;
          changePhase("intro");
          return;
        }

        if (introCompletedRef.current) {
          changePhase("playing");
        }

        return;
      }

      if (
        hasPlayedRef.current &&
        phaseRef.current === "playing"
      ) {
        changePhase("pausing");
      }
    };

    const handleAnalyserReady = () => {
      if (isAdminRoute) {
        dataRef.current = null;
        return;
      }

      dataRef.current = null;
      setAnalyserVersion(
        (current) => current + 1,
      );
    };

    window.addEventListener(
      "background-music:state-change",
      handleStateChange,
    );

    window.addEventListener(
      "background-music:analyser-ready",
      handleAnalyserReady,
    );

    return () => {
      window.removeEventListener(
        "background-music:state-change",
        handleStateChange,
      );

      window.removeEventListener(
        "background-music:analyser-ready",
        handleAnalyserReady,
      );
    };
  }, [isAdminRoute]);

  /*
   * Intro اولیه:
   */
  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    if (phase !== "intro") {
      return;
    }

    stopAnimationFrame();
    clearIntroEffects();

    barRefs.current.forEach((bar) => {
      if (!bar) {
        return;
      }

      bar.style.width = `${DOT_SIZE}px`;
      bar.style.height = `${DOT_SIZE}px`;
      bar.style.opacity = "0";
      bar.style.backgroundColor = DOT_COLOR;
      bar.style.transform =
        "translateY(-25px) scale(0.72)";
      bar.style.borderRadius = "9999px";
    });

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      barRefs.current.forEach(
        (bar, index) => {
          if (!bar) {
            return;
          }

          const timeoutId =
            window.setTimeout(() => {
              if (
                phaseRef.current !== "intro"
              ) {
                return;
              }

              if (isAdminRoute) {
                return;
              }

              const animation = bar.animate(
                [
                  {
                    opacity: 0,
                    transform:
                      "translateY(-25px) scale(0.72)",
                  },
                  {
                    opacity: 1,
                    offset: 0.72,
                    transform:
                      "translateY(2px) scale(1.08)",
                  },
                  {
                    opacity: 1,
                    transform:
                      "translateY(0) scale(1)",
                  },
                ],
                {
                  duration:
                    INTRO_DROP_DURATION_MS,
                  easing:
                    "cubic-bezier(0.22, 1, 0.36, 1)",
                  fill: "forwards",
                },
              );

              introAnimationsRef.current.push(
                animation,
              );
            }, index * INTRO_STAGGER_MS);

          introTimeoutsRef.current.push(
            timeoutId,
          );
        },
      );

      const lastDotDelay =
        (BAR_COUNT - 1) * INTRO_STAGGER_MS;

      const introTotalDuration =
        lastDotDelay +
        INTRO_DROP_DURATION_MS +
        INTRO_END_DELAY_MS;

      const finishTimeoutId =
        window.setTimeout(() => {
          if (
            phaseRef.current !== "intro"
          ) {
            return;
          }

          if (isAdminRoute) {
            return;
          }

          barRefs.current.forEach((bar) => {
            if (!bar) {
              return;
            }

            bar.style.width =
              `${PLAYING_BAR_WIDTH}px`;

            bar.style.height =
              `${DOT_SIZE}px`;

            bar.style.opacity = "1";
            bar.style.backgroundColor =
              BAR_COLOR;
            bar.style.transform =
              "translateY(0) scale(1)";
          });

          introAnimationsRef.current.forEach(
            (animation) => {
              animation.cancel();
            },
          );

          introAnimationsRef.current = [];

          introCompletedRef.current = true;
          smoothedRef.current.fill(0);

          if (persistedIsPlaying) {
            changePhase("playing");
          } else {
            changePhase("pausing");
          }
        }, introTotalDuration);

      introTimeoutsRef.current.push(
        finishTimeoutId,
      );
    });

    return () => {
      stopAnimationFrame();
      clearIntroEffects();
    };
  }, [phase, isAdminRoute]);

  /*
   * تحلیل صدا و حرکت میله‌ها هنگام پخش.
   */
  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    if (phase !== "playing") {
      return;
    }

    stopAnimationFrame();
    smoothedRef.current.fill(0);
    lastFrameTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (isAdminRoute) {
        stopAnimationFrame();
        return;
      }

      if (
        phaseRef.current !== "playing"
      ) {
        stopAnimationFrame();
        return;
      }

      const analyser = getMusicAnalyser();

      const previousTime =
        lastFrameTimeRef.current ?? timestamp;

      const deltaTime = Math.min(
        50,
        Math.max(1, timestamp - previousTime),
      );

      lastFrameTimeRef.current = timestamp;

      if (analyser) {
        if (
          !dataRef.current ||
          dataRef.current.length !==
            analyser.frequencyBinCount
        ) {
          dataRef.current =
            new Float32Array(
              analyser.frequencyBinCount,
            );
        }

        const frequencyData =
          dataRef.current;

        analyser.getFloatFrequencyData(
          frequencyData,
        );

        const sampleRate =
          analyser.context.sampleRate;

        const nyquistFrequency =
          sampleRate / 2;

        const hzPerBin =
          nyquistFrequency /
          analyser.frequencyBinCount;

        const minDecibels =
          analyser.minDecibels;

        const maxDecibels =
          analyser.maxDecibels;

        const decibelRange =
          maxDecibels - minDecibels;

        const smoothed =
          smoothedRef.current;

        barRefs.current.forEach(
          (bar, index) => {
            if (!bar) {
              return;
            }

            const band =
              FREQUENCY_BANDS[index];

            const startBin = Math.max(
              1,
              Math.floor(
                band.minHz / hzPerBin,
              ),
            );

            const endBin = Math.min(
              frequencyData.length - 1,
              Math.ceil(
                band.maxHz / hzPerBin,
              ),
            );

            let energySum = 0;
            let peakEnergy = 0;
            let validBinCount = 0;

            for (
              let binIndex = startBin;
              binIndex <= endBin;
              binIndex += 1
            ) {
              const decibels =
                frequencyData[binIndex];

              if (
                !Number.isFinite(
                  decibels,
                )
              ) {
                continue;
              }

              const normalizedDecibels =
                Math.min(
                  1,
                  Math.max(
                    0,
                    (decibels -
                      minDecibels) /
                      decibelRange,
                  ),
                );

              const energy =
                normalizedDecibels *
                normalizedDecibels;

              energySum += energy;

              peakEnergy = Math.max(
                peakEnergy,
                energy,
              );

              validBinCount += 1;
            }

            const averageEnergy =
              validBinCount > 0
                ? energySum /
                  validBinCount
                : 0;

            let target =
              averageEnergy *
                AVERAGE_WEIGHT +
              peakEnergy * PEAK_WEIGHT;

            target = Math.pow(
              target,
              RESPONSE_CURVE,
            );

            target *=
              band.gain *
              VISUALIZER_GAIN;

            if (target < NOISE_GATE) {
              target = 0;
            } else {
              target =
                (target - NOISE_GATE) /
                (1 - NOISE_GATE);
            }

            target = Math.min(
              1,
              Math.max(0, target),
            );

            const current =
              smoothed[index];

            const timeConstant =
              target > current
                ? ATTACK_TIME_MS
                : RELEASE_TIME_MS;

            const alpha =
              1 -
              Math.exp(
                -deltaTime /
                  timeConstant,
              );

            const next =
              current +
              (target - current) *
                alpha;

            smoothed[index] = next;

            const rawHeight =
              DOT_SIZE +
              next *
                (MAX_BAR_H -
                  DOT_SIZE);

            const devicePixelRatio =
              window.devicePixelRatio || 1;

            const heightStep =
              2 / devicePixelRatio;

            const height =
              Math.round(
                rawHeight / heightStep,
              ) * heightStep;

            bar.style.height =
              `${height}px`;

            bar.style.width =
              `${PLAYING_BAR_WIDTH}px`;

            bar.style.opacity = "1";
            bar.style.backgroundColor =
              BAR_COLOR;
            bar.style.borderRadius =
              "9999px";
            bar.style.transform =
              "translateY(0) scale(1)";
          },
        );
      } else {
        barRefs.current.forEach((bar) => {
          if (!bar) {
            return;
          }

          bar.style.width =
            `${DOT_SIZE}px`;

          bar.style.height =
            `${DOT_SIZE}px`;

          bar.style.opacity = "1";
          bar.style.backgroundColor =
            DOT_COLOR;
          bar.style.borderRadius =
            "9999px";
          bar.style.transform =
            "translateY(0) scale(1)";
        });
      }

      rafRef.current =
        requestAnimationFrame(animate);
    };

    rafRef.current =
      requestAnimationFrame(animate);

    return () => {
      stopAnimationFrame();
    };
  }, [phase, analyserVersion, isAdminRoute]);

  /*
   * تبدیل آرام میله‌ها به نقطه هنگام Pause.
   */
  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    if (phase !== "pausing") {
      return;
    }

    stopAnimationFrame();

    const startHeights =
      barRefs.current.map((bar) => {
        if (!bar) {
          return DOT_SIZE;
        }

        const height =
          Number.parseFloat(
            bar.style.height,
          );

        if (Number.isFinite(height)) {
          return height;
        }

        return (
          bar.getBoundingClientRect()
            .height || DOT_SIZE
        );
      });

    const startWidths =
      barRefs.current.map((bar) => {
        if (!bar) {
          return PLAYING_BAR_WIDTH;
        }

        const width =
          Number.parseFloat(
            bar.style.width,
          );

        if (Number.isFinite(width)) {
          return width;
        }

        return (
          bar.getBoundingClientRect()
            .width ||
          PLAYING_BAR_WIDTH
        );
      });

    let startTimestamp: number | null = null;

    const morphToDots = (
      timestamp: number,
    ) => {
      if (isAdminRoute) {
        stopAnimationFrame();
        return;
      }

      if (
        phaseRef.current !== "pausing"
      ) {
        stopAnimationFrame();
        return;
      }

      if (startTimestamp === null) {
        startTimestamp = timestamp;
      }

      const elapsed =
        timestamp - startTimestamp;

      const rawProgress = Math.min(
        1,
        elapsed /
          PAUSE_MORPH_DURATION_MS,
      );

      const progress =
        easeInOutCubic(rawProgress);

      barRefs.current.forEach(
        (bar, index) => {
          if (!bar) {
            return;
          }

          const startHeight =
            startHeights[index] ??
            DOT_SIZE;

          const startWidth =
            startWidths[index] ??
            PLAYING_BAR_WIDTH;

          const nextHeight =
            startHeight +
            (DOT_SIZE -
              startHeight) *
              progress;

          const nextWidth =
            startWidth +
            (DOT_SIZE -
              startWidth) *
              progress;

          const colorAlpha =
            BAR_COLOR_ALPHA +
            (DOT_COLOR_ALPHA -
              BAR_COLOR_ALPHA) *
              progress;

          bar.style.height =
            `${nextHeight.toFixed(2)}px`;

          bar.style.width =
            `${nextWidth.toFixed(2)}px`;

          bar.style.opacity = "1";
          bar.style.borderRadius =
            "9999px";
          bar.style.backgroundColor =
            `rgba(${VISUALIZER_RGB}, ${colorAlpha.toFixed(3)})`;
          bar.style.transform =
            "translateY(0) scale(1)";
        },
      );

      if (rawProgress < 1) {
        rafRef.current =
          requestAnimationFrame(
            morphToDots,
          );

        return;
      }

      barRefs.current.forEach((bar) => {
        if (!bar) {
          return;
        }

        bar.style.width =
          `${DOT_SIZE}px`;

        bar.style.height =
          `${DOT_SIZE}px`;

        bar.style.opacity = "1";
        bar.style.borderRadius =
          "9999px";
        bar.style.backgroundColor =
          DOT_COLOR;
        bar.style.transform =
          "translateY(0) scale(1)";
      });

      smoothedRef.current.fill(0);
      rafRef.current = null;
      lastFrameTimeRef.current = null;

      changePhase("paused");
    };

    rafRef.current =
      requestAnimationFrame(morphToDots);

    return () => {
      stopAnimationFrame();
    };
  }, [phase, isAdminRoute]);

  /*
   * تضمین شکل نهایی نقطه‌ها در حالت Pause کامل.
   */
  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    if (phase !== "paused") {
      return;
    }

    barRefs.current.forEach((bar) => {
      if (!bar) {
        return;
      }

      bar.style.width =
        `${DOT_SIZE}px`;

      bar.style.height =
        `${DOT_SIZE}px`;

      bar.style.opacity = "1";
      bar.style.borderRadius =
        "9999px";
      bar.style.backgroundColor =
        DOT_COLOR;
      bar.style.transform =
        "translateY(0) scale(1)";
    });
  }, [phase, isAdminRoute]);

  /*
   * پاک‌سازی کامل هنگام Unmount.
   */
  useEffect(() => {
    return () => {
      stopAnimationFrame();
      clearIntroEffects();
    };
  }, []);

  const handleClick = () => {
    if (isAdminRoute) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "background-music:toggle",
      ),
    );
  };

  if (isAdminRoute) {
    return null;
  }

  if (!hasPlayed) {
    return null;
  }

  return (
    <button
      type="button"
      data-music-control
      onClick={handleClick}
      aria-label={
        isPlaying
          ? "توقف موزیک"
          : "ادامه پخش موزیک"
      }
      aria-pressed={isPlaying}
      className={[
        "mv-btn",
        "relative flex h-11 w-11 appearance-none",
        "items-center justify-center gap-[3px]",
        "transition-transform duration-300",
        "active:scale-95 focus:outline-none",
        className ?? "",
      ].join(" ")}
    >
      {Array.from({
        length: BAR_COUNT,
      }).map((_, index) => (
        <span
          key={index}
          ref={(element) => {
            barRefs.current[index] = element;
          }}
          className="mv-bar"
        />
      ))}

      <style jsx>{`
        .mv-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .mv-btn:hover {
          transform: none;
        }

        .mv-bar {
          display: block;
          flex: 0 0 auto;
          align-self: center;
          width: ${DOT_SIZE}px;
          height: ${DOT_SIZE}px;
          border-radius: 9999px;
          background-color: ${DOT_COLOR};
          transform-origin: center center;
          will-change: height, width, transform, opacity,
            background-color;
          transition: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .mv-bar {
            transition: none;
          }
        }
      `}</style>
    </button>
  );
}
