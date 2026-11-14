"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";


const TARGET_VOLUME = 0.12;
type AmbientContext = { enabled:boolean; playing:boolean; toggle:()=>void; getLevels:()=>number[] };
const AmbientSoundContext = createContext<AmbientContext>({enabled:false,playing:false,toggle:()=>{},getLevels:()=>[0,0,0,0,0]});
export function useAmbientSound(){ return useContext(AmbientSoundContext); }

/** Single audio source with a live frequency analyser; UI controls are in the header. */
export default function MaisonAmbientSound({children,audioUrl="/audio/luxury-piano.mp3",musicEnabled=true}:{children:ReactNode;audioUrl?:string;musicEnabled?:boolean}){
  const pathname = usePathname() || "/";
  const enabled = musicEnabled && (pathname === "/" || pathname === "/products" || pathname.startsWith("/products/") || pathname.startsWith("/fragrance/") || pathname.startsWith("/journal") || pathname === "/about");
  const ref=useRef<HTMLAudioElement>(null);
  const audioContextRef=useRef<AudioContext|null>(null);
  const analyserRef=useRef<AnalyserNode|null>(null);
  const samplesRef=useRef<Uint8Array<ArrayBuffer>|null>(null);
  const getLevels=useCallback(()=>{
    const analyser=analyserRef.current;
    if(!analyser || audioContextRef.current?.state!=="running")return [0,0,0,0,0];
    if(!samplesRef.current || samplesRef.current.length!==analyser.frequencyBinCount)
      samplesRef.current=new Uint8Array(analyser.frequencyBinCount);
    const samples=samplesRef.current;
    analyser.getByteFrequencyData(samples);
    return [[0,3],[3,6],[6,11],[11,19],[19,35]].map(([start,end])=>{
      let total=0;
      for(let i=start;i<end;i++)total+=samples[i]||0;
      return Math.min(1,total/((end-start)*105));
    });
  },[]);
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
      if(!audioContextRef.current && typeof AudioContext!=="undefined"){
        const context=new AudioContext();
        const source=context.createMediaElementSource(audio);
        const analyser=context.createAnalyser();
        analyser.fftSize=512;
        analyser.smoothingTimeConstant=.83;
        source.connect(analyser);
        analyser.connect(context.destination);
        audioContextRef.current=context;
        analyserRef.current=analyser;
      }
      if(audioContextRef.current?.state==="suspended")await audioContextRef.current.resume();
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
    if(audioContextRef.current){void audioContextRef.current.close();audioContextRef.current=null;}
    analyserRef.current=null;
    samplesRef.current=null;
  },[]);
  const value=useMemo(()=>({enabled,playing,toggle,getLevels}),[enabled,playing,toggle,getLevels]);
  return <AmbientSoundContext.Provider value={value}>
    {children}
    <audio ref={ref} src={audioUrl} preload="none" loop playsInline aria-hidden="true" />
  </AmbientSoundContext.Provider>;
}
