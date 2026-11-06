"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

type Props={productName:string;voiceUrl?:string;script?:string;className?:string};
const radius=43;
const circumference=2*Math.PI*radius;
function time(value:number){
 if(!Number.isFinite(value)||value<0)return "00:00";
 return String(Math.floor(value/60)).padStart(2,"0")+":"+String(Math.floor(value%60)).padStart(2,"0");
}
export default function FertiniVoicePlayer({productName,voiceUrl,script,className=""}:Props){
 const audioRef=useRef<HTMLAudioElement>(null);
 const lockRef=useRef(false);
 const [playing,setPlaying]=useState(false);
 const [current,setCurrent]=useState(0);
 const [duration,setDuration]=useState(0);
 const [speechProgress,setSpeechProgress]=useState(0);
 const [rate,setRate]=useState(1);
 const [error,setError]=useState("");
 const [persianVoiceAvailable,setPersianVoiceAvailable]=useState<boolean|null>(null);
 const isSpeech=!voiceUrl&&Boolean(script);
 useEffect(()=>{
   if(!isSpeech)return;
   const refresh=()=>{
     const supported="speechSynthesis" in window &&
       window.speechSynthesis.getVoices().some(voice=>voice.lang.toLowerCase().startsWith("fa"));
     setPersianVoiceAvailable(Boolean(supported));
   };
   // Voices are often registered asynchronously (notably on Windows).
   const frame=window.requestAnimationFrame(refresh);
   const delayed=window.setTimeout(refresh,950);
   if("speechSynthesis" in window)window.speechSynthesis.addEventListener("voiceschanged",refresh);
   return()=>{
     window.cancelAnimationFrame(frame);
     window.clearTimeout(delayed);
     if("speechSynthesis" in window)window.speechSynthesis.removeEventListener("voiceschanged",refresh);
   };
 },[isSpeech]);
 const progress=voiceUrl?(duration>0?Math.min(current/duration,1):0):speechProgress;
 const lock=useCallback(()=>{
  if(lockRef.current)return;
  lockRef.current=true;
  window.dispatchEvent(new Event("background-music:pause-for-voice"));
 },[]);
 const unlock=useCallback(()=>{
  if(!lockRef.current)return;
  lockRef.current=false;
  window.dispatchEvent(new Event("background-music:resume-after-voice"));
 },[]);
 const finishSpeech=useCallback(()=>{setPlaying(false);unlock();},[unlock]);
 function stopSpeech(){
  if("speechSynthesis" in window)window.speechSynthesis.cancel();
  setPlaying(false);setSpeechProgress(0);unlock();
 }
 async function toggle(){
  setError("");
  if(isSpeech){
   if(playing){stopSpeech();return;}
   if(!("speechSynthesis" in window)||!persianVoiceAvailable){setPersianVoiceAvailable(false);return;}
   window.speechSynthesis.cancel();
   const item=new SpeechSynthesisUtterance(script||"");
   item.lang="fa-IR";item.rate=rate;item.pitch=.98;
   const persian=window.speechSynthesis.getVoices().find(voice=>voice.lang.toLowerCase().startsWith("fa"));
   if(!persian){setPersianVoiceAvailable(false);return;}
   item.voice=persian;
   // Web Speech exposes character position, not a reliable duration.
   // Keep the ring truthful: advance only when the browser reports a boundary.
   item.onboundary=event=>{
    if(script&&event.charIndex>=0)setSpeechProgress(Math.min(1,event.charIndex/script.length));
   };
   item.onend=()=>{setSpeechProgress(1);finishSpeech();};
   item.onerror=event=>{
    finishSpeech();
    if(event.error!=="canceled"&&event.error!=="interrupted")setPersianVoiceAvailable(false);
   };
   setSpeechProgress(0);lock();setPlaying(true);
   try{window.speechSynthesis.speak(item);}
   catch{finishSpeech();setPersianVoiceAvailable(false);}
   return;
  }
  const audio=audioRef.current;
  if(!audio)return;
  if(!audio.paused){audio.pause();return;}
  audio.playbackRate=rate;
  try{await audio.play();}catch{unlock();setPlaying(false);setError("فایل صوتی در دسترس نیست.");}
 }
 function cycleRate(){
  const next=rate===1?1.25:rate===1.25?1.5:1;
  setRate(next);
  if(audioRef.current)audioRef.current.playbackRate=next;
 }
 useEffect(()=>()=>{
  if("speechSynthesis" in window)window.speechSynthesis.cancel();
  if(lockRef.current){lockRef.current=false;window.dispatchEvent(new Event("background-music:resume-after-voice"));}
 },[]);
 if(!voiceUrl&&!script)return null;
 if(isSpeech&&persianVoiceAvailable!==true){
   return <section className={"fertini-voice-v6 fertini-voice-v6--text "+className} aria-label={"روایت رایحه "+productName}>
     <div className="fertini-voice-v6__info">
       <span className="fertini-voice-v6__overline" lang="en" dir="ltr">FERTINI / SCENT STORY</span>
       <h2>روایتی از این رایحه</h2>
       <p>برای پخش صوتی فارسی، مرورگر به صدای فارسی نیاز دارد. متن روایت در دسترس است.</p>
       <details><summary>خواندن متن روایت</summary><p>{script}</p></details>
     </div>
   </section>;
 }
 return <section className={"fertini-voice-v6 "+className} aria-label={"معرفی صوتی "+productName}>
   <button type="button" className={"fertini-voice-v6__disc"+(playing?" is-playing":"")}
     aria-label={playing?(isSpeech?"توقف گفتار":"مکث پخش"):"پخش معرفی صوتی"} aria-pressed={playing} onClick={()=>void toggle()}>
     <svg aria-hidden="true" viewBox="0 0 100 100">
       <circle cx="50" cy="50" r={radius} className="fertini-voice-v6__track"/>
       <circle cx="50" cy="50" r={radius} className="fertini-voice-v6__progress"
         strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress)} transform="rotate(-90 50 50)"/>
     </svg>
     <span>{playing?<Pause size={18} fill="currentColor" strokeWidth={1.4}/>:<Play size={19} fill="currentColor" strokeWidth={1.4}/>}</span>
   </button>
   <div className="fertini-voice-v6__info">
     <span className="fertini-voice-v6__overline" lang="en" dir="ltr">FERTINI / AUDIO EXPERIENCE</span>
     <h2>روایتی از این رایحه</h2>
     {voiceUrl?<div className="fertini-voice-v6__timeline">
       <input type="range" min={0} max={duration||1} step=".1" value={current}
         aria-label="جابه‌جایی در فایل صوتی" onChange={event=>{
           const value=Number(event.target.value);
           if(audioRef.current)audioRef.current.currentTime=value;
           setCurrent(value);
         }}/>
       <span dir="ltr" lang="en">{time(current)} / {time(duration)}</span>
     </div>:<p>{playing?"در حال پخش روایت":"معرفی صوتی عطر"}</p>}
   </div>
   <button type="button" className="fertini-voice-v6__rate" lang="en" dir="ltr" aria-label="تغییر سرعت پخش" onClick={cycleRate}>{rate}×</button>
   {voiceUrl&&<audio ref={audioRef} src={voiceUrl} preload="metadata" playsInline
     onLoadedMetadata={event=>setDuration(Number.isFinite(event.currentTarget.duration)?event.currentTarget.duration:0)}
     onTimeUpdate={event=>setCurrent(event.currentTarget.currentTime)}
     onPlay={()=>{setPlaying(true);lock();}} onPause={()=>{setPlaying(false);unlock();}}
     onEnded={()=>{setPlaying(false);unlock();}} onError={()=>setError("فایل صوتی در دسترس نیست.")}/>}
   {error&&<p className="fertini-voice-v6__error" role="alert">{error}</p>}
 </section>;
}
