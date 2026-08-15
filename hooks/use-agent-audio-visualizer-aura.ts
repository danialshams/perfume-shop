"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  type AnimationPlaybackControlsWithThen,
  type ValueAnimationTransition,
  animate,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";

export type AuraAgentState =
  | "idle"
  | "failed"
  | "disconnected"
  | "listening"
  | "pre-connect-buffering"
  | "thinking"
  | "connecting"
  | "initializing"
  | "speaking";

const DEFAULT_SPEED = 10;
const DEFAULT_AMPLITUDE = 2;
const DEFAULT_FREQUENCY = 0.5;
const DEFAULT_SCALE = 0.2;
const DEFAULT_BRIGHTNESS = 1.5;

const DEFAULT_TRANSITION: ValueAnimationTransition = {
  duration: 0.5,
  ease: "easeOut",
};

const SOFT_PULSE_TRANSITION: ValueAnimationTransition = {
  duration: 2.4,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
};

const DEFAULT_PULSE_TRANSITION: ValueAnimationTransition = {
  duration: 0.35,
  ease: "easeOut",
  repeat: Infinity,
  repeatType: "mirror",
};

function useAnimatedValue<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const motionValue = useMotionValue(initialValue);
  const controlsRef = useRef<AnimationPlaybackControlsWithThen | null>(null);

  useMotionValueEvent(motionValue, "change", (latestValue) => {
    setValue(latestValue as T);
  });

  const animateFn = useCallback(
    (targetValue: T | T[], transition: ValueAnimationTransition) => {
      controlsRef.current?.stop();
      controlsRef.current = animate(motionValue, targetValue, transition);
    },
    [motionValue]
  );

  return {
    value,
    motionValue,
    controls: controlsRef,
    animate: animateFn,
  };
}

export function useAgentAudioVisualizerAura(
  state: AuraAgentState | undefined,
  audioLevel = 0
) {
  const [speed, setSpeed] = useState(DEFAULT_SPEED);

  const {
    value: scale,
    animate: animateScale,
    motionValue: scaleMotionValue,
  } = useAnimatedValue(DEFAULT_SCALE);

  const { value: amplitude, animate: animateAmplitude } =
    useAnimatedValue(DEFAULT_AMPLITUDE);

  const { value: frequency, animate: animateFrequency } =
    useAnimatedValue(DEFAULT_FREQUENCY);

  const { value: brightness, animate: animateBrightness } =
    useAnimatedValue(DEFAULT_BRIGHTNESS);

  useEffect(() => {
    switch (state) {
      case "idle":
        setSpeed(14);
        animateScale([0.205, 0.225], SOFT_PULSE_TRANSITION);
        animateAmplitude(0.7, DEFAULT_TRANSITION);
        animateFrequency(0.55, DEFAULT_TRANSITION);
        animateBrightness([0.92, 1.08], SOFT_PULSE_TRANSITION);
        return;

      case "failed":
      case "disconnected":
        setSpeed(10);
        animateScale(0.2, DEFAULT_TRANSITION);
        animateAmplitude(1.0, DEFAULT_TRANSITION);
        animateFrequency(0.4, DEFAULT_TRANSITION);
        animateBrightness(0.95, DEFAULT_TRANSITION);
        return;

      case "listening":
      case "pre-connect-buffering":
        setSpeed(20);
        animateScale(0.28, {
          type: "spring",
          duration: 1.0,
          bounce: 0.35,
        });
        animateAmplitude(0.95, DEFAULT_TRANSITION);
        animateFrequency(0.72, DEFAULT_TRANSITION);
        animateBrightness([1.3, 1.8], DEFAULT_PULSE_TRANSITION);
        return;

      case "thinking":
      case "connecting":
      case "initializing":
        setSpeed(28);
        animateScale(0.27, DEFAULT_TRANSITION);
        animateAmplitude(0.45, DEFAULT_TRANSITION);
        animateFrequency(0.95, DEFAULT_TRANSITION);
        animateBrightness([0.85, 1.75], {
          duration: 1.2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
        });
        return;

      case "speaking":
        setSpeed(62);
        animateScale(0.26, DEFAULT_TRANSITION);
        animateAmplitude(0.7, DEFAULT_TRANSITION);
        animateFrequency(1.18, DEFAULT_TRANSITION);
        animateBrightness(1.35, DEFAULT_TRANSITION);
        return;

      default:
        setSpeed(10);
        animateScale(0.2, DEFAULT_TRANSITION);
        animateAmplitude(1.0, DEFAULT_TRANSITION);
        animateFrequency(0.4, DEFAULT_TRANSITION);
        animateBrightness(1.0, DEFAULT_TRANSITION);
        return;
    }
  }, [state, animateScale, animateAmplitude, animateFrequency, animateBrightness]);

  useEffect(() => {
    if (state !== "speaking") return;

    const safeLevel = Number.isFinite(audioLevel)
      ? Math.min(1, Math.max(0, audioLevel))
      : 0;

    if (!scaleMotionValue.isAnimating()) {
      animateScale(0.22 + 0.16 * safeLevel, { duration: 0 });
    }
  }, [state, audioLevel, scaleMotionValue, animateScale]);

  return {
    speed,
    scale,
    amplitude,
    frequency,
    brightness,
  };
}
