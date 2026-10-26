"use client";

import { useMemo, useState } from "react";

import {
  BARRIER_DEFAULTS,
  BARRIER_LIMITS,
  SUPERPOSITION_DEFAULTS,
  WELL_DEFAULTS,
  WELL_LIMITS,
  beatAngularFrequencies,
  energy,
  histogram,
  normalizationIntegral,
  reflection,
  sampleBarrierWave,
  sampleEigenfunction,
  sampleMeasurements,
  sampleSuperposition,
  scatteringRegime,
  transmission,
  type SuperpositionState,
  type SuperpositionTerm,
  type WellParams,
} from "@/lib/laboratory/quantum";

import { ButtonRow, Controls, LabButton, LabFrame, Legend, Note, Readout, Slider } from "./ui";
import { useClock } from "./useClock";

type Mode = "box" | "superposition" | "tunneling" | "measurement";

const MODES: { id: Mode; label: string }[] = [
  { id: "box", label: "A · Particle in a Box" },
  { id: "superposition", label: "B · Superposition" },
  { id: "tunneling", label: "C · Tunneling" },
  { id: "measurement", label: "D · Measurement" },
];

/* Shared plot geometry — every mode's SVGs use the same canvas size and
   left/right/top/bottom padding, so switching modes doesn't jolt the eye. */
const PW = 640;
const PH = 230;
const PAD = { l: 38, r: 16, t: 14, b: 30 };
const plotW = PW - PAD.l - PAD.r;
const plotH = PH - PAD.t - PAD.b;

const INK_SOFT = "var(--color-ink-soft)";
const ACCENT = "var(--color-accent)";
const RULE = "var(--color-rule)";
const MUTED = "var(--color-ink-muted)";

function AxisFrame({
  xTicks,
  yTicks,
  xLabel,
  yLabel,
}: {
  xTicks: { at: number; label: string }[];
  yTicks: { at: number; label: string }[];
  xLabel: string;
  yLabel: string;
}) {
  return (
    <>
      <line x1={PAD.l} y1={PH - PAD.b} x2={PW - PAD.r} y2={PH - PAD.b} stroke={RULE} strokeWidth="0.8" />
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PH - PAD.b} stroke={RULE} strokeWidth="0.8" />
      {xTicks.map((tick) => (
        <g key={tick.label}>
          <line x1={tick.at} y1={PH - PAD.b} x2={tick.at} y2={PH - PAD.b + 3} stroke={RULE} strokeWidth="0.8" />
          <text x={tick.at} y={PH - PAD.b + 12} textAnchor="middle" fontSize="7" className="font-mono" fill={MUTED}>
            {tick.label}
          </text>
        </g>
      ))}
      {yTicks.map((tick) => (
        <g key={tick.label}>
          <line x1={PAD.l - 3} y1={tick.at} x2={PAD.l} y2={tick.at} stroke={RULE} strokeWidth="0.8" />
          <text x={PAD.l - 6} y={tick.at + 2.5} textAnchor="end" fontSize="7" className="font-mono" fill={MUTED}>
            {tick.label}
          </text>
        </g>
      ))}
      <text x={PW - PAD.r} y={PH - 4} textAnchor="end" fontSize="7" className="font-mono" fill={MUTED}>
        {xLabel}
      </text>
      <text x={PAD.l + 4} y={PAD.t + 8} textAnchor="start" fontSize="7" className="font-mono" fill={MUTED}>
        {yLabel}
      </text>
    </>
  );
}

