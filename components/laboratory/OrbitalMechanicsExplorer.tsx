"use client";

import { useMemo, useState } from "react";

import {
  CIRCULAR_DEFAULTS,
  CIRCULAR_LIMITS,
  EARTH,
  GM,
  IMPACT_DEFAULTS,
  IMPACT_LIMITS,
  KEPLER_DEFAULTS,
  KEPLER_LIMITS,
  THIRD_LAW_SLOPE,
  acceleration,
  circularSpeed,
  escapeSpeed,
  impactSpeed,
  kineticEnergy,
  measureOrbit,
  orbitalElements,
  potentialEnergy,
  simulate,
  specificEnergy,
  thirdLawFit,
  type Trajectory,
} from "@/lib/laboratory/gravitation";

import { ButtonRow, LabButton, LabFrame, Legend, Note, Readout, Slider } from "./ui";
import { useClock } from "./useClock";

type Mode = "impact" | "circular" | "kepler";

const MODES: { id: Mode; label: string }[] = [
  { id: "impact", label: "A · Impact & Escape" },
  { id: "circular", label: "B · Circular Orbit" },
  { id: "kepler", label: "C · Kepler's Laws" },
];

/** The satellite's mass in every energy readout — the lab's own m = 100 kg, which cancels out of the motion itself. */
const MASS = 100;

const SIZE = 480;
const PAD = 16;

