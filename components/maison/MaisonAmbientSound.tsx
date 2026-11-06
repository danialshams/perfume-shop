"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

const TRACK_SRC = "/audio/luxury-piano.mp3";
const TARGET_VOLUME = 0.12;
type AmbientContext = { enabled:boolean; playing:boolean; toggle:()=>void };
const AmbientSoundContext = createContext<AmbientContext>({enabled:false,playing:false,toggle:()=>{}});
export function useAmbientSound(){ return useContext(AmbientSoundContext); }

/** Global audio lifecycle; controls are rendered only in the header and mobile menu. */
export default function MaisonAmbientSound({children}:{children:ReactNode}){
  const pathname = usePathname() || "/";
  const enabled = pathname === "/" || pathname === "/products" || pathname.startsWith("/products/") || pathname.startsWith("/demo/fragrance");
  const ref=useRef<HTMLAudioElement>(null);
  const wants=useRef(false), voiceLocks=useRef(0), resume=useRef(false);
  const [playing,setPlaying]=useState(false);
  const fade=useCallback(()=>{
    const audio=ref.current;
    if(!audio || audio.paused)return;
    gsap.killTweensOf(audio);
    gsap.to(audio,{volume:0,duration:.5,ease:"power2.out",onComplete:()=>audio.pause()});
  },[]);
  const start=useCallback(async()=>{
    const audio=ref.current;
    if(!audio || !enabled || voiceLocks.current>0)return;
    gsap.killTweensOf(audio);
    audio.volume=0;
    try{
      await audio.play();
      wants.current=true;
      setPlaying(true);
      gsap.to(audio,{volume:TARGET_VOLUME,duration:1.4,ease:"power2.out"});
    }catch{
      wants.current=false;
      setPlaying(false);
    }
  },[enabled]);
  const toggle=useCallback(()=>{
    if(wants.current){
      wants.current=false;resume.current=false;
      setPlaying(false);fade();
    }else{ void start(); }
  },[start,fade]);
  useEffect(()=>{
    if(enabled)return;
    wants.current=false;resume.current=false;voiceLocks.current=0;
    const audio=ref.current;
    if(audio){gsap.killTweensOf(audio);audio.pause();}
    const id=requestAnimationFrame(()=>setPlaying(false));
    return()=>cancelAnimationFrame(id);
  },[enabled]);
  useEffect(()=>{
    const voiceStart=()=>{
      voiceLocks.current+=1;
      if(wants.current && ref.current && !ref.current.paused){
        resume.current=true;fade();setPlaying(false);
      }
    };
    const voiceStop=()=>{
      voiceLocks.current=Math.max(0,voiceLocks.current-1);
      if(voiceLocks.current===0 && resume.current && wants.current){
        resume.current=false;void start();
      }
    };
    window.addEventListener("background-music:pause-for-voice",voiceStart);
    window.addEventListener("background-music:resume-after-voice",voiceStop);
    return()=>{
      window.removeEventListener("background-music:pause-for-voice",voiceStart);
      window.removeEventListener("background-music:resume-after-voice",voiceStop);
    };
  },[start,fade]);
  useEffect(()=>()=>{
    const audio=ref.current;
    if(audio){gsap.killTweensOf(audio);audio.pause();}
  },[]);
  const value=useMemo(()=>({enabled,playing,toggle}),[enabled,playing,toggle]);
  return <AmbientSoundContext.Provider value={value}>
    {children}
    <audio ref={ref} src={TRACK_SRC} preload="none" loop playsInline aria-hidden="true" />
  </AmbientSoundContext.Provider>;
}
