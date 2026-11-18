"use client";

import { useMemo, useState } from "react";

import {
  AIR_FREQUENCY_LIMITS,
  AIR_LENGTH_LIMITS,
  DEFAULT_TEMPERATURE_C,
  GRAVITY,
  MASS_LIMITS,
  MAX_DISPLAY_GAIN,
  STRING_FREQUENCY_HZ,
  STRING_LENGTH_LIMITS,
  STRING_LINEAR_DENSITY,
  STRING_LINEAR_DENSITY_UNCERTAINTY,
  TEMPERATURE_LIMITS,
  drivenDisplacement,
  drivenPressure,
  isNearResonance,
  nearestMode,
  percentDifference,
  resonanceGain,
  resonantLength,
  speedFromDeltaX,
  speedFromResonantLength,
  speedOfSound,
  stringSpeed,
  tension,
  waveNumber,
  wavelengthOf,
} from "@/lib/laboratory/standingWaves";

import { ButtonRow, Controls, CopyTableButton, LabButton, LabFrame, Legend, NumberField, Note, Readout, Slider } from "./ui";
import { useClock } from "./useClock";

type Mode = "string" | "air";

const MODES: { id: Mode; label: string }[] = [
  { id: "string", label: "I · String" },
  { id: "air", label: "II · Air column" },
];

/* Shared plot geometry: every panel below uses the same canvas and padding. */
const W = 640;
const H = 220;
const PAD = { l: 34, r: 16, t: 14, b: 26 };
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;
const Y_MAX = 1;

const MUTED = "var(--color-ink-muted)";
const RULE = "var(--color-rule)";

/**
 * The real driving frequency (120 Hz, or the chosen audio frequency) sets
 * every physical quantity below — wavelength, resonant lengths, the gain.
 * It does not set how fast the curve visibly pulses: at 120 Hz that would
 * either alias against the screen's frame rate or simply look frozen, so
 * the animation itself runs at this fixed, slow, arbitrary rate instead.
 */
const DISPLAY_OMEGA = 2 * Math.PI * 0.35;

const STRING_DRIVE_AMPLITUDE = (0.9 * Y_MAX) / MAX_DISPLAY_GAIN;
const AIR_DRIVE_AMPLITUDE = (0.85 * Y_MAX) / MAX_DISPLAY_GAIN;

function pathFrom(xs: number[], ys: number[], sx: (x: number) => number, sy: (y: number) => number): string {
  return xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join(" ");
}

function samplePoints(domainMax: number, n = 161): number[] {
  return Array.from({ length: n }, (_, i) => (i / (n - 1)) * domainMax);
}