function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  return a !== 0 && (a < 1e-3 || a >= 1e5) ? v.toExponential(2) : v.toFixed(a < 10 ? 3 : 1);
}
const fmtVel = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(2)} km/s` : `${v.toFixed(0)} m/s`);
const fmtR = (v: number) => `${v.toFixed(2)} R`;
const pctDiff = (theory: number, sim: number) => (100 * Math.abs(sim - theory)) / Math.abs(theory);

/** First index whose simulated time is at least `value`, by binary search over the monotone time array. */
function indexAtTime(t: number[], value: number): number {
  let lo = 0;
  let hi = t.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (t[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function pathFrom(points: { sx: number; sy: number }[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
}

/* ───────────────────────── the shared orbit view ───────────────────────── */

function OrbitFigure({
  traj,
  guideRadius,
  ellipse,
  markerIndex,
  ariaLabel,
}: {
  traj: Trajectory;
  guideRadius?: number;
  ellipse?: { semiMajorAxis: number; eccentricity: number; periapsisAngle: number };
  markerIndex: number;
  ariaLabel: string;
}) {
  let extent = EARTH.R * 1.3;
  for (let i = 0; i < traj.x.length; i++) {
    extent = Math.max(extent, Math.abs(traj.x[i]), Math.abs(traj.y[i]));
  }
  if (guideRadius) extent = Math.max(extent, guideRadius * 1.1);
  if (ellipse) extent = Math.max(extent, ellipse.semiMajorAxis * (1 + ellipse.eccentricity) * 1.05);
  extent *= 1.15;

  const scale = (SIZE - 2 * PAD) / (2 * extent);
  const sx = (x: number) => SIZE / 2 + x * scale;
  const sy = (y: number) => SIZE / 2 - y * scale;

  const n = traj.x.length;
  const stride = Math.max(1, Math.floor(n / 500));
  const pathPoints: { sx: number; sy: number }[] = [];
  for (let i = 0; i < n; i += stride) pathPoints.push({ sx: sx(traj.x[i]), sy: sy(traj.y[i]) });
  if ((n - 1) % stride !== 0) pathPoints.push({ sx: sx(traj.x[n - 1]), sy: sy(traj.y[n - 1]) });

  let ellipseD = "";
  if (ellipse) {
    const { semiMajorAxis: a, eccentricity: e, periapsisAngle: omega } = ellipse;
    const b = a * Math.sqrt(Math.max(0, 1 - e * e));
    const cosO = Math.cos(omega);
    const sinO = Math.sin(omega);
    const cx = -a * e * cosO;
    const cy = -a * e * sinO;
    const pts = Array.from({ length: 97 }, (_, k) => {
      const phi = (2 * Math.PI * k) / 96;
      const lx = cx + a * Math.cos(phi) * cosO - b * Math.sin(phi) * sinO;
      const ly = cy + a * Math.cos(phi) * sinO + b * Math.sin(phi) * cosO;
      return { sx: sx(lx), sy: sy(ly) };
    });
    ellipseD = pathFrom(pts);
  }

  const mi = Math.min(markerIndex, n - 1);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <rect x={PAD} y={PAD} width={SIZE - 2 * PAD} height={SIZE - 2 * PAD} fill="var(--color-paper)" stroke="var(--color-rule)" strokeWidth="0.8" />
      {guideRadius ? (
        <circle cx={sx(0)} cy={sy(0)} r={guideRadius * scale} fill="none" stroke="var(--color-chart-extra)" strokeWidth="1.2" strokeDasharray="4 3" />
      ) : null}
      {ellipseD ? <path d={ellipseD} fill="none" stroke="var(--color-chart-extra)" strokeWidth="1.3" strokeDasharray="5 3" /> : null}
      <path d={pathFrom(pathPoints)} fill="none" stroke="var(--color-plot)" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx={sx(0)} cy={sy(0)} r={Math.max(2, EARTH.R * scale)} fill="var(--color-accent-soft)" fillOpacity="0.4" stroke="var(--color-accent)" strokeWidth="1" />
      <circle cx={sx(traj.x[mi])} cy={sy(traj.y[mi])} r="3.6" fill="var(--color-ink)" />
      {traj.impact ? <circle cx={sx(traj.impact.x)} cy={sy(traj.impact.y)} r="6" fill="none" stroke="var(--color-plot)" strokeWidth="1.4" /> : null}
    </svg>
  );
}

/* ───────────────────────────── A. Impact & escape ───────────────────────── */

function ImpactMode() {
  const [x0, setX0] = useState(IMPACT_DEFAULTS.x0);
  const [y0, setY0] = useState(IMPACT_DEFAULTS.y0);
  const [vx0, setVx0] = useState(IMPACT_DEFAULTS.vx0);
  const [vy0, setVy0] = useState(IMPACT_DEFAULTS.vy0);
  const [tmax, setTmax] = useState(IMPACT_DEFAULTS.tmax);

  const traj = useMemo(() => simulate(x0 * EARTH.R, y0 * EARTH.R, vx0, vy0, tmax, 3000), [x0, y0, vx0, vy0, tmax]);
  const eps = specificEnergy(x0 * EARTH.R, y0 * EARTH.R, vx0, vy0);
  const theoreticalImpact = impactSpeed(x0 * EARTH.R, y0 * EARTH.R, vx0, vy0);
  const tSpan = traj.impact ? traj.impact.t : tmax;

  const clock = useClock({ autoplay: true, rate: tSpan / 8, max: tSpan, loop: false });
  const index = indexAtTime(traj.t, clock.t);
  const x = traj.x[index];
  const y = traj.y[index];
  const vx = traj.vx[index];
  const vy = traj.vy[index];
  const a = acceleration(x, y);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <OrbitFigure
          traj={traj}
          markerIndex={index}
          ariaLabel={`Trajectory from (${x0.toFixed(1)}R, ${y0.toFixed(1)}R) with initial velocity (${vx0}, ${vy0}) m/s. ${traj.impact ? "It reaches Earth's surface." : "It does not reach the surface within the simulated time."}`}
        />
        <div>
          <Legend
            items={[
              { label: "Earth", color: "var(--color-accent)" },
              { label: "simulated trajectory", color: "var(--color-plot)", width: 1.6 },
            ]}
          />
          <div className="mt-5 grid gap-y-5">
            <Slider label="x₀" value={x0} {...IMPACT_LIMITS.position} onChange={setX0} format={fmtR} />
            <Slider label="y₀" value={y0} {...IMPACT_LIMITS.position} onChange={setY0} format={fmtR} />
            <Slider label="vₓ(0)" value={vx0} {...IMPACT_LIMITS.velocity} onChange={setVx0} format={fmtVel} />
            <Slider label="v_y(0)" value={vy0} {...IMPACT_LIMITS.velocity} onChange={setVy0} format={fmtVel} />
            <Slider label="t_max" value={tmax} {...IMPACT_LIMITS.tmax} onChange={setTmax} format={(v) => `${v.toFixed(0)} s`} />
          </div>
          <ButtonRow>
            <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
              {clock.playing ? "Pause" : "Play"}
            </LabButton>
            <LabButton onClick={clock.reset}>Reset time</LabButton>
          </ButtonRow>
        </div>
      </div>

      <Readout
        items={[
          { term: "r", value: `${fmtNum(Math.hypot(x, y))} m` },
          { term: "v", value: `${fmtNum(Math.hypot(vx, vy))} m/s` },
          { term: "a", value: `${fmtNum(Math.hypot(a.x, a.y))} m/s²` },
          { term: "KE", value: `${fmtNum(kineticEnergy(vx, vy, MASS))} J` },
          { term: "PE", value: `${fmtNum(potentialEnergy(x, y, MASS))} J` },
          { term: "E", value: `${fmtNum(kineticEnergy(vx, vy, MASS) + potentialEnergy(x, y, MASS))} J` },
        ]}
      />
      <Readout
        items={[
          { term: "v_esc at 1 R", value: `${fmtNum(escapeSpeed(1 * EARTH.R))} m/s` },
          { term: "v_esc at 3 R", value: `${fmtNum(escapeSpeed(3 * EARTH.R))} m/s` },
          { term: "v_esc at 9 R", value: `${fmtNum(escapeSpeed(9 * EARTH.R))} m/s` },
          { term: "specific energy ε", value: `${fmtNum(eps)} J/kg` },
        ]}
      />
      <Note>
        {eps < 0
          ? "This trajectory is bound (ε < 0): left alone, it eventually falls back, whether or not it clears Earth on the way."
          : "This trajectory is unbound (ε ≥ 0): it escapes to infinity unless it hits Earth first — energy conservation does not care which direction the velocity points, only its magnitude."}{" "}
        {traj.impact
          ? `It reaches the surface at t = ${fmtNum(traj.impact.t)} s with simulated speed ${fmtNum(traj.impact.speed)} m/s, against ${theoreticalImpact !== undefined ? `${fmtNum(theoreticalImpact)} m/s from energy conservation (${pctDiff(theoreticalImpact, traj.impact.speed).toFixed(2)}% apart)` : "no theoretical impact speed (it should not reach the surface)"}.`
          : "It does not reach the surface within t_max — raise t_max, or check the energy sign above, to see where it ends up."}
      </Note>
    </>
  );
}

/* ───────────────────────────── B. Circular orbit ────────────────────────── */

function CircularMode() {
  const [r0, setR0] = useState(CIRCULAR_DEFAULTS.r0);
  const theoreticalV = circularSpeed(r0 * EARTH.R);
  const [v0, setV0] = useState(theoreticalV);
  const [touched, setTouched] = useState(false);
  const v0Used = touched ? v0 : theoreticalV;

  const period = 2 * Math.PI * Math.sqrt((r0 * EARTH.R) ** 3 / GM);
  const traj = useMemo(() => simulate(0, r0 * EARTH.R, v0Used, 0, period * 1.2, 3000), [r0, v0Used, period]);
  const measured = measureOrbit(traj);
  const wobble = ((measured.apogee - measured.perigee) / (r0 * EARTH.R)) * 100;

  const clock = useClock({ autoplay: true, rate: period / 8, max: measured.period ?? period, loop: true });
  const index = indexAtTime(traj.t, clock.t);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <OrbitFigure
          traj={traj}
          guideRadius={r0 * EARTH.R}
          markerIndex={index}
          ariaLabel={`Orbit at r(0) = ${r0.toFixed(2)}R with v(0) = ${v0Used.toFixed(0)} m/s, against the guide circle at r(0). Wobble ${wobble.toFixed(2)}%.`}
        />
        <div>
          <Legend
            items={[
              { label: "Earth", color: "var(--color-accent)" },
              { label: "guide circle at r(0)", color: "var(--color-chart-extra)", dashed: true },
              { label: "simulated orbit", color: "var(--color-plot)", width: 1.6 },
            ]}
          />
          <div className="mt-5 grid gap-y-5">
            <Slider label="r(0)" value={r0} {...CIRCULAR_LIMITS.r0} onChange={(v) => { setR0(v); setTouched(false); }} format={fmtR} />
            <Slider
              label="v(0) used in the simulation"
              value={v0Used}
              min={theoreticalV * 0.7}
              max={theoreticalV * 1.3}
              step={1}
              onChange={(v) => { setV0(v); setTouched(true); }}
              format={fmtVel}
            />
          </div>
          <ButtonRow>
            <LabButton onClick={() => { setTouched(false); }} disabled={!touched}>Reset to theoretical v(0)</LabButton>
            <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
              {clock.playing ? "Pause" : "Play"}
            </LabButton>
          </ButtonRow>
        </div>
      </div>

      <Readout
        items={[
          { term: "r(0)", value: fmtR(r0) },
          { term: "theoretical v(0)", value: `${fmtNum(theoreticalV)} m/s` },
          { term: "v(0) used", value: `${fmtNum(v0Used)} m/s` },
          { term: "(max r − min r)/r(0)", value: `${wobble.toFixed(3)}%` },
        ]}
      />
      <Note>
        At the theoretical v(0) = √(GM/r), the wobble above should sit near 0% — the small remainder is the
        Runge-Kutta integration&apos;s own error, not a physical effect. Move the v(0) slider away from the theoretical
        value and the orbit stops being circular: too fast, and the far side bulges outward (toward an ellipse with
        r(0) as its perigee); too slow, and it bulges the other way (r(0) as its apogee).
      </Note>
    </>
  );
}

/* ───────────────────────────── C. Kepler's laws ─────────────────────────── */

interface Run {
  vx0: number;
  semiMajorAxis: number;
  period: number;
}

function KeplerMode() {
  const [x0, setX0] = useState(KEPLER_DEFAULTS.x0);
  const [y0, setY0] = useState(KEPLER_DEFAULTS.y0);
  const [vx0, setVx0] = useState(KEPLER_DEFAULTS.vx0);
  const [vy0, setVy0] = useState(KEPLER_DEFAULTS.vy0);
  const [runs, setRuns] = useState<Run[]>([]);

  const elements = orbitalElements(x0 * EARTH.R, y0 * EARTH.R, vx0, vy0);
  const tmax = elements.bound ? elements.period! * 1.1 : 150000;
  const traj = useMemo(() => simulate(x0 * EARTH.R, y0 * EARTH.R, vx0, vy0, tmax, 4000), [x0, y0, vx0, vy0, tmax]);
  const measured = measureOrbit(traj);

  const clock = useClock({
    autoplay: true,
    rate: tmax / 9,
    max: elements.bound ? (measured.period ?? elements.period!) : tmax,
    loop: elements.bound,
  });
  const index = indexAtTime(traj.t, clock.t);

  const fit = useMemo(() => {
    if (runs.length < 2) return undefined;
    return thirdLawFit(runs.map((r) => ({ a3: r.semiMajorAxis ** 3, t2: r.period ** 2 })));
  }, [runs]);

  const addRun = () => {
    if (!elements.bound || measured.period === undefined) return;
    setRuns((prev) => [...prev, { vx0, semiMajorAxis: measured.semiMajorAxis, period: measured.period! }]);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <OrbitFigure
          traj={traj}
          ellipse={elements.bound ? { semiMajorAxis: elements.semiMajorAxis!, eccentricity: elements.eccentricity!, periapsisAngle: elements.periapsisAngle! } : undefined}
          markerIndex={index}
          ariaLabel={`Orbit from initial condition (${x0.toFixed(1)}R, ${y0.toFixed(1)}R, ${vx0} m/s, ${vy0} m/s), with the theoretical ellipse overlaid.`}
        />
        <div>
          <Legend
            items={[
              { label: "Earth (one focus)", color: "var(--color-accent)" },
              { label: "theoretical ellipse", color: "var(--color-chart-extra)", dashed: true },
              { label: "simulated orbit", color: "var(--color-plot)", width: 1.6 },
            ]}
          />
          <div className="mt-5 grid gap-y-5">
            <Slider label="x₀" value={x0} {...KEPLER_LIMITS.position} onChange={setX0} format={fmtR} />
            <Slider label="y₀" value={y0} {...KEPLER_LIMITS.position} onChange={setY0} format={fmtR} />
            <Slider label="vₓ(0)" value={vx0} {...KEPLER_LIMITS.velocity} onChange={setVx0} format={fmtVel} />
            <Slider label="v_y(0)" value={vy0} {...KEPLER_LIMITS.velocity} onChange={setVy0} format={fmtVel} />
          </div>
          <ButtonRow>
            <LabButton onClick={() => clock.setPlaying(!clock.playing)} pressed={clock.playing}>
              {clock.playing ? "Pause" : "Play"}
            </LabButton>
            <LabButton onClick={addRun} disabled={!elements.bound || measured.period === undefined}>
              + Add this run to the third-law fit
            </LabButton>
          </ButtonRow>
        </div>
      </div>

      {elements.bound ? (
        <>
          <p className="label mt-6 mb-2 !text-ink-muted">Theoretical (exact two-body solution)</p>
          <Readout
            items={[
              { term: "R_a", value: `${fmtNum(elements.apogee!)} m` },
              { term: "R_p", value: `${fmtNum(elements.perigee!)} m` },
              { term: "e", value: elements.eccentricity!.toFixed(4) },
              { term: "a", value: `${fmtNum(elements.semiMajorAxis!)} m` },
              { term: "T", value: `${fmtNum(elements.period!)} s` },
            ]}
          />
          <p className="label mt-5 mb-2 !text-ink-muted">Measured off the simulated trajectory</p>
          <Readout
            items={[
              { term: "R_a", value: `${fmtNum(measured.apogee)} m` },
              { term: "R_p", value: `${fmtNum(measured.perigee)} m` },
              { term: "e", value: measured.eccentricity.toFixed(4) },
              { term: "a", value: `${fmtNum(measured.semiMajorAxis)} m` },
              { term: "T", value: measured.period !== undefined ? `${fmtNum(measured.period)} s` : "incomplete" },
            ]}
          />
        </>
      ) : (
        <Note>This initial condition is unbound (ε ≥ 0) — not a closed ellipse, so there is no R_a, e, a or T to compare.</Note>
      )}

      {runs.length > 0 ? (
        <div className="mt-6 border-t border-rule-soft pt-5">
          <p className="label mb-2 !text-ink-muted">Table 3B — runs collected for Kepler&apos;s third law</p>
          <ul className="grid gap-1.5 font-mono text-[0.75rem] text-ink-soft">
            {runs.map((r, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3">
                <span>vₓ(0) = {r.vx0} m/s</span>
                <span>a = {fmtNum(r.semiMajorAxis)} m</span>
                <span>T = {fmtNum(r.period)} s</span>
                <span>a³ = {fmtNum(r.semiMajorAxis ** 3)} m³</span>
                <span>T² = {fmtNum(r.period ** 2)} s²</span>
                <LabButton onClick={() => setRuns((prev) => prev.filter((_, idx) => idx !== i))}>remove</LabButton>
              </li>
            ))}
          </ul>
          {fit ? (
            <Readout
              items={[
                { term: "fit slope T²/a³", value: `${fmtNum(fit.slope)} ± ${fmtNum(fit.slopeError)} s²/m³` },
                { term: "theoretical 4π²/GM", value: `${fmtNum(THIRD_LAW_SLOPE)} s²/m³` },
                { term: "difference", value: `${pctDiff(THIRD_LAW_SLOPE, fit.slope).toFixed(3)}%` },
              ]}
            />
          ) : (
            <Note>Add at least one more run — the fit needs two or more orbits of different size.</Note>
          )}
        </div>
      ) : null}

      <Note>
        The theoretical ellipse is computed from the Laplace-Runge-Lenz vector and the vis-viva equation —
        independent of the simulation — with Earth placed at one focus, not at its center, exactly as Kepler&apos;s
        first law states. How closely the blue trajectory hugs it is the integration&apos;s own accuracy, not an
        assumption built into the drawing.
      </Note>
    </>
  );
}

/* ──────────────────────────────────── root ──────────────────────────────── */

export function OrbitalMechanicsExplorer() {
  const [mode, setMode] = useState<Mode>("impact");
  return (
    <LabFrame
      caption={
        <>
          <span className="font-medium text-ink">
            A satellite near Earth, with its motion integrated numerically from Newton&apos;s second law —
            a fourth-order Runge-Kutta step, the same kind of approach a <code>NDSolveValue</code> call takes in
            Mathematica.
          </span>{" "}
          Three questions, one integrator: whether a trajectory hits the surface or escapes, what speed holds a
          circular orbit, and whether an elliptical orbit&apos;s shape and period match the closed-form two-body
          solution for the same initial condition. Built to check predictions for Rutgers Physics 275&apos;s
          Classical Physics Lab 9, &ldquo;Gravitation.&rdquo;
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
        {mode === "impact" ? <ImpactMode /> : mode === "circular" ? <CircularMode /> : <KeplerMode />}
      </div>
    </LabFrame>
  );
}
