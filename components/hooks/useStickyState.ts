"use client";
import { useEffect, useRef, useState } from "react";

export function useStickyState() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: [0] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, stuck };
}
