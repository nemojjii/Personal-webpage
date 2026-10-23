"use client";

import { useMemo, useRef, useState } from "react";

import { ButtonRow, Controls, LabButton, LabFrame, Note, Slider } from "@/components/laboratory/ui";
import {
  HYPOTROCHOID_DEFAULTS,
  HYPOTROCHOID_LIMITS,
  LISSAJOUS_DEFAULTS,
  LISSAJOUS_LIMITS,
  parametricKinds,
  ROSE_DEFAULTS,
  ROSE_LIMITS,
  sampleCurve,
  type HypotrochoidParams,
  type LissajousParams,
  type ParametricKind,
  type RoseParams,
} from "@/lib/art/parametric";

import { downloadSvg } from "./export";
import { useReveal } from "./useReveal";

const SIZE = 440;
const PAD = 20;
const SAMPLE_COUNT = 480;
const DURATION_MS = 1800;

const kindLabel: Record<ParametricKind, string> = {
  lissajous: "Lissajous",
  rose: "Rose",
  hypotrochoid: "Hypotrochoid",
};

const LISSAJOUS_PRESETS: { label: string; p: LissajousParams }[] = [
  { label: "Circle", p: { kind: "lissajous", a: 1, b: 1, delta: Math.PI / 2 } },
  { label: "Figure eight", p: { kind: "lissajous", a: 1, b: 2, delta: Math.PI / 2 } },
  { label: "Classic 3:2", p: { kind: "lissajous", a: 3, b: 2, delta: Math.PI / 2 } },
];
const ROSE_PRESETS: { label: string; p: RoseParams }[] = [
  { label: "Five-petal", p: { kind: "rose", n: 5, d: 1 } },
  { label: "Seven-petal", p: { kind: "rose", n: 7, d: 1 } },
  { label: "Woven 5/3", p: { kind: "rose", n: 5, d: 3 } },
];
const HYPOTROCHOID_PRESETS: { label: string; p: HypotrochoidParams }[] = [
  { label: "Classic spirograph", p: { kind: "hypotrochoid", R: 5, r: 3, d: 5 } },
  { label: "Dense star", p: { kind: "hypotrochoid", R: 9, r: 2, d: 6 } },
  { label: "Simple loop", p: { kind: "hypotrochoid", R: 6, r: 1, d: 3 } },
];

function sameLissajous(a: LissajousParams, b: LissajousParams) {
  return a.a === b.a && a.b === b.b && Math.abs(a.delta - b.delta) < 1e-6;
}
function sameRose(a: RoseParams, b: RoseParams) {
  return a.n === b.n && a.d === b.d;
}
function sameHypotrochoid(a: HypotrochoidParams, b: HypotrochoidParams) {
  return a.R === b.R && a.r === b.r && Math.abs(a.d - b.d) < 1e-6;
}