function pathFrom(points: { sx: number; sy: number }[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
}

/* ──────────────────────────────── A. Particle in a box ─────────────────── */

function BoxMode({ well, n, setWell, setN }: { well: WellParams; n: number; setWell: (w: WellParams) => void; setN: (n: number) => void }) {
  const maxN = WELL_LIMITS.n.max;
  const levels = useMemo(() => Array.from({ length: maxN }, (_, i) => energy(i + 1, well.L, well.m)), [well.L, well.m, maxN]);
  const eMax = levels[levels.length - 1] * 1.08;
  const syE = (e: number) => PAD.t + (1 - e / eMax) * plotH;

  const samples = useMemo(() => sampleEigenfunction(n, well.L, 240), [n, well.L]);
  const maxPsi = Math.sqrt(2 / well.L);
  const maxDensity = 2 / well.L;
  const sxX = (x: number) => PAD.l + (x / well.L) * plotW;
  const syPsi = (psi: number) => PAD.t + (1 - (psi + maxPsi) / (2 * maxPsi)) * plotH;
  const syDensity = (d: number) => PAD.t + (1 - d / (maxDensity * 1.08)) * plotH;

  const normCheck = useMemo(() => normalizationIntegral(n, well.L), [n, well.L]);
  const E_n = energy(n, well.L, well.m);

  return (
    <>
      <p className="label mb-2 !text-ink-muted">Potential and energy levels</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Infinite square well of width ${well.L.toFixed(2)}, with energy levels for quantum numbers 1 through ${maxN}. The selected state, n = ${n}, has energy ${E_n.toFixed(2)}.`}
      >
        <AxisFrame
          xTicks={[{ at: PAD.l, label: "0" }, { at: PAD.l + plotW, label: "L" }]}
          yTicks={[{ at: syE(0), label: "0" }, { at: syE(eMax / 1.08), label: eMax.toFixed(1) }]}
          xLabel="x"
          yLabel="E"
        />
        {/* The well walls: infinite outside [0, L], drawn running off the top of the frame. */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PH - PAD.b} stroke={INK_SOFT} strokeWidth="1.2" />
        <line x1={PAD.l + plotW} y1={PAD.t} x2={PAD.l + plotW} y2={PH - PAD.b} stroke={INK_SOFT} strokeWidth="1.2" />
        <line x1={PAD.l} y1={PH - PAD.b} x2={PAD.l + plotW} y2={PH - PAD.b} stroke={INK_SOFT} strokeWidth="1.2" />
        {levels.map((e, i) => (
          <g key={i}>
            <line
              x1={PAD.l}
              y1={syE(e)}
              x2={PAD.l + plotW}
              y2={syE(e)}
              stroke={i + 1 === n ? ACCENT : RULE}
              strokeWidth={i + 1 === n ? 1.6 : 0.8}
              strokeDasharray={i + 1 === n ? undefined : "2 2"}
            />
            <text x={PAD.l + plotW + 2} y={syE(e) + 2.5} fontSize="6.5" className="font-mono" fill={i + 1 === n ? ACCENT : MUTED}>
              {i + 1}
            </text>
          </g>
        ))}
      </svg>

      <p className="label mt-6 mb-2 !text-ink-muted">Wavefunction ψₙ(x) and probability density |ψₙ(x)|²</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Wavefunction and probability density for n = ${n}, well width ${well.L.toFixed(2)}. The wavefunction changes sign ${n - 1} time${n - 1 === 1 ? "" : "s"} inside the well; the probability density never goes negative.`}
      >
        <AxisFrame
          xTicks={[{ at: PAD.l, label: "0" }, { at: PAD.l + plotW, label: "L" }]}
          yTicks={[{ at: syPsi(maxPsi), label: maxPsi.toFixed(2) }, { at: syPsi(0), label: "0" }, { at: syPsi(-maxPsi), label: `−${maxPsi.toFixed(2)}` }]}
          xLabel="x"
          yLabel="ψₙ, |ψₙ|²"
        />
        <line x1={PAD.l} y1={syPsi(0)} x2={PAD.l + plotW} y2={syPsi(0)} stroke={RULE} strokeWidth="0.6" />
        <path
          d={pathFrom(samples.map((s) => ({ sx: sxX(s.x), sy: syDensity(s.density) })))}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d={pathFrom(samples.map((s) => ({ sx: sxX(s.x), sy: syPsi(s.psi) })))}
          fill="none"
          stroke={INK_SOFT}
          strokeWidth="1.2"
          strokeDasharray="4 2"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-3">
        <Legend
          items={[
            { label: "ψₙ(x) — signed amplitude", color: INK_SOFT, dashed: true },
            { label: "|ψₙ(x)|² — probability density, never negative", color: ACCENT, width: 2 },
          ]}
        />
      </div>

      <Controls>
        <Slider label="Quantum number n" value={n} {...WELL_LIMITS.n} onChange={setN} />
        <Slider label="Well width L" value={well.L} {...WELL_LIMITS.L} onChange={(L) => setWell({ ...well, L })} />
        <Slider label="Particle mass m" value={well.m} {...WELL_LIMITS.m} onChange={(m) => setWell({ ...well, m })} />
      </Controls>

      <Readout
        items={[
          { term: "Energy Eₙ", value: E_n.toFixed(3) },
          { term: "Eₙ / E₁", value: (E_n / energy(1, well.L, well.m)).toFixed(2) },
          { term: "Nodes inside (0, L)", value: String(n - 1) },
          { term: "∫|ψₙ|² dx (numeric)", value: normCheck.toFixed(6) },
        ]}
      />
      <Note>
        Energy scales as n² — doubling n quadruples Eₙ, visible above as levels spreading apart, not staying evenly
        spaced. It also scales as 1/L² and 1/m: a wider well or a heavier particle both lower every level, a
        narrower one raises them. The last readout integrates |ψₙ|² numerically, as a check — it should read 1 to
        several decimal places for any n and L, since ψₙ is normalized analytically, not approximately.
      </Note>
    </>
  );
}

