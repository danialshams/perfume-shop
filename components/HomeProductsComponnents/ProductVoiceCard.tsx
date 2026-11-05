"use client";

import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaPause, FaPlay } from "react-icons/fa6";
import { IoAdd, IoRemove } from "react-icons/io5";
import { TbRewindBackward15, TbRewindForward15 } from "react-icons/tb";
import { useTheme } from "next-themes";

import { normalizeAssetUrl } from "@/lib/product";

type Props = {
  voiceUrl: string;
  productName: string;
  compact?: boolean;
  className?: string;
  desktop?: boolean;
  defaultOpen?: boolean;
};

type VisualizerPhase = "playing" | "pausing" | "paused";

const BAR_COUNT = 7;
const DOT_SIZE = 3;
const PLAYING_BAR_WIDTH = 2;

const VISUALIZER_RGB = "63, 68, 77";
const BAR_COLOR_ALPHA = 0.82;
const DOT_COLOR_ALPHA = 0.4;

const BAR_COLOR = `rgba(${VISUALIZER_RGB}, ${BAR_COLOR_ALPHA})`;
const DOT_COLOR = `rgba(${VISUALIZER_RGB}, ${DOT_COLOR_ALPHA})`;

const WAVEFORM_GAIN = 2.35;
const WAVEFORM_NOISE_GATE = 0.012;
const WAVEFORM_RESPONSE_CURVE = 0.72;
const WAVEFORM_NEIGHBOR_SMOOTHING = 0.24;

