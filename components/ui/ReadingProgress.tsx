"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A hairline reading indicator pinned below the header. It measures the
 * article element it is given, not the whole document, so the bar reaches
 * 100% at the end of the text rather than at the end of the footer.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const measure = () => {
      frame.current = null;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const scrolled = -rect.top;
      const ratio = total <= 0 ? 1 : scrolled / total;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };

    const onScroll = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [targetId]);

  return (
    <div
      className="no-print pointer-events-none fixed inset-x-0 top-[var(--nav-h)] z-40 h-px bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-px origin-left bg-accent/70"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
