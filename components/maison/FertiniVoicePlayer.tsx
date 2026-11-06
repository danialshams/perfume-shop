"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props={productName:string;voiceUrl?:string;script?:string;className?:string};
function time(value:number){
 if(!Number.isFinite(value)||value<0)return "00:00";
 return String(Math.floor(value/60)).padStart(2,"0")+":"+String(Math.floor(value%60)).padStart(2,"0");
}
const bars=Array.from({length:61},(_,index)=>Math.max(8,Math.round(12+28*Math.abs(Math.sin(index*1.78)*Math.cos(index*.39)))));

export default function FertiniVoicePlayer({productName,voiceUrl,script,className=""}:Props){
 const ref=useRef<HTMLAudioElement>(null);
 const [playing,setPlaying]=useState(false);
 const [current,setCurrent]=useState(0);
 const [duration,setDuration]=useState(0);
 const [rate,setRate]=useState(1);
 const [error,setError]=useState("");
 const isSpeech=!voiceUrl&&Boolean(script);
 const progress=duration>0?Math.min(1,current/duration):0;
 const pauseBackground=useCallback(()=>window.dispatchEvent(new Event("background-music:pause-for-voice")),[]);
 const resumeBackground=useCallback(()=>window.dispatchEvent(new Event("background-music:resume-after-voice")),[]);
 const stopSpeech=useCallback(()=>{
   if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();
   setPlaying(false);
   resumeBackground();
 },[resumeBackground]);
 const toggle=async()=>{
   setError("");
   if(isSpeech){
     if(playing){stopSpeech();return;}
     if(!("speechSynthesis" in window)){setError("امکان پخش گفتار در این مرورگر وجود ندارد.");return;}
     const item=new SpeechSynthesisUtterance(script||"");
     item.lang="fa-IR";item.rate=rate;item.pitch=.95;
     const voices=window.speechSynthesis.getVoices();
     const persian=voices.find(voice=>voice.lang.toLowerCase().startsWith("fa"));
     if(persian)item.voice=persian;
     item.onend=()=>{setPlaying(false);resumeBackground();};
     item.onerror=event=>{setPlaying(false);resumeBackground();if(event.error!=="canceled")setError("امکان پخش گفتار فارسی در این مرورگر وجود ندارد.");};
     pauseBackground();setPlaying(true);
     window.speechSynthesis.speak(item);
     return;
   }
   const audio=ref.current;if(!audio)return;
   if(!audio.paused){audio.pause();return;}
   audio.playbackRate=rate;
   try{await audio.play();}catch{resumeBackground();setError("فایل صوتی در دسترس نیست.");}
 };
 useEffect(()=>()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();window.dispatchEvent(new Event("background-music:resume-after-voice"));},[]);
 const hasAudio=Boolean(voiceUrl||script);
 const accent=useMemo(()=>bars.map((height,index)=>({height,index})),[]);
 if(!hasAudio)return null;
 return <section className={"fertini-voice-v5 "+className} aria-label={"معرفی صوتی "+productName}>
   <div className="fertini-voice-v5__top">
     <div><span lang="en" dir="ltr">FERTINI / AUDIO NOTES</span><h2>روایتی از این رایحه</h2></div>
     <button type="button" className="fertini-voice-v5__play" aria-label={playing?"توقف پخش":"پخش معرفی صوتی"} aria-pressed={playing} onClick={()=>void toggle()}>
       {playing?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}
     </button>
   </div>
   <div className={"fertini-voice-v5__wave"+(playing?" is-playing":"")} aria-hidden="true">
     {accent.map(({height,index})=><span key={index} style={{height:height+"%",opacity:voiceUrl?(index/61<=progress?1:.35):playing?0.88:.38}} />)}
   </div>
   <div className="fertini-voice-v5__bottom">
     {voiceUrl?<><span dir="ltr" lang="en">{time(current)} / {time(duration)}</span>
       <input type="range" min={0} max={duration||1} step=".1" value={current} aria-label="جابه‌جایی در صوت"
          onChange={event=>{if(ref.current)ref.current.currentTime=Number(event.target.value);setCurrent(Number(event.target.value));}} /></>:
       <span>معرفی صوتی عطر</span>}
     <button type="button" onClick={()=>setRate(value=>value===1?1.25:value===1.25?1.5:1)} aria-label="تغییر سرعت پخش" lang="en" dir="ltr">{rate}×</button>
   </div>
   {voiceUrl&&<audio ref={ref} src={voiceUrl} preload="metadata" playsInline
     onLoadedMetadata={event=>setDuration(Number.isFinite(event.currentTarget.duration)?event.currentTarget.duration:0)}
     onTimeUpdate={event=>setCurrent(event.currentTarget.currentTime)}
     onPlay={()=>{setPlaying(true);pauseBackground();}} onPause={()=>{setPlaying(false);resumeBackground();}}
     onEnded={()=>{setPlaying(false);resumeBackground();}} onError={()=>setError("فایل صوتی در دسترس نیست.")}/>}
   {error&&<p role="alert" className="fertini-voice-v5__error">{error}</p>}
 </section>;
}
