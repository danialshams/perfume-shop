"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import gsap from "gsap";

// Ported from Essential 2: decode ahead, drive CSS clip numerically, then zoom out.
// One unique observer and a permanently settled final frame per photograph.
type Mode="up"|"left"|"right"|"fade"|"stretch";
const selector=[
 "[data-fertini-photo]",".fertini-catalog-v5__image",".fertini-demo-shelf__photo",
 ".fertini-journal-v5__hero",".fertini-journal-v5__article > div",
 ".fertini-fragrance__large",".fertini-fragrance__related a > div",
 ".fertini-journal-v5__body article > div"
].join(",");
const order:Mode[]=["up","fade","right","left"];
function clipAt(mode:Exclude<Mode,"fade">,p:number){
 const cut=(Math.max(0,1-p)*100).toFixed(3)+"%";
 return mode==="stretch"?"inset(0% "+((1-p)*50).toFixed(3)+"% 0% "+((1-p)*50).toFixed(3)+"%)":
  mode==="left"?"inset(0% 0% 0% "+cut+")":
  mode==="right"?"inset(0% "+cut+" 0% 0%)":"inset(0% 0% "+cut+" 0%)";
}
type Item={element:HTMLElement;prepare:()=>void;play:()=>void;settle:()=>void;tl:gsap.core.Timeline};
export default function FertiniEditorialMotion(){
 const pathname=usePathname();
 useEffect(()=>{
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let live=true,ready=pathname!=="/";
  if(pathname==="/")try{ready=sessionStorage.getItem("fertini:intro:seen:v3")==="1"}catch{ready=true}
  const seen=new WeakSet<HTMLElement>(),items:Item[]=[];
  let sequenceIndex=0,scanFrame=0,scrollFrame=0;
  const visible=(el:Element)=>{
   const r=el.getBoundingClientRect();
   return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight*.85&&r.right>0&&r.left<innerWidth*.94;
  };
  const passed=(el:Element)=>el.getBoundingClientRect().bottom< -innerHeight*.15;
  const warming=new IntersectionObserver(es=>{
   es.forEach(e=>{if(!e.isIntersecting)return;items.find(x=>x.element===e.target)?.prepare();warming.unobserve(e.target);});
  },{rootMargin:"500px 700px 1300px 700px",threshold:0});
  const entering=new IntersectionObserver(es=>{
   es.forEach(e=>{if(!e.isIntersecting)return;const x=items.find(x=>x.element===e.target);x?.prepare();x?.play();});
  },{rootMargin:"0px 0px -15% 0px",threshold:0});
  const build=(el:HTMLElement)=>{
   if(seen.has(el))return;
   const img=el.querySelector<HTMLImageElement>("img");
   if(!img)return;
   seen.add(el);
   const mode=(el.dataset.photoEntrance as Mode|undefined)||order[sequenceIndex++%4];
   el.dataset.cinematicMode=mode;
   el.dataset.photoRevealState="waiting";
   const card=el.closest<HTMLElement>("[data-fertini-card]");
   const captions=[...(card?.querySelectorAll<HTMLElement>("[data-fertini-caption] > *")||[])];
   const mask={value:0},tl=gsap.timeline({paused:true});
   if(mode==="fade"){
    gsap.set(el,{autoAlpha:0});
    tl.to(el,{autoAlpha:1,duration:1.05,ease:"power2.out"},0);
   }else{
    const draw=()=>{el.style.clipPath=clipAt(mode,mask.value);el.dataset.photoRevealProgress=mask.value.toFixed(3);};
    draw();
    tl.to(mask,{value:1,duration:mode==="stretch"?1.55:mode==="up"?1.03:1.22,ease:mode==="stretch"?"power3.inOut":"power2.out",onUpdate:draw},0);
   }
   gsap.set(img,{scale:1.045,transformOrigin:"center center"});
   tl.to(img,{scale:1,duration:mode==="stretch"?2.45:2.1,ease:"sine.out"},mode==="fade"?.85:mode==="stretch"?1.43:1.05);
   if(captions.length){
    gsap.set(captions,{autoAlpha:0,y:12});
    tl.to(captions,{autoAlpha:1,y:0,duration:.73,stagger:.1,ease:"power2.out"},.32);
   }
   let loaded=false,loading=false,started=false;
   const finish=()=>{
    el.style.clipPath="";
    gsap.set(el,{autoAlpha:1});
    gsap.set(img,{scale:1});
    if(captions.length)gsap.set(captions,{autoAlpha:1,y:0});
    el.dataset.photoRevealProgress="1.000";
    el.dataset.photoRevealState="complete";
    el.dataset.fertiniMotionDone="true";
    if(card)card.dataset.fertiniMotionDone="true";
    warming.unobserve(el);entering.unobserve(el);
   };
   const settle=()=>{
    if(!live||started)return;
    started=true;tl.progress(1).pause();finish();
   };
   tl.eventCallback("onComplete",finish);
   const play=()=>{
    if(!live||started||!loaded||!ready)return;
    if(passed(el)){settle();return}
    if(!visible(el))return;
    started=true;el.dataset.photoRevealState="playing";tl.play();
   };
   const prepare=()=>{
    if(!live||loaded||loading)return;
    loading=true;
    if(img.loading==="lazy")img.loading="eager";
    const decoded=new Promise<void>(resolve=>{
     const complete=()=>{
      if(img.naturalWidth&&img.decode)void img.decode().then(()=>resolve(),()=>resolve());
      else resolve();
     };
     if(img.complete)complete();
     else{img.addEventListener("load",complete,{once:true});img.addEventListener("error",()=>resolve(),{once:true});}
    });
    void Promise.race([decoded,new Promise<void>(r=>setTimeout(r,5500))]).then(()=>{
     if(!live)return;
     loaded=true;requestAnimationFrame(play);
    });
   };
   items.push({element:el,prepare,play,settle,tl});
   if(passed(el)){settle();return}
   warming.observe(el);entering.observe(el);
   if(visible(el))prepare();
  };
  const scan=()=>{scanFrame=0;if(live)document.querySelectorAll<HTMLElement>(selector).forEach(build)};
  scan();
  const observer=new MutationObserver(()=>{if(!scanFrame&&live)scanFrame=requestAnimationFrame(scan)});
  observer.observe(document.querySelector("#main-content")||document.body,{subtree:true,childList:true});
  const afterIntro=()=>{
   ready=true;
   requestAnimationFrame(()=>{if(live)items.forEach(x=>{if(passed(x.element))x.settle();else if(visible(x.element)){x.prepare();x.play()}})});
  };
  window.addEventListener("fertini:intro:complete",afterIntro);
  if(ready)afterIntro();
  const onScroll=()=>{
   if(scrollFrame)return;
   scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;
    if(live)items.forEach(x=>{if(passed(x.element))x.settle()});
   });
  };
  window.addEventListener("scroll",onScroll,{passive:true});
  return()=>{
   live=false;observer.disconnect();warming.disconnect();entering.disconnect();
   window.removeEventListener("scroll",onScroll);
   window.removeEventListener("fertini:intro:complete",afterIntro);
   cancelAnimationFrame(scanFrame);cancelAnimationFrame(scrollFrame);
   items.forEach(x=>x.tl.kill());
  };
 },[pathname]);
 return null;
}
