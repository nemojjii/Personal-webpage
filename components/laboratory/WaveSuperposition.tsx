"use client";

import { useMemo, useState } from "react";

import {
  type WaveParams,
  WAVE_DEFAULTS,
  WAVE_LENGTH,
  WAVE_LIMITS,
  interference,
  omega,
  reinforces,
  resultantAmplitude,
  sameWaveNumber,
  sampleWaves,
  wavelength,
} from "@/lib/laboratory/wave";

import { ButtonRow, Controls, LabButton, LabFrame, Legend, Note, Readout, Slider, Toggle } from "./ui";
import { useClock } from "./useClock";

const W = 640;
const H = 300;
const PAD = { l: 30, r: 12, t: 12, b: 26 };
/** The largest sum two full-amplitude waves can reach. */
const Y_MAX = WAVE_LIMITS.a.max * 2;

const COLOUR = {
  y1: "var(--color-ink-soft)",
  y2: "var(--color-accent-soft)",
  sum: "var(--color-accent)",
};

const PRESETS: { label: string; params: Partial<WaveParams> }[] = [
  { label: "In phase", params: { a1: 1, a2: 1, k1: 2, k2: 2, phase: 0 } },
  { label: "Opposite phase", params: { a1: 1, a2: 1, k1: 2, k2: 2, phase: Math.PI } },
  { label: "Different amplitudes", params: { a1: 1.2, a2: 0.5, k1: 2, k2: 2, phase: Math.PI / 2 } },
  { label: "Different wavelengths", params: { a1: 1, a2: 1, k1: 2, k2: 2.4, phase: 0 } },
];

const fmtPi = (v: number) => `${(v / Math.PI).toFixed(2)} π`;

