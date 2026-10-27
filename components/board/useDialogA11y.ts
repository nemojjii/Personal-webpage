"use client";

import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE = 'button, a[href], textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * The accessibility contract every case file and connection dossier shares:
 * focus moves in on open, Escape closes, Tab cannot leave the dialog while
 * it's open, and focus returns to whatever opened it on close. One hook so
 * both dialog types behave identically rather than drifting apart.
 */
export function useDialogA11y(containerRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusable?.[0] ?? containerRef.current)?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount, by design (see useDialogA11y's own contract above)
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !containerRef.current) return;
      const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, containerRef]);
}