/* ──────────────────────── B. Superposition & time evolution ────────────── */

const SUPER_COLORS = ["var(--color-accent)", "var(--color-klein-preview, var(--color-accent-soft))", "var(--color-chart-extra)"];

function SuperpositionMode({ well, state, setState }: { well: WellParams; state: SuperpositionState; setState: (s: SuperpositionState) => void }) {
  const beatFreqs = useMemo(() => beatAngularFrequencies(state, well), [state, well]);
  const beatPeriod = beatFreqs.length ? (2 * Math.PI) / Math.min(...beatFreqs) : undefined;
  const tSpan = beatPeriod ?? 4;
  const clock = useClock({ autoplay: true, rate: tSpan / 9, max: tSpan, loop: true });
  const t = Math.min(clock.t, tSpan);

  const samples = useMemo(() => sampleSuperposition(state, well, t, 220), [state, well, t]);
  const maxAmp = Math.sqrt(2 / well.L); // an individual term's own bound; the sum of a few such terms is used below
  const activeCount = Math.max(1, state.terms.filter((term) => term.amplitude > 0).length);
  const envelope = maxAmp; // |c_n| ≤ 1 after normalization, so no single term's contribution exceeds ψ's own peak
  const yBound = envelope * Math.min(2, Math.sqrt(activeCount));
  const sxX = (x: number) => PAD.l + (x / well.L) * plotW;
  const syAmp = (v: number) => PAD.t + (1 - (v + yBound) / (2 * yBound)) * plotH;
  const syDensity = (d: number) => PAD.t + (1 - d / (yBound * yBound * 1.1)) * plotH;

  const setTerm = (i: number, patch: Partial<SuperpositionTerm>) => {
    const terms = state.terms.map((term, idx) => (idx === i ? { ...term, ...patch } : term));
    setState({ terms });
  };

  return (
    <>
      <p className="label mb-2 !text-ink-muted">Re Ψ(x, t) and Im Ψ(x, t)</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Real and imaginary parts of the superposition at t = ${t.toFixed(2)}.`}
      >
        <AxisFrame
          xTicks={[{ at: PAD.l, label: "0" }, { at: PAD.l + plotW, label: "L" }]}
          yTicks={[{ at: syAmp(yBound), label: yBound.toFixed(2) }, { at: syAmp(0), label: "0" }, { at: syAmp(-yBound), label: `−${yBound.toFixed(2)}` }]}
          xLabel="x"
          yLabel="Re Ψ, Im Ψ"
        />
        <line x1={PAD.l} y1={syAmp(0)} x2={PAD.l + plotW} y2={syAmp(0)} stroke={RULE} strokeWidth="0.6" />
        <path d={pathFrom(samples.map((s) => ({ sx: sxX(s.x), sy: syAmp(s.re) })))} fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={pathFrom(samples.map((s) => ({ sx: sxX(s.x), sy: syAmp(s.im) })))} fill="none" stroke={INK_SOFT} strokeWidth="1.2" strokeDasharray="4 2" strokeLinejoin="round" />
      </svg>
      <div className="mt-3">
        <Legend items={[{ label: "Re Ψ(x,t)", color: ACCENT, width: 2 }, { label: "Im Ψ(x,t)", color: INK_SOFT, dashed: true }]} />
      </div>

      <p className="label mt-6 mb-2 !text-ink-muted">Probability density |Ψ(x, t)|²</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Probability density at t = ${t.toFixed(2)}, ${state.terms.filter((s) => s.amplitude > 0).length > 1 ? "visibly changing over time since more than one energy is present" : "unchanging in time, since only one energy is present"}.`}
      >
        <AxisFrame
          xTicks={[{ at: PAD.l, label: "0" }, { at: PAD.l + plotW, label: "L" }]}
          yTicks={[{ at: syDensity(0), label: "0" }, { at: syDensity(yBound * yBound * 1.1), label: (yBound * yBound * 1.1).toFixed(2) }]}
          xLabel="x"
          yLabel="|Ψ|²"
        />
        <path
          d={`${pathFrom(samples.map((s) => ({ sx: sxX(s.x), sy: syDensity(s.density) })))} L${sxX(well.L).toFixed(1)},${syDensity(0).toFixed(1)} L${sxX(0).toFixed(1)},${syDensity(0).toFixed(1)} Z`}
          fill={ACCENT}
          fillOpacity="0.18"
          stroke={ACCENT}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>

      <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-3">
        {state.terms.map((term, i) => (
          <div key={i} className="grid gap-y-3 border-b border-rule-soft pb-5 last:border-b-0 sm:border-b-0">
            <p className="label !text-ink-muted" style={{ color: SUPER_COLORS[i] }}>
              Term {i + 1}
            </p>
            <Slider label="Quantum number n" value={term.n} {...WELL_LIMITS.n} onChange={(n) => setTerm(i, { n })} />
            <Slider
              label="Amplitude (relative)"
              value={term.amplitude}
              min={0}
              max={1}
              step={0.05}
              onChange={(amplitude) => setTerm(i, { amplitude })}
            />
            <Slider
              label="Phase φ"
              value={term.phase}
              min={-Math.PI}
              max={Math.PI}
              step={Math.PI / 12}
              format={(v) => (Math.abs(v) < 1e-9 ? "0" : `${(v / Math.PI).toFixed(2)} π`)}
              onChange={(phase) => setTerm(i, { phase })}
            />
          </div>
        ))}
      </div>

      <ButtonRow>
        <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
          {clock.playing ? "Pause" : "Play"}
        </LabButton>
        <LabButton onClick={clock.reset}>Reset time</LabButton>
      </ButtonRow>

      <Readout
        items={[
          { term: "Active terms", value: String(state.terms.filter((s) => s.amplitude > 0).length) },
          { term: "Σ|cₙ|² (after renormalizing)", value: "1 (exact)" },
          { term: "Beat period 2π/ΔE", value: beatPeriod ? `${beatPeriod.toFixed(2)}` : "— (stationary)" },
          { term: "t", value: t.toFixed(2) },
        ]}
      />
      <Note>
        With one active term the density above sits still: Ψ(x,t) = ψₙ(x)·e^(−iEₙt), and |e^(−iθ)| = 1 for any
        real θ, so |Ψ|² = ψₙ(x)² regardless of t — a <em>stationary</em> state, in the literal sense. With
        two or more terms of different energy, the cross terms between them oscillate at their energy difference,
        and the density genuinely redistributes in time, repeating every beat period shown above. Each term&apos;s
        amplitude is renormalized automatically, so Σ|cₙ|² = 1 and ∫|Ψ|² dx = 1 at every instant — only the
        <em> relative</em> sizes entered above matter.
      </Note>
    </>
  );
}

