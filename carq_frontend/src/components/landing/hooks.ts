"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

export function useAnimatedTelemetry() {
  const [values, setValues] = useState({
    speed: 72,
    rpm: 2450,
    temp: 91,
    battery: 13.8,
    load: 42,
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const interval = setInterval(() => {
      setValues((v) => ({
        speed: Math.round(Math.min(85, Math.max(55, v.speed + (Math.random() - 0.5) * 4))),
        rpm: Math.round(Math.min(3200, Math.max(1800, v.rpm + (Math.random() - 0.5) * 120))),
        temp: Math.round(Math.min(95, Math.max(85, v.temp + (Math.random() - 0.5) * 2))),
        battery:
          Math.round(
            Math.min(14.2, Math.max(12.8, v.battery + (Math.random() - 0.5) * 0.2)) * 10,
          ) / 10,
        load: Math.round(Math.min(65, Math.max(25, v.load + (Math.random() - 0.5) * 6))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return values;
}
