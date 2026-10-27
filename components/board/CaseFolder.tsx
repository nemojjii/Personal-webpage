"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useDialogA11y } from "./useDialogA11y";
import { useReducedMotion } from "./useReducedMotion";

/** One two-page spread. `right` is `null` for a file with nothing genuine to put there — never filled with invented content. */
export interface Spread {
  key: string;
  /** Announced to screen readers when this spread becomes current. */
  srLabel: string;
  left: React.ReactNode;
  right: React.ReactNode | null;
}

export interface OriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ENTER_MS = 420;
const LEAVE_MS = 260;
const FLIP_MS = 480;

type FlipSlot = "left" | "right" | "single";

interface FlipState {
  slot: FlipSlot;
  front: React.ReactNode;
  back: React.ReactNode;
  /** What the slot the flap is leaving reveals underneath, as it lifts — desktop only. */
  reveal?: React.ReactNode;
  endAngle: number;
  commit: () => void;
}

/**
 * The folder taken off the investigation wall: a physical object that
 * emerges from the clicked artifact, opens around a hinge, and holds its
 * pages via a real page-turn — not a modal with tabs. The wall stays
 * visible through a translucent scrim the whole time.
 */
export function CaseFolder({
  tabLabel,
  fileLabel,
  ariaLabel,
  spreads,
  onClose,
  originRect,
}: {
  tabLabel: string;
  fileLabel: string;
  ariaLabel: string;
  spreads: Spread[];
  onClose: () => void;
  originRect?: OriginRect | null;
}) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [stage, setStage] = useState<"enter" | "settled" | "leave">(reducedMotion ? "settled" : "enter");
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [mobileHalf, setMobileHalf] = useState<0 | 1>(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );
  const [flip, setFlip] = useState<FlipState | null>(null);
  const [flipArmed, setFlipArmed] = useState(false);
  const [enterTransform, setEnterTransform] = useState("none");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Measure once, compute the transform that makes the folder look like it
  // emerged from the clicked artifact's own position on the wall.
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (originRect) {
      const dx = originRect.x + originRect.width / 2 - (rect.x + rect.width / 2);
      const dy = originRect.y + originRect.height / 2 - (rect.y + rect.height / 2);
      const scale = Math.min(0.92, Math.max(0.22, originRect.width / Math.max(1, rect.width)));
      setEnterTransform(`translate(${dx}px, ${dy}px) scale(${scale})`);
    } else {
      setEnterTransform("scale(0.88) translateY(16px)");
    }
    const raf = requestAnimationFrame(() => setStage("settled"));
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- measured once, on mount, by design

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closeTimerRef.current) return;
    setFlip(null);
    if (reducedMotion) {
      onClose();
      return;
    }
    setStage("leave");
    closeTimerRef.current = window.setTimeout(onClose, LEAVE_MS);
  }, [onClose, reducedMotion]);

  useDialogA11y(dialogRef, requestClose);

  const lastIndex = spreads.length - 1;
  const atStart = spreadIndex === 0 && mobileHalf === 0;
  const currentSpread = spreads[spreadIndex];
  const atEnd = spreadIndex === lastIndex && (!currentSpread.right || mobileHalf === 1 || !isMobile);

  const runFlip = useCallback(
    (state: FlipState) => {
      if (reducedMotion) {
        state.commit();
        return;
      }
      setFlip(state);
      setFlipArmed(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setFlipArmed(true)));
    },
    [reducedMotion],
  );

  const next = useCallback(() => {
    if (flip) return;
    if (!isMobile) {
      if (spreadIndex >= lastIndex) return;
      const i = spreadIndex;
      runFlip({
        slot: "right",
        front: spreads[i].right,
        back: spreads[i + 1].left,
        reveal: spreads[i + 1].right,
        endAngle: -180,
        commit: () => setSpreadIndex(i + 1),
      });
      return;
    }
    if (mobileHalf === 0 && currentSpread.right) {
      runFlip({
        slot: "single",
        front: currentSpread.left,
        back: currentSpread.right,
        endAngle: -180,
        commit: () => setMobileHalf(1),
      });
    } else if (spreadIndex < lastIndex) {
      const i = spreadIndex;
      const from = mobileHalf === 1 ? spreads[i].right : spreads[i].left;
      runFlip({
        slot: "single",
        front: from,
        back: spreads[i + 1].left,
        endAngle: -180,
        commit: () => {
          setSpreadIndex(i + 1);
          setMobileHalf(0);
        },
      });
    }
  }, [flip, isMobile, spreadIndex, lastIndex, mobileHalf, currentSpread, spreads, runFlip]);

  const prev = useCallback(() => {
    if (flip) return;
    if (!isMobile) {
      if (spreadIndex <= 0) return;
      const i = spreadIndex;
      runFlip({
        slot: "left",
        front: spreads[i - 1].right,
        back: spreads[i].left,
        reveal: spreads[i - 1].left,
        endAngle: 180,
        commit: () => setSpreadIndex(i - 1),
      });
      return;
    }
    if (mobileHalf === 1) {
      runFlip({
        slot: "single",
        front: currentSpread.right,
        back: currentSpread.left,
        endAngle: 180,
        commit: () => setMobileHalf(0),
      });
    } else if (spreadIndex > 0) {
      const i = spreadIndex;
      const prevSpread = spreads[i - 1];
      const hasRight = !!prevSpread.right;
      runFlip({
        slot: "single",
        front: spreads[i].left,
        back: hasRight ? prevSpread.right : prevSpread.left,
        endAngle: 180,
        commit: () => {
          setSpreadIndex(i - 1);
          setMobileHalf(hasRight ? 1 : 0);
        },
      });
    }
  }, [flip, isMobile, spreadIndex, mobileHalf, currentSpread, spreads, runFlip]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT")) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  const finishFlip = useCallback(() => {
    if (!flip) return;
    flip.commit();
    setFlip(null);
  }, [flip]);

  const baseLeft = flip?.slot === "left" ? flip.reveal : currentSpread.left;
  const baseRight = flip?.slot === "right" ? flip.reveal : currentSpread.right;
  const baseSingle = flip?.slot === "single" ? flip.back : mobileHalf === 0 ? currentSpread.left : currentSpread.right;

  const containerTransform = stage === "settled" ? "none" : enterTransform;
  const containerOpacity = stage === "settled" || reducedMotion ? 1 : 0;

  const coverAngle = stage === "settled" ? -108 : 0;

  const pageLabel = isMobile
    ? (() => {
        const totalPages = spreads.reduce((n, s) => n + (s.right ? 2 : 1), 0);
        const pagesBefore = spreads.slice(0, spreadIndex).reduce((n, s) => n + (s.right ? 2 : 1), 0);
        return `Page ${pagesBefore + mobileHalf + 1} of ${totalPages}`;
      })()
    : `Spread ${spreadIndex + 1} of ${spreads.length}`;

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/25 p-3 backdrop-blur-[1px] sm:items-center sm:p-8"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={rootRef}
        className="relative my-auto w-full max-w-[52rem] motion-safe:transition-[transform,opacity] motion-safe:duration-300 motion-safe:ease-out"
        style={{
          transform: containerTransform,
          opacity: containerOpacity,
          transitionDuration: `${stage === "leave" ? LEAVE_MS : ENTER_MS}ms`,
          perspective: 2400,
        }}
      >
        {/* Backing — slightly uneven manila layers underneath the dialog. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[7px] translate-y-[10px] rotate-[1.1deg] border"
          style={{ background: "var(--folder-cover)", borderColor: "var(--folder-cover-line)" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[3px] translate-y-[5px] rotate-[-0.7deg] border"
          style={{ background: "var(--folder-cover)", borderColor: "var(--folder-cover-line)" }}
        />

        {/* The tab, projecting above the folder. */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-7 z-10 -translate-y-1/2 rotate-[-0.6deg] border px-3 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
          style={{ background: "var(--folder-cover)", borderColor: "var(--folder-cover-line)" }}
        >
          <span className="label whitespace-nowrap text-ink">{tabLabel}</span>
        </div>

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="relative border bg-paper p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] outline-none sm:p-7"
          style={{ borderColor: "var(--folder-cover-line)" }}
        >
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close file — return to the wall"
            className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-rule-soft bg-paper font-sans text-[1rem] text-ink-soft hover:border-accent-soft hover:text-ink"
          >
            ×
          </button>

          <p aria-live="polite" className="sr-only">
            {currentSpread.srLabel} — {pageLabel}
          </p>

          {/* Pages */}
          <div
            className="relative min-h-[22rem] pt-2 sm:min-h-[26rem]"
            style={{ perspective: 2000, userSelect: flip ? "none" : undefined }}
          >
            {isMobile ? (
              <div className="relative h-full">
                <div className="relative z-0 h-full overflow-y-auto pr-1 pb-14">{baseSingle}</div>
                {flip && flip.slot === "single" ? (
                  <PageFace
                    endAngle={flip.endAngle}
                    armed={flipArmed}
                    front={flip.front}
                    back={flip.back}
                    origin={flip.endAngle < 0 ? "left" : "right"}
                    onTransitionEnd={finishFlip}
                  />
                ) : null}
              </div>
            ) : (
              <div className="relative grid h-full grid-cols-2 gap-6">
                <div className="relative z-0 h-full overflow-y-auto border-r border-dashed border-rule-soft pr-5 pb-14">
                  {baseLeft}
                </div>
                <div className="relative z-0 h-full overflow-y-auto pl-1 pb-14">{baseRight}</div>

                {flip && flip.slot === "right" ? (
                  <div className="absolute inset-y-0 right-0 w-1/2">
                    <PageFace
                      endAngle={flip.endAngle}
                      armed={flipArmed}
                      front={flip.front}
                      back={flip.back}
                      origin="left"
                      onTransitionEnd={finishFlip}
                    />
                  </div>
                ) : null}
                {flip && flip.slot === "left" ? (
                  <div className="absolute inset-y-0 left-0 w-1/2">
                    <PageFace
                      endAngle={flip.endAngle}
                      armed={flipArmed}
                      front={flip.front}
                      back={flip.back}
                      origin="right"
                      onTransitionEnd={finishFlip}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Page-turn controls */}
          <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-3 border-t border-rule-soft bg-paper pt-2.5 sm:inset-x-7">
            <button
              type="button"
              onClick={prev}
              disabled={atStart || !!flip}
              aria-label="Previous page"
              className="flex items-center gap-1 border border-rule-soft px-2.5 py-1 font-sans text-[0.75rem] text-ink transition-colors hover:border-accent-soft disabled:pointer-events-none disabled:opacity-30"
            >
              <span aria-hidden="true">‹</span> Previous
            </button>
            <span className="font-sans text-[0.6875rem] text-ink-muted">{pageLabel}</span>
            <button
              type="button"
              onClick={next}
              disabled={atEnd || !!flip}
              aria-label="Next page"
              className="flex items-center gap-1 border border-rule-soft px-2.5 py-1 font-sans text-[0.75rem] text-ink transition-colors hover:border-accent-soft disabled:pointer-events-none disabled:opacity-30"
            >
              Next <span aria-hidden="true">›</span>
            </button>
          </div>

          {/* Page-corner affordances. */}
          {!atEnd ? (
            <button
              type="button"
              onClick={next}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute right-0 bottom-14 hidden h-10 w-10 cursor-pointer sm:block"
              style={{
                background: "linear-gradient(135deg, transparent 50%, var(--color-rule-soft) 50%)",
              }}
            />
          ) : null}
          {!atStart ? (
            <button
              type="button"
              onClick={prev}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute bottom-14 left-0 hidden h-10 w-10 cursor-pointer sm:block"
              style={{
                background: "linear-gradient(45deg, transparent 50%, var(--color-rule-soft) 50%)",
              }}
            />
          ) : null}
        </div>

        {/* The folder's cover — closed over the pages at rest, opening around a hinge at the top. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border motion-safe:transition-transform motion-safe:ease-out"
          style={{
            background: "var(--folder-cover)",
            borderColor: "var(--folder-cover-line)",
            transformOrigin: "top center",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            transform: `rotateX(${reducedMotion ? -108 : coverAngle}deg)`,
            transitionDuration: `${ENTER_MS}ms`,
            boxShadow: "0 18px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="absolute top-8 left-1/2 w-3/4 -translate-x-1/2 border-t"
            style={{ borderColor: "var(--folder-cover-line)" }}
            aria-hidden="true"
          />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center font-sans text-[0.6875rem] tracking-[0.18em] text-ink/70 uppercase">
            {fileLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function PageFace({
  front,
  back,
  endAngle,
  armed,
  origin,
  onTransitionEnd,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  endAngle: number;
  armed: boolean;
  origin: "left" | "right";
  onTransitionEnd: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-10 motion-safe:transition-transform motion-safe:ease-in-out"
      style={{
        transformOrigin: origin === "left" ? "left center" : "right center",
        transformStyle: "preserve-3d",
        transform: `rotateY(${armed ? endAngle : 0}deg)`,
        transitionDuration: `${FLIP_MS}ms`,
        boxShadow: "0 0 24px rgba(0,0,0,0.25)",
      }}
      onTransitionEnd={onTransitionEnd}
    >
      <div
        className="absolute inset-0 overflow-y-auto bg-paper p-1 pr-4"
        style={{ backfaceVisibility: "hidden" }}
      >
        {front}
      </div>
      <div
        className="absolute inset-0 overflow-y-auto bg-paper p-1 pr-4"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      >
        {back}
      </div>
    </div>
  );
}