/* ─────────────────────────────── C. Quantum tunneling ───────────────────── */

function TunnelingMode({ barrier, mass, setBarrier }: { barrier: { E: number; V0: number; a: number }; mass: number; setBarrier: (b: { E: number; V0: number; a: number }) => void }) {
  const regime = scatteringRegime(barrier.E, barrier.V0);
  const T = transmission(barrier.E, barrier.V0, barrier.a, mass);
  const R = reflection(barrier.E, barrier.V0, barrier.a, mass);

  const xMin = -1.5;
  const xMax = barrier.a + 1.5;
  const samples = useMemo(
    () => sampleBarrierWave({ ...barrier, m: mass }, xMin, xMax, 320),
    [barrier, mass, xMin, xMax],
  );
  const vMax = Math.max(barrier.V0, barrier.E) * 1.15 || 1;
  const sxX = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * plotW;
  const syV = (v: number) => PAD.t + (1 - v / vMax) * plotH;

  const densities = samples.map((s) => s.density);
  const dMax = Math.max(1, ...densities) * 1.1;
  const syD = (d: number) => PAD.t + (1 - d / dMax) * plotH;

  const regimeLabel =
    regime === "tunneling" ? "Tunneling (E < V₀)" : regime === "over-barrier" ? "Over the barrier (E > V₀)" : "At the barrier top (E = V₀)";

  return (
    <>
      <p className="label mb-2 !text-ink-muted">Potential V(x) and incident energy E</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`A rectangular barrier of height ${barrier.V0.toFixed(2)} and width ${barrier.a.toFixed(2)}, with incident energy ${barrier.E.toFixed(2)} — ${regimeLabel}.`}
      >
        <AxisFrame
          xTicks={[{ at: sxX(0), label: "0" }, { at: sxX(barrier.a), label: "a" }]}
          yTicks={[{ at: syV(0), label: "0" }, { at: syV(barrier.V0), label: barrier.V0.toFixed(2) }]}
          xLabel="x"
          yLabel="V, E"
        />
        <path
          d={`M${sxX(xMin).toFixed(1)},${syV(0).toFixed(1)} L${sxX(0).toFixed(1)},${syV(0).toFixed(1)} L${sxX(0).toFixed(1)},${syV(barrier.V0).toFixed(1)} L${sxX(barrier.a).toFixed(1)},${syV(barrier.V0).toFixed(1)} L${sxX(barrier.a).toFixed(1)},${syV(0).toFixed(1)} L${sxX(xMax).toFixed(1)},${syV(0).toFixed(1)}`}
          fill="none"
          stroke={INK_SOFT}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <line x1={sxX(xMin)} y1={syV(barrier.E)} x2={sxX(xMax)} y2={syV(barrier.E)} stroke={ACCENT} strokeWidth="1.4" strokeDasharray="4 2" />
        <text x={sxX(xMax) - 2} y={syV(barrier.E) - 4} textAnchor="end" fontSize="7" className="font-mono" fill={ACCENT}>
          E
        </text>
      </svg>

      <p className="label mt-6 mb-2 !text-ink-muted">Probability density |ψ(x)|²</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Scattering probability density across the barrier. Transmission probability ${T.toFixed(4)}, reflection probability ${R.toFixed(4)}.`}
      >
        <AxisFrame
          xTicks={[{ at: sxX(0), label: "0" }, { at: sxX(barrier.a), label: "a" }]}
          yTicks={[{ at: syD(0), label: "0" }, { at: syD(dMax / 1.1), label: (dMax / 1.1).toFixed(1) }]}
          xLabel="x"
          yLabel="|ψ|²"
        />
        <rect x={sxX(0)} y={PAD.t} width={sxX(barrier.a) - sxX(0)} height={plotH} fill={RULE} opacity="0.3" />
        <path d={pathFrom(samples.map((s) => ({ sx: sxX(s.x), sy: syD(s.density) })))} fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <p className="mt-2 font-sans text-[0.75rem] leading-relaxed text-ink-muted">
        The shaded band is the barrier, [0, a]. Left of it, the incoming and reflected waves interfere, which is
        why the density there ripples rather than sitting flat; right of it, only the transmitted wave remains.
      </p>

      <Controls>
        <Slider label="Incident energy E" value={barrier.E} {...BARRIER_LIMITS.E} onChange={(E) => setBarrier({ ...barrier, E })} />
        <Slider label="Barrier height V₀" value={barrier.V0} {...BARRIER_LIMITS.V0} onChange={(V0) => setBarrier({ ...barrier, V0 })} />
        <Slider label="Barrier width a" value={barrier.a} {...BARRIER_LIMITS.a} onChange={(a) => setBarrier({ ...barrier, a })} />
      </Controls>

      <Readout
        items={[
          { term: "Regime", value: regimeLabel },
          { term: "Transmission T", value: T.toFixed(4) },
          { term: "Reflection R", value: R.toFixed(4) },
          { term: "T + R", value: (T + R).toFixed(6) },
        ]}
      />
      <Note>
        T and R are probabilities, computed exactly from the matched boundary conditions — not a height read off
        the wavefunction plot above, which is an amplitude, not a probability. Past the barrier top (E {">"} V₀)
        the particle is classically free to cross, yet T is still below 1: part of the wave reflects even there,
        which a classical particle rolling over a hill never would. Exactly at E = V₀ the two formulas either side
        of it would each divide by zero; the value shown there is their shared limit, not an extrapolation.
      </Note>
    </>
  );
}

/* ───────────────────────────── D. Measurement & probability ─────────────── */

function MeasurementMode({ well, n, setWell, setN }: { well: WellParams; n: number; setWell: (w: WellParams) => void; setN: (n: number) => void }) {
  const [seed, setSeed] = useState(1);
  const [count, setCount] = useState(0);

  const samples = useMemo(() => sampleMeasurements(n, well.L, seed, count), [n, well.L, seed, count]);
  const bins = useMemo(() => histogram(samples, well.L, 20), [samples, well.L]);
  const theoretical = useMemo(() => sampleEigenfunction(n, well.L, 220), [n, well.L]);

  const maxDensity = Math.max(2 / well.L, ...bins.map((b) => b.density)) * 1.15;
  const sxX = (x: number) => PAD.l + (x / well.L) * plotW;
  const syD = (d: number) => PAD.t + (1 - d / maxDensity) * plotH;

  return (
    <>
      <p className="label mb-2 !text-ink-muted">Sampled measurement positions vs. the theoretical density</p>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${count} simulated position measurements of state n = ${n}, binned into a histogram, against the theoretical probability density.`}
      >
        <AxisFrame
          xTicks={[{ at: PAD.l, label: "0" }, { at: PAD.l + plotW, label: "L" }]}
          yTicks={[{ at: syD(0), label: "0" }, { at: syD(maxDensity / 1.15), label: (maxDensity / 1.15).toFixed(2) }]}
          xLabel="x"
          yLabel="density"
        />
        {bins.map((bin) => (
          <rect
            key={bin.x0}
            x={sxX(bin.x0) + 0.5}
            y={syD(bin.density)}
            width={Math.max(0, sxX(bin.x1) - sxX(bin.x0) - 1)}
            height={Math.max(0, syD(0) - syD(bin.density))}
            fill={ACCENT}
            fillOpacity="0.35"
          />
        ))}
        <path
          d={pathFrom(theoretical.map((s) => ({ sx: sxX(s.x), sy: syD(s.density) })))}
          fill="none"
          stroke={INK_SOFT}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Individual observations, as short ticks along the axis. */}
        {samples.map((x, i) => (
          <line key={i} x1={sxX(x)} y1={syD(0)} x2={sxX(x)} y2={syD(0) - 5} stroke={ACCENT} strokeWidth="0.8" opacity="0.6" />
        ))}
      </svg>
      <div className="mt-3">
        <Legend items={[{ label: "theoretical |ψₙ(x)|²", color: INK_SOFT, width: 2 }, { label: "sampled histogram", color: ACCENT }]} />
      </div>

      <Controls>
        <Slider label="Quantum number n" value={n} {...WELL_LIMITS.n} onChange={setN} />
        <Slider label="Well width L" value={well.L} {...WELL_LIMITS.L} onChange={(L) => setWell({ ...well, L })} />
        <Slider label="Seed" value={seed} min={1} max={999} step={1} format={(v) => String(Math.round(v))} onChange={(v) => setSeed(Math.round(v))} />
      </Controls>

      <ButtonRow>
        <LabButton onClick={() => setCount((c) => c + 1)}>Measure once</LabButton>
        <LabButton onClick={() => setCount((c) => c + 100)}>Measure 100</LabButton>
        <LabButton onClick={() => setCount(0)}>Reset</LabButton>
      </ButtonRow>

      <Readout
        items={[
          { term: "Measurements", value: String(count) },
          { term: "Seed", value: String(seed) },
          { term: "Same seed, same run", value: "reproducible" },
        ]}
      />
      <Note>
        Each run samples positions from |ψₙ(x)|² itself — the probability density a measurement is already known to
        follow, not a classical particle bouncing around inside the well and being caught at intervals. With the
        same seed and the same number of measurements, the exact same positions come back every time; a different
        seed gives a different sequence, but one that still thickens toward the same curve as the count grows.
      </Note>
    </>
  );
}

