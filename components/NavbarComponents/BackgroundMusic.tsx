"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

let sharedAnalyser: AnalyserNode | null = null;

export function getMusicAnalyser() {
    return sharedAnalyser;
}

type BackgroundMusicProps = {
    audioUrl: string;
};

const TARGET_VOLUME = 0.16;
const FADE_DURATION = 1800;
const FADE_INTERVAL = 50;
const LEGACY_STORAGE_KEY = "luxury-perfume-background-music";

/*
 * رویدادهایی که تلاش برای پخش موزیک را فعال می‌کنند.
 *
 * pointerdown / keydown / touchstart / touchend => تعامل معتبر کاربر
 * برای رفع محدودیت autoplay مرورگر.
 *
 * touchmove / wheel / scroll => برای پوشش حرکت انگشت و اسکرول.
 * (در برخی مرورگرها ممکن است به‌تنهایی autoplay را باز نکنند.)
 */
const INTERACTION_EVENTS = [
    "pointerdown",
    "keydown",
    "touchstart",
    "touchend",
    "touchmove",
    "wheel",
    "scroll",
] as const;

/*
 * رویدادهایی که passive ثبت می‌شوند تا اسکرول/تاچ کند نشود.
 * keydown از این لیست خارج است.
 */
const PASSIVE_EVENTS = new Set<string>([
    "pointerdown",
    "touchstart",
    "touchend",
    "touchmove",
    "wheel",
    "scroll",
]);

function addInteractionListeners(
    handler: EventListener,
    options?: { target?: Window | Document }
) {
    for (const eventName of INTERACTION_EVENTS) {
        const target: Window | Document =
            eventName === "scroll"
                ? window
                : options?.target ?? window;

        target.addEventListener(
            eventName,
            handler,
            PASSIVE_EVENTS.has(eventName)
                ? { passive: true }
                : undefined
        );
    }
}

function removeInteractionListeners(handler: EventListener) {
    for (const eventName of INTERACTION_EVENTS) {
        const target: Window | Document =
            eventName === "scroll" ? window : window;

        target.removeEventListener(eventName, handler);
    }
}

declare global {
    interface WindowEventMap {
        "background-music:toggle": CustomEvent;
        "background-music:play": CustomEvent;
        "background-music:pause": CustomEvent;

        "background-music:pause-for-voice": CustomEvent;
        "background-music:resume-after-voice": CustomEvent;

        "background-music:state-change": CustomEvent<{
            isPlaying: boolean;
        }>;

        "background-music:analyser-ready": CustomEvent<{
            analyser: AnalyserNode;
        }>;
    }
}

