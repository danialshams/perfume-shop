"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause } from "lucide-react";

const TRACK_SRC="/audio/luxury-piano.mp3";
const TARGET_VOLUME=.13;
export default function MaisonAmbientSound(){
  const pathname=usePathname();
  const onStorefront=pathname==="/"||pathname==="/products"||pathname.startsWith("/products/")||pathname.startsWith("/demo/fragrance");
  const audioRef=useRef<HTMLAudioElement>(null);
  const wantedRef=useRef(false),voiceLocksRef=useRef(0),resumeRef=useRef(false);
  const [playing,setPlaying]=useState(false),[error,setError]=useState(false);

  const fadeOut=useCallback(()=>{
    const audio=audioRef.current;if(!audio||audio.paused)return;
    gsap.killTweensOf(audio);
    gsap.to(audio,{volume:0,duration:.48,ease:"power2.inOut",onComplete:()=>audio.pause()});
  },[]);
  const start=useCallback(async()=>{
    const audio=audioRef.current;if(!audio||voiceLocksRef.current>0)return;
    gsap.killTweensOf(audio);audio.volume=0;
    try{
      await audio.play();wantedRef.current=true;setError(false);setPlaying(true);
      gsap.to(audio,{volume:TARGET_VOLUME,duration:1.5,ease:"power2.out"});
    }catch{wantedRef.current=false;setPlaying(false);setError(true);}
  },[]);
  const toggle=()=>{
    if(wantedRef.current){wantedRef.current=false;resumeRef.current=false;setPlaying(false);fadeOut();}
    else void start();
  };
  useEffect(()=>{
    if(onStorefront)return;
    wantedRef.current=false;resumeRef.current=false;voiceLocksRef.current=0;
    const audio=audioRef.current;
    if(audio){gsap.killTweensOf(audio);audio.pause();}
    const frame=requestAnimationFrame(()=>setPlaying(false));
    return()=>cancelAnimationFrame(frame);
  },[onStorefront]);
  useEffect(()=>{
    const voiceStart=()=>{
      voiceLocksRef.current+=1;
      if(wantedRef.current&&audioRef.current&&!audioRef.current.paused){
        resumeRef.current=true;fadeOut();setPlaying(false);
      }
    };
    const voiceStop=()=>{
      voiceLocksRef.current=Math.max(0,voiceLocksRef.current-1);
      if(!voiceLocksRef.current&&resumeRef.current&&onStorefront&&wantedRef.current){
        resumeRef.current=false;void start();
      }
    };
    window.addEventListener("background-music:pause-for-voice",voiceStart);
    window.addEventListener("background-music:resume-after-voice",voiceStop);
    return()=>{
      window.removeEventListener("background-music:pause-for-voice",voiceStart);
      window.removeEventListener("background-music:resume-after-voice",voiceStop);
    };
  },[onStorefront,start,fadeOut]);
  useEffect(()=>()=>{
    const audio=audioRef.current;
    if(audio){gsap.killTweensOf(audio);audio.pause();}
  },[]);
  return <>
    <audio ref={audioRef} src={TRACK_SRC} preload="none" loop playsInline aria-hidden="true" />
    {onStorefront&&<button type="button" className={"fertini-ambient "+(playing?"is-playing":"")}
      aria-label={playing?"خاموش کردن موسیقی پس‌زمینه":"روشن کردن موسیقی پس‌زمینه"}
      aria-pressed={playing} title={error?"فایل صدا در دسترس نیست":"Fertini / Ambient"}
      onClick={toggle}>
      <span className="fertini-ambient__record" aria-hidden="true"><span><i/></span></span>
      <span className="fertini-ambient__details"><strong lang="en" dir="ltr">FERTINI RADIO</strong><small>{error?"صدا در دسترس نیست":playing?"در حال پخش":"موسیقی محیط"}</small></span>
      <span className="fertini-ambient__action">{playing?<Pause size={16} fill="currentColor"/>:<Play size={16} fill="currentColor"/>}</span>
    </button>}
  </>;
}