/* ──────────────────────────────────── root ──────────────────────────────── */

export function QuantumExplorer() {
  const [mode, setMode] = useState<Mode>("box");
  const [well, setWell] = useState<WellParams>({ ...WELL_DEFAULTS });
  const [n, setN] = useState(1);
  const [superposition, setSuperposition] = useState<SuperpositionState>({
    terms: SUPERPOSITION_DEFAULTS.terms.map((t) => ({ ...t })),
  });
  const [barrier, setBarrier] = useState<{ E: number; V0: number; a: number }>({
    E: BARRIER_DEFAULTS.E,
    V0: BARRIER_DEFAULTS.V0,
    a: BARRIER_DEFAULTS.a,
  });

  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">
            One quantum particle, confined to a one-dimensional box — four ways of putting the same model to the
            test.
          </span>{" "}
          Natural units throughout (ħ = 1): mass, length and energy are dimensionless sliders here, not measured
          quantities. Switching modes keeps the well width and mass you have set.
        </>
      }
    >
      <ButtonRow>
        {MODES.map((m) => (
          <LabButton key={m.id} onClick={() => setMode(m.id)} pressed={mode === m.id}>
            {m.label}
          </LabButton>
        ))}
      </ButtonRow>
      <div className="mt-6">
        {mode === "box" ? (
          <BoxMode well={well} n={n} setWell={setWell} setN={setN} />
        ) : mode === "superposition" ? (
          <SuperpositionMode well={well} state={superposition} setState={setSuperposition} />
        ) : mode === "tunneling" ? (
          <TunnelingMode barrier={barrier} mass={well.m} setBarrier={setBarrier} />
        ) : (
          <MeasurementMode well={well} n={n} setWell={setWell} setN={setN} />
        )}
      </div>
    </LabFrame>
  );
}
