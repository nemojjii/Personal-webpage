"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ButtonRow, Controls, LabButton, LabFrame, Note, Slider } from "@/components/laboratory/ui";
import {
  FIELD_LIMITS,
  fieldKinds,
  fieldLabel,
  fullTrajectory,
  generateSeeds,
  INTEGRATION_LIMITS,
  SEED_LIMITS,
  VECTORFIELD_DEFAULTS,
  type FieldKind,
  type FieldParams,
  type Point,
} from "@/lib/art/vectorfield";

import { downloadCanvasPng } from "./export";
import { useReveal } from "./useReveal";

const BOUND = 4;
const INTEGRATION = { stepSize: 0.05, maxSteps: 220, bound: BOUND };
const SEED = { count: 24, seed: 7 };
const LOGICAL_SIZE = 520;
const DURATION_MS = 1600;

function readColor(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

export function VectorField() {
  const [field, setField] = useState<FieldParams>({ ...VECTORFIELD_DEFAULTS });
  const [integration, setIntegration] = useState(INTEGRATION);
  const [seedConf, setSeedConf] = useState(SEED);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reveal = useReveal(DURATION_MS);

  const seeds = useMemo(
    () => generateSeeds(seedConf.count, seedConf.seed, BOUND * 0.9),
    [seedConf.count, seedConf.seed],
  );
  const trajectories = useMemo<Point[][]>(
    () => seeds.map((seed) => fullTrajectory(field, seed, integration)),
    [seeds, field, integration],
  );

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const cssSize = canvas.clientWidth || LOGICAL_SIZE;
    if (canvas.width !== Math.round(cssSize * dpr)) {
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = (cssSize * dpr) / (2 * BOUND);
    const toPx = (p: Point) => [cssSize * dpr * 0.5 + p[0] * scale, cssSize * dpr * 0.5 - p[1] * scale] as const;

    const paper = readColor(canvas, "--color-paper", "#f8f6f0");
    const klein = readColor(canvas, "--color-klein", "#223bee");
    const rule = readColor(canvas, "--color-rule", "#d9d4ca");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = rule;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

    const frac = reveal.fraction;
    ctx.strokeStyle = klein;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = Math.max(1, dpr * 0.9);
    for (const traj of trajectories) {
      const count = Math.max(0, Math.round(traj.length * frac));
      if (count < 2) continue;
      ctx.beginPath();
      const [x0, y0] = toPx(traj[0]);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < count; i++) {
        const [x, y] = toPx(traj[i]);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // Redraw on data changes, container resize, and theme changes — canvas
  // pixels do not update on their own the way SVG `var(--color-…)` does.
  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onThemeChange = () => draw();
    mq.addEventListener("change", onThemeChange);
    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onThemeChange);
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trajectories, reveal.fraction]);

  const reset = () => {
    setField({ ...VECTORFIELD_DEFAULTS });
    setIntegration(INTEGRATION);
    setSeedConf(SEED);
    reveal.complete();
  };

  const newSeed = () => setSeedConf((s) => ({ ...s, seed: s.seed + 1 }));

  const exportPng = () => {
    if (canvasRef.current) downloadCanvasPng(canvasRef.current, `vector-field-${field.kind}.png`);
  };

  return (
    <div>
      <LabFrame
        caption={
          <>
            {seeds.length} streamlines of {fieldLabel[field.kind]}, each integrated with
            fourth-order Runge–Kutta until it leaves the frame, stalls at a fixed point, or
            reaches {integration.maxSteps} steps — whichever comes first. Nothing here is a
            measured flow; it is this exact equation, drawn.
          </>
        }
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", aspectRatio: "1 / 1", display: "block" }}
          role="img"
          aria-label={`${seeds.length} flow lines of the ${fieldLabel[field.kind]} vector field, seed ${seedConf.seed}, drawn in Klein blue on a square domain from ${-BOUND} to ${BOUND}.`}
        >
          A generative drawing of {seeds.length} streamlines through the {fieldLabel[field.kind]}{" "}
          vector field. Your browser does not support canvas rendering, so the image itself cannot
          be shown here.
        </canvas>
      </LabFrame>

      <Controls>
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="font-sans text-[0.6875rem] font-medium tracking-[0.06em] text-ink-soft">
            Field
          </span>
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
            {fieldKinds.map((k) => (
              <LabButton key={k} pressed={field.kind === k} onClick={() => setField((f) => ({ ...f, kind: k as FieldKind }))}>
                {fieldLabel[k]}
              </LabButton>
            ))}
          </div>
        </div>
        <Slider
          label="Parameter a"
          value={field.a}
          min={FIELD_LIMITS.a.min}
          max={FIELD_LIMITS.a.max}
          step={FIELD_LIMITS.a.step}
          onChange={(a) => setField((f) => ({ ...f, a }))}
        />
        <Slider
          label="Parameter b"
          value={field.b}
          min={FIELD_LIMITS.b.min}
          max={FIELD_LIMITS.b.max}
          step={FIELD_LIMITS.b.step}
          onChange={(b) => setField((f) => ({ ...f, b }))}
        />
        <Slider
          label="Seed"
          value={seedConf.seed}
          min={1}
          max={999}
          step={1}
          format={(v) => v.toFixed(0)}
          onChange={(seed) => setSeedConf((s) => ({ ...s, seed }))}
        />
        <Slider
          label="Seed points"
          value={seedConf.count}
          min={SEED_LIMITS.count.min}
          max={SEED_LIMITS.count.max}
          step={SEED_LIMITS.count.step}
          format={(v) => v.toFixed(0)}
          onChange={(count) => setSeedConf((s) => ({ ...s, count }))}
        />
        <Slider
          label="Step size"
          value={integration.stepSize}
          min={INTEGRATION_LIMITS.stepSize.min}
          max={INTEGRATION_LIMITS.stepSize.max}
          step={INTEGRATION_LIMITS.stepSize.step}
          onChange={(stepSize) => setIntegration((i) => ({ ...i, stepSize }))}
        />
        <Slider
          label="Line length"
          value={integration.maxSteps}
          min={INTEGRATION_LIMITS.maxSteps.min}
          max={INTEGRATION_LIMITS.maxSteps.max}
          step={INTEGRATION_LIMITS.maxSteps.step}
          format={(v) => `${v.toFixed(0)} steps`}
          onChange={(maxSteps) => setIntegration((i) => ({ ...i, maxSteps }))}
        />
      </Controls>

      <ButtonRow>
        <LabButton onClick={reveal.playing ? reveal.pause : reveal.play} pressed={reveal.playing}>
          {reveal.playing ? "Pause" : "Replay drawing"}
        </LabButton>
        <LabButton onClick={newSeed}>New seed</LabButton>
        <span className="text-rule-soft">|</span>
        <LabButton onClick={reset}>Reset to defaults</LabButton>
        <span className="text-rule-soft">|</span>
        <LabButton onClick={exportPng}>Export PNG</LabButton>
      </ButtonRow>

      <Note>
        The same seed and parameters always draw the same composition — nothing here is left to
        chance at the moment of drawing, only chosen once, by the seed, in advance. &quot;New
        seed&quot; moves to the next seed in sequence rather than a fresh random one, so a
        composition you like can always be found again.
      </Note>
    </div>
  );
}