export function WaveSuperposition() {
  const [p, setP] = useState<WaveParams>(WAVE_DEFAULTS);
  const [highlight, setHighlight] = useState(true);
  const clock = useClock({ autoplay: true });

  const sx = (x: number) => PAD.l + (x / WAVE_LENGTH) * (W - PAD.l - PAD.r);
  const sy = (y: number) => PAD.t + (H - PAD.t - PAD.b) / 2 - (y / Y_MAX) * ((H - PAD.t - PAD.b) / 2);
  const mid = sy(0);

  const points = useMemo(() => sampleWaves(p, clock.t), [p, clock.t]);

  const paths = useMemo(() => {
    const line = (key: "y1" | "y2" | "y") =>
      points.map((pt, i) => `${i ? "L" : "M"}${sx(pt.x).toFixed(1)},${sy(pt[key]).toFixed(1)}`).join(" ");
    // Runs of consecutive samples where the two displacements agree or disagree in sign.
    const runs: { reinforce: boolean; d: string }[] = [];
    let i = 0;
    while (i < points.length) {
      const reinforce = reinforces(points[i]);
      let j = i;
      while (j + 1 < points.length && reinforces(points[j + 1]) === reinforce) j++;
      if (j > i) {
        const seg = points.slice(i, j + 1);
        const top = seg.map((pt) => `L${sx(pt.x).toFixed(1)},${sy(pt.y).toFixed(1)}`).join(" ");
        runs.push({
          reinforce,
          d: `M${sx(seg[0].x).toFixed(1)},${mid.toFixed(1)} ${top} L${sx(seg[seg.length - 1].x).toFixed(1)},${mid.toFixed(1)} Z`,
        });
      }
      i = j + 1;
    }
    return { y1: line("y1"), y2: line("y2"), sum: line("y"), runs };
    // sx/sy are pure functions of constants; `mid` likewise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const set = (patch: Partial<WaveParams>) => setP((prev) => ({ ...prev, ...patch }));
  const amplitude = resultantAmplitude(p);
  const kind = interference(p);
  const equal = sameWaveNumber(p);

  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">Two waves, one string.</span> Both travel at speed{" "}
          <span className="font-mono text-[0.75rem]">v</span>, so each angular frequency is{" "}
          <span className="font-mono text-[0.75rem]">ω = v·k</span>. Shading marks where the two
          displacements pull the same way (wine) and opposite ways (grey) at this instant.
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Two sine waves and their sum at t = ${clock.t.toFixed(1)} seconds. ${
          equal
            ? `Equal wavelengths: the sum has amplitude ${amplitude?.toFixed(2)} (${kind} interference).`
            : "Different wavelengths: the sum beats and has no single amplitude."
        }`}
      >
        {highlight
          ? paths.runs.map((r, i) => (
              <path
                key={i}
                d={r.d}
                fill={r.reinforce ? "var(--color-accent)" : "var(--color-ink)"}
                opacity={r.reinforce ? 0.12 : 0.07}
              />
            ))
          : null}
        <line x1={PAD.l} y1={mid} x2={W - PAD.r} y2={mid} stroke="var(--color-rule)" strokeWidth="0.8" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-rule)" strokeWidth="0.8" />
        {[Y_MAX, Y_MAX / 2, -Y_MAX / 2, -Y_MAX].map((v) => (
          <g key={v}>
            <line x1={PAD.l - 3} y1={sy(v)} x2={PAD.l} y2={sy(v)} stroke="var(--color-rule)" strokeWidth="0.8" />
            <text x={PAD.l - 6} y={sy(v) + 2.5} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
              {v > 0 ? `+${v}` : v}
            </text>
          </g>
        ))}
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
          x
        </text>
        <path d={paths.y1} fill="none" stroke={COLOUR.y1} strokeWidth="1" opacity="0.9" />
        <path d={paths.y2} fill="none" stroke={COLOUR.y2} strokeWidth="1" opacity="0.9" />
        <path d={paths.sum} fill="none" stroke={COLOUR.sum} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Legend
          items={[
            { label: "y₁", color: COLOUR.y1 },
            { label: "y₂", color: COLOUR.y2 },
            { label: "y₁ + y₂", color: COLOUR.sum, width: 2 },
          ]}
        />
        <Toggle label="Highlight reinforcement and opposition" checked={highlight} onChange={setHighlight} />
      </div>

      <Controls>
        <Slider label="Amplitude A₁" value={p.a1} {...WAVE_LIMITS.a} onChange={(a1) => set({ a1 })} />
        <Slider label="Amplitude A₂" value={p.a2} {...WAVE_LIMITS.a} onChange={(a2) => set({ a2 })} />
        <Slider label="Phase Δφ" value={p.phase} {...WAVE_LIMITS.phase} onChange={(phase) => set({ phase })} format={fmtPi} />
        <Slider label="Wave number k₁" value={p.k1} {...WAVE_LIMITS.k} onChange={(k1) => set({ k1 })} unit="rad/unit" />
        <Slider label="Wave number k₂" value={p.k2} {...WAVE_LIMITS.k} onChange={(k2) => set({ k2 })} unit="rad/unit" />
        <Slider label="Speed v" value={p.v} {...WAVE_LIMITS.v} onChange={(v) => set({ v })} unit="units/s" />
      </Controls>

      <ButtonRow>
        <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
          {clock.playing ? "Pause" : "Play"}
        </LabButton>
        <LabButton onClick={clock.reset}>Reset time</LabButton>
        <span aria-hidden="true" className="h-3.5 w-px bg-rule" />
        {PRESETS.map((preset) => (
          <LabButton key={preset.label} onClick={() => set(preset.params)}>
            {preset.label}
          </LabButton>
        ))}
      </ButtonRow>

      <Readout
        items={[
          { term: "t", value: `${clock.t.toFixed(2)} s` },
          { term: "λ₁, λ₂", value: `${wavelength(p.k1).toFixed(2)}, ${wavelength(p.k2).toFixed(2)}` },
          { term: "ω₁, ω₂", value: `${omega(p.k1, p.v).toFixed(2)}, ${omega(p.k2, p.v).toFixed(2)} rad/s` },
          {
            term: "Resultant amplitude",
            value: equal && amplitude !== undefined ? `${amplitude.toFixed(2)} · ${kind}` : "no single value",
          },
        ]}
      />
      <Note>
        {equal
          ? kind === "constructive"
            ? "Equal wavelengths, in phase: the crests coincide and the amplitudes add, A = A₁ + A₂."
            : kind === "destructive"
              ? "Equal wavelengths, opposite phase: crest meets trough and the amplitudes subtract, A = |A₁ − A₂|."
              : "Equal wavelengths, partly out of phase: the sum is one sine wave whose amplitude lies between |A₁ − A₂| and A₁ + A₂."
          : "Different wavelengths, and therefore different frequencies: the sum is not a sine wave. It beats, and the pattern of reinforcement itself moves along the string."}
      </Note>
    </LabFrame>
  );
}
