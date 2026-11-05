"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "maison:intro:seen:v2";

/** Short, skippable editorial intro, mounted only on the home page. */
export default function MaisonIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const [visible, setVisible] = useState(true);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    setVisible(false);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let seen = false;
    try { seen = window.sessionStorage.getItem(SESSION_KEY) === "1"; } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display = "none";
      const id = window.requestAnimationFrame(finish);
      return () => window.cancelAnimationFrame(id);
    }

    const scope = gsap.context(() => {
      const sequence = gsap.timeline({ onComplete: finish });
      sequence
        .fromTo(".maison-intro__brand",
          { autoAlpha: 0, y: 17, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.78, ease: "power3.out" })
        .fromTo(".maison-intro__rule",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, "<0.12")
        .fromTo(".maison-intro__sub",
          { autoAlpha: 0, y: 9 },
          { autoAlpha: 1, y: 0, duration: 0.62, ease: "power2.out" }, "<0.12")
        .to(root, { autoAlpha: 0, yPercent: -2, duration: 0.64, ease: "power2.inOut" }, "+=0.28");
    }, root);

    return () => scope.revert();
  }, [finish]);

  if (!visible) return null;

  return (
    <div className="maison-intro" ref={rootRef} role="status" aria-label="در حال ورود به مزون">
      <div className="maison-intro__content" dir="ltr">
        <span className="maison-intro__overline">THE ART OF SCENT</span>
        <div className="maison-intro__brand">MAISON<span className="maison-intro__period">.</span></div>
        <div className="maison-intro__rule" />
        <span className="maison-intro__sub" dir="rtl">رایحه‌ای که می‌ماند</span>
      </div>
      <button type="button" className="maison-intro__skip" onClick={finish} aria-label="رد کردن نمایش آغازین">
        عبور از مقدمه
      </button>
    </div>
  );
}
