"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

import { deformPoint, easeTo } from "@/lib/home/fieldPointer";

import { useFieldCanvas } from "./useFieldCanvas";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HERO FIELD — interwoven harmonic ribbons
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Three families of streamlines of prescribed planar incompressible flows,
 *  each family the level sets of its own stream function
 *
 *      H(r, t) = V(x, t) · s(r, t) / L + E(r, t) · Σᵢ Aᵢ cos(kᵢ · r − ωᵢ t + φᵢ),
 *      ωᵢ = c |kᵢ|,
 *
 *  built from three parts:
 *
 *  1. A bent, slowly turning axis. The across-stream coordinate is
 *         s(r, t) = y cos α(t) − x sin α(t) + B sin(κ u),   u = x cos α + y sin α,
 *     so the base streamlines are sine-bent bands tilted by α, and α(t)
 *     drifts slowly, so the angle at which families cross changes.
 *  2. A drift that breathes along the flow,
 *         V(x, t) = 1 + m₁ cos(q₁ x − Ω₁ t) + m₂ cos(q₂ x − Ω₂ t + φ),
 *     which spaces the streamlines closer where V is large and wider where
 *     it is small: ribbons narrow and expand, the narrowing travels, and
 *     with two incommensurate components the pattern does not simply repeat.
 *  3. Waves under a slow envelope,
 *         E(r, t) = 1 − e/2 + (e/2) cos(k_e · r − Ω_e t),
 *     so the travelling-wave perturbation is strong in some regions
 *     (tension: bunched, curved ribbons) and faint in others (calm, even
 *     ribbons).
 *
 *  The waves are scaled, if ever necessary, so that ∂H/∂y > 0 everywhere:
 *  no closed loops, no cells, no singular points. Each level set is then the
 *  graph of a function y(x), traced column by column with Newton's method.
 *  L is the canvas's shorter edge, or 0.88 w on a wide band, so the pattern
 *  keeps its character at every size.
 *
 *  Depth is drawing order, weight and opacity; nothing is shaded.
 *  - PRESENCE. The far charcoal family is shown where the front family opens
 *    and recedes where the front gathers (its opacity follows 1 − n(x), n the
 *    front family's breathing normalised to [0, 1]); the wine family gathers
 *    in one soft, slowly wandering region of radius ≈ L/2 and is faint
 *    elsewhere. At any point the front family meets at most one strong
 *    partner, so no three-way crosshatch forms.
 *  - FOCUS. A soft ellipse aligned with the front family's drift, its centre
 *    wandering slowly, multiplies the whole drawing, falling to a floor at
 *    the periphery — never to nothing — so there is one place where the
 *    drawing is densest and darkest and the edges stay calm.
 *  - WEIGHT. Within each family, line width follows the same slow modulation
 *    as opacity: the darker lines of a ribbon are also the heavier ones.
 *  Presence and focus are opacity only — gradients used as stroke styles and
 *  one radial destination-in pass — and change no geometry.
 *
 *  This is a kinematic construction — a flow field written down, not a fluid
 *  simulated. Canvas 2D, no WebGL, 60 fps (30 before a pointer response
 *  existed — see POINTER RESPONSE below for why that changed), paused off
 *  screen, one still frame under prefers-reduced-motion (see useFieldCanvas).
 *  The canvas itself never receives pointer events and is hidden from
 *  assistive technology; it is wrapped in a plain div that does, purely to
 *  know where a mouse or pen pointer is — touch is explicitly excluded, so
 *  nothing here can ever compete with a scroll or any other gesture.
 *
 *  POINTER RESPONSE. A mouse or pen pointer near the artwork pushes nearby
 *  points radially outward by a bounded Gaussian amount (lib/home/fieldPointer.ts:
 *  deformPoint, w(d) = exp(−d²/2σ²)) — applied only at the moment a point is
 *  pushed to the drawn path, after Newton's method has already found it on
 *  the true, undeformed geometry, so the deformation can never feed back into
 *  the root-finding or destabilise it. Two things are eased toward their
 *  target, each with its own time constant (lib/home/fieldPointer.ts: easeTo):
 *  an `influence` factor, toward 1 while a pointer is present and toward 0
 *  once it leaves, so the response's *strength* arrives and settles smoothly;
 *  and a smoothed copy of the pointer's position itself, toward the latest
 *  raw sample, so a sudden direction change or a stop settles rather than
 *  cutting. Position easing alone turned out not to be the fix for the
 *  stepping a visitor could see while moving the pointer, though — replaying
 *  a captured real drag through it at several time constants left the
 *  average distance between consecutive drawn frames essentially unchanged;
 *  easing a target that is itself advancing mostly adds lag, not smoothness.
 *  What closes that gap is the frame rate above: this component asks
 *  useFieldCanvas to draw at 60 fps rather than its 30 fps default, halving
 *  the distance a hand can cover between redraws and, with it, the size of
 *  the visible step. Under prefers-reduced-motion the draw loop never
 *  restarts after its one still frame, so pointer movement already has
 *  nothing to redraw into; the pointer handler also checks the same media
 *  query itself, so the state is never even tracked in that case.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Charcoal and wine as rgb triples — the site's `--color-ink` and `--color-accent`. */
const INK = "36, 35, 32";
const WINE = "112, 47, 59";
/** The same two roles' dark-theme values — off-white and the soft Klein blue. */
const INK_DARK = "240, 238, 255";
const WINE_DARK = "134, 157, 255";

interface WaveSpec {
  amplitude: number;
  angle: number;
  wavelength: number;
  phase: number;
}

interface FamilySpec {
  colour: string;
  tilt: number;
  turn: number;
  turnPeriod: number;
  bend: number;
  bendWavelength: number;
  breathe: number;
  breatheWavelength: number;
  breatheSpeed: number;
  breathe2: number;
  breathe2Wavelength: number;
  breathe2Speed: number;
  envelope: number;
  envelopeWavelength: number;
  envelopeAngle: number;
  envelopeSpeed: number;
  waves: WaveSpec[];
  speed: number;
  spacing: number;
  alpha: [number, number];
  /** Line width at the lightest and at the darkest lines of a ribbon. */
  width: [number, number];
}

/** The three families, in drawing order: far, wine, front. */
const FAMILIES: FamilySpec[] = [
  {
    colour: INK, tilt: -0.58, turn: 0.08, turnPeriod: 50, bend: 0.13, bendWavelength: 1.4,
    breathe: 0.46, breatheWavelength: 0.9, breatheSpeed: 0.034,
    breathe2: 0.14, breathe2Wavelength: 2.3, breathe2Speed: 0.012,
    envelope: 0.9, envelopeWavelength: 1.1, envelopeAngle: 0.3, envelopeSpeed: 0.026,
    waves: [
      { amplitude: 0.026, angle: 0.95, wavelength: 0.64, phase: 0.4 },
      { amplitude: 0.012, angle: -1.55, wavelength: 0.32, phase: 2.2 },
    ],
    speed: 0.036, spacing: 40, alpha: [0.08, 0.2], width: [0.4, 0.5],
  },
  {
    colour: WINE, tilt: 0.64, turn: 0.07, turnPeriod: 58, bend: 0.1, bendWavelength: 1.6,
    breathe: 0.38, breatheWavelength: 1.1, breatheSpeed: 0.026,
    breathe2: 0.12, breathe2Wavelength: 2.6, breathe2Speed: 0.01,
    envelope: 0.85, envelopeWavelength: 1.3, envelopeAngle: 1.0, envelopeSpeed: 0.02,
    waves: [
      { amplitude: 0.02, angle: 1.9, wavelength: 0.56, phase: 0.9 },
      { amplitude: 0.012, angle: -0.6, wavelength: 0.36, phase: 2.8 },
    ],
    speed: 0.03, spacing: 42, alpha: [0.3, 0.6], width: [0.6, 0.75],
  },
  {
    colour: INK, tilt: 0.26, turn: 0.09, turnPeriod: 42, bend: 0.16, bendWavelength: 1.25,
    breathe: 0.48, breatheWavelength: 0.8, breatheSpeed: 0.03,
    breathe2: 0.14, breathe2Wavelength: 2.1, breathe2Speed: 0.013,
    envelope: 0.9, envelopeWavelength: 0.95, envelopeAngle: 2.4, envelopeSpeed: 0.024,
    waves: [
      { amplitude: 0.03, angle: 1.3, wavelength: 0.52, phase: 0 },
      { amplitude: 0.014, angle: -1.05, wavelength: 0.3, phase: 1.7 },
    ],
    speed: 0.044, spacing: 27, alpha: [0.2, 0.55], width: [0.5, 0.8],
  },
];
const FAR = 0;
const WINE_FAMILY = 1;
const FRONT = 2;

/** Presence floors: how faint the far and the wine family become where they are not shown. */
const PRESENCE = { farFloor: { wide: 0.2, band: 0.12 }, wineFloor: 0.14, wineRadius: { wide: 0.55, band: 0.45 } };

/** The focal ellipse: centre (fractions of w, h), its slow wander, radius (fraction of L), axis ratio, floor. */
const FOCUS = {
  wide: { cx: 0.6, cy: 0.44, wander: [0.05, 0.06], radius: 0.95, ratio: 0.72, floor: 0.7, angle: 0.26 },
  band: { cx: 0.58, cy: 0.5, wander: [0.06, 0.1], radius: 0.8, ratio: 0.5, floor: 0.7, angle: 0.1 },
};

interface Wave { a: number; kx: number; ky: number; omega: number; phase: number }

interface Resolved {
  waves: Wave[];
  bendK: number;
  breatheQ: number;
  breatheOmega: number;
  breathe2Q: number;
  breathe2Omega: number;
  envKx: number;
  envKy: number;
  envOmega: number;
  /** Worst-case cross-stream gradient of the wave term, in units of 1/L. */
  waveGradient: number;
}

function resolve(f: FamilySpec, L: number): Resolved {
  const waves = f.waves.map((w) => {
    const k = (2 * Math.PI) / (w.wavelength * L);
    return { a: w.amplitude, kx: k * Math.cos(w.angle), ky: k * Math.sin(w.angle), omega: f.speed * L * k, phase: w.phase };
  });
  const envK = (2 * Math.PI) / (f.envelopeWavelength * L);
  const envKy = envK * Math.sin(f.envelopeAngle);
  const waveGradient =
    waves.reduce((s, w) => s + w.a * Math.abs(w.ky), 0) * L +
    (f.envelope / 2) * Math.abs(envKy) * L * waves.reduce((s, w) => s + w.a, 0);
  const q = (2 * Math.PI) / (f.breatheWavelength * L);
  const q2 = (2 * Math.PI) / (f.breathe2Wavelength * L);
  return {
    waves,
    bendK: (2 * Math.PI) / (f.bendWavelength * L),
    breatheQ: q,
    breatheOmega: f.breatheSpeed * L * q,
    breathe2Q: q2,
    breathe2Omega: f.breathe2Speed * L * q2,
    envKx: envK * Math.cos(f.envelopeAngle),
    envKy,
    envOmega: f.envelopeSpeed * L * envK,
    waveGradient,
  };
}

const breathing = (f: FamilySpec, r: Resolved, x: number, t: number) =>
  1 + f.breathe * Math.cos(r.breatheQ * x - r.breatheOmega * t) + f.breathe2 * Math.cos(r.breathe2Q * x - r.breathe2Omega * t + 1.1);

export function HeroField({
  fade = { left: 0.35, top: 0.14, bottom: 0.16 },
  opacity = 1,
  className = "",
}: {
  fade?: Fade;
  opacity?: number;
  className?: string;
}) {
  const cache = useRef({ L: 0, families: [] as Resolved[] });

  // The construction below is untouched by theming — only which two rgb
  // triples it paints with. Read fresh on mount and kept current by a
  // MutationObserver (an explicit `data-theme` choice) and a matchMedia
  // listener (System mode, so this follows an OS change live, same as the
  // CSS does); `draw` reads the ref so this never costs a DOM read per frame.
  const isDark = useRef(false);
  useEffect(() => {
    const resolve = () => {
      const explicit = document.documentElement.dataset.theme;
      if (explicit === "dark") return true;
      if (explicit === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    };
    isDark.current = resolve();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      isDark.current = resolve();
    };
    mq.addEventListener("change", onChange);

    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      mq.removeEventListener("change", onChange);
      observer.disconnect();
    };
  }, []);

  const colourFor = useCallback(
    (base: string) => (isDark.current ? (base === INK ? INK_DARK : base === WINE ? WINE_DARK : base) : base),
    [],
  );

  // Pointer state: all refs, read and written only inside the draw loop and
  // the handlers below, so a mouse moving never itself triggers a React
  // render — the already-running loop just picks up the latest values next
  // time it draws. `pointer` is the last known *raw* position in CSS pixels
  // local to the canvas, or null while nothing is hovering it; `smoothPos`
  // is a separately-eased copy of it, read by the deformation (see below);
  // `influence` is the eased [0, 1] response strength; `lastT` lets the draw
  // loop compute its own dt from the time it is already given, without
  // useFieldCanvas needing to know any of this exists.
  //
  // Position is eased on its own, at a short time constant, distinct from
  // influence's: smoothing a *target that is itself moving* mostly adds lag
  // rather than shrinking the gap between samples (verified directly —
  // replaying a captured real drag through this exact function at several
  // τ left the average inter-frame step essentially unchanged while lag grew
  // with τ) — what actually closes that gap is drawing more often, below.
  // Easing the position still earns its place for what redraw rate alone
  // cannot fix: a real pointer's own event timing is not perfectly even,
  // and a sudden direction change or stop should settle rather than cut.
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const smoothPos = useRef<{ x: number; y: number } | null>(null);
  const influence = useRef(0);
  const lastT = useRef<number | null>(null);
  const POSITION_TAU = 0.045;

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    // Touch is excluded on purpose: the artwork stays static under touch,
    // so a drag across it is never mistaken for anything but a scroll.
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);
  const onPointerLeave = useCallback(() => {
    pointer.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const dt = lastT.current === null ? 0 : Math.max(0, t - lastT.current);
      lastT.current = t;
      influence.current = easeTo(influence.current, pointer.current ? 1 : 0, dt, 0.18);
      if (pointer.current) {
        // Snap in on the very first sample — nothing to ease from yet — then
        // ease every sample after, including across a later re-entry, which
        // reads as the response fading in near wherever the pointer came
        // back rather than teleporting a stale position there.
        smoothPos.current ??= { ...pointer.current };
        smoothPos.current = {
          x: easeTo(smoothPos.current.x, pointer.current.x, dt, POSITION_TAU),
          y: easeTo(smoothPos.current.y, pointer.current.y, dt, POSITION_TAU),
        };
      }
      const short = Math.min(w, h);
      // Reference length: the short edge, unless the canvas is a wide band.
      const L = Math.max(short, 0.88 * w);
      const band = L > short * 1.3;
      if (cache.current.L !== L) cache.current = { L, families: FAMILIES.map((f) => resolve(f, L)) };
      const dx = Math.max(3, Math.round(L / 95));
      const margin = 48;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Presence of the far family: the complement of the front family's breathing.
      const farStyle = () => {
        const f = FAMILIES[FRONT];
        const r = cache.current.families[FRONT];
        const depth = f.breathe + f.breathe2;
        const g = ctx.createLinearGradient(0, 0, w, 0);
        const stops = 48;
        for (let i = 0; i <= stops; i++) {
          const x = (w * i) / stops;
          const n = (breathing(f, r, x, t) - (1 - depth)) / (2 * depth); // 0 where the front is sparsest, 1 where densest
          const floor = band ? PRESENCE.farFloor.band : PRESENCE.farFloor.wide;
          const p = floor + (1 - floor) * Math.pow(1 - Math.min(1, Math.max(0, n)), 1.25);
          g.addColorStop(i / stops, `rgba(${colourFor(FAMILIES[FAR].colour)}, ${p.toFixed(3)})`);
        }
        return g;
      };
      // Presence of the wine family: one soft region whose centre wanders.
      const wineStyle = () => {
        const cx = band
          ? w * (0.55 + 0.1 * Math.sin((2 * Math.PI * t) / 83))
          : w * (0.52 + 0.07 * Math.sin((2 * Math.PI * t) / 83));
        const cy = band ? h * 0.5 : h * (0.6 + 0.08 * Math.sin((2 * Math.PI * t) / 61 + 2));
        const R = (band ? PRESENCE.wineRadius.band : PRESENCE.wineRadius.wide) * L;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        const stops = 12;
        for (let i = 0; i <= stops; i++) {
          const u = i / stops;
          const p = PRESENCE.wineFloor + (1 - PRESENCE.wineFloor) * 0.5 * (1 + Math.cos(Math.PI * u));
          g.addColorStop(u, `rgba(${colourFor(FAMILIES[WINE_FAMILY].colour)}, ${p.toFixed(3)})`);
        }
        return g;
      };

      FAMILIES.forEach((f, fi) => {
        const r = cache.current.families[fi];
        const tiltScale = band ? 0.65 : 1;
        const alphaT = tiltScale * f.tilt + f.turn * Math.sin((2 * Math.PI * t) / f.turnPeriod);
        const cosA = Math.cos(alphaT);
        const sinA = Math.sin(alphaT);
        const bendAmp = f.bend * L;
        // The drift's smallest possible cross-stream gradient, in 1/L units:
        //   V_min · (cos α − |B κ sin α|), V_min = 1 − m₁ − m₂.
        const driftMin = (1 - f.breathe - f.breathe2) * (cosA - Math.abs(bendAmp * r.bendK * sinA));
        const safety = r.waveGradient < 0.8 * driftMin ? 1 : (0.8 * driftMin) / r.waveGradient;

        const V = (x: number) => breathing(f, r, x, t);
        const E = (x: number, y: number) =>
          1 - f.envelope / 2 + (f.envelope / 2) * Math.cos(r.envKx * x + r.envKy * y - r.envOmega * t);
        const H = (x: number, y: number) => {
          const u = x * cosA + y * sinA;
          const s = y * cosA - x * sinA + bendAmp * Math.sin(r.bendK * u);
          let wave = 0;
          for (const wv of r.waves) wave += wv.a * Math.cos(wv.kx * x + wv.ky * y - wv.omega * t + wv.phase);
          return (V(x) * s) / L + safety * E(x, y) * wave;
        };
        const Hy = (x: number, y: number) => {
          const u = x * cosA + y * sinA;
          const ds = cosA + bendAmp * r.bendK * Math.cos(r.bendK * u) * sinA;
          let wave = 0;
          let dwave = 0;
          for (const wv of r.waves) {
            const arg = wv.kx * x + wv.ky * y - wv.omega * t + wv.phase;
            wave += wv.a * Math.cos(arg);
            dwave -= wv.a * wv.ky * Math.sin(arg);
          }
          const e = E(x, y);
          const de = -(f.envelope / 2) * r.envKy * Math.sin(r.envKx * x + r.envKy * y - r.envOmega * t);
          return (V(x) * ds) / L + safety * (e * dwave + de * wave);
        };

        let hMin = Infinity;
        let hMax = -Infinity;
        for (let i = 0; i <= 6; i++)
          for (let j = 0; j <= 4; j++) {
            const v = H((i / 6) * w, -margin + (j / 4) * (h + 2 * margin));
            if (v < hMin) hMin = v;
            if (v > hMax) hMax = v;
          }
        // Lines sit a little closer on the band, whose height is small against L.
        const step = (f.spacing * (band ? 0.8 : 1) * (L >= 500 ? 1 : 0.85)) / L;
        const count = Math.floor((hMax - hMin) / step);

        const style = fi === FAR ? farStyle() : fi === WINE_FAMILY ? wineStyle() : null;

        for (let j = 0; j <= count; j++) {
          const c = hMin + j * step;
          // Slow modulation across the lines of a family: the darker lines are also the heavier ones.
          const mix = 0.5 + 0.5 * Math.sin(j * 0.72 + fi * 1.7);
          const shaped = mix * mix * (3 - 2 * mix);
          const alpha = (f.alpha[0] + (f.alpha[1] - f.alpha[0]) * shaped) * opacity;
          ctx.beginPath();
          let drawing = false;
          let y = (c * L) / cosA;
          for (let x = -dx; x <= w + dx; x += dx) {
            for (let it = 0; it < 2; it++) y -= (H(x, y) - c) / Hy(x, y);
            if (!Number.isFinite(y) || y < -margin || y > h + margin) {
              drawing = false;
              y = Number.isFinite(y) ? Math.max(-margin, Math.min(h + margin, y)) : (c * L) / cosA;
              continue;
            }
            // The deformation is purely a display-time offset of this one
            // point: `y` itself — fed into the next x step above and into
            // the bounds check above — is always the true, undeformed value.
            // Deformed around smoothPos (the eased position), not the raw
            // pointer — see the comment where it is defined.
            const p =
              influence.current > 1e-4 && smoothPos.current
                ? deformPoint(x, y, smoothPos.current.x, smoothPos.current.y, influence.current)
                : { x, y };
            if (drawing) ctx.lineTo(p.x, p.y);
            else {
              ctx.moveTo(p.x, p.y);
              drawing = true;
            }
          }
          if (style) {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = style;
          } else {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = `rgba(${colourFor(f.colour)}, ${alpha})`;
          }
          ctx.lineWidth = f.width[0] + (f.width[1] - f.width[0]) * shaped;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // The focal ellipse: multiply the whole drawing by a soft field that
      // falls from 1 at its centre to a floor at the periphery.
      const fo = band ? FOCUS.band : FOCUS.wide;
      const cx = w * (fo.cx + fo.wander[0] * Math.sin((2 * Math.PI * t) / 73));
      const cy = h * (fo.cy + fo.wander[1] * Math.sin((2 * Math.PI * t) / 97 + 1));
      const R = fo.radius * L;
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.translate(cx, cy);
      ctx.rotate(fo.angle);
      ctx.scale(1, fo.ratio);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.3, "rgba(0,0,0,0.96)");
      g.addColorStop(0.65, `rgba(0,0,0,${(fo.floor + 0.18).toFixed(3)})`);
      g.addColorStop(1, `rgba(0,0,0,${fo.floor.toFixed(3)})`);
      ctx.fillStyle = g;
      const reach = (4 * Math.max(w, h)) / fo.ratio;
      ctx.fillRect(-reach, -reach, 2 * reach, 2 * reach);
      ctx.restore();

      applyFade(ctx, w, h, fade);
    },
    [fade, opacity, colourFor],
  );

  // 60 fps, not useFieldCanvas's 30 fps default: at 30, a redraw is up to
  // ~33ms apart, and a hand moving the pointer at an ordinary pace covers
  // enough distance in that gap to make the deformation's position visibly
  // step from frame to frame — confirmed by capturing a real drag's actual
  // draw-to-draw position jumps, not assumed. Halving the gap roughly halves
  // the step. The autonomous motion alone never needed this; only directly
  // chasing a pointer does.
  const ref = useFieldCanvas(draw, { fps: 60 });
  return (
    <div
      className={`h-full w-full ${className}`}
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <canvas
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none h-full w-full select-none"
      />
    </div>
  );
}

/**
 * Soften the drawing towards chosen edges so it belongs to the page rather
 * than sitting in a box. Fractions are of the width (left, right) or height
 * (top, bottom) over which the lines fade to nothing.
 */
export interface Fade {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

function applyFade(ctx: CanvasRenderingContext2D, w: number, h: number, fade: Fade) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  if (fade.left || fade.right) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, fade.left ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    if (fade.left) g.addColorStop(Math.min(1, fade.left), "rgba(0,0,0,1)");
    if (fade.right) g.addColorStop(Math.max(0, 1 - fade.right), "rgba(0,0,0,1)");
    g.addColorStop(1, fade.right ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  if (fade.top || fade.bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, fade.top ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    if (fade.top) g.addColorStop(Math.min(1, fade.top), "rgba(0,0,0,1)");
    if (fade.bottom) g.addColorStop(Math.max(0, 1 - fade.bottom), "rgba(0,0,0,1)");
    g.addColorStop(1, fade.bottom ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

