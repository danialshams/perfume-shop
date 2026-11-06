"use client";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "fertini:intro:seen:v3";

/** A short, optional cinematic prelude. Never intercepts recurring navigation. */
export default function MaisonIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const [visible, setVisible] = useState(true);
  const finish = useCallback(()=>{
    if (finishedRef.current) return;
    finishedRef.current=true;
    try { window.sessionStorage.setItem(SESSION_KEY,"1"); } catch {}
    setVisible(false);
    window.dispatchEvent(new Event("fertini:intro:complete"));
  },[]);

  useEffect(()=>{
    const root=rootRef.current;
    if (!root) return;
    let seen=false;
    try {seen=window.sessionStorage.getItem(SESSION_KEY)==="1";}catch{}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display="none";
      const frame=window.requestAnimationFrame(finish);
      return ()=>window.cancelAnimationFrame(frame);
    }
    const ctx=gsap.context(()=>{
      const tl=gsap.timeline({onComplete:finish});
      tl.fromTo(".maison-intro__brand",{autoAlpha:0,y:24,filter:"blur(10px)",letterSpacing:".34em"},
        {autoAlpha:1,y:0,filter:"blur(0px)",letterSpacing:".20em",duration:1.1,ease:"power3.out"})
      .fromTo(".maison-intro__sub",{autoAlpha:0,y:11},{autoAlpha:1,y:0,duration:.65,ease:"power2.out"},.55)
      .to(root,{autoAlpha:0,duration:.65,ease:"power2.inOut"},"+=.28");
    },root);
    return ()=>{ctx.revert();};
  },[finish]);

  if (!visible) return null;
  return <div className="maison-intro fertini-intro" ref={rootRef} role="status" aria-label="در حال نمایش مقدمه فرتینی">
    <div className="maison-intro__content" dir="ltr">
      <div className="maison-intro__brand">FERTINI</div>
      <span className="maison-intro__sub" dir="ltr">THE ART OF SCENT</span>
    </div>
    <button className="maison-intro__skip" type="button" onClick={finish}>عبور از مقدمه</button>
  </div>;
}
