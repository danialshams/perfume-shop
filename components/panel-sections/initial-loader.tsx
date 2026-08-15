"use client";

import Image from "next/image";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** power2.out — ورود نرم و بی‌شتاب */
const EASE_OUT = "cubic-bezier(0.165, 0.84, 0.44, 1)";
/** power2.inOut — خروج متعادل */
const EASE_IN_OUT = "cubic-bezier(0.45, 0.05, 0.55, 0.95)";

/** مسیر لوگو — هم برای <Image> هم برای ماسکِ برق */
const LOGO_SRC = "/next.svg";
/** رنگ برق. برای لوگوی تیره: سفید. */
const SHEEN_COLOR = "rgba(255, 255, 255, 0.92)";

/* ---------- کوریوگرافی ورود: متن اول، لوگو بعد ---------- */
const IN_MARK_DELAY = 200;
const IN_MARK_DUR = 1800;
const IN_LOGO_DELAY = 1100;
const IN_LOGO_DUR = 1700;
/** لحظه‌ای که ورود کامل تمام شده */
const IN_TOTAL = IN_LOGO_DELAY + IN_LOGO_DUR; // 2800

/* ---------- برقِ لوگو ---------- */
const SHEEN_DELAY = IN_LOGO_DELAY + 950; // 2050
const SHEEN_DUR = 1150;

/* ---------- خروج: معکوسِ ورود، لوگو اول ---------- */
const OUT_FADE = 700;
const OUT_STAGGER = 180;
const OUT_CONTENT = OUT_FADE + OUT_STAGGER; // 880
const OUT_CURTAIN = 950;
const OUT_TOTAL = OUT_CONTENT + OUT_CURTAIN; // 1830

/** فرصت تنفس بعد از کامل شدن ورود */
const HOLD = 700;

/* ---------- قرارداد مشترک با اسکریپت inline ---------- */
/** کلید سشن — باید با layout.tsx یکی باشد */
export const LOADER_SESSION_KEY = "fertini:loader:seen";
/** کلاسی که اسکریپت روی <html> می‌گذارد اگر لودر قبلاً دیده شده */
export const LOADER_SEEN_CLASS = "fx-intro-seen";
/** نشانه‌ی اینکه اسکریپت inline واقعاً اجرا شده */
export const LOADER_READY_ATTR = "data-fx-intro";

/**
 * فلگ ماژول‌سکوپ: با هر رفرش ریست می‌شود،
 * ولی در ناوبری کلاینتی و remount شدن کامپوننت باقی می‌ماند.
 */
let seenThisPageLoad = false;

/** برای تست دستی در کنسول یا دکمه‌ی dev */
export function resetInitialLoader() {
    seenThisPageLoad = false;
    try {
        window.sessionStorage.removeItem(LOADER_SESSION_KEY);
    } catch {
        /* noop */
    }
    try {
        document.documentElement.classList.remove(LOADER_SEEN_CLASS);
    } catch {
        /* noop */
    }
}

/** خواندنِ امنِ فلگ سشن */
function readSessionFlag(): boolean {
    try {
        return window.sessionStorage.getItem(LOADER_SESSION_KEY) === "1";
    } catch {
        return false;
    }
}

/** نوشتنِ امنِ فلگ سشن */
function writeSessionFlag(): void {
    try {
        window.sessionStorage.setItem(LOADER_SESSION_KEY, "1");
    } catch {
        /* private mode / storage blocked */
    }
}

type InitialLoaderProps = {
    /** حداقل زمان نمایش پرده (ms) — پیش‌فرض: ورود کامل + تنفس */
    minDuration?: number;
    /**
     * "session" → یک بار تا زمان بسته شدن تب (پیش‌فرض)
     * "load"    → یک بار در هر بارگذاری صفحه (هر رفرش دوباره می‌آید)
     * "always"  → هر بار، حتی در ناوبری کلاینتی
     */
    showOn?: "session" | "load" | "always";
    /** اجازه‌ی رد کردن با کلیک یا Escape */
    allowSkip?: boolean;
    /** بعد از اتمام کامل خروج صدا زده می‌شود */
    onFinish?: () => void;
};

