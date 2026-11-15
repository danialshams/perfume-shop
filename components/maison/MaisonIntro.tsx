"use client";
import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

const SESSION_KEY = "fertini:intro:seen:v3";
const START_KEY = "fertini:intro:started:v4";

/*
 * The homepage has ONE intro. Its animation clock survives a React effect
 * teardown/remount, so Strict Mode, Suspense or a fast navigation can never
 * restart the logo animation from frame zero during the same page visit.
 */
let introStartedAt: number | null = null;
let introStartedInDocument = false;
let introFinishedInDocument = false;

export default function MaisonIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const unlockScrollRef = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(true);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const firstCompletion = !introFinishedInDocument;
    introStartedAt = null;
    introFinishedInDocument = true;
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    document.documentElement.classList.add("fertini-intro-seen");
    // The component remains mounted after returning null, so effect cleanup
    // alone would not restore overflow. Release the scroll lock at finish.
    unlockScrollRef.current?.();
    setVisible(false);
    // The storefront slideshow and image reveals start after the single
    // intro curtain has completely disappeared, never during its animation.
    if (firstCompletion) window.dispatchEvent(new Event("fertini:intro:complete"));
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // A hydration/remount before completion must not replay the intro.
    // The started marker also prevents a second show after a full navigation
    // during the first intro, while the separate seen marker gates the hero.
    let seen = introFinishedInDocument || introStartedInDocument ||
      document.documentElement.classList.contains("fertini-intro-seen");
    try {
      seen ||= window.sessionStorage.getItem(SESSION_KEY) === "1" ||
        window.sessionStorage.getItem(START_KEY) === "1";
    } catch {}

    if (seen || new URLSearchParams(window.location.search).has("studioPreview") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Happens before the next paint: no brief second splash on back navigation.
      root.style.display = "none";
      const frame = window.requestAnimationFrame(finish);
      return () => window.cancelAnimationFrame(frame);
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    let unlocked = false;
    const releaseScroll = () => {
      if (unlocked) return;
      unlocked = true;
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      unlockScrollRef.current = null;
    };
    unlockScrollRef.current = releaseScroll;

    // Set before the first tween so a React remount or browser reload cannot
    // show a second copy while the first intro is already in progress.
    introStartedInDocument = true;
    try { window.sessionStorage.setItem(START_KEY, "1"); } catch {}
    if (introStartedAt === null) introStartedAt = performance.now();

    let finishFrame = 0;
    const ctx = gsap.context(() => {
      const letters = root.querySelectorAll<HTMLElement>("[data-intro-letter]");
      const brand = root.querySelector<HTMLElement>(".maison-intro__brand");
      const line = root.querySelector<HTMLElement>(".maison-intro__rule");
      const sheen = root.querySelector<HTMLElement>(".maison-intro__shine");
      const sub = root.querySelector<HTMLElement>(".maison-intro__sub");
      // All characters use the exact same existing Georgia wordmark font.
      // Only the intro assembles letters; section headings reveal as full lines.
      gsap.set(brand,{autoAlpha:1});
      gsap.set(line,{scaleX:0,autoAlpha:1,transformOrigin:"50% 50%"});
      gsap.set(sheen,{autoAlpha:0,backgroundPosition:"-180% 50%"});
      gsap.set(sub,{autoAlpha:0,y:9});
      const scatteredX = [-104,64,-67,92,-83,75,118];
      const scatteredY = [-26,35,19,-34,30,-19,24];
      const tl = gsap.timeline({ paused:true,onComplete:finish });
      tl.fromTo(letters,
        {autoAlpha:0,x:(i:number)=>scatteredX[i],y:(i:number)=>scatteredY[i],filter:"blur(12px)"},
        {autoAlpha:1,x:0,y:0,filter:"blur(0px)",duration:1.34,stagger:{each:.075,from:"center"},ease:"power3.out"},0.05)
        .to(line,{scaleX:1,duration:.84,ease:"power2.inOut"},1.23)
        .to(sheen,{autoAlpha:1,duration:.16},1.94)
        .to(sheen,{backgroundPosition:"180% 50%",duration:.9,ease:"sine.inOut"},1.95)
        .to(sub,{autoAlpha:1,y:0,duration:.48,ease:"power2.out"},2.04)
        .to(root,{autoAlpha:0,duration:.43,ease:"power2.inOut"},2.92);
      const elapsed = Math.max(0,(performance.now() - introStartedAt!)/1000);
      tl.time(Math.min(elapsed,tl.duration()));
      if(elapsed<tl.duration())tl.play();
      else finishFrame=window.requestAnimationFrame(finish);
    },root);

    return () => {
      window.cancelAnimationFrame(finishFrame);
      ctx.revert();
      releaseScroll();
    };
  }, [finish]);

  if (!visible) return null;
  return <div className="maison-intro fertini-intro" ref={rootRef} role="status" aria-label="در حال نمایش مقدمه فرتینی">
    <div className="maison-intro__content" dir="ltr">
      <div className="maison-intro__brand" aria-label="FERTINI">{Array.from("FERTINI").map((letter,index)=>
        <span data-intro-letter key={index} aria-hidden="true">{letter}</span>)}</div>
      <div className="maison-intro__rule" aria-hidden="true"/>
      <div className="maison-intro__shine" aria-hidden="true">FERTINI</div>
      <span className="maison-intro__sub" dir="ltr">THE ART OF SCENT</span>
    </div>
    <button className="maison-intro__skip" type="button" onClick={finish}>عبور از مقدمه</button>
  </div>;
}
