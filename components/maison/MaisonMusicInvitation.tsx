"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {useAmbientSound} from "@/components/maison/MaisonAmbientSound";
import {lockDocumentScroll} from "@/lib/document-scroll-lock";

const answeredKey="fertini:ambient-invitation:answered:v1";

/**
 * Intro -> storefront -> an unobtrusive, one-time invitation.
 * Never start audio without an explicit user gesture. A decision is held
 * only for the browsing session, not stored as a permanent account preference.
 */
export default function MaisonMusicInvitation(){
 const {enabled,playing,play}=useAmbientSound();
 const [mounted,setMounted]=useState(false);
 const [open,setOpen]=useState(false);
 const yes=useRef<HTMLButtonElement>(null);
 const openTimer=useRef<number>(0);
 const closeTimer=useRef<number>(0);

 const answered=useCallback(()=>{
  try{return sessionStorage.getItem(answeredKey)==="1";}catch{return true;}
 },[]);

 useEffect(()=>{
  if(!enabled||answered())return;
  const show=()=>{
   if(answered())return;
   window.clearTimeout(openTimer.current);
   openTimer.current=window.setTimeout(()=>{
    setMounted(true);
    window.requestAnimationFrame(()=>setOpen(true));
   },510);
  };
  try{
   if(sessionStorage.getItem("fertini:intro:seen:v3")==="1")show();
  }catch{}
  window.addEventListener("fertini:intro:complete",show);
  return()=>{
   window.removeEventListener("fertini:intro:complete",show);
   window.clearTimeout(openTimer.current);
   window.clearTimeout(closeTimer.current);
  };
 },[enabled,answered]);

 const close=useCallback((accept:boolean)=>{
  if(accept&&!playing)play();
  try{sessionStorage.setItem(answeredKey,"1");}catch{}
  setOpen(false);
  window.clearTimeout(closeTimer.current);
  closeTimer.current=window.setTimeout(()=>setMounted(false),570);
 },[play,playing]);

 useEffect(()=>{
  if(!open)return;
  const unlock=lockDocumentScroll();
  const focused=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const frame=window.requestAnimationFrame(()=>yes.current?.focus());
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();close(false);}
   if(event.key==="Tab"){
    // The only two choices form a compact keyboard focus loop.
    const buttons=document.querySelectorAll<HTMLButtonElement>(".fertini-music-consent__action");
    const first=buttons.item(0),last=buttons.item(buttons.length-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  };
  document.addEventListener("keydown",onKey);
  return()=>{
   window.cancelAnimationFrame(frame);
   document.removeEventListener("keydown",onKey);
   unlock();
   focused?.focus({preventScroll:true});
  };
 },[open,close]);

 if(!enabled||!mounted)return null;
 return <div className={"fertini-music-consent"+(open?" is-open":"")} dir="rtl"
   role="dialog" aria-modal={open} aria-hidden={!open} inert={!open}
   aria-labelledby="fertini-music-consent-title">
  <div className="fertini-music-consent__shade" aria-hidden="true"/>
  <div className="fertini-music-consent__panel">
   <span className="fertini-music-consent__eyebrow" lang="en" dir="ltr">FERTINI · A QUIET MOMENT</span>
   <span className="fertini-music-consent__line" aria-hidden="true"/>
   <h2 id="fertini-music-consent-title">برای تجربه بهتر تمایل به پخش آوای پس زمینه دارید؟</h2>
   <div className="fertini-music-consent__actions">
    <button ref={yes} className="fertini-music-consent__action is-accept" type="button" onClick={()=>close(true)}>پخش</button>
    <button className="fertini-music-consent__action is-decline" type="button" onClick={()=>close(false)}>تمایل ندارم</button>
   </div>
   <span className="fertini-music-consent__hint">انتخاب موسیقی همیشه از طریق بالای صفحه قابل تغییر است.</span>
  </div>
 </div>;
}
