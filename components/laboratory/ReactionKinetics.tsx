"use client";

import { useMemo, useState } from "react";

import {
  KINETICS_DEFAULTS,
  KINETICS_LIMITS,
  concentration,
  curve,
  fractionRemaining,
  halfLife,
  rate,
  timeWindow,
} from "@/lib/laboratory/kinetics";

import { ButtonRow, Controls, LabButton, LabFrame, Legend, Note, Readout, Slider } from "./ui";
import { useClock } from "./useClock";

const W = 640;
const H = 300;
const PAD = { l: 40, r: 14, t: 12, b: 28 };
const Y_MAX = KINETICS_LIMITS.a0.max;
const PARTICLES = 100;

export function ReactionKinetics() {
  const [a0, setA0] = useState(KINETICS_DEFAULTS.a0);
  const [k, setK] = useState(KINETICS_DEFAULTS.k);
  const tMax = timeWindow(k);
  // The plot shows tMax seconds; the clock runs it in about eight real seconds.
  const clock = useClock({ autoplay: true, rate: tMax / 8, max: tMax });
  const t = Math.min(clock.t, tMax);

  const sx = (time: number) => PAD.l + (time / tMax) * (W - PAD.l - PAD.r);
  const sy = (a: number) => PAD.t + (1 - a / Y_MAX) * (H - PAD.t - PAD.b);

  const curveD = useMemo(
    () => curve(a0, k, tMax).map((pt, i) => `${i ? "L" : "M"}${sx(pt.t).toFixed(1)},${sy(pt.a).toFixed(1)}`).join(" "),
    // sx/sy depend on tMax, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a0, k, tMax],
  );

  const now = concentration(a0, k, t);
  const fraction = fractionRemaining(k, t);
  const t12 = halfLife(k);
  const remaining = Math.round(PARTICLES * fraction);
  const changeK = (value: number) => {
    setK(value);
    const next = timeWindow(value);
    if (clock.t > next) clock.seek(next);
  };
  const xTicks = Array.from({ length: 5 }, (_, i) => (i * tMax) / 4);

  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">A → products, first order.</span> The curve is{" "}
          <span className="font-mono text-[0.75rem]">[A]₀·e^(−kt)</span>; dashed lines mark successive
          half-lives, equally spaced because each halving takes the same time. Units are
          illustrative.
        </>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Concentration of A against time. At t = ${t.toFixed(1)} seconds, [A] = ${now.toFixed(3)} mol per litre, ${(fraction * 100).toFixed(0)} percent of the initial ${a0.toFixed(2)}.${t12 ? ` Half-life ${t12.toFixed(2)} seconds.` : " With k = 0 the concentration is constant."}`}
      >
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--color-rule)" strokeWidth="0.8" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-rule)" strokeWidth="0.8" />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={PAD.l - 3} y1={sy(v)} x2={PAD.l} y2={sy(v)} stroke="var(--color-rule)" strokeWidth="0.8" />
            <text x={PAD.l - 6} y={sy(v) + 2.5} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={H - PAD.b} x2={sx(v)} y2={H - PAD.b + 3} stroke="var(--color-rule)" strokeWidth="0.8" />
            <text x={sx(v)} y={H - PAD.b + 12} textAnchor="middle" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
              {v.toFixed(tMax >= 10 ? 0 : 1)}
            </text>
          </g>
        ))}
        <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">t / s</text>
        <text x={PAD.l + 4} y={PAD.t + 8} textAnchor="start" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">[A] / mol L⁻¹</text>

        {t12
          ? [1, 2, 3]
              .map((n) => n * t12)
              .filter((time) => time <= tMax)
              .map((time, n) => (
                <g key={n}>
                  <line x1={sx(time)} y1={H - PAD.b} x2={sx(time)} y2={sy(concentration(a0, k, time))} stroke="var(--color-ink-muted)" strokeWidth="0.7" strokeDasharray="3 3" />
                  {n === 0 ? (
                    <line x1={PAD.l} y1={sy(a0 / 2)} x2={sx(time)} y2={sy(a0 / 2)} stroke="var(--color-ink-muted)" strokeWidth="0.7" strokeDasharray="3 3" />
                  ) : null}
                  <text x={sx(time)} y={PAD.t + 8} textAnchor="middle" fontSize="7" className="font-mono" fill="var(--color-ink-muted)">
                    {n + 1}t½
                  </text>
                </g>
              ))
          : null}

        <path d={curveD} fill="none" stroke="var(--color-accent)" strokeWidth="1.6" />
        <line x1={sx(t)} y1={H - PAD.b} x2={sx(t)} y2={sy(now)} stroke="var(--color-ink)" strokeWidth="0.8" />
        <circle cx={sx(t)} cy={sy(now)} r="4" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="1.2" />
      </svg>

      <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <Legend
            items={[
              { label: "[A](t)", color: "var(--color-accent)", width: 1.6 },
              { label: "half-lives", color: "var(--color-ink-muted)", dashed: true },
            ]}
          />
          <Controls>
            <Slider label="Initial [A]₀" value={a0} {...KINETICS_LIMITS.a0} onChange={setA0} unit="mol/L" />
            <Slider label="Rate constant k" value={k} {...KINETICS_LIMITS.k} onChange={changeK} unit="s⁻¹" />
            <Slider label="Elapsed time t" value={t} min={0} max={tMax} step={tMax / 400} onChange={clock.seek} format={(v) => v.toFixed(1)} unit="s" />
          </Controls>
          <ButtonRow>
            <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing} disabled={!clock.playing && t >= tMax}>
              {clock.playing ? "Pause" : "Play"}
            </LabButton>
            <LabButton onClick={clock.reset}>Reset</LabButton>
          </ButtonRow>
        </div>

        <figure className="sm:w-[7.5rem]" aria-label={`${remaining} of ${PARTICLES} particles of A remain`}>
          <svg viewBox="0 0 100 100" className="h-auto w-full max-w-[7.5rem]" aria-hidden="true">
            {Array.from({ length: PARTICLES }, (_, i) => {
              const cx = 5 + (i % 10) * 10;
              const cy = 5 + Math.floor(i / 10) * 10;
              const present = i < remaining;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill={present ? "var(--color-accent)" : "none"}
                  stroke={present ? "none" : "var(--color-rule)"}
                  strokeWidth="0.8"
                />
              );
            })}
          </svg>
          <figcaption className="mt-1.5 font-sans text-[0.6875rem] leading-snug text-ink-muted">
            {remaining} of {PARTICLES} remain — a tally of the fraction, not a simulation.
          </figcaption>
        </figure>
      </div>

      <Readout
        items={[
          { term: "[A](t)", value: `${now.toFixed(3)} mol/L` },
          { term: "Fraction remaining", value: `${(fraction * 100).toFixed(1)} %` },
          { term: "Half-life t½", value: t12 ? `${t12.toFixed(2)} s` : "— (k = 0)" },
          { term: "Rate k[A]", value: `${rate(a0, k, t).toFixed(3)} mol L⁻¹ s⁻¹` },
        ]}
      />
      <Note>
        {k > 0
          ? `Every ${t12?.toFixed(2)} s the remaining concentration halves, whatever its value — so after ${Math.floor(t / (t12 ?? 1))} half-lives ${(fraction * 100).toFixed(1)} % is left.`
          : "With k = 0 nothing reacts: the concentration stays at its initial value for all time, and there is no half-life."}
      </Note>
    </LabFrame>
  );
}
