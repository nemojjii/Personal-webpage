"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  DESCENT_DEFAULTS,
  DESCENT_EXTENT,
  DESCENT_LIMITS,
  type Point,
  type Quadratic,
  contourLevels,
  gradient,
  levelCurve,
  norm,
  objective,
  regime,
  run,
  stabilityLimit,
} from "@/lib/laboratory/gradient";

import { ButtonRow, LabButton, LabFrame, Legend, Note, Readout, Slider } from "./ui";

const SIZE = 480;
const PAD = 16;
const STEP_MS = 260;

const clampCoord = (v: number) =>
  Math.max(DESCENT_LIMITS.coordinate.min, Math.min(DESCENT_LIMITS.coordinate.max, Math.round(v * 10) / 10));

export function GradientDescent() {
  const [q, setQ] = useState<Quadratic>(DESCENT_DEFAULTS.q);
  const [eta, setEta] = useState(DESCENT_DEFAULTS.eta);
  const [start, setStart] = useState<Point>(DESCENT_DEFAULTS.start);
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const trajectory = useMemo(() => run(q, start, eta), [q, start, eta]);
  const last = trajectory.path.length - 1;
  const index = Math.min(shown, last);
  const current = trajectory.path[index];
  const atEnd = index >= last;

  // Auto-stepping: one iteration every STEP_MS while playing, until the end.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n + 1 >= last) setPlaying(false);
        return Math.min(n + 1, last);
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, last]);

  const restart = () => {
    setShown(0);
    setPlaying(false);
  };
  const changeQ = (patch: Partial<Quadratic>) => {
    setQ((prev) => ({ ...prev, ...patch }));
    restart();
  };
  const changeEta = (value: number) => {
    setEta(value);
    restart();
  };
  const changeStart = (patch: Partial<Point>) => {
    setStart((prev) => ({ ...prev, ...patch }));
    restart();
  };

  const scale = (SIZE - 2 * PAD) / (2 * DESCENT_EXTENT);
  const sx = (x: number) => PAD + (x + DESCENT_EXTENT) * scale;
  const sy = (y: number) => PAD + (DESCENT_EXTENT - y) * scale;

  const placeStart = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * SIZE;
    changeStart({
      x: clampCoord((x - PAD) / scale - DESCENT_EXTENT),
      y: clampCoord(DESCENT_EXTENT - (y - PAD) / scale),
    });
  };

  const contours = useMemo(
    () =>
      contourLevels(q).map((c) =>
        levelCurve(q, c)
          .map((pt, i) => `${i ? "L" : "M"}${sx(pt.x).toFixed(1)},${sy(pt.y).toFixed(1)}`)
          .join(" "),
      ),
    // sx/sy depend only on constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );
  const pathD = trajectory.path
    .slice(0, index + 1)
    .map((pt, i) => `${i ? "L" : "M"}${sx(pt.x).toFixed(1)},${sy(pt.y).toFixed(1)}`)
    .join(" ");

  const limit = stabilityLimit(q);
  const mode = regime(q, eta);
  const g = gradient(q, current);
  const f = objective(q, current);
  const outOfFrame = Math.abs(current.x) > DESCENT_EXTENT || Math.abs(current.y) > DESCENT_EXTENT;
  const fmt = (v: number) =>
    Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : v.toFixed(3);

  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">A bowl, seen from above.</span> The ellipses are
          level curves of <span className="font-mono text-[0.75rem]">f</span>; the minimum is at the
          centre. Click or tap anywhere on the surface to start from there, or set the start with the
          sliders.
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full cursor-crosshair touch-none"
          role="img"
          aria-label={`Gradient descent on f(x,y) = ½(${q.a}x² + ${q.b}y²), learning rate ${eta}. Iteration ${index} of ${last}; current point (${current.x.toFixed(2)}, ${current.y.toFixed(2)}), objective ${fmt(f)}.`}
          onPointerDown={placeStart}
        >
          <defs>
            <clipPath id="descent-frame">
              <rect x={PAD} y={PAD} width={SIZE - 2 * PAD} height={SIZE - 2 * PAD} />
            </clipPath>
          </defs>
          <rect x={PAD} y={PAD} width={SIZE - 2 * PAD} height={SIZE - 2 * PAD} fill="var(--color-paper)" stroke="var(--color-rule)" strokeWidth="0.8" />
          <g clipPath="url(#descent-frame)">
            <line x1={sx(-DESCENT_EXTENT)} y1={sy(0)} x2={sx(DESCENT_EXTENT)} y2={sy(0)} stroke="var(--color-rule-soft)" strokeWidth="0.8" />
            <line x1={sx(0)} y1={sy(-DESCENT_EXTENT)} x2={sx(0)} y2={sy(DESCENT_EXTENT)} stroke="var(--color-rule-soft)" strokeWidth="0.8" />
            {contours.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="var(--color-ink-muted)" strokeWidth="0.7" opacity="0.55" />
            ))}
            <circle cx={sx(0)} cy={sy(0)} r="2" fill="var(--color-ink-muted)" />
            <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinejoin="round" />
            {trajectory.path.slice(0, index + 1).map((pt, i) => (
              <circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r="1.6" fill="var(--color-accent)" opacity="0.7" />
            ))}
            <circle cx={sx(start.x)} cy={sy(start.y)} r="4.5" fill="none" stroke="var(--color-ink)" strokeWidth="1" />
            <circle cx={sx(current.x)} cy={sy(current.y)} r="4.5" fill="var(--color-accent)" />
          </g>
          {[-2, 0, 2].map((v) => (
            <g key={v}>
              <text x={sx(v)} y={SIZE - 4} textAnchor="middle" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">{v}</text>
              <text x={5} y={sy(v) + 2.5} textAnchor="start" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">{v}</text>
            </g>
          ))}
        </svg>

        <div>
          <Legend
            items={[
              { label: "level curves of f", color: "var(--color-ink-muted)", width: 0.8 },
              { label: "path", color: "var(--color-accent)", width: 1.4 },
            ]}
          />
          <div className="mt-5 grid gap-y-5">
            <Slider label="Curvature a (along x)" value={q.a} {...DESCENT_LIMITS.curvature} onChange={(a) => changeQ({ a })} format={(v) => v.toFixed(1)} />
            <Slider label="Curvature b (along y)" value={q.b} {...DESCENT_LIMITS.curvature} onChange={(b) => changeQ({ b })} format={(v) => v.toFixed(1)} />
            <Slider label="Learning rate η" value={eta} {...DESCENT_LIMITS.eta} onChange={changeEta} />
            <Slider label="Start x₀" value={start.x} {...DESCENT_LIMITS.coordinate} onChange={(x) => changeStart({ x })} format={(v) => v.toFixed(1)} />
            <Slider label="Start y₀" value={start.y} {...DESCENT_LIMITS.coordinate} onChange={(y) => changeStart({ y })} format={(v) => v.toFixed(1)} />
          </div>
          <ButtonRow>
            <LabButton onClick={() => setShown((n) => Math.min(n + 1, last))} disabled={atEnd}>
              Step
            </LabButton>
            <LabButton onClick={() => setPlaying(!playing)} pressed={playing} disabled={atEnd && !playing}>
              {playing ? "Pause" : "Play"}
            </LabButton>
            <LabButton onClick={restart}>Reset</LabButton>
          </ButtonRow>
        </div>
      </div>

      <Readout
        items={[
          { term: "Iteration", value: `${index} of ${last}` },
          { term: "Point", value: `(${fmt(current.x)}, ${fmt(current.y)})` },
          { term: "f(x, y)", value: fmt(f) },
          { term: "|∇f|", value: fmt(norm(g)) },
        ]}
      />
      <Note>
        {mode === "converging"
          ? `η = ${eta.toFixed(2)} is below 2/max(a, b) = ${limit.toFixed(2)}, and both step factors are positive: every step moves closer to the minimum.`
          : mode === "oscillating"
            ? `η = ${eta.toFixed(2)} is below 2/max(a, b) = ${limit.toFixed(2)}, but one step factor is negative: the point overshoots and lands on the other side each step, shrinking all the while.`
            : `η = ${eta.toFixed(2)} is at or above 2/max(a, b) = ${limit.toFixed(2)}: the steps no longer shrink, and the iteration diverges.`}
        {trajectory.status === "converged" && atEnd
          ? " The gradient is now below 10⁻⁶; the iteration has stopped."
          : trajectory.status === "diverged" && atEnd
            ? " The point has left any sensible frame; the iteration was stopped."
            : outOfFrame
              ? " The current point is outside the drawn window."
              : ""}
      </Note>
    </LabFrame>
  );
}
