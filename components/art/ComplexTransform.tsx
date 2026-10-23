"use client";

import { useMemo, useRef, useState } from "react";

import { Controls, LabButton, LabFrame, Note, Slider } from "@/components/laboratory/ui";
import {
  COMPLEX_DEFAULTS,
  COMPLEX_LIMITS,
  buildSourceGrid,
  complexMappings,
  mappingLabel,
  toSegments,
  transformLine,
  type ComplexMapping,
  type ComplexParams,
} from "@/lib/art/complex";

import { downloadSvg } from "./export";

const SIZE = 320;
const PAD = 22;

function frame(extent: number) {
  const scale = (SIZE - 2 * PAD) / (2 * extent);
  const sx = (re: number) => SIZE / 2 + re * scale;
  const sy = (im: number) => SIZE / 2 - im * scale;
  return { sx, sy };
}

function pathFrom(points: { re: number; im: number }[], sx: (n: number) => number, sy: (n: number) => number) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.re).toFixed(1)},${sy(p.im).toFixed(1)}`).join(" ");
}

function Axes({ extent, sx, sy }: { extent: number; sx: (n: number) => number; sy: (n: number) => number }) {
  return (
    <g stroke="var(--color-rule)" strokeWidth="1">
      <line x1={sx(-extent)} y1={sy(0)} x2={sx(extent)} y2={sy(0)} />
      <line x1={sx(0)} y1={sy(-extent)} x2={sx(0)} y2={sy(extent)} />
    </g>
  );
}

export function ComplexTransform() {
  const [p, setP] = useState<ComplexParams>({ ...COMPLEX_DEFAULTS });
  const svgRef = useRef<SVGSVGElement>(null);

  const sourceGrid = useMemo(() => buildSourceGrid(p.extent, p.density), [p.extent, p.density]);
  const transformedSegments = useMemo(
    () => sourceGrid.map((line) => toSegments(transformLine(line, p.mapping, p.viewLimit))),
    [sourceGrid, p.mapping, p.viewLimit],
  );
  const brokenCount = useMemo(
    () => transformedSegments.reduce((n, segs) => n + Math.max(0, segs.length - 1), 0),
    [transformedSegments],
  );

  const src = frame(p.extent);
  const dst = frame(p.viewLimit);

  const reset = () => setP({ ...COMPLEX_DEFAULTS });
  const exportSvg = () => {
    if (svgRef.current) downloadSvg(svgRef.current, `complex-transform-${p.mapping}.svg`);
  };

  return (
    <div>
      <LabFrame
        caption={
          <>
            Source grid on the left, {mappingLabel[p.mapping]} applied to it on the right. A gap in a
            curve marks a point the mapping sends to infinity or outside this view — never bridged,
            only broken.{" "}
            {brokenCount > 0
              ? `${brokenCount} break${brokenCount === 1 ? "" : "s"} shown at the current settings.`
              : "No breaks at the current settings."}
          </>
        }
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE * 2 + 24} ${SIZE}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Source grid of ${p.density} by ${p.density} lines over the square from ${-p.extent} to ${p.extent}, shown beside its image under ${mappingLabel[p.mapping]}.`}
        >
          <g>
            <Axes extent={p.extent} sx={src.sx} sy={src.sy} />
            {sourceGrid.map((line, i) => (
              <path
                key={i}
                d={pathFrom(line, src.sx, src.sy)}
                fill="none"
                stroke="var(--color-ink-soft)"
                strokeWidth="1"
              />
            ))}
            <text x={8} y={16} className="font-mono" fontSize="9" fill="var(--color-ink-muted)">
              z-plane
            </text>
          </g>
          <g transform={`translate(${SIZE + 24}, 0)`}>
            <Axes extent={p.viewLimit} sx={dst.sx} sy={dst.sy} />
            {transformedSegments.map((segments, i) =>
              segments.map((segment, j) => (
                <path
                  key={`${i}-${j}`}
                  d={pathFrom(segment, dst.sx, dst.sy)}
                  fill="none"
                  stroke="var(--color-klein)"
                  strokeWidth="1.3"
                />
              )),
            )}
            <text x={8} y={16} className="font-mono" fontSize="9" fill="var(--color-ink-muted)">
              w = f(z)
            </text>
          </g>
        </svg>
      </LabFrame>

      <Controls>
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-[0.6875rem] font-medium tracking-[0.06em] text-ink-soft">Mapping</span>
          </span>
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
            {complexMappings.map((m) => (
              <LabButton key={m} pressed={p.mapping === m} onClick={() => setP((q) => ({ ...q, mapping: m as ComplexMapping }))}>
                {mappingLabel[m]}
              </LabButton>
            ))}
          </div>
        </div>
        <Slider
          label="Grid density"
          value={p.density}
          min={COMPLEX_LIMITS.density.min}
          max={COMPLEX_LIMITS.density.max}
          step={COMPLEX_LIMITS.density.step}
          format={(v) => `${v}×${v}`}
          onChange={(density) => setP((q) => ({ ...q, density }))}
        />
        <Slider
          label="Source extent"
          value={p.extent}
          min={COMPLEX_LIMITS.extent.min}
          max={COMPLEX_LIMITS.extent.max}
          step={COMPLEX_LIMITS.extent.step}
          format={(v) => `±${v.toFixed(1)}`}
          onChange={(extent) => setP((q) => ({ ...q, extent }))}
        />
        <Slider
          label="View limit"
          value={p.viewLimit}
          min={COMPLEX_LIMITS.viewLimit.min}
          max={COMPLEX_LIMITS.viewLimit.max}
          step={COMPLEX_LIMITS.viewLimit.step}
          format={(v) => `±${v.toFixed(0)}`}
          onChange={(viewLimit) => setP((q) => ({ ...q, viewLimit }))}
        />
      </Controls>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LabButton onClick={reset}>Reset to defaults</LabButton>
        <span className="text-rule-soft">|</span>
        <LabButton onClick={exportSvg}>Export SVG</LabButton>
      </div>

      <Note>
        f(z) = z² and f(z) = z³ are finite everywhere, so every break on the right comes from the
        view limit — the mapping genuinely does send some of this grid outside the window shown.
        f(z) = 1/z is different: it is undefined at z = 0 itself, and grows without bound as z
        approaches it, so the lines through the origin break there regardless of the view limit.
      </Note>
    </div>
  );
}