export function ParametricForms() {
  const [kind, setKind] = useState<ParametricKind>("lissajous");
  const [lissajous, setLissajous] = useState<LissajousParams>({ ...LISSAJOUS_DEFAULTS });
  const [rose, setRose] = useState<RoseParams>({ ...ROSE_DEFAULTS });
  const [hypotrochoid, setHypotrochoid] = useState<HypotrochoidParams>({ ...HYPOTROCHOID_DEFAULTS });
  const svgRef = useRef<SVGSVGElement>(null);
  const reveal = useReveal(DURATION_MS);

  const active = kind === "lissajous" ? lissajous : kind === "rose" ? rose : hypotrochoid;
  const points = useMemo(() => sampleCurve(active, SAMPLE_COUNT), [active]);

  const bounds = useMemo(() => {
    let maxR = 0.001;
    for (const { x, y } of points) maxR = Math.max(maxR, Math.hypot(x, y));
    return maxR * 1.12;
  }, [points]);

  const scale = (SIZE - 2 * PAD) / (2 * bounds);
  const sx = (x: number) => SIZE / 2 + x * scale;
  const sy = (y: number) => SIZE / 2 - y * scale;

  const shown = Math.max(2, Math.round(points.length * reveal.fraction));
  const d = points
    .slice(0, shown)
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`)
    .join(" ");

  const reset = () => {
    setKind("lissajous");
    setLissajous({ ...LISSAJOUS_DEFAULTS });
    setRose({ ...ROSE_DEFAULTS });
    setHypotrochoid({ ...HYPOTROCHOID_DEFAULTS });
    reveal.complete();
  };

  const exportSvg = () => {
    if (svgRef.current) downloadSvg(svgRef.current, `parametric-${kind}.svg`);
  };

  const describe = () => {
    if (kind === "lissajous") return `Lissajous figure, frequencies ${lissajous.a}:${lissajous.b}, phase ${lissajous.delta.toFixed(2)} radians.`;
    if (kind === "rose") return `Rose curve, r = cos((${rose.n}/${rose.d})·θ).`;
    return `Hypotrochoid, fixed radius ${hypotrochoid.R}, rolling radius ${hypotrochoid.r}, pen offset ${hypotrochoid.d.toFixed(2)}.`;
  };

  return (
    <div>
      <LabFrame caption={describe()}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full"
          role="img"
          aria-label={describe()}
        >
          <path d={d} fill="none" stroke="var(--color-klein)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </LabFrame>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
        {parametricKinds.map((k) => (
          <LabButton key={k} pressed={kind === k} onClick={() => setKind(k)}>
            {kindLabel[k]}
          </LabButton>
        ))}
      </div>

      {kind === "lissajous" ? (
        <Controls>
          <Slider
            label="Frequency a"
            value={lissajous.a}
            min={LISSAJOUS_LIMITS.a.min}
            max={LISSAJOUS_LIMITS.a.max}
            step={LISSAJOUS_LIMITS.a.step}
            format={(v) => v.toFixed(0)}
            onChange={(a) => setLissajous((p) => ({ ...p, a }))}
          />
          <Slider
            label="Frequency b"
            value={lissajous.b}
            min={LISSAJOUS_LIMITS.b.min}
            max={LISSAJOUS_LIMITS.b.max}
            step={LISSAJOUS_LIMITS.b.step}
            format={(v) => v.toFixed(0)}
            onChange={(b) => setLissajous((p) => ({ ...p, b }))}
          />
          <Slider
            label="Phase δ"
            value={lissajous.delta}
            min={LISSAJOUS_LIMITS.delta.min}
            max={LISSAJOUS_LIMITS.delta.max}
            step={LISSAJOUS_LIMITS.delta.step}
            format={(v) => `${(v / Math.PI).toFixed(2)}π`}
            onChange={(delta) => setLissajous((p) => ({ ...p, delta }))}
          />
        </Controls>
      ) : null}

      {kind === "rose" ? (
        <Controls>
          <Slider
            label="n"
            value={rose.n}
            min={ROSE_LIMITS.n.min}
            max={ROSE_LIMITS.n.max}
            step={ROSE_LIMITS.n.step}
            format={(v) => v.toFixed(0)}
            onChange={(n) => setRose((p) => ({ ...p, n }))}
          />
          <Slider
            label="d"
            value={rose.d}
            min={ROSE_LIMITS.d.min}
            max={ROSE_LIMITS.d.max}
            step={ROSE_LIMITS.d.step}
            format={(v) => v.toFixed(0)}
            onChange={(dVal) => setRose((p) => ({ ...p, d: dVal }))}
          />
        </Controls>
      ) : null}

      {kind === "hypotrochoid" ? (
        <Controls>
          <Slider
            label="Fixed radius R"
            value={hypotrochoid.R}
            min={HYPOTROCHOID_LIMITS.R.min}
            max={HYPOTROCHOID_LIMITS.R.max}
            step={HYPOTROCHOID_LIMITS.R.step}
            format={(v) => v.toFixed(0)}
            onChange={(R) => setHypotrochoid((p) => ({ ...p, R }))}
          />
          <Slider
            label="Rolling radius r"
            value={hypotrochoid.r}
            min={HYPOTROCHOID_LIMITS.r.min}
            max={HYPOTROCHOID_LIMITS.r.max}
            step={HYPOTROCHOID_LIMITS.r.step}
            format={(v) => v.toFixed(0)}
            onChange={(r) => setHypotrochoid((p) => ({ ...p, r }))}
          />
          <Slider
            label="Pen offset d"
            value={hypotrochoid.d}
            min={HYPOTROCHOID_LIMITS.d.min}
            max={HYPOTROCHOID_LIMITS.d.max}
            step={HYPOTROCHOID_LIMITS.d.step}
            onChange={(dVal) => setHypotrochoid((p) => ({ ...p, d: dVal }))}
          />
        </Controls>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5">
        {kind === "lissajous"
          ? LISSAJOUS_PRESETS.map(({ label, p }) => (
              <LabButton key={label} pressed={sameLissajous(lissajous, p)} onClick={() => setLissajous(p)}>
                {label}
              </LabButton>
            ))
          : null}
        {kind === "rose"
          ? ROSE_PRESETS.map(({ label, p }) => (
              <LabButton key={label} pressed={sameRose(rose, p)} onClick={() => setRose(p)}>
                {label}
              </LabButton>
            ))
          : null}
        {kind === "hypotrochoid"
          ? HYPOTROCHOID_PRESETS.map(({ label, p }) => (
              <LabButton key={label} pressed={sameHypotrochoid(hypotrochoid, p)} onClick={() => setHypotrochoid(p)}>
                {label}
              </LabButton>
            ))
          : null}
      </div>

      <ButtonRow>
        <LabButton onClick={reveal.playing ? reveal.pause : reveal.play} pressed={reveal.playing}>
          {reveal.playing ? "Pause" : "Trace from the start"}
        </LabButton>
        <span className="text-rule-soft">|</span>
        <LabButton onClick={reset}>Reset to defaults</LabButton>
        <span className="text-rule-soft">|</span>
        <LabButton onClick={exportSvg}>Export SVG</LabButton>
      </ButtonRow>

      <Note>
        {kind === "lissajous"
          ? "Both frequencies are kept to whole numbers, which is exactly why this always closes: after one full turn (t = 2π), sin(a·t + δ) and sin(b·t) have each gone through a whole number of their own cycles and are back where they started. An irrational ratio, not offered here, would never close."
          : kind === "rose"
            ? "r = cos((n/d)·θ) is sampled over θ from 0 to 2π·d — enough for both the polar angle and the value of (n/d)·θ to return to their starting values together, since d and n are whole numbers. The petal count and symmetry are left to look at directly rather than stated as a formula here."
            : "R and r are kept to whole numbers so the curve is guaranteed to close exactly after a provable number of turns; d only sets how far the pen sits from the rolling circle's centre; it changes the loop's depth, never whether the curve closes."}
      </Note>
    </div>
  );
}
