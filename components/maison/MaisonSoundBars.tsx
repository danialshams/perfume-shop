"use client";
import { useEffect, useRef } from "react";
import { useAmbientSound } from "./MaisonAmbientSound";

/** Audio-frequency-driven bars; no keyframe, randomness or fake levels. */
export default function MaisonSoundBars() {
  const ref=useRef<HTMLSpanElement>(null);
  const {playing,getLevels}=useAmbientSound();
  useEffect(()=>{
    const bars=Array.from(ref.current?.querySelectorAll<HTMLElement>("i")||[]);
    if(!playing){bars.forEach(bar=>{bar.style.transform="scaleY(.24)";});return;}
    let animationFrame=0;
    const draw=()=>{
      const levels=getLevels();
      bars.forEach((bar,i)=>{bar.style.transform="scaleY("+Math.max(.24,Math.min(1.25,.24+(levels[i]||0)*1.15)).toFixed(3)+")";});
      animationFrame=window.requestAnimationFrame(draw);
    };
    animationFrame=window.requestAnimationFrame(draw);
    return ()=>window.cancelAnimationFrame(animationFrame);
  },[playing,getLevels]);
  return <span ref={ref} className="fertini-sound-equalizer" aria-hidden="true"><i/><i/><i/><i/></span>;
}
