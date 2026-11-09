"use client";
import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

const SESSION_KEY = "fertini:intro:seen:v3";

/*
 * The homepage has ONE intro. Its animation clock survives a React effect
 * teardown/remount, so Strict Mode, Suspense or a fast navigation can never
 * restart the logo animation from frame zero during the same page visit.
 */
let introStartedAt: number | null = null;
let introFinishedInDocument = false;

export default function MaisonIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const [visible, setVisible] = useState(true);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const firstCompletion = !introFinishedInDocument;
    introStartedAt = null;
    introFinishedInDocument = true;
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    document.documentElement.classList.add("fertini-intro-seen");
    setVisible(false);
    // The storefront slideshow and image reveals start after the single
    // intro curtain has completely disappeared, never during its animation.
    if (firstCompletion) window.dispatchEvent(new Event("fertini:intro:complete"));
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let seen = introFinishedInDocument ||
      document.documentElement.classList.contains("fertini-intro-seen");
    try { seen ||= window.sessionStorage.getItem(SESSION_KEY) === "1"; } catch {}

    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

    if (introStartedAt === null) introStartedAt = performance.now();

    let finishFrame = 0;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, onComplete: finish });
      tl.fromTo(".maison-intro__brand",
        { autoAlpha: 0, y: 24, filter: "blur(10px)", letterSpacing: ".34em" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", letterSpacing: ".20em", duration: .8, ease: "power3.out" })
        .fromTo(".maison-intro__sub", { autoAlpha: 0, y: 11 },
          { autoAlpha: 1, y: 0, duration: .45, ease: "power2.out" }, .35)
        .to(root, { autoAlpha: 0, duration: .45, ease: "power2.inOut" }, "+=.18");

      const elapsed = Math.max(0, (performance.now() - introStartedAt!) / 1000);
      tl.time(Math.min(elapsed, tl.duration()));
      if (elapsed < tl.duration()) tl.play();
      else finishFrame = window.requestAnimationFrame(finish);
    }, root);

    return () => {
      window.cancelAnimationFrame(finishFrame);
      ctx.revert();
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [finish]);

  if (!visible) return null;
  return <div className="maison-intro fertini-intro" ref={rootRef} role="status" aria-label="در حال نمایش مقدمه فرتینی">
    <div className="maison-intro__content" dir="ltr">
      <div className="maison-intro__brand">FERTINI</div>
      <span className="maison-intro__sub" dir="ltr">THE ART OF SCENT</span>
    </div>
    <button className="maison-intro__skip" type="button" onClick={finish}>عبور از مقدمه</button>
  </div>;
}
