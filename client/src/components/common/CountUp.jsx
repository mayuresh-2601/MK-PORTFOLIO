import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Counts from 0 to `end` once the element enters the viewport.
 * Respects `prefers-reduced-motion` by rendering the final value instantly.
 */
export default function CountUp({ end = 0, duration = 1400, suffix = "" }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      setValue(end);
      return undefined;
    }

    let frame = 0;
    let startedAt = 0;

    const tick = (now) => {
      if (!startedAt) startedAt = now;
      const progress = Math.min((now - startedAt) / duration, 1);
      setValue(Math.round(easeOutCubic(progress) * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}
