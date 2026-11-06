"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const frames=[
  ".fertini-catalog-v5__image",
  ".fertini-demo-shelf__photo",
  ".fertini-journal-v5__hero",
  ".fertini-journal-v5__article > div",
  ".fertini-fragrance__large",
  ".fertini-fragrance__related a > div",
  ".fertini-journal-v5__body article > div"
].join(",");

/** Varied editorial entrance on inner pages, followed by a consistent, slow zoom-out. */
export default function FertiniEditorialMotion(){
  const pathname=usePathname();
  useEffect(()=>{
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx=gsap.context(()=>{});
    const seen=new WeakSet<HTMLElement>();
    let index=0,frameId=0;
    const scan=()=>ctx.add(()=>{
      document.querySelectorAll<HTMLElement>(frames).forEach(frame=>{
        if(seen.has(frame))return;
        const photo=frame.querySelector<HTMLImageElement>("img");
        if(!photo)return;
        seen.add(frame);
        const choice=index++%4;
        const rect=frame.getBoundingClientRect();
        const ahead=rect.top>window.innerHeight*.86;
        const tl=gsap.timeline({paused:true});
        if(ahead){
          if(choice===0)tl.fromTo(frame,{autoAlpha:.25,y:32},{autoAlpha:1,y:0,duration:1.65,ease:"power3.out",clearProps:"transform,opacity,visibility"},0);
          else if(choice===1)tl.fromTo(frame,{autoAlpha:.35,scale:.965},{autoAlpha:1,scale:1,duration:1.7,ease:"power3.out",clearProps:"transform,opacity,visibility"},0);
          else if(choice===2)tl.fromTo(frame,{autoAlpha:.55,x:24},{autoAlpha:1,x:0,duration:1.6,ease:"power3.out",clearProps:"transform,opacity,visibility"},0);
          else tl.fromTo(frame,{autoAlpha:.2,y:-18},{autoAlpha:1,y:0,duration:1.7,ease:"power3.out",clearProps:"transform,opacity,visibility"},0);
        }
        tl.fromTo(photo,{scale:1.085},{scale:1,duration:3.5,ease:"power2.out",clearProps:"transform"},0);
        const play=()=>{
          if(photo.complete)tl.play();
          else{
            photo.addEventListener("load",()=>tl.play(),{once:true});
            photo.addEventListener("error",()=>tl.play(),{once:true});
          }
        };
        const trigger=ScrollTrigger.create({trigger:frame,start:"top bottom+=170",once:true,onEnter:play});
        if(trigger.isActive || !ahead)play();
      });
    });
    const schedule=()=>{
      if(frameId)return;
      frameId=window.requestAnimationFrame(()=>{frameId=0;scan();});
    };
    scan();
    const root=document.querySelector("#main-content")||document.body;
    const observer=new MutationObserver(schedule);
    observer.observe(root,{subtree:true,childList:true});
    return()=>{observer.disconnect();window.cancelAnimationFrame(frameId);ctx.revert();};
  },[pathname]);
  return null;
}
