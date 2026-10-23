"use client";

import { useMemo, useState } from "react";

import {
  type FourierParams,
  FOURIER_DEFAULTS,
  FOURIER_LIMITS,
  FOURIER_MAX_N,
  cloneParams,
  harmonicFrequency,
  maxActiveAmplitude,
  period,
  pureSineParams,
  sampleTimeDomain,
  sawtoothWaveParams,
  spectrum,
  squareWaveParams,
  synthesize,
} from "@/lib/laboratory/fourier";

import { ButtonRow, Controls, Disclosure, LabButton, LabFrame, Legend, Note, Readout, Slider, Toggle } from "./ui";
import { useClock } from "./useClock";

const TW = 640;
const TH = 280;
const T_PAD = { l: 36, r: 14, t: 14, b: 28 };

const FW = 640;
const FH = 200;
const F_PAD = { l: 36, r: 14, t: 14, b: 32 };

const PERIODS_SHOWN = 2;

const fmtPi = (v: number) => (Math.abs(v) < 1e-9 ? "0" : `${(v / Math.PI).toFixed(2)} π`);

type PresetName = "Pure sine" | "Square wave" | "Sawtooth wave";

function paramsEqual(a: FourierParams, b: FourierParams): boolean {
  if (a.n !== b.n || Math.abs(a.f0 - b.f0) > 1e-9) return false;
  for (let i = 0; i < a.n; i++) {
    if (Math.abs(a.amplitudes[i] - b.amplitudes[i]) > 1e-6) return false;
    if (Math.abs(a.phases[i] - b.phases[i]) > 1e-6) return false;
  }
  return true;
}

