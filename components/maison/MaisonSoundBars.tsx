"use client";
import {useEffect,useRef} from "react";
import {useAmbientSound} from "./MaisonAmbientSound";

const idle=[8,14,22,14,8] as const;
const xs=[5,9.5,14,18.5,23] as const;
/** SVG bars have identical width, with x=15 as their shared horizontal center. */
export default function MaisonSoundBars(){
 const svg=useRef<SVGSVGElement>(null);
 const {playing,getLevels}=useAmbientSound();
 useEffect(()=>{
  const rects=Array.from(svg.current?.querySelectorAll<SVGRectElement>("rect")||[]);
  const paint=(heights:number[])=>{
   rects.forEach((rect,i)=>{
    const h=Math.max(4,Math.min(25,heights[i]??8));
    rect.setAttribute("y",(14-h/2).toFixed(2));
    rect.setAttribute("height",h.toFixed(2));
   });
  };
  if(!playing){paint([...idle]);return}
  let frame=0;
  const tick=()=>{
   const levels=getLevels();
   paint(levels.map((v,i)=>Math.max(5,Math.min(25,5+v*(i===2?20:17)))));
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[playing,getLevels]);
 return <svg ref={svg} className="fertini-sound-meter" width="30" height="28" viewBox="0 0 30 28"
  xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  {xs.map((x,i)=><rect key={x} x={x} y={14-idle[i]/2} width="2" height={idle[i]} rx="1"/>)}
 </svg>;
}
