"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The user must explicitly opt in. The original 10MB track is not downloaded
 * until Play is clicked. This control intentionally doesn't mount in admin.
 */
const TRACK_SRC = "/audio/luxury-piano.mp3";
const TARGET_VOLUME = 0.13;

export default function MaisonAmbientSound() {
  const pathname = usePathname();
  const onStorefront = pathname === "/" || pathname === "/products" || pathname.startsWith("/products/");
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantedRef = useRef(false);
  const voiceLocksRef = useRef(0);
  const resumeAfterVoiceRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const fadeOut = useCallback((pauseAfter = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    gsap.killTweensOf(audio);
    if (audio.paused) return;
    gsap.to(audio, {
      volume: 0, duration: 0.45, ease: "power2.inOut",
      onComplete: () => { if (pauseAfter) audio.pause(); },
    });
  }, []);

  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || voiceLocksRef.current > 0) return;
    gsap.killTweensOf(audio);
    audio.volume = 0;
    try {
      await audio.play();
      wantedRef.current = true;
      setError(false);
      setPlaying(true);
      gsap.to(audio, { volume: TARGET_VOLUME, duration: 1.2, ease: "power2.out" });
    } catch {
      wantedRef.current = false;
      setPlaying(false);
      setError(true);
    }
  }, []);

  const toggle = () => {
    if (wantedRef.current) {
      wantedRef.current = false;
      resumeAfterVoiceRef.current = false;
      setPlaying(false);
      fadeOut();
    } else {
      void start();
    }
  };

  useEffect(() => {
    if (onStorefront) return;
    wantedRef.current = false;
    resumeAfterVoiceRef.current = false;
    voiceLocksRef.current = 0;
    const audio = audioRef.current;
    if (audio) {
      gsap.killTweensOf(audio);
      audio.pause();
    }
    const frame = requestAnimationFrame(() => setPlaying(false));
    return () => cancelAnimationFrame(frame);
  }, [onStorefront]);

  useEffect(() => {
    const handleVoiceStart = () => {
      voiceLocksRef.current += 1;
      if (wantedRef.current && audioRef.current && !audioRef.current.paused) {
        resumeAfterVoiceRef.current = true;
        fadeOut();
        setPlaying(false);
      }
    };
    const handleVoiceStop = () => {
      voiceLocksRef.current = Math.max(0, voiceLocksRef.current - 1);
      if (voiceLocksRef.current === 0 && resumeAfterVoiceRef.current && onStorefront && wantedRef.current) {
        resumeAfterVoiceRef.current = false;
        void start();
      }
    };
    window.addEventListener("background-music:pause-for-voice", handleVoiceStart);
    window.addEventListener("background-music:resume-after-voice", handleVoiceStop);
    return () => {
      window.removeEventListener("background-music:pause-for-voice", handleVoiceStart);
      window.removeEventListener("background-music:resume-after-voice", handleVoiceStop);
    };
  }, [fadeOut, onStorefront, start]);

  useEffect(() => () => {
    if (audioRef.current) {
      gsap.killTweensOf(audioRef.current);
      audioRef.current.pause();
    }
  }, []);

  return (
    <>
      <audio ref={audioRef} src={TRACK_SRC} preload="none" loop playsInline aria-hidden="true" />
      {onStorefront && (
        <button
          type="button"
          className={"maison-sound " + (playing ? "maison-sound--playing" : "")}
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? "خاموش کردن موسیقی پس‌زمینه" : "روشن کردن موسیقی پس‌زمینه"}
          title={error ? "موسیقی در دسترس نیست" : playing ? "توقف موسیقی" : "پخش موسیقی"}
        >
          <span className="maison-sound__bars" aria-hidden="true"><i /><i /><i /></span>
          <span>{error ? "صدا در دسترس نیست" : "موسیقی"}</span>
          <span className="maison-sound__state">{playing ? "روشن" : "خاموش"}</span>
        </button>
      )}
    </>
  );
}