export function FourierExplorer() {
  const [p, setP] = useState<FourierParams>(() => cloneParams(FOURIER_DEFAULTS));
  const [showComponents, setShowComponents] = useState(true);

  const tSpan = (period(p.f0) ?? 1) * PERIODS_SHOWN;
  const clock = useClock({ autoplay: true, rate: tSpan / 10, max: tSpan, loop: true });

  const set = (patch: Partial<FourierParams>) => setP((prev) => ({ ...cloneParams(prev), ...patch }));
  const setAmplitude = (i: number, value: number) =>
    setP((prev) => {
      const next = cloneParams(prev);
      next.amplitudes[i] = value;
      return next;
    });
  const setPhase = (i: number, value: number) =>
    setP((prev) => {
      const next = cloneParams(prev);
      next.phases[i] = value;
      return next;
    });

  const applyPreset = (name: PresetName) => {
    const next =
      name === "Pure sine"
        ? pureSineParams(p.f0)
        : name === "Square wave"
          ? squareWaveParams(p.f0, FOURIER_MAX_N)
          : sawtoothWaveParams(p.f0, FOURIER_MAX_N);
    setP(next);
  };

  const activePreset: PresetName | "Custom" = useMemo(() => {
    if (paramsEqual(p, pureSineParams(p.f0))) return "Pure sine";
    if (paramsEqual(p, squareWaveParams(p.f0, FOURIER_MAX_N))) return "Square wave";
    if (paramsEqual(p, sawtoothWaveParams(p.f0, FOURIER_MAX_N))) return "Sawtooth wave";
    return "Custom";
  }, [p]);

  const samples = useMemo(() => sampleTimeDomain(p, PERIODS_SHOWN, 140), [p]);
  const lines = spectrum(p);

  const yMaxTime = Math.max(0.2, maxActiveSum(p));
  const sxT = (t: number) => T_PAD.l + (t / tSpan) * (TW - T_PAD.l - T_PAD.r);
  const syT = (y: number) => T_PAD.t + (TH - T_PAD.t - T_PAD.b) / 2 - (y / yMaxTime) * ((TH - T_PAD.t - T_PAD.b) / 2);
  const midT = syT(0);

  const path = (key: "sum" | number) =>
    samples
      .map((s, i) => {
        const y = key === "sum" ? s.sum : s.components[key];
        return `${i ? "L" : "M"}${sxT(s.t).toFixed(1)},${syT(y).toFixed(1)}`;
      })
      .join(" ");

  const maxFreq = Math.max(FOURIER_LIMITS.f0.min, harmonicFrequency(p.f0, p.n)) * 1.15;
  const yMaxFreq = Math.max(0.2, maxActiveAmplitude(p) * 1.15);
  const sxF = (f: number) => F_PAD.l + (f / maxFreq) * (FW - F_PAD.l - F_PAD.r);
  const syF = (a: number) => F_PAD.t + (1 - a / yMaxFreq) * (FH - F_PAD.t - F_PAD.b);

  const t = Math.min(clock.t, tSpan);
  const nowValue = synthesize(p, t);

  const componentColour = "var(--color-ink-soft)";

  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">A finite Fourier series, synthesised one harmonic at a time.</span>{" "}
          This is a sum of {p.n} sinusoid{p.n === 1 ? "" : "s"} — a Fourier <em>series</em>, for a signal that
          repeats. It is not a Fourier <em>transform</em>: a transform maps a signal, periodic or not, to a
          function of continuous frequency by an integral, not a finite sum like this one. The square- and
          sawtooth-wave presets only approximate those waveforms, and only improve as more harmonics are added —
          try lowering the harmonic count on either preset to see the approximation visibly worsen.
        </>
      }
    >
      <p className="label mb-2 !text-ink-muted">Time domain</p>
      <svg
        viewBox={`0 0 ${TW} ${TH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`The sum of ${p.n} harmonics at fundamental frequency ${p.f0.toFixed(2)} hertz, over ${PERIODS_SHOWN} periods. At t = ${t.toFixed(2)} seconds the sum is ${nowValue.toFixed(2)}.`}
      >
        <line x1={T_PAD.l} y1={midT} x2={TW - T_PAD.r} y2={midT} stroke="var(--color-rule)" strokeWidth="0.8" />
        <line x1={T_PAD.l} y1={T_PAD.t} x2={T_PAD.l} y2={TH - T_PAD.b} stroke="var(--color-rule)" strokeWidth="0.8" />
        {[yMaxTime, yMaxTime / 2, -yMaxTime / 2, -yMaxTime].map((v) => (
          <g key={v}>
            <line x1={T_PAD.l - 3} y1={syT(v)} x2={T_PAD.l} y2={syT(v)} stroke="var(--color-rule)" strokeWidth="0.8" />
            <text x={T_PAD.l - 6} y={syT(v) + 2.5} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {Array.from({ length: PERIODS_SHOWN * 2 + 1 }, (_, i) => (i / 2) * (period(p.f0) ?? 1)).map((time) => (
          <g key={time}>
            <line x1={sxT(time)} y1={TH - T_PAD.b} x2={sxT(time)} y2={TH - T_PAD.b + 3} stroke="var(--color-rule)" strokeWidth="0.8" />
            <text x={sxT(time)} y={TH - T_PAD.b + 12} textAnchor="middle" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
              {time.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={TW - T_PAD.r} y={TH - 6} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
          t / s
        </text>
        <text x={T_PAD.l + 4} y={T_PAD.t + 8} textAnchor="start" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
          f(t)
        </text>

        {showComponents
          ? Array.from({ length: p.n }, (_, i) => (
              <path key={i} d={path(i)} fill="none" stroke={componentColour} strokeWidth="0.8" opacity="0.55" />
            ))
          : null}
        <path d={path("sum")} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinejoin="round" />

        <line x1={sxT(t)} y1={TH - T_PAD.b} x2={sxT(t)} y2={syT(nowValue)} stroke="var(--color-ink-muted)" strokeWidth="0.7" strokeDasharray="2 2" />
        <circle cx={sxT(t)} cy={syT(nowValue)} r="3.5" fill="var(--color-paper)" stroke="var(--color-accent)" strokeWidth="1.3" />
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Legend
          items={
            showComponents
              ? [
                  { label: "individual harmonics", color: componentColour },
                  { label: "f(t), the sum", color: "var(--color-accent)", width: 2 },
                ]
              : [{ label: "f(t), the sum", color: "var(--color-accent)", width: 2 }]
          }
        />
        <Toggle label="Show individual harmonics" checked={showComponents} onChange={setShowComponents} />
      </div>

      <p className="label mt-8 mb-2 !text-ink-muted">Frequency domain — discrete amplitude spectrum</p>
      <svg
        viewBox={`0 0 ${FW} ${FH}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Amplitude spectrum: ${lines.map((l) => `harmonic ${l.harmonic} at ${l.frequency.toFixed(2)} hertz, amplitude ${l.amplitude.toFixed(2)}`).join("; ")}.`}
      >
        <line x1={F_PAD.l} y1={FH - F_PAD.b} x2={FW - F_PAD.r} y2={FH - F_PAD.b} stroke="var(--color-rule)" strokeWidth="0.8" />
        <line x1={F_PAD.l} y1={F_PAD.t} x2={F_PAD.l} y2={FH - F_PAD.b} stroke="var(--color-rule)" strokeWidth="0.8" />
        {[yMaxFreq, yMaxFreq / 2, 0].map((v) => (
          <g key={v}>
            <line x1={F_PAD.l - 3} y1={syF(v)} x2={F_PAD.l} y2={syF(v)} stroke="var(--color-rule)" strokeWidth="0.8" />
            <text x={F_PAD.l - 6} y={syF(v) + 2.5} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={F_PAD.l + 4} y={F_PAD.t + 8} textAnchor="start" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
          Aₙ
        </text>
        <text x={FW - F_PAD.r} y={FH - 4} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
          frequency / Hz
        </text>

        {lines.map((l) => (
          <g key={l.harmonic}>
            <line
              x1={sxF(l.frequency)}
              y1={syF(0)}
              x2={sxF(l.frequency)}
              y2={syF(l.amplitude)}
              stroke="var(--color-accent)"
              strokeWidth="2"
            />
            <circle cx={sxF(l.frequency)} cy={syF(l.amplitude)} r="3" fill="var(--color-accent)" />
            <text
              x={sxF(l.frequency)}
              y={FH - F_PAD.b + 12}
              textAnchor="middle"
              fontSize="7"
              className="font-mono"
              fill="var(--color-ink-muted)"
            >
              {l.frequency.toFixed(2)}
            </text>
            <text x={sxF(l.frequency)} y={Math.max(F_PAD.t + 7, syF(l.amplitude) - 6)} textAnchor="middle" fontSize="6.5" className="font-mono" fill="var(--color-ink-soft)">
              n={l.harmonic}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 font-sans text-[0.75rem] leading-relaxed text-ink-muted">
        Each line is one active harmonic, placed at its own frequency n·f₀ with height equal to its amplitude Aₙ.
        Phase is set per harmonic below, not shown on this axis — amplitude and phase are independent choices, and
        two spectra can look identical while their waveforms differ entirely in where their harmonics line up in
        time.
      </p>

      <Controls>
        <Slider label="Harmonic count N" value={p.n} {...FOURIER_LIMITS.n} onChange={(n) => set({ n })} />
        <Slider label="Fundamental frequency f₀" value={p.f0} {...FOURIER_LIMITS.f0} onChange={(f0) => set({ f0 })} unit="Hz" />
      </Controls>

      <ButtonRow>
        <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
          {clock.playing ? "Pause" : "Play"}
        </LabButton>
        <LabButton onClick={clock.reset}>Reset time</LabButton>
        <span aria-hidden="true" className="h-3.5 w-px bg-rule" />
        <LabButton onClick={() => setP(cloneParams(FOURIER_DEFAULTS))}>Reset to defaults</LabButton>
        <span aria-hidden="true" className="h-3.5 w-px bg-rule" />
        {(["Pure sine", "Square wave", "Sawtooth wave"] as PresetName[]).map((name) => (
          <LabButton key={name} onClick={() => applyPreset(name)} pressed={activePreset === name}>
            {name}
          </LabButton>
        ))}
      </ButtonRow>

      <Disclosure summary={`Per-harmonic amplitude and phase (${p.n} active)`}>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {Array.from({ length: p.n }, (_, i) => (
            <div key={i} className="grid gap-y-4 border-b border-rule-soft pb-5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
              <p className="label !text-ink-muted">Harmonic {i + 1} · {harmonicFrequency(p.f0, i + 1).toFixed(2)} Hz</p>
              <Slider
                label={`Amplitude A${i + 1}`}
                value={p.amplitudes[i]}
                {...FOURIER_LIMITS.amplitude}
                onChange={(v) => setAmplitude(i, v)}
              />
              <Slider
                label={`Phase φ${i + 1}`}
                value={p.phases[i]}
                {...FOURIER_LIMITS.phase}
                onChange={(v) => setPhase(i, v)}
                format={fmtPi}
              />
            </div>
          ))}
        </div>
      </Disclosure>

      <Readout
        items={[
          { term: "Composition", value: activePreset },
          { term: "Period 1/f₀", value: `${(period(p.f0) ?? 1).toFixed(2)} s` },
          { term: "Highest frequency", value: `${harmonicFrequency(p.f0, p.n).toFixed(2)} Hz` },
          { term: "f(t) at t", value: `${nowValue.toFixed(3)}` },
        ]}
      />
      <Note>
        {activePreset === "Square wave"
          ? "A square wave's series carries only odd harmonics, each at 4/(nπ) — that uneven falloff, and the ripple it leaves behind at the edges even with all 8 harmonics active, is the Gibbs phenomenon: a true square wave needs infinitely many."
          : activePreset === "Sawtooth wave"
            ? "A sawtooth's series carries every harmonic at 2/(nπ), alternating in sign — here, in phase 0 or π. As with the square wave, finitely many terms only approximate the sharp edge; it sharpens, but never fully resolves, as more harmonics are added."
            : activePreset === "Pure sine"
              ? "One harmonic only: this is the fundamental alone, nothing to add or cancel against."
              : "Adjust any amplitude or phase and the composition stops matching any preset exactly — which is expected, not an error."}
      </Note>
    </LabFrame>
  );
}

/** The largest magnitude f(t) can reach is bounded by the sum of the active amplitudes. */
function maxActiveSum(p: FourierParams): number {
  let s = 0;
  for (let i = 0; i < p.n; i++) s += Math.abs(p.amplitudes[i]);
  return s;
}
