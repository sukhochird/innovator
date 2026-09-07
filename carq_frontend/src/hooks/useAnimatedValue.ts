"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedValue(target: number, duration = 450): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const start = currentRef.current;
    if (Math.abs(target - start) < 0.05) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }

    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = start + (target - start) * eased;
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}