export default function InitialLoader({
    minDuration = IN_TOTAL + HOLD, // 3500
    showOn = "session",
    allowSkip = true,
    onFinish,
}: InitialLoaderProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(true);
    const [entered, setEntered] = useState(false);
    const [shine, setShine] = useState(false);
    const [leaving, setLeaving] = useState(false); // مرحله ۱: محتوا
    const [curtainOut, setCurtainOut] = useState(false); // مرحله ۲: پرده
    const [armed, setArmed] = useState(false);

    const finishedRef = useRef(false);
    const aliveRef = useRef(true);
    const lockedRef = useRef(false);
    const timersRef = useRef<number[]>([]);

    // onFinish را در ref نگه می‌داریم تا تغییر رفرنسِ پراپ، افکت‌ها را ری‌استارت نکند
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;

    const showOnRef = useRef(showOn);
    showOnRef.current = showOn;

    const emitFinish = useCallback(() => {
        // در microtask تا setState والد داخل layout effect ما اجرا نشود
        Promise.resolve().then(() => onFinishRef.current?.());
    }, []);

    const after = useCallback((ms: number, fn: () => void) => {
        const id = window.setTimeout(() => {
            if (!aliveRef.current) return;
            fn();
        }, ms);
        timersRef.current.push(id);
        return id;
    }, []);

    /* ---------- ردیابی چرخه‌ی حیات ---------- */
    useEffect(
        () => () => {
            aliveRef.current = false;
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        },
        []
    );

    /* ---------- تصمیم اولیه: نمایش یا عبور ---------- */
    useIsoLayoutEffect(() => {
        const mode = showOnRef.current;
        let seen = false;

        if (mode === "load") {
            seen = seenThisPageLoad;
        } else if (mode === "session") {
            const html = document.documentElement;
            const scriptRan = html.getAttribute(LOADER_READY_ATTR) === "ready";

            if (scriptRan) {
                // منبع حقیقت = اسکریپت inline. خودش فلگ را هم نوشته.
                seen = html.classList.contains(LOADER_SEEN_CLASS) || seenThisPageLoad;
            } else {
                // اسکریپت نصب نشده → مستقیم از سشن می‌خوانیم
                seen = readSessionFlag() || seenThisPageLoad;
                if (!seen) writeSessionFlag();
            }
        }

        if (seen) {
            finishedRef.current = true;
            seenThisPageLoad = true;
            setVisible(false);
            emitFinish();
            return;
        }

        setMounted(true);
        // فقط یک بار؛ عمداً وابستگی به پراپ‌های متغیر نداریم
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- قفل اسکرول ---------- */
    useIsoLayoutEffect(() => {
        if (!visible || !mounted) return;

        const html = document.documentElement;
        const body = document.body;

        const restore: Array<[HTMLElement, string, string]> = [
            [html, "overflow", html.style.getPropertyValue("overflow")],
            [body, "overflow", body.style.getPropertyValue("overflow")],
            [body, "touch-action", body.style.getPropertyValue("touch-action")],
        ];

        html.style.setProperty("overflow", "hidden");
        body.style.setProperty("overflow", "hidden");
        body.style.setProperty("touch-action", "none");
        lockedRef.current = true;

        return () => {
            for (const [el, prop, val] of restore) {
                if (val) el.style.setProperty(prop, val);
                else el.style.removeProperty(prop);
            }
            lockedRef.current = false;
        };
    }, [visible, mounted]);

    /* ---------- تور نجات: اگر کامپوننت غیرمنتظره unmount شد ---------- */
    useEffect(
        () => () => {
            if (!lockedRef.current) return;
            document.documentElement.style.removeProperty("overflow");
            document.body.style.removeProperty("overflow");
            document.body.style.removeProperty("touch-action");
        },
        []
    );

    /* ---------- خروج دو مرحله‌ای ---------- */
    const dismiss = useCallback(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;

        seenThisPageLoad = true;

        if (showOnRef.current === "session") {
            writeSessionFlag();
            try {
                document.documentElement.classList.add(LOADER_SEEN_CLASS);
            } catch {
                /* noop */
            }
        }

        if (!aliveRef.current) return;

        // مرحله ۱ — محتوا محو می‌شود (لوگو، بعد متن)
        setLeaving(true);
        // مرحله ۲ — بعدش پرده کنار می‌رود
        after(OUT_CONTENT, () => setCurtainOut(true));
        after(OUT_TOTAL, () => {
            setVisible(false);
            emitFinish();
        });
    }, [after, emitFinish]);

    /* ---------- کوریوگرافی: یک ورود، یک انتظار، یک خروج ---------- */
    useEffect(() => {
        if (!mounted || !visible) return;

        const raf = requestAnimationFrame(() => {
            if (aliveRef.current) setEntered(true);
        });

        // تا ورود متن جا نیفتاده، کلیک تصادفی پرده را نبندد
        after(IN_MARK_DELAY + IN_MARK_DUR * 0.5, () => setArmed(true));

        // برقِ یک‌بارِ لوگو
        after(SHEEN_DELAY, () => setShine(true));

        const minWait = new Promise<void>((r) => after(minDuration, r));

        const fonts =
            typeof document !== "undefined" && "fonts" in document
                ? (document as Document & { fonts: FontFaceSet }).fonts.ready
                    .then(() => undefined)
                    .catch(() => undefined)
                : Promise.resolve();

        const images = Promise.all(
            Array.from(
                document.querySelectorAll<HTMLImageElement>("img[data-loader-await]")
            ).map((img) =>
                img.complete
                    ? Promise.resolve()
                    : new Promise<void>((r) => {
                        img.addEventListener("load", () => r(), { once: true });
                        img.addEventListener("error", () => r(), { once: true });
                    })
            )
        )
            .then(() => undefined)
            .catch(() => undefined);

        // سقف امن: هر اتفاقی افتاد، پرده گیر نمی‌کند
        const hardCap = new Promise<void>((r) => after(minDuration + 3000, r));

        Promise.race([Promise.all([minWait, fonts, images]), hardCap])
            .then(() => dismiss())
            .catch(() => dismiss());

        return () => cancelAnimationFrame(raf);
    }, [mounted, visible, minDuration, after, dismiss]);

    /* ---------- Escape ---------- */
    useEffect(() => {
        if (!allowSkip || !visible || !mounted || !armed) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") dismiss();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [allowSkip, visible, mounted, armed, dismiss]);

    if (!mounted || !visible) return null;

    const skippable = allowSkip && armed && !leaving;

    /* وردمارک — اول می‌آید، آخر می‌رود */
    const markStyle: React.CSSProperties = {
        fontSize: "clamp(14px, 1.1vw, 17px)",
        lineHeight: 1,
        letterSpacing: "0.62em",
        // اسپیسینگ حرف آخر را جبران می‌کند تا بلوک واقعاً وسط بیفتد
        textIndent: "0.62em",
        fontWeight: 300,
        color: "#57534E",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        opacity: leaving ? 0 : entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(8px)",
        transition: leaving
            ? `opacity ${OUT_FADE}ms ${EASE_IN_OUT} ${OUT_STAGGER}ms`
            : `opacity ${IN_MARK_DUR}ms ${EASE_OUT} ${IN_MARK_DELAY}ms,` +
            ` transform ${IN_MARK_DUR}ms ${EASE_OUT} ${IN_MARK_DELAY}ms`,
        willChange: "opacity, transform",
    };

    /* قاب لوگو — ماسکِ برق روی همین قاب سوار می‌شود */
    const logoWrapStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-flex",
        height: "clamp(38px, 4.4vw, 54px)",
        // برق نباید از سیلوئت بیرون بزند
        overflow: "hidden",
        opacity: leaving ? 0 : entered ? 1 : 0,
        // در خروج transform را نگه می‌داریم تا snap نکند
        transform: entered ? "scale(1)" : "scale(1.04)",
        transformOrigin: "center",
        transition: leaving
            ? `opacity ${OUT_FADE}ms ${EASE_IN_OUT}`
            : `opacity ${IN_LOGO_DUR}ms ${EASE_OUT} ${IN_LOGO_DELAY}ms,` +
            ` transform ${IN_LOGO_DUR}ms ${EASE_OUT} ${IN_LOGO_DELAY}ms`,
        willChange: "opacity, transform",
    };

    return (
        <div
            className="fx-initial-loader"
            role="status"
            aria-live="polite"
            aria-label="در حال بارگذاری"
            aria-hidden={leaving ? true : undefined}
            onClick={skippable ? dismiss : undefined}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // پس‌زمینه‌ی غیرتخت: نور ملایم در مرکز
                backgroundColor: "#F5F2EE",
                backgroundImage:
                    "radial-gradient(120% 120% at 50% 42%, #FAF8F5 0%, #F5F2EE 100%)",
                opacity: curtainOut ? 0 : 1,
                transition: `opacity ${OUT_CURTAIN}ms ${EASE_IN_OUT}`,
                cursor: skippable ? "pointer" : "default",
                // در حین خروج، تعامل به صفحه‌ی اصلی برسد
                pointerEvents: leaving ? "none" : "auto",
                WebkitFontSmoothing: "antialiased",
            }}
        >
            <div
                dir="ltr"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    // مرکزِ نوری کمی بالاتر از مرکز هندسی
                    paddingBottom: "clamp(24px, 5vh, 56px)",
                    // فاصله‌ی لوگو و متن — جمع‌تر، مثل یک قفلِ واحد
                    gap: "clamp(28px, 4.2vh, 48px)",
                }}
            >
                {/* لوگو — بالا، با یک برقِ گذرا */}
                <div style={logoWrapStyle}>
                    <Image
                        src={LOGO_SRC}
                        alt=""
                        aria-hidden="true"
                        width={120}
                        height={54}
                        priority
                        unoptimized
                        style={{ width: "auto", height: "100%", display: "block" }}
                    />

                    {/* لایه‌ی برق: با mask فقط داخل فرم لوگو دیده می‌شود */}
                    {shine && !leaving && (
                        <span
                            aria-hidden="true"
                            className="fx-sheen"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                backgroundImage:
                                    `linear-gradient(100deg,` +
                                    ` transparent 38%,` +
                                    ` ${SHEEN_COLOR} 50%,` +
                                    ` transparent 62%)`,
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "220% 100%",
                                // ماسک = خودِ لوگو
                                WebkitMaskImage: `url(${LOGO_SRC})`,
                                maskImage: `url(${LOGO_SRC})`,
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                                maskPosition: "center",
                                WebkitMaskSize: "contain",
                                maskSize: "contain",
                            }}
                        />
                    )}
                </div>

                {/* وردمارک — پایین، ظریف و بازِ باز */}
                <div style={markStyle}>FERTINI</div>
            </div>

            {/* کی‌فریم برق + احترام به prefers-reduced-motion */}
            <style>{`
        @keyframes fx-sheen-sweep {
          0%   { background-position: 210% 0; opacity: 0; }
          18%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { background-position: -110% 0; opacity: 0; }
        }
        .fx-sheen {
          animation: fx-sheen-sweep ${SHEEN_DUR}ms ${EASE_IN_OUT} 1 both;
        }
        @media (prefers-reduced-motion: reduce) {
          .fx-initial-loader,
          .fx-initial-loader *:not(.fx-sheen) {
            transition-duration: 1ms !important;
            transition-delay: 0ms !important;
          }
          .fx-sheen { display: none !important; }
        }
      `}</style>
        </div>
    );
}