const ATTACK_TIME_MS = 10;
const RELEASE_TIME_MS = 72;
const PAUSE_MORPH_DURATION_MS = 420;

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ProductVoiceCard({
  voiceUrl,
  productName,
  compact = false,
  className,
  desktop = false,
  defaultOpen = false,
}: Props) {
  const { resolvedTheme } = useTheme();
  const panelId = useId();
  const scale = compact
    ? {
      visualizerWidth: 158,
      visualizerHeight: 26,
      barGap: 3,
      barMax: 20,
      trackWidth: 158,
      controlSize: 24,
      controlGap: 18,
      seekIcon: 13,
      playIcon: 12,
      timeSize: 10,
      rateSize: 10,
      rateOffset: -26,
    }
    : {
      visualizerWidth: 186,
      visualizerHeight: 28,
      barGap: 3.5,
      barMax: 23,
      trackWidth: 186,
      controlSize: 26,
      controlGap: 22,
      seekIcon: 14,
      playIcon: 13,
      timeSize: 10.5,
      rateSize: 10.5,
      rateOffset: -30,
    };

  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLButtonElement | null>(null);
  const chevronRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const lineActiveRef = useRef<HTMLSpanElement | null>(null);
  const openTweenRef = useRef<gsap.core.Timeline | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const progressRef = useRef<HTMLDivElement | null>(null);
  const isDraggingProgressRef = useRef(false);
  const hasAssignedSrcRef = useRef(false);
  const mountedRef = useRef(true);

  /*
   * اگر این کارت برای pause شدن موزیک background درخواست داده باشد،
   * بعداً باید همان درخواست را release کند.
   */
  const voiceMusicPauseRequestedRef = useRef(false);

  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const waveformDataRef = useRef<Float32Array | null>(null);
  const smoothedBarsRef = useRef<number[]>(
    new Array(BAR_COUNT).fill(0),
  );

  const visualizerRafRef = useRef<number | null>(null);
  const visualizerPhaseRef = useRef<VisualizerPhase>("paused");
  const lastFrameTimeRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 2>(1);

  const [isVisualizerHovered, setIsVisualizerHovered] = useState(false);
  const [isProgressHovered, setIsProgressHovered] = useState(false);
  const [isProgressDragging, setIsProgressDragging] = useState(false);

  const safeVoiceUrl = normalizeAssetUrl(voiceUrl);

  const themeMode: "dark" | "light" =
    resolvedTheme === "dark" ? "dark" : "light";

  const progressPercent =
    duration > 0
      ? clamp((currentTime / duration) * 100, 0, 100)
      : 0;

  const canSeekBackward = isReady && currentTime > 0;
  const canSeekForward = isReady && duration > 0 && currentTime < duration;

  const requestMusicPauseForVoice = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (voiceMusicPauseRequestedRef.current) {
      return;
    }

    voiceMusicPauseRequestedRef.current = true;

    window.dispatchEvent(
      new Event("background-music:pause-for-voice"),
    );
  };

  const releaseMusicAfterVoice = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!voiceMusicPauseRequestedRef.current) {
      return;
    }

    voiceMusicPauseRequestedRef.current = false;

    window.dispatchEvent(
      new Event("background-music:resume-after-voice"),
    );
  };

  const stopVisualizerFrame = () => {
    if (visualizerRafRef.current !== null) {
      window.cancelAnimationFrame(visualizerRafRef.current);
      visualizerRafRef.current = null;
    }

    lastFrameTimeRef.current = null;
  };

  const setVisualizerPhase = (phase: VisualizerPhase) => {
    visualizerPhaseRef.current = phase;
  };

  const setBarsToDots = () => {
    barRefs.current.forEach((bar) => {
      if (!bar) return;

      bar.style.width = `${DOT_SIZE}px`;
      bar.style.height = `${DOT_SIZE}px`;
      bar.style.opacity = "1";
      bar.style.backgroundColor = DOT_COLOR;
      bar.style.borderRadius = "9999px";
      bar.style.transform = "translateY(0) scale(1)";
    });

    smoothedBarsRef.current.fill(0);
  };

  const startPauseMorph = () => {
    if (visualizerPhaseRef.current === "paused") {
      setBarsToDots();
      return;
    }

    setVisualizerPhase("pausing");
    stopVisualizerFrame();

    const startHeights = barRefs.current.map((bar) => {
      if (!bar) return DOT_SIZE;

      const inlineHeight = Number.parseFloat(bar.style.height);

      if (Number.isFinite(inlineHeight)) {
        return inlineHeight;
      }

      return bar.getBoundingClientRect().height || DOT_SIZE;
    });

    const startWidths = barRefs.current.map((bar) => {
      if (!bar) return PLAYING_BAR_WIDTH;

      const inlineWidth = Number.parseFloat(bar.style.width);

      if (Number.isFinite(inlineWidth)) {
        return inlineWidth;
      }

      return bar.getBoundingClientRect().width || PLAYING_BAR_WIDTH;
    });

    let startTimestamp: number | null = null;

    const morphToDots = (timestamp: number) => {
      if (visualizerPhaseRef.current !== "pausing") {
        stopVisualizerFrame();
        return;
      }

      if (startTimestamp === null) {
        startTimestamp = timestamp;
      }

      const elapsed = timestamp - startTimestamp;
      const rawProgress = clamp(
        elapsed / PAUSE_MORPH_DURATION_MS,
        0,
        1,
      );

      const progress = easeInOutCubic(rawProgress);

      barRefs.current.forEach((bar, index) => {
        if (!bar) return;

        const startHeight = startHeights[index] ?? DOT_SIZE;
        const startWidth = startWidths[index] ?? PLAYING_BAR_WIDTH;

        const nextHeight =
          startHeight + (DOT_SIZE - startHeight) * progress;

        const nextWidth =
          startWidth + (DOT_SIZE - startWidth) * progress;

        const colorAlpha =
          BAR_COLOR_ALPHA +
          (DOT_COLOR_ALPHA - BAR_COLOR_ALPHA) * progress;

        bar.style.height = `${nextHeight.toFixed(2)}px`;
        bar.style.width = `${nextWidth.toFixed(2)}px`;
        bar.style.opacity = "1";
        bar.style.borderRadius = "9999px";
        bar.style.backgroundColor =
          `rgba(${VISUALIZER_RGB}, ${colorAlpha.toFixed(3)})`;
        bar.style.transform = "translateY(0) scale(1)";
      });

      if (rawProgress < 1) {
        visualizerRafRef.current =
          window.requestAnimationFrame(morphToDots);

        return;
      }

      setVisualizerPhase("paused");
      setBarsToDots();

      visualizerRafRef.current = null;
      lastFrameTimeRef.current = null;
    };

    visualizerRafRef.current =
      window.requestAnimationFrame(morphToDots);
  };

  const startVisualizerLoop = () => {
    stopVisualizerFrame();

    setVisualizerPhase("playing");
    lastFrameTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (visualizerPhaseRef.current !== "playing") {
        stopVisualizerFrame();
        return;
      }

      const analyser = analyserRef.current;

      if (!analyser) {
        setBarsToDots();
        visualizerRafRef.current =
          window.requestAnimationFrame(animate);

        return;
      }

      const previousTimestamp =
        lastFrameTimeRef.current ?? timestamp;

      const deltaTime = clamp(
        timestamp - previousTimestamp,
        1,
        40,
      );

      lastFrameTimeRef.current = timestamp;

      if (
        !waveformDataRef.current ||
        waveformDataRef.current.length !== analyser.fftSize
      ) {
        waveformDataRef.current = new Float32Array(analyser.fftSize);
      }

      const waveformData = waveformDataRef.current;

      analyser.getFloatTimeDomainData(waveformData as Float32Array<ArrayBuffer>);

      const rawTargets = new Array<number>(BAR_COUNT).fill(0);
      const samplesPerBar = Math.max(
        1,
        Math.floor(waveformData.length / BAR_COUNT),
      );

      for (let barIndex = 0; barIndex < BAR_COUNT; barIndex += 1) {
        const startSample = barIndex * samplesPerBar;

        const endSample =
          barIndex === BAR_COUNT - 1
            ? waveformData.length
            : Math.min(
              waveformData.length,
              startSample + samplesPerBar,
            );

        let squareSum = 0;
        let peak = 0;
        let sampleCount = 0;

        for (
          let sampleIndex = startSample;
          sampleIndex < endSample;
          sampleIndex += 1
        ) {
          const sample = waveformData[sampleIndex];

          if (!Number.isFinite(sample)) continue;

          const absoluteSample = Math.abs(sample);

          squareSum += sample * sample;
          peak = Math.max(peak, absoluteSample);
          sampleCount += 1;
        }

        const rms =
          sampleCount > 0
            ? Math.sqrt(squareSum / sampleCount)
            : 0;

        let amplitude = rms * 0.72 + peak * 0.28;

        if (amplitude <= WAVEFORM_NOISE_GATE) {
          amplitude = 0;
        } else {
          amplitude =
            (amplitude - WAVEFORM_NOISE_GATE) /
            (1 - WAVEFORM_NOISE_GATE);
        }

        amplitude = Math.pow(
          clamp(amplitude * WAVEFORM_GAIN, 0, 1),
          WAVEFORM_RESPONSE_CURVE,
        );

        const normalizedPosition =
          BAR_COUNT > 1
            ? barIndex / (BAR_COUNT - 1)
            : 0.5;

        const distanceFromCenter =
          Math.abs(normalizedPosition - 0.5) * 2;

        const edgeWeight =
          1 - Math.pow(distanceFromCenter, 2.4) * 0.18;

        rawTargets[barIndex] = clamp(
          amplitude * edgeWeight,
          0,
          1,
        );
      }

      const waveformTargets = rawTargets.map((target, index) => {
        const previous = rawTargets[index - 1] ?? target;
        const next = rawTargets[index + 1] ?? target;
        const neighborAverage = (previous + target + next) / 3;

        return clamp(
          target * (1 - WAVEFORM_NEIGHBOR_SMOOTHING) +
          neighborAverage * WAVEFORM_NEIGHBOR_SMOOTHING,
          0,
          1,
        );
      });

      const smoothedBars = smoothedBarsRef.current;

      barRefs.current.forEach((bar, index) => {
        if (!bar) return;

        const target = waveformTargets[index] ?? 0;
        const current = smoothedBars[index] ?? 0;

        const timeConstant =
          target > current
            ? ATTACK_TIME_MS
            : RELEASE_TIME_MS;

        const alpha =
          1 - Math.exp(-deltaTime / timeConstant);

        const nextValue =
          current + (target - current) * alpha;

        smoothedBars[index] = nextValue;

        const rawHeight =
          DOT_SIZE +
          nextValue * (scale.barMax - DOT_SIZE);

        const pixelRatio = window.devicePixelRatio || 1;
        const heightStep = 1 / pixelRatio;

        const height =
          Math.round(rawHeight / heightStep) * heightStep;

        bar.style.width = `${PLAYING_BAR_WIDTH}px`;
        bar.style.height = `${Math.max(DOT_SIZE, height)}px`;
        bar.style.opacity = "1";
        bar.style.backgroundColor = BAR_COLOR;
        bar.style.borderRadius = "9999px";
        bar.style.transform = "translateY(0) scale(1)";
      });

      visualizerRafRef.current =
        window.requestAnimationFrame(animate);
    };

    visualizerRafRef.current =
      window.requestAnimationFrame(animate);
  };

  const ensureAudioSrc = () => {
    const audio = audioRef.current;

    if (!audio || !safeVoiceUrl) {
      return false;
    }

    if (!hasAssignedSrcRef.current) {
      audio.src = safeVoiceUrl;
      audio.load();
      hasAssignedSrcRef.current = true;
    }

    audio.playbackRate = playbackRate;
    audio.defaultPlaybackRate = playbackRate;

    return true;
  };

  const setupAudioGraph = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn(
          "Web Audio API is not supported in this browser.",
        );

        return;
      }

      audioContextRef.current = new AudioContextClass();
    }

    const audioContext = audioContextRef.current;

    if (!analyserRef.current) {
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;
      analyser.minDecibels = -96;
      analyser.maxDecibels = -8;

      if (!sourceNodeRef.current) {
        sourceNodeRef.current =
          audioContext.createMediaElementSource(audio);
      }

      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;
      waveformDataRef.current = new Float32Array(
        analyser.fftSize,
      );
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  };

  const beginPlayback = async () => {
    const audio = audioRef.current;

    if (!audio || !safeVoiceUrl || isLoadingPlay) {
      return;
    }

    setIsLoadingPlay(true);

    try {
      const hasSource = ensureAudioSrc();

      if (!hasSource) {
        return;
      }

      audio.playbackRate = playbackRate;
      audio.defaultPlaybackRate = playbackRate;

      /*
       * قبل از شروع voice، از BackgroundMusic می‌خواهیم fade-out شود.
       */
      requestMusicPauseForVoice();

      await setupAudioGraph();
      await audio.play();
    } catch (error) {
      console.error("Audio play failed:", error);

      /*
       * اگر voice موفق به شروع نشد،
       * lock موزیک background نباید باقی بماند.
       */
      releaseMusicAfterVoice();

      if (mountedRef.current) {
        setIsPlaying(false);
      }

      startPauseMorph();
    } finally {
      if (mountedRef.current) {
        setIsLoadingPlay(false);
      }
    }
  };

  const toggleAudio = async () => {
    const audio = audioRef.current;

    if (!audio || !safeVoiceUrl || isLoadingPlay) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    await beginPlayback();
  };

  const togglePlaybackRate = () => {
    const nextRate: 1 | 2 =
      playbackRate === 1 ? 2 : 1;

    setPlaybackRate(nextRate);

    const audio = audioRef.current;

    if (audio) {
      audio.playbackRate = nextRate;
      audio.defaultPlaybackRate = nextRate;

      if ("preservesPitch" in audio) {
        audio.preservesPitch = true;
      }
    }
  };

  const seekToTime = (nextTime: number) => {
    const audio = audioRef.current;

    if (!audio || !duration) return;

    const safeTime = clamp(nextTime, 0, duration);

    audio.currentTime = safeTime;

    if (mountedRef.current) {
      setCurrentTime(safeTime);
    }
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;

    if (!audio || !isReady) return;

    const current = Number.isFinite(audio.currentTime)
      ? audio.currentTime
      : 0;

    seekToTime(current + delta);
  };

  const seekToClientX = (clientX: number) => {
    const progress = progressRef.current;

    if (!progress || !duration) return;

    const rect = progress.getBoundingClientRect();

    if (rect.width <= 0) return;

    const ratio = clamp(
      (clientX - rect.left) / rect.width,
      0,
      1,
    );

    seekToTime(ratio * duration);
  };

  const handleProgressPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!isReady || duration <= 0) return;

    isDraggingProgressRef.current = true;
    setIsProgressDragging(true);

    event.currentTarget.setPointerCapture?.(event.pointerId);
    seekToClientX(event.clientX);
  };

  const handleProgressPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!isDraggingProgressRef.current) return;

    seekToClientX(event.clientX);
  };

  const handleProgressPointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!isDraggingProgressRef.current) return;

    isDraggingProgressRef.current = false;
    setIsProgressDragging(false);

    if (
      event.currentTarget.hasPointerCapture?.(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleProgressKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!isReady || duration <= 0) return;

    const keyboardStep = event.shiftKey ? 15 : 5;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        seek(-keyboardStep);
        break;

      case "ArrowRight":
        event.preventDefault();
        seek(keyboardStep);
        break;

      case "Home":
        event.preventDefault();
        seekToTime(0);
        break;

      case "End":
        event.preventDefault();
        seekToTime(duration);
        break;

      default:
        break;
    }
  };

  const formatTime = (seconds: number) => {
    const safeSeconds =
      Number.isFinite(seconds) && seconds > 0
        ? seconds
        : 0;

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = Math.floor(safeSeconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    mountedRef.current = true;
    setBarsToDots();

    return () => {
      mountedRef.current = false;
      stopVisualizerFrame();

      /*
       * اگر کارت هنگام پخش یا قبل از release شدن حذف شود،
       * background music در lock باقی نماند.
       */
      if (
        voiceMusicPauseRequestedRef.current &&
        typeof window !== "undefined"
      ) {
        voiceMusicPauseRequestedRef.current = false;

        window.dispatchEvent(
          new Event("background-music:resume-after-voice"),
        );
      }

      const audio = audioRef.current;

      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      const audioContext = audioContextRef.current;

      if (
        audioContext &&
        audioContext.state !== "closed"
      ) {
        void audioContext.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.defaultPlaybackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    /*
     * اگر source عوض شد و قبلاً برای این voice موزیک را pause کرده بودیم،
     * باید آن lock را آزاد کنیم.
     */
    releaseMusicAfterVoice();

    audio.pause();
    stopVisualizerFrame();
    setBarsToDots();

    audio.removeAttribute("src");
    audio.load();

    hasAssignedSrcRef.current = false;

    setIsPlaying(false);
    setIsLoadingPlay(false);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeVoiceUrl]);

  useLayoutEffect(() => {
    if (!safeVoiceUrl) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const header = headerRef.current;

    if (!section || !header) return;

    const context = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 20,
        filter: "blur(6px)",
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            once: true,
          },
        })
        .to(header, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
        });
    }, section);

    return () => context.revert();
  }, [safeVoiceUrl]);

  useLayoutEffect(() => {
    if (!safeVoiceUrl) return;

    const panel = panelRef.current;
    const body = bodyRef.current;
    const chevron = chevronRef.current;
    const activeLine = lineActiveRef.current;

    if (!panel || !body || !chevron || !activeLine) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(panel, {
        height: defaultOpen ? "auto" : 0,
      });

      gsap.set(body, {
        opacity: defaultOpen ? 1 : 0,
        y: defaultOpen ? 0 : 14,
        filter: defaultOpen
          ? "blur(0px)"
          : "blur(6px)",
      });

      gsap.set(chevron, {
        rotation: defaultOpen ? 180 : 0,
        transformOrigin: "center center",
      });

      gsap.set(activeLine, {
        scaleX: defaultOpen ? 1 : 0,
        transformOrigin: "center center",
        force3D: true,
      });

      const timeline = gsap.timeline({
        paused: true,
      });

      timeline
        .to(
          panel,
          {
            height: "auto",
            duration: 0.8,
            ease: "power3.inOut",
          },
          0,
        )
        .to(
          chevron,
          {
            rotation: 180,
            duration: 0.8,
            ease: "power3.inOut",
            transformOrigin: "center center",
          },
          0,
        )
        .to(
          body,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          },
          0.2,
        )
        .to(
          activeLine,
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power2.inOut",
            force3D: true,
          },
          0.3,
        );

      openTweenRef.current = timeline;

      if (defaultOpen) {
        timeline.progress(1);
      }
    }, panel);

    return () => {
      openTweenRef.current = null;
      context.revert();
    };
  }, [safeVoiceUrl, defaultOpen]);

  useLayoutEffect(() => {
    const timeline = openTweenRef.current;

    if (!timeline) return;

    if (isOpen) {
      timeline.timeScale(1).play();
    } else {
      timeline.timeScale(1).reverse();
    }
  }, [isOpen]);

  if (!safeVoiceUrl) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className={[
        desktop ? "hidden lg:block" : "lg:hidden",
        className ?? "",
      ].join(" ")}
    >
      <div className="w-full text-right">
        <button
          ref={headerRef}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group relative flex w-full items-center justify-between gap-6 px-7 py-3.5 outline-none sm:px-10 sm:py-4 lg:px-16"
        >
          <span
            className={[
              "max-w-[80%] bg-gradient-to-b from-[#24405f] via-[#14294a] to-[#0a1a2e]",
              "bg-clip-text pb-[3px] text-right text-transparent",
              "transition-opacity duration-700 ease-out group-hover:opacity-85",
              desktop
                ? "text-[16.5px] leading-[2.05] lg:text-[18px]"
                : "text-[14.5px] leading-[2] sm:text-[15.5px]",
            ].join(" ")}
            style={{
              fontWeight: 300,
              letterSpacing: "0",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <span style={{ opacity: 0.72 }}>معرفی صوتی</span>{" "}
            <span style={{ fontWeight: 400 }}>{productName}</span>
          </span>

          <div
            ref={chevronRef}
            className="shrink-0 text-[#7d8189] opacity-45 transition-opacity duration-500 ease-out group-hover:opacity-80"
            style={{ willChange: "transform" }}
          >
            {isOpen ? (
              <IoRemove size={14} />
            ) : (
              <IoAdd size={14} />
            )}
          </div>
        </button>

        <div
          ref={panelRef}
          id={panelId}
          className="overflow-hidden"
          style={{ height: 0 }}
        >
          <div
            ref={bodyRef}
            className={desktop ? "pt-3" : "pt-2"}
          >
            <div className="flex w-full flex-col items-center justify-center py-5 sm:py-6">
              <audio
                ref={audioRef}
                preload="none"
                controlsList="nodownload noplaybackrate"
                playsInline
                crossOrigin="anonymous"
                onLoadedMetadata={(event) => {
                  const nextDuration =
                    event.currentTarget.duration;

                  if (!mountedRef.current) return;

                  const hasValidDuration =
                    Number.isFinite(nextDuration) &&
                    nextDuration > 0;

                  setIsReady(hasValidDuration);
                  setDuration(
                    hasValidDuration ? nextDuration : 0,
                  );
                }}
                onCanPlay={() => {
                  if (mountedRef.current) {
                    setIsReady(true);
                  }
                }}
                onDurationChange={(event) => {
                  const nextDuration =
                    event.currentTarget.duration;

                  if (
                    mountedRef.current &&
                    Number.isFinite(nextDuration) &&
                    nextDuration > 0
                  ) {
                    setDuration(nextDuration);
                    setIsReady(true);
                  }
                }}
                onTimeUpdate={(event) => {
                  if (
                    !mountedRef.current ||
                    isDraggingProgressRef.current
                  ) {
                    return;
                  }

                  setCurrentTime(
                    event.currentTarget.currentTime,
                  );
                }}
                onPlay={() => {
                  if (mountedRef.current) {
                    setIsPlaying(true);
                    setIsLoadingPlay(false);
                  }

                  startVisualizerLoop();
                }}
                onPause={() => {
                  releaseMusicAfterVoice();

                  if (mountedRef.current) {
                    setIsPlaying(false);
                    setIsLoadingPlay(false);
                  }

                  startPauseMorph();
                }}
                onEnded={() => {
                  releaseMusicAfterVoice();

                  stopVisualizerFrame();

                  const audio = audioRef.current;

                  if (audio) {
                    audio.currentTime = 0;
                  }

                  if (mountedRef.current) {
                    setCurrentTime(0);
                    setIsPlaying(false);
                    setIsLoadingPlay(false);
                  }

                  startPauseMorph();
                }}
                onError={() => {
                  releaseMusicAfterVoice();

                  stopVisualizerFrame();

                  if (mountedRef.current) {
                    setIsPlaying(false);
                    setIsLoadingPlay(false);
                    setIsReady(false);
                  }

                  startPauseMorph();
                }}
                onRateChange={(event) => {
                  const nextRate =
                    event.currentTarget.playbackRate;

                  if (
                    mountedRef.current &&
                    (nextRate === 1 || nextRate === 2)
                  ) {
                    setPlaybackRate(nextRate);
                  }
                }}
              />

              <div
                dir="ltr"
                className="flex w-full max-w-md flex-col items-center px-3"
              >
                <div
                  onMouseEnter={() =>
                    setIsVisualizerHovered(true)
                  }
                  onMouseLeave={() =>
                    setIsVisualizerHovered(false)
                  }
                  style={{
                    position: "relative",
                    width: `${scale.visualizerWidth + 14}px`,
                    minHeight: `${scale.visualizerHeight + 4}px`,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    marginBottom: "2px",
                    transform: isVisualizerHovered
                      ? "translateY(-1px)"
                      : "translateY(0)",
                    transition:
                      "transform 600ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="voice-visualizer"
                    style={{
                      width: `${scale.visualizerWidth}px`,
                      height: `${scale.visualizerHeight}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: `${scale.barGap}px`,
                      pointerEvents: "none",
                    }}
                  >
                    {Array.from({
                      length: BAR_COUNT,
                    }).map((_, index) => (
                      <span
                        key={index}
                        ref={(element) => {
                          barRefs.current[index] = element;
                        }}
                        className="voice-visualizer-bar"
                      />
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    width: `${scale.trackWidth}px`,
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "26px",
                    opacity: 1,
                    visibility: "visible",
                  }}
                >
                  <div
                    ref={progressRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="زمان پخش فایل صوتی"
                    aria-valuemin={0}
                    aria-valuemax={Math.floor(duration)}
                    aria-valuenow={Math.floor(currentTime)}
                    aria-valuetext={`${formatTime(
                      currentTime,
                    )} از ${formatTime(duration)}`}
                    aria-disabled={!isReady}
                    onKeyDown={handleProgressKeyDown}
                    onPointerDown={
                      handleProgressPointerDown
                    }
                    onPointerMove={
                      handleProgressPointerMove
                    }
                    onPointerUp={handleProgressPointerUp}
                    onPointerCancel={
                      handleProgressPointerUp
                    }
                    onMouseEnter={() =>
                      setIsProgressHovered(true)
                    }
                    onMouseLeave={() =>
                      setIsProgressHovered(false)
                    }
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      cursor: isReady
                        ? "pointer"
                        : "default",
                      touchAction: "none",
                      outline: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        left: 0,
                        top: "50%",
                        height: "1.5px",
                        overflow: "hidden",
                        borderRadius: "999px",
                        background:
                          themeMode === "dark"
                            ? "rgba(226, 232, 240, 0.16)"
                            : "rgba(63, 68, 77, 0.16)",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background:
                            themeMode === "dark"
                              ? "rgba(226, 232, 240, 0.78)"
                              : "rgba(63, 68, 77, 0.82)",
                          transition: isProgressDragging
                            ? "none"
                            : "width 90ms linear",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        left: `${progressPercent}%`,
                        top: "50%",
                        width:
                          isProgressHovered ||
                            isProgressDragging
                            ? "8px"
                            : "5px",
                        height:
                          isProgressHovered ||
                            isProgressDragging
                            ? "8px"
                            : "5px",
                        borderRadius: "50%",
                        background:
                          themeMode === "dark"
                            ? "#e2e8f0"
                            : "#3f444d",
                        transform: "translate(-50%, -50%)",
                        transition: isProgressDragging
                          ? "none"
                          : "width 320ms cubic-bezier(0.22,1,0.36,1), height 320ms cubic-bezier(0.22,1,0.36,1)",

                      }}
                    />

                    <span
                                            style={{
                        position: "absolute",
                        left: 0,
                        top: "14px",
                        color:
                          themeMode === "dark"
                            ? "rgba(203, 213, 225, 0.62)"
                            : "rgba(63, 68, 77, 0.5)",
                        fontSize: `${scale.timeSize}px`,
                        fontWeight: 300,
                        letterSpacing: "0.04em",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                      }}

                    >
                      {formatTime(currentTime)}
                    </span>

                    <span
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "16px",
                        color: "#6b7280",
                        fontSize: "11px",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatTime(duration)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={togglePlaybackRate}
                    aria-label={
                      playbackRate === 2
                        ? "بازگشت به سرعت پخش معمولی"
                        : "پخش با سرعت دو برابر"
                    }
                    aria-pressed={playbackRate === 2}
                    title={
                      playbackRate === 2
                        ? "سرعت دو برابر فعال است"
                        : "پخش با سرعت دو برابر"
                    }
                    style={{
                      position: "absolute",
                      right: `${scale.rateOffset}px`,
                      top: "50%",
                      minWidth: "26px",
                      height: "26px",
                      padding: 0,
                      border: "none",
                      borderRadius: "999px",
                      background: "transparent",
                      color:
                        themeMode === "dark"
                          ? "#e2e8f0"
                          : "#2b303a",
                      opacity: playbackRate === 2 ? 1 : 0.42,
                      fontSize: `${scale.rateSize}px`,
                      fontWeight: playbackRate === 2 ? 500 : 400,
                      letterSpacing: "0.06em",
                      lineHeight: 1,
                      cursor: "pointer",
                      transform: "translateY(-50%)",
                      transition:
                        "opacity 320ms ease, font-weight 200ms ease, transform 320ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    ×2
                  </button>
                </div>

                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: `${scale.controlGap}px`,
                    opacity: 1,
                    visibility: "visible",
                    pointerEvents: "auto",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => seek(-15)}
                    disabled={!canSeekBackward}
                    aria-label="۱۵ ثانیه عقب"
                    style={{
                      width: `${scale.controlSize}px`,
                      height: `${scale.controlSize}px`,
                      padding: 0,
                      border: "none",
                      borderRadius: "50%",
                      background: "transparent",
                      color: canSeekBackward
                        ? themeMode === "dark"
                          ? "#cbd5e1"
                          : "#565b67"
                        : themeMode === "dark"
                          ? "#475569"
                          : "#d1d5db",
                      cursor: canSeekBackward
                        ? "pointer"
                        : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: canSeekBackward ? 1 : 0.65,
                    }}
                  >
                    <TbRewindBackward15
                      size={scale.seekIcon}
                      strokeWidth={1.4}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleAudio()}
                    disabled={isLoadingPlay}
                    aria-label={
                      isLoadingPlay
                        ? "در حال بارگذاری"
                        : isPlaying
                          ? "توقف پخش"
                          : "پخش فایل صوتی"
                    }
                    style={{
                      width: `${scale.controlSize}px`,
                      height: `${scale.controlSize}px`,
                      padding: 0,
                      border: "none",
                      borderRadius: 0,
                      background: "transparent",
                      color:
                        themeMode === "dark"
                          ? "#e2e8f0"
                          : "#374151",
                      cursor: isLoadingPlay
                        ? "wait"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "none",
                      opacity: isLoadingPlay ? 0.8 : 1,
                      transition:
                        "color 200ms ease, opacity 200ms ease, transform 200ms ease",
                    }}
                  >
                    {isLoadingPlay && !isPlaying ? (
                      <span className="voice-spinner" />
                    ) : isPlaying ? (
                      <FaPause size={scale.playIcon} />
                    ) : (
                      <span
                        style={{
                          display: "flex",
                          paddingLeft: "2px",
                        }}
                      >
                        <FaPlay size={scale.playIcon} />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => seek(15)}
                    disabled={!canSeekForward}
                    aria-label="۱۵ ثانیه جلو"
                    style={{
                      width: `${scale.controlSize}px`,
                      height: `${scale.controlSize}px`,
                      padding: 0,
                      border: "none",
                      borderRadius: "50%",
                      background: "transparent",
                      color: canSeekForward
                        ? themeMode === "dark"
                          ? "#cbd5e1"
                          : "#565b67"
                        : themeMode === "dark"
                          ? "#475569"
                          : "#d1d5db",
                      cursor: canSeekForward
                        ? "pointer"
                        : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: canSeekForward ? 1 : 0.65,
                    }}
                  >
                    <TbRewindForward15
                      size={compact ? 14 : 15}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className={desktop ? "h-3" : "h-2"} />
          </div>
        </div>

        <div className="relative mx-7 mt-5 h-px sm:mx-10 sm:mt-6 lg:mx-16">
          <span className="absolute inset-x-0 top-0 h-px w-full bg-[#e9e4dc]" />

          <span
            ref={lineActiveRef}
            className="absolute inset-x-0 top-0 h-px w-full bg-[#8a8a90]/55"
            style={{ willChange: "transform" }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes product-voice-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .voice-spinner {
          display: block;
          width: 12px;
          height: 12px;
          border: 1.5px solid rgba(63, 68, 77, 0.16);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: product-voice-spin 0.9s linear infinite;
        }

        .voice-visualizer {
          overflow: visible;
        }

        .voice-visualizer-bar {
          display: block;
          flex: 0 0 auto;
          align-self: center;
          width: ${DOT_SIZE}px;
          height: ${DOT_SIZE}px;
          border-radius: 9999px;
          background-color: ${DOT_COLOR};
          transform: translateY(0) scale(1);
          transform-origin: center center;
          will-change: height, width, transform, background-color;
        }

        @media (hover: hover) {
          button[aria-label="پخش فایل صوتی"]:hover,
          button[aria-label="توقف پخش"]:hover {
            transform: scale(1.06);
          }

          button[aria-label="۱۵ ثانیه عقب"]:hover:not(:disabled),
          button[aria-label="۱۵ ثانیه جلو"]:hover:not(:disabled) {
            opacity: 0.75;
          }

          button[aria-pressed]:hover {
            transform: translateY(-50%) scale(1.04);
            opacity: 0.85;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .voice-spinner {
            animation-duration: 1.5s;
          }

          .voice-visualizer-bar {
            will-change: auto;
          }
        }
      `}</style>
    </section>
  );
}