export default function BackgroundMusic({
    audioUrl,
}: BackgroundMusicProps) {
    const pathname = usePathname();

    const isAdminRoute =
        pathname === "/admin" ||
        pathname.startsWith("/admin/");

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fadeTimerRef = useRef<number | null>(null);
    const closeContextTimerRef = useRef<number | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    const isPlayingRef = useRef(false);
    const isStartingRef = useRef(false);
    const userPausedRef = useRef(false);

    /*
     * اگر voice در حالی شروع شده که موزیک فعال بوده،
     * بعداً اجازه داریم موزیک را برگردانیم.
     */
    const musicWasPlayingBeforeVoiceRef = useRef(false);

    /*
     * اگر چند voice هم‌زمان/پشت‌سرهم pause درخواست کنند،
     * تا وقتی همه release نشده‌اند موزیک برنگردد.
     */
    const activeVoiceLocksRef = useRef(0);

    const [isReady, setIsReady] = useState(false);

    const emitStateChange = useCallback((playing: boolean) => {
        isPlayingRef.current = playing;

        window.dispatchEvent(
            new CustomEvent("background-music:state-change", {
                detail: {
                    isPlaying: playing,
                },
            })
        );
    }, []);

    const clearFadeTimer = useCallback(() => {
        if (fadeTimerRef.current === null) return;

        window.clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
    }, []);

    useEffect(() => {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }, []);

    const fadeIn = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        clearFadeTimer();

        audio.volume = 0;

        const steps = Math.max(
            1,
            Math.ceil(FADE_DURATION / FADE_INTERVAL)
        );

        const volumeStep = TARGET_VOLUME / steps;

        fadeTimerRef.current = window.setInterval(() => {
            const currentAudio = audioRef.current;

            if (!currentAudio) {
                clearFadeTimer();
                return;
            }

            const nextVolume = Math.min(
                TARGET_VOLUME,
                currentAudio.volume + volumeStep
            );

            currentAudio.volume = nextVolume;

            if (nextVolume >= TARGET_VOLUME) {
                clearFadeTimer();
            }
        }, FADE_INTERVAL);
    }, [clearFadeTimer]);

    const fadeOutAndPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        clearFadeTimer();

        const startVolume = audio.volume;

        if (startVolume <= 0) {
            audio.pause();
            audio.volume = TARGET_VOLUME;
            return;
        }

        const steps = Math.max(
            1,
            Math.ceil(FADE_DURATION / FADE_INTERVAL)
        );

        const volumeStep = startVolume / steps;

        fadeTimerRef.current = window.setInterval(() => {
            const currentAudio = audioRef.current;

            if (!currentAudio) {
                clearFadeTimer();
                return;
            }

            const nextVolume = Math.max(
                0,
                currentAudio.volume - volumeStep
            );

            currentAudio.volume = nextVolume;

            if (nextVolume <= 0) {
                clearFadeTimer();
                currentAudio.pause();
                currentAudio.volume = TARGET_VOLUME;
            }
        }, FADE_INTERVAL);
    }, [clearFadeTimer]);

    const setupAudioGraph = useCallback((): AudioContext | null => {
        const audio = audioRef.current;

        if (!audio) {
            console.error(
                "[BackgroundMusic] Audio element is not available."
            );

            return null;
        }

        if (
            audioCtxRef.current &&
            analyserRef.current &&
            sourceRef.current &&
            audioCtxRef.current.state !== "closed"
        ) {
            return audioCtxRef.current;
        }

        const AudioContextConstructor =
            window.AudioContext ||
            (
                window as typeof window & {
                    webkitAudioContext?: typeof AudioContext;
                }
            ).webkitAudioContext;

        if (!AudioContextConstructor) {
            console.warn(
                "[BackgroundMusic] Web Audio API is not supported."
            );

            return null;
        }

        try {
            const context = new AudioContextConstructor();
            const source = context.createMediaElementSource(audio);
            const analyser = context.createAnalyser();

            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.05;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -15;

            source.connect(analyser);
            analyser.connect(context.destination);

            audioCtxRef.current = context;
            sourceRef.current = source;
            analyserRef.current = analyser;
            sharedAnalyser = analyser;

            window.dispatchEvent(
                new CustomEvent("background-music:analyser-ready", {
                    detail: {
                        analyser,
                    },
                })
            );

            console.info(
                "[BackgroundMusic] Audio graph created.",
                {
                    contextState: context.state,
                    sampleRate: context.sampleRate,
                    source: audio.currentSrc || audio.src,
                }
            );

            return context;
        } catch (error) {
            console.error(
                "[BackgroundMusic] Audio graph setup failed:",
                error
            );

            return null;
        }
    }, []);

    const startMusic = useCallback(
        async ({
            setupGraph = true,
        }: {
            setupGraph?: boolean;
        } = {}) => {
            if (isAdminRoute) {
                userPausedRef.current = true;
                emitStateChange(false);
                return false;
            }

            /*
             * تا وقتی voice lock فعال است،
             * هیچ play خارجی نباید موزیک را برگرداند.
             */
            if (activeVoiceLocksRef.current > 0) {
                emitStateChange(false);
                return false;
            }

            const audio = audioRef.current;

            if (!audio) {
                console.error(
                    "[BackgroundMusic] Audio element does not exist."
                );

                return false;
            }

            if (!audio.paused && !audio.ended) {
                emitStateChange(true);
                return true;
            }

            if (isStartingRef.current) {
                return false;
            }

            isStartingRef.current = true;
            clearFadeTimer();

            try {
                audio.muted = false;
                audio.volume = 0;

                const context = setupGraph
                    ? setupAudioGraph()
                    : null;

                const resumePromise =
                    context?.state === "suspended"
                        ? context.resume()
                        : Promise.resolve();

                const playPromise = audio.play();

                await Promise.all([
                    resumePromise,
                    playPromise,
                ]);

                /*
                 * اگر در فاصله شروع تا اتمام play، voice lock فعال شد
                 * یا route به admin رفت، پخش را ادامه نده.
                 */
                if (
                    isAdminRoute ||
                    activeVoiceLocksRef.current > 0
                ) {
                    audio.pause();
                    audio.volume = TARGET_VOLUME;
                    emitStateChange(false);
                    return false;
                }

                userPausedRef.current = false;

                emitStateChange(true);
                fadeIn();

                console.info(
                    "[BackgroundMusic] Music playback started.",
                    {
                        paused: audio.paused,
                        muted: audio.muted,
                        volume: audio.volume,
                        readyState: audio.readyState,
                        networkState: audio.networkState,
                        contextState: context?.state ?? "not-created",
                        source: audio.currentSrc || audio.src,
                    }
                );

                return true;
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === "NotAllowedError"
                ) {
                    console.info(
                        "[BackgroundMusic] Audible autoplay was blocked. " +
                            "Music will start after the first user interaction.",
                        error
                    );
                } else {
                    console.error(
                        "[BackgroundMusic] Music playback failed:",
                        error
                    );
                }

                console.table({
                    source: audio.currentSrc || audio.src,
                    paused: audio.paused,
                    muted: audio.muted,
                    volume: audio.volume,
                    readyState: audio.readyState,
                    networkState: audio.networkState,
                    mediaErrorCode: audio.error?.code ?? "none",
                    mediaErrorMessage:
                        audio.error?.message ?? "none",
                    audioContextState:
                        audioCtxRef.current?.state ?? "none",
                });

                emitStateChange(false);

                return false;
            } finally {
                isStartingRef.current = false;
            }
        },
        [
            clearFadeTimer,
            emitStateChange,
            fadeIn,
            isAdminRoute,
            setupAudioGraph,
        ]
    );

    const pauseMusic = useCallback(
        (markAsUserPause = true) => {
            const audio = audioRef.current;

            if (!audio) {
                emitStateChange(false);
                return;
            }

            if (markAsUserPause) {
                userPausedRef.current = true;
                musicWasPlayingBeforeVoiceRef.current = false;
            }

            if (audio.paused) {
                emitStateChange(false);
                return;
            }

            emitStateChange(false);
            fadeOutAndPause();
        },
        [emitStateChange, fadeOutAndPause]
    );

    const handleVoicePauseRequest = useCallback(() => {
        if (isAdminRoute) {
            musicWasPlayingBeforeVoiceRef.current = false;
            return;
        }

        activeVoiceLocksRef.current += 1;

        const audio = audioRef.current;

        if (!audio) {
            musicWasPlayingBeforeVoiceRef.current = false;
            emitStateChange(false);
            return;
        }

        const wasPlaying =
            !audio.paused &&
            !audio.ended &&
            !userPausedRef.current;

        /*
         * فقط اگر حداقل یکی از voice requestها در زمانی آمده
         * که موزیک واقعاً فعال بوده، بعداً resume مجاز است.
         */
        if (wasPlaying) {
            musicWasPlayingBeforeVoiceRef.current = true;
        }

        if (!wasPlaying) {
            emitStateChange(false);
            return;
        }

        pauseMusic(false);
    }, [emitStateChange, isAdminRoute, pauseMusic]);

    const handleVoiceResumeRequest = useCallback(async () => {
        if (activeVoiceLocksRef.current > 0) {
            activeVoiceLocksRef.current -= 1;
        }

        /*
         * تا وقتی هنوز voice دیگری فعال است، resume نکن.
         */
        if (activeVoiceLocksRef.current > 0) {
            return;
        }

        if (isAdminRoute) {
            musicWasPlayingBeforeVoiceRef.current = false;
            emitStateChange(false);
            return;
        }

        const shouldResume =
            musicWasPlayingBeforeVoiceRef.current &&
            !userPausedRef.current;

        musicWasPlayingBeforeVoiceRef.current = false;

        if (!shouldResume) {
            return;
        }

        await startMusic({
            setupGraph: true,
        });
    }, [emitStateChange, isAdminRoute, startMusic]);

    /*
     * هنگام ورود به /admin، اگر موزیک فعال باشد متوقف می‌شود.
     */
    useEffect(() => {
        if (!isAdminRoute) {
            return;
        }

        userPausedRef.current = true;
        musicWasPlayingBeforeVoiceRef.current = false;
        activeVoiceLocksRef.current = 0;

        const audio = audioRef.current;

        if (!audio) {
            emitStateChange(false);
            return;
        }

        clearFadeTimer();

        audio.pause();
        audio.volume = TARGET_VOLUME;

        emitStateChange(false);
    }, [
        clearFadeTimer,
        emitStateChange,
        isAdminRoute,
    ]);

    /**
     * تلاش اولیه برای autoplay.
     */
    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) return;

        const attemptAutoplay = async () => {
            setIsReady(true);

            if (isAdminRoute) {
                emitStateChange(false);
                return;
            }

            const started = await startMusic({
                setupGraph: false,
            });

            if (!started) {
                emitStateChange(false);
            }
        };

        const handleCanPlay = () => {
            void attemptAutoplay();
        };

        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            void attemptAutoplay();
        } else {
            audio.addEventListener(
                "canplay",
                handleCanPlay,
                { once: true }
            );
        }

        const handleAudioError = () => {
            console.error(
                "[BackgroundMusic] Audio file could not be loaded:",
                {
                    src: audio.currentSrc || audio.src,
                    mediaErrorCode: audio.error?.code,
                    mediaErrorMessage: audio.error?.message,
                }
            );
        };

        audio.addEventListener("error", handleAudioError);

        return () => {
            audio.removeEventListener(
                "canplay",
                handleCanPlay
            );

            audio.removeEventListener(
                "error",
                handleAudioError
            );
        };
    }, [
        emitStateChange,
        isAdminRoute,
        startMusic,
    ]);

    /**
     * اگر autoplay مسدود شده باشد، اولین تعامل معمولی کاربر با صفحه
     * موزیک را راه‌اندازی می‌کند.
     */
    useEffect(() => {
        if (!isReady || isAdminRoute) {
            return;
        }

        const handleFirstInteraction = (event: Event) => {
            if (isAdminRoute) {
                removeInteractionListeners(
                    handleFirstInteraction
                );
                return;
            }

            if (
                userPausedRef.current ||
                isPlayingRef.current ||
                activeVoiceLocksRef.current > 0
            ) {
                removeInteractionListeners(
                    handleFirstInteraction
                );
                return;
            }

            const target = event.target;

            if (
                target instanceof Element &&
                target.closest("[data-music-control]")
            ) {
                return;
            }

            void startMusic({
                setupGraph: true,
            }).then((started) => {
                if (started) {
                    removeInteractionListeners(
                        handleFirstInteraction
                    );
                }
            });
        };

        addInteractionListeners(handleFirstInteraction);

        return () => {
            removeInteractionListeners(handleFirstInteraction);
        };
    }, [
        isAdminRoute,
        isReady,
        startMusic,
    ]);

    /**
     * اگر autoplay واقعاً موفق شده باشد، در اولین تعامل بعدی فقط
     * AudioContext/analyser را فعال می‌کنیم.
     */
    useEffect(() => {
        if (isAdminRoute) {
            return;
        }

        const enableAnalyserOnInteraction = () => {
            if (isAdminRoute) {
                removeInteractionListeners(
                    enableAnalyserOnInteraction
                );
                return;
            }

            if (!isPlayingRef.current) {
                return;
            }

            if (analyserRef.current) {
                removeInteractionListeners(
                    enableAnalyserOnInteraction
                );
                return;
            }

            const context = setupAudioGraph();

            if (context?.state === "suspended") {
                void context.resume().catch((error) => {
                    console.error(
                        "[BackgroundMusic] Could not resume AudioContext:",
                        error
                    );
                });
            }

            removeInteractionListeners(
                enableAnalyserOnInteraction
            );
        };

        addInteractionListeners(enableAnalyserOnInteraction);

        return () => {
            removeInteractionListeners(enableAnalyserOnInteraction);
        };
    }, [
        isAdminRoute,
        setupAudioGraph,
    ]);

    /**
     * همگام‌سازی state با رخدادهای خود عنصر audio.
     */
    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) return;

        const handlePlay = () => {
            emitStateChange(true);
        };

        const handlePause = () => {
            emitStateChange(false);
        };

        const handleEnded = () => {
            emitStateChange(false);
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [emitStateChange]);

    /**
     * فرمان‌های صادرشده توسط ویژوالایزر و voice card.
     */
    useEffect(() => {
        const handleToggle = async () => {
            if (isAdminRoute) {
                return;
            }

            const audio = audioRef.current;

            if (!audio) return;

            if (!audio.paused) {
                pauseMusic(true);
                return;
            }

            /*
             * اگر voice در حال اجراست، toggle نباید موزیک را روشن کند.
             */
            if (activeVoiceLocksRef.current > 0) {
                return;
            }

            userPausedRef.current = false;

            await startMusic({
                setupGraph: true,
            });
        };

        const handlePlayRequest = async () => {
            if (isAdminRoute) {
                return;
            }

            if (activeVoiceLocksRef.current > 0) {
                return;
            }

            userPausedRef.current = false;

            await startMusic({
                setupGraph: true,
            });
        };

        const handlePauseRequest = () => {
            pauseMusic(true);
        };

        window.addEventListener(
            "background-music:toggle",
            handleToggle
        );

        window.addEventListener(
            "background-music:play",
            handlePlayRequest
        );

        window.addEventListener(
            "background-music:pause",
            handlePauseRequest
        );

        window.addEventListener(
            "background-music:pause-for-voice",
            handleVoicePauseRequest
        );

        window.addEventListener(
            "background-music:resume-after-voice",
            handleVoiceResumeRequest
        );

        return () => {
            window.removeEventListener(
                "background-music:toggle",
                handleToggle
            );

            window.removeEventListener(
                "background-music:play",
                handlePlayRequest
            );

            window.removeEventListener(
                "background-music:pause",
                handlePauseRequest
            );

            window.removeEventListener(
                "background-music:pause-for-voice",
                handleVoicePauseRequest
            );

            window.removeEventListener(
                "background-music:resume-after-voice",
                handleVoiceResumeRequest
            );
        };
    }, [
        handleVoicePauseRequest,
        handleVoiceResumeRequest,
        isAdminRoute,
        pauseMusic,
        startMusic,
    ]);

    useEffect(() => {
        if (closeContextTimerRef.current !== null) {
            window.clearTimeout(closeContextTimerRef.current);
            closeContextTimerRef.current = null;
        }

        return () => {
            clearFadeTimer();

            closeContextTimerRef.current = window.setTimeout(() => {
                const context = audioCtxRef.current;

                sharedAnalyser = null;
                analyserRef.current = null;
                sourceRef.current = null;
                audioCtxRef.current = null;
                closeContextTimerRef.current = null;

                if (context && context.state !== "closed") {
                    void context.close().catch((error) => {
                        console.warn(
                            "[BackgroundMusic] AudioContext close failed:",
                            error
                        );
                    });
                }
            }, 0);
        };
    }, [clearFadeTimer]);

    return (
        <audio
            ref={audioRef}
            src={audioUrl}
            loop
            preload="auto"
            playsInline
            aria-hidden="true"
        />
    );
}
