"use client";
import { useEffect, useRef } from "react";
import { useAmbientSound } from "./MaisonAmbientSound";

const idle=[.63,.86,.99,.79,.57] as const;
/** Five visible bars at rest; when playing, the bars sample real audio frequencies. */
export default function MaisonSoundBars(){
  const ref=useRef<HTMLSpanElement>(null);
  const {playing,getLevels}=useAmbientSound();
  useEffect(()=>{
    const bars=Array.from(ref.current?.querySelectorAll<HTMLElement>("i")||[]);
    if(!playing){
      bars.forEach((bar,i)=>{bar.style.transform="scaleY("+idle[i]+")";});
      return;
    }
    let frame=0;
    const update=()=>{
      const frequencies=getLevels();
      bars.forEach((bar,i)=>{
        const scale=Math.min(1.16,Math.max(.28,.28+(frequencies[i]||0)*1.08));
        bar.style.transform="scaleY("+scale.toFixed(3)+")";
      });
      frame=window.requestAnimationFrame(update);
    };
    frame=window.requestAnimationFrame(update);
    return()=>window.cancelAnimationFrame(frame);
  },[playing,getLevels]);
  return <span ref={ref} className="fertini-sound-equalizer" aria-hidden="true"><i/><i/><i/><i/><i/></span>;
}