function signed(n: number, decimals = 1): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}`;
}

/* ──────────────────────────────── I. String ─────────────────────────────── */

function StringMode() {
  const [mass, setMass] = useState(0.12);
  const [L, setL] = useState(0.5);
  const [measuredL, setMeasuredL] = useState<number | null>(null);
  const clock = useClock({ autoplay: true });

  const c = stringSpeed(mass);
  const k = waveNumber(c, STRING_FREQUENCY_HZ);
  const lambda = wavelengthOf(c, STRING_FREQUENCY_HZ);
  const n = nearestMode(L, lambda);
  const Ln = resonantLength(n, lambda);
  const gain = resonanceGain(L, k);
  const near = isNearResonance(L, k);

  const cExp = measuredL !== null ? speedFromResonantLength(n, measuredL, STRING_FREQUENCY_HZ) : null;
  const diffPct = cExp !== null ? percentDifference(cExp, c) : null;

  const domainMax = STRING_LENGTH_LIMITS.max;
  const sx = (x: number) => PAD.l + (x / domainMax) * plotW;
  const sy = (y: number) => PAD.t + plotH / 2 - (y / Y_MAX) * (plotH / 2);
  const mid = sy(0);

  const xs = useMemo(() => samplePoints(L), [L]);
  // k is a pure function of mass alone (via c = stringSpeed(mass)); mass is
  // already listed, so k itself need not be.
  const ys = useMemo(
    () => xs.map((x) => STRING_DRIVE_AMPLITUDE * drivenDisplacement(x, L, k) * Math.cos(DISPLAY_OMEGA * clock.t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xs, L, mass, clock.t],
  );
  const envelopeUp = useMemo(
    () => xs.map((x) => STRING_DRIVE_AMPLITUDE * Math.abs(drivenDisplacement(x, L, k))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xs, L, mass],
  );

  const curve = pathFrom(xs, ys, sx, sy);
  const envTop = pathFrom(xs, envelopeUp, sx, sy);
  const envBottom = pathFrom(xs, envelopeUp.map((v) => -v), sx, sy);

  const modes = [n - 1, n, n + 1].filter((m) => m >= 1);

  const readoutItems = [
    { term: "F = mg", value: `${tension(mass).toFixed(3)} N (g = ${GRAVITY} m/s²)` },
    { term: "c = √(F/ρ)", value: `${c.toFixed(2)} m/s` },
    { term: "λ = c/f, f = 120 Hz", value: `${lambda.toFixed(3)} m` },
    { term: "nearest mode n", value: `${n}, resonant at L = ${Ln.toFixed(3)} m` },
    { term: "L − Lₙ", value: `${signed(L - Ln, 3)} m` },
    { term: "relative amplitude", value: `×${gain.toFixed(1)}` },
    ...(cExp !== null && diffPct !== null
      ? [
          { term: "c_exp = 2fL/n (measured)", value: `${cExp.toFixed(2)} m/s` },
          { term: "% difference from c_th", value: `${signed(diffPct)}%` },
        ]
      : []),
  ];

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`A string driven at 120 hertz, vibrating length ${L.toFixed(3)} meters. ${
          near ? `Near resonance — mode n=${n}, amplitude strongly amplified.` : "Off resonance — the response stays small."
        }`}
      >
        <line x1={PAD.l} y1={mid} x2={W - PAD.r} y2={mid} stroke={RULE} strokeWidth="0.8" />
        {/* The rest of the physical string, beyond the fret: present, not vibrating. */}
        <line x1={sx(L)} y1={mid} x2={sx(domainMax)} y2={mid} stroke={RULE} strokeWidth="1.2" strokeDasharray="1 3" opacity="0.6" />
        <path d={envTop} fill="none" stroke="var(--color-plot-soft)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
        <path d={envBottom} fill="none" stroke="var(--color-plot-soft)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
        <path d={curve} fill="none" stroke="var(--color-plot)" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Buzzer end. */}
        <rect x={sx(0) - 4} y={mid - 10} width="4" height="20" fill="var(--color-ink-soft)" />
        <text x={sx(0) - 4} y={mid + 22} textAnchor="start" fontSize="7" className="font-mono" fill={MUTED}>buzzer</text>
        {/* Fret, at the current L. */}
        <line x1={sx(L)} y1={mid - 14} x2={sx(L)} y2={mid + 14} stroke="var(--color-ink)" strokeWidth="1.4" />
        <text x={sx(L)} y={PAD.t + 8} textAnchor="middle" fontSize="7" className="font-mono" fill={MUTED}>fret, L</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="7" className="font-mono" fill={MUTED}>x (m)</text>
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Legend
          items={[
            { label: "instantaneous shape", color: "var(--color-plot)", width: 2 },
            { label: "envelope (± max amplitude)", color: "var(--color-plot-soft)", dashed: true },
          ]}
        />
        <span className={`font-sans text-[0.75rem] ${near ? "text-accent" : "text-ink-muted"}`}>
          {near ? "● near resonance" : "○ no stable pattern here"}
        </span>
      </div>

      <Controls>
        <Slider label="Hanging mass m" value={mass} {...MASS_LIMITS} onChange={setMass} unit="kg" format={(v) => v.toFixed(3)} />
        <Slider label="Vibrating length L" value={L} {...STRING_LENGTH_LIMITS} onChange={setL} unit="m" format={(v) => v.toFixed(3)} />
      </Controls>

      <ButtonRow>
        <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
          {clock.playing ? "Pause" : "Play"}
        </LabButton>
        <span aria-hidden="true" className="h-3.5 w-px bg-rule" />
        {modes.map((m) => (
          <LabButton key={m} onClick={() => setL(resonantLength(m, lambda))} pressed={m === n && near}>
            Snap to n = {m}
          </LabButton>
        ))}
      </ButtonRow>

      <Readout items={readoutItems} />

      <div className="mt-6 border-t border-rule-soft pt-5">
        <NumberField
          label={`Measured resonant length at n = ${n}`}
          unit="m"
          placeholder="e.g. 0.624"
          onChange={setMeasuredL}
        />
        {cExp !== null && diffPct !== null ? (
          <p className="mt-2 font-mono text-[0.75rem] text-ink tnum">
            c_exp = 2fL/n = {cExp.toFixed(2)} m/s ({signed(diffPct)}% from c_th)
          </p>
        ) : null}
      </div>

      <ButtonRow>
        <CopyTableButton rows={readoutItems} />
      </ButtonRow>

      <Note>
        ρ is taken as ({(STRING_LINEAR_DENSITY * 1e4).toFixed(1)} ± {(STRING_LINEAR_DENSITY_UNCERTAINTY * 1e4).toFixed(1)})×10⁻⁴ kg/m,
        the handout&rsquo;s value, with its stated 10% uncertainty — not something this
        instrument measures. The buzzer end is driven at a
        small, fixed amplitude regardless of L (hence &ldquo;a good approximation of a
        node&rdquo;); what grows large near resonance is the response everywhere else, not the
        driver itself. Away from a resonant L the curve stays close to that same small
        amplitude throughout — there is no clean pattern to read node spacing from, which is
        the point: tomorrow, sliding the fret is a search for the L where the string swings
        widely, not a search for where it happens to look wavy.
      </Note>
    </>
  );
}

/* ───────────────────────────── II. Air column ──────────────────────────── */

function AirColumnMode() {
  const [freq, setFreq] = useState(1000);
  const [length, setLength] = useState(0.4);
  const [tempC, setTempC] = useState(DEFAULT_TEMPERATURE_C);
  const [measuredDeltaX, setMeasuredDeltaX] = useState<number | null>(null);
  const clock = useClock({ autoplay: true });

  const c = speedOfSound(tempC);
  const k = waveNumber(c, freq);
  const lambda = wavelengthOf(c, freq);
  const n = nearestMode(length, lambda);
  const cExp = measuredDeltaX !== null ? speedFromDeltaX(measuredDeltaX, freq) : null;
  const diffPct = cExp !== null ? percentDifference(cExp, c) : null;
  const Ln = resonantLength(n, lambda);
  const gain = resonanceGain(length, k);
  const near = isNearResonance(length, k);

  const domainMax = AIR_LENGTH_LIMITS.max;
  const sx = (x: number) => PAD.l + (x / domainMax) * plotW;
  const sy = (y: number) => PAD.t + plotH / 2 - (y / Y_MAX) * (plotH / 2);
  const mid = sy(0);

  const xs = useMemo(() => samplePoints(length), [length]);
  // k is a pure function of freq and tempC alone (via c = speedOfSound(tempC));
  // both are already listed, so k itself need not be.
  const uy = useMemo(
    () => xs.map((x) => AIR_DRIVE_AMPLITUDE * drivenDisplacement(x, length, k) * Math.cos(DISPLAY_OMEGA * clock.t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xs, length, freq, tempC, clock.t],
  );
  const py = useMemo(
    () => xs.map((x) => AIR_DRIVE_AMPLITUDE * drivenPressure(x, length, k) * Math.cos(DISPLAY_OMEGA * clock.t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xs, length, freq, tempC, clock.t],
  );

  const uCurve = pathFrom(xs, uy, sx, sy);
  const pCurve = pathFrom(xs, py, sx, sy);
  const deltaX = lambda / 2;
  const modes = [n - 1, n, n + 1].filter((m) => m >= 1);

  const readoutItems = [
    { term: "c_th = 331.4 + 0.6T", value: `${c.toFixed(1)} m/s` },
    { term: "λ = c/f", value: `${lambda.toFixed(3)} m` },
    { term: "nearest mode n", value: `${n}, resonant at ℓ = ${Ln.toFixed(3)} m` },
    { term: "ℓ − ℓₙ", value: `${signed(length - Ln, 3)} m` },
    { term: "Δx between successive maxima", value: `λ/2 = ${deltaX.toFixed(3)} m` },
    { term: "relative amplitude", value: `×${gain.toFixed(1)}` },
    ...(cExp !== null && diffPct !== null
      ? [
          { term: "c_exp = f·(2Δx) (measured)", value: `${cExp.toFixed(1)} m/s` },
          { term: "% difference from c_th", value: `${signed(diffPct)}%` },
        ]
      : []),
  ];

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`An air column of length ${length.toFixed(3)} meters, driven at ${freq} hertz. Displacement and pressure patterns, a quarter wavelength apart.`}
      >
        <line x1={PAD.l} y1={mid} x2={W - PAD.r} y2={mid} stroke={RULE} strokeWidth="0.8" />
        <line x1={sx(length)} y1={mid} x2={sx(domainMax)} y2={mid} stroke={RULE} strokeWidth="1.2" strokeDasharray="1 3" opacity="0.4" />
        <path d={uCurve} fill="none" stroke="var(--color-ink-soft)" strokeWidth="1.3" opacity="0.85" />
        <path d={pCurve} fill="none" stroke="var(--color-plot)" strokeWidth="1.8" strokeLinejoin="round" />
        <rect x={sx(0) - 4} y={mid - 10} width="4" height="20" fill="var(--color-ink-soft)" />
        <text x={sx(0) - 4} y={mid + 22} textAnchor="start" fontSize="7" className="font-mono" fill={MUTED}>speaker (sealed)</text>
        <line x1={sx(length)} y1={mid - 14} x2={sx(length)} y2={mid + 14} stroke="var(--color-ink)" strokeWidth="1.4" />
        <text x={sx(length)} y={PAD.t + 8} textAnchor="middle" fontSize="7" className="font-mono" fill={MUTED}>plunger (rigid)</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="7" className="font-mono" fill={MUTED}>x (m)</text>
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Legend
          items={[
            { label: "pressure (what the microphone reads)", color: "var(--color-plot)", width: 2 },
            { label: "displacement (air motion, unmeasured)", color: "var(--color-ink-soft)" },
          ]}
        />
        <span className={`font-sans text-[0.75rem] ${near ? "text-accent" : "text-ink-muted"}`}>
          {near ? "● near resonance" : "○ no stable pattern here"}
        </span>
      </div>

      <Controls>
        <Slider label="Frequency f" value={freq} {...AIR_FREQUENCY_LIMITS} onChange={setFreq} unit="Hz" format={(v) => v.toFixed(0)} />
        <Slider label="Column length ℓ" value={length} {...AIR_LENGTH_LIMITS} onChange={setLength} unit="m" format={(v) => v.toFixed(3)} />
        <Slider label="Room temperature T" value={tempC} {...TEMPERATURE_LIMITS} onChange={setTempC} unit="°C" format={(v) => v.toFixed(1)} />
      </Controls>

      <ButtonRow>
        <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
          {clock.playing ? "Pause" : "Play"}
        </LabButton>
        <span aria-hidden="true" className="h-3.5 w-px bg-rule" />
        {modes.map((m) => (
          <LabButton key={m} onClick={() => setLength(resonantLength(m, lambda))} pressed={m === n && near}>
            Snap to n = {m}
          </LabButton>
        ))}
      </ButtonRow>

      <Readout items={readoutItems} />

      <div className="mt-6 border-t border-rule-soft pt-5">
        <NumberField
          label="Measured Δx between successive pressure maxima"
          unit="m"
          placeholder="e.g. 0.172"
          onChange={setMeasuredDeltaX}
        />
        {cExp !== null && diffPct !== null ? (
          <p className="mt-2 font-mono text-[0.75rem] text-ink tnum">
            c_exp = f·(2Δx) = {cExp.toFixed(1)} m/s ({signed(diffPct)}% from c_th)
          </p>
        ) : null}
      </div>

      <ButtonRow>
        <CopyTableButton rows={readoutItems} />
      </ButtonRow>

      <Note>
        If tomorrow&rsquo;s plunger positions for two successive microphone maxima really are
        {" "}
        {deltaX.toFixed(3)} m apart at this frequency and temperature, then c_exp = f·(2Δx) will
        land near {c.toFixed(1)} m/s — type the Δx you actually measure above to check it against
        this prediction directly, rather than doing the arithmetic by hand.
      </Note>
      <Note>
        <span className="font-medium text-ink">On Question 2:</span> both ends here are sealed,
        rigid boundaries — the plunger obviously, and the speaker too, since it drives a closed
        tube rather than sitting open to the room. Modelling the speaker the same way as the
        buzzer in Part I (a small, fixed driving amplitude, not a free end) already forces
        resonances at ℓ = n·λ/2 starting from n = 1 — the spacing the handout&rsquo;s own method
        measures — rather than the n = 1, 3, 5,… quarter-wave series an open end would give. A
        small, forced displacement there is close to a displacement <em>node</em>; since pressure
        and displacement are a quarter wavelength apart, that makes the loudspeaker end close to
        a pressure <em>antinode</em> — which is exactly what the microphone, which reads
        pressure, would see.
      </Note>
    </>
  );
}

/* ──────────────────────────────────── root ──────────────────────────────── */

export function StandingWaves() {
  const [mode, setMode] = useState<Mode>("string");

  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">A lab-prep instrument, not a substitute for the lab.</span>{" "}
          Built from the Rutgers 275 Classical Physics Lab 10 handout (&ldquo;Standing
          Waves,&rdquo; contributed by Maryam Taherinejad and Girsh Blumberg) to see the resonance
          conditions beforehand — tomorrow&rsquo;s own apparatus, string, and air column are what
          the lab report is actually built from.
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
      <div className="mt-6">{mode === "string" ? <StringMode /> : <AirColumnMode />}</div>
    </LabFrame>
  );
}
