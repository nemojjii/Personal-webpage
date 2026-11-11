/**
 * A satellite of mass m ≪ M in Earth's gravitational field, solved the way
 * a two-body gravitation lab solves it: not analytically, but by
 * integrating Newton's second law,
 *
 *   r'' = -GM r / |r|^3,
 *
 * with a fourth-order Runge-Kutta step. Three questions are put to the same
 * integrator: whether a trajectory hits the surface or escapes, what speed
 * holds a circular orbit, and whether an elliptical orbit's own shape and
 * period match the closed-form two-body solution for the same initial
 * condition.
 */

export const EARTH = {
  G: 6.672e-11,
  M: 5.972e24,
  R: 6.371e6,
} as const;

export const GM = EARTH.G * EARTH.M;

export interface State {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function acceleration(x: number, y: number): { x: number; y: number } {
  const r2 = x * x + y * y;
  const r = Math.sqrt(r2);
  const f = -GM / (r2 * r);
  return { x: f * x, y: f * y };
}

function derivative(s: State): State {
  const a = acceleration(s.x, s.y);
  return { x: s.vx, y: s.vy, vx: a.x, vy: a.y };
}

function addScaled(a: State, b: State, h: number): State {
  return { x: a.x + h * b.x, y: a.y + h * b.y, vx: a.vx + h * b.vx, vy: a.vy + h * b.vy };
}

export function rk4Step(s: State, dt: number): State {
  const k1 = derivative(s);
  const k2 = derivative(addScaled(s, k1, dt / 2));
  const k3 = derivative(addScaled(s, k2, dt / 2));
  const k4 = derivative(addScaled(s, k3, dt));
  return {
    x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    vx: s.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: s.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
  };
}

export const potentialEnergy = (x: number, y: number, m: number) => (-GM * m) / Math.hypot(x, y);
export const kineticEnergy = (vx: number, vy: number, m: number) => 0.5 * m * (vx * vx + vy * vy);
/** Energy per unit mass — the quantity whose sign decides bound vs. unbound. */
export const specificEnergy = (x: number, y: number, vx: number, vy: number) =>
  0.5 * (vx * vx + vy * vy) - GM / Math.hypot(x, y);

export const circularSpeed = (r: number) => Math.sqrt(GM / r);
export const escapeSpeed = (r: number) => Math.sqrt((2 * GM) / r);

/** From energy conservation; undefined if the trajectory never reaches the surface. */
export function impactSpeed(x0: number, y0: number, vx0: number, vy0: number): number | undefined {
  const r0 = Math.hypot(x0, y0);
  const v2 = vx0 * vx0 + vy0 * vy0 + 2 * GM * (1 / EARTH.R - 1 / r0);
  return v2 >= 0 ? Math.sqrt(v2) : undefined;
}

export interface OrbitalElements {
  bound: boolean;
  specificEnergy: number;
  semiMajorAxis?: number;
  eccentricity?: number;
  apogee?: number;
  perigee?: number;
  period?: number;
  /** Direction from Earth toward periapsis, radians — where the theoretical ellipse's near vertex sits. */
  periapsisAngle?: number;
}

/**
 * The exact two-body solution for one initial condition, via the vis-viva
 * equation and the Laplace-Runge-Lenz vector — independent of any
 * integration, so it is what a simulated trajectory is checked against,
 * not derived from it.
 */
export function orbitalElements(x0: number, y0: number, vx0: number, vy0: number): OrbitalElements {
  const r0 = Math.hypot(x0, y0);
  const v2 = vx0 * vx0 + vy0 * vy0;
  const eps = 0.5 * v2 - GM / r0;
  if (eps >= 0) return { bound: false, specificEnergy: eps };
  const a = -GM / (2 * eps);
  const rdotv = x0 * vx0 + y0 * vy0;
  const ex = ((v2 - GM / r0) * x0 - rdotv * vx0) / GM;
  const ey = ((v2 - GM / r0) * y0 - rdotv * vy0) / GM;
  const e = Math.hypot(ex, ey);
  const period = 2 * Math.PI * Math.sqrt((a * a * a) / GM);
  return {
    bound: true,
    specificEnergy: eps,
    semiMajorAxis: a,
    eccentricity: e,
    apogee: a * (1 + e),
    perigee: a * (1 - e),
    period,
    periapsisAngle: Math.atan2(ey, ex),
  };
}

export interface Impact {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

export interface Trajectory {
  t: number[];
  x: number[];
  y: number[];
  vx: number[];
  vy: number[];
  impact?: Impact;
}

/**
 * The whole trajectory from one initial condition, computed up front so a
 * page can scrub through it. Stops early at the first surface crossing,
 * linearly interpolated between the two RK4 samples either side of it.
 */
export function simulate(
  x0: number,
  y0: number,
  vx0: number,
  vy0: number,
  tmax: number,
  steps = 4000,
): Trajectory {
  const dt = tmax / steps;
  let s: State = { x: x0, y: y0, vx: vx0, vy: vy0 };
  let tCur = 0;
  const t = [tCur];
  const xs = [s.x];
  const ys = [s.y];
  const vxs = [s.vx];
  const vys = [s.vy];
  for (let i = 0; i < steps; i++) {
    const rPrev = Math.hypot(s.x, s.y);
    const next = rk4Step(s, dt);
    const rNext = Math.hypot(next.x, next.y);
    if (rNext < EARTH.R && rPrev >= EARTH.R) {
      const frac = (EARTH.R - rPrev) / (rNext - rPrev);
      const imp: Impact = {
        t: tCur + frac * dt,
        x: s.x + frac * (next.x - s.x),
        y: s.y + frac * (next.y - s.y),
        vx: s.vx + frac * (next.vx - s.vx),
        vy: s.vy + frac * (next.vy - s.vy),
        speed: 0,
      };
      imp.speed = Math.hypot(imp.vx, imp.vy);
      t.push(imp.t);
      xs.push(imp.x);
      ys.push(imp.y);
      vxs.push(imp.vx);
      vys.push(imp.vy);
      return { t, x: xs, y: ys, vx: vxs, vy: vys, impact: imp };
    }
    s = next;
    tCur += dt;
    t.push(tCur);
    xs.push(s.x);
    ys.push(s.y);
    vxs.push(s.vx);
    vys.push(s.vy);
  }
  return { t, x: xs, y: ys, vx: vxs, vy: vys };
}

export interface MeasuredOrbit {
  apogee: number;
  perigee: number;
  semiMajorAxis: number;
  eccentricity: number;
  /** Undefined if the trajectory does not complete a full revolution. */
  period?: number;
}

/** Apogee, perigee and period read directly off a simulated trajectory — not assumed, measured. */
export function measureOrbit(traj: Trajectory): MeasuredOrbit {
  let rMin = Infinity;
  let rMax = -Infinity;
  for (let i = 0; i < traj.x.length; i++) {
    const r = Math.hypot(traj.x[i], traj.y[i]);
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
  }
  let period: number | undefined;
  let prevTheta = Math.atan2(traj.y[0], traj.x[0]);
  let cum = 0;
  for (let i = 1; i < traj.x.length; i++) {
    const theta = Math.atan2(traj.y[i], traj.x[i]);
    let d = theta - prevTheta;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const next = cum + d;
    if (period === undefined && Math.abs(next) >= 2 * Math.PI) {
      const frac = (2 * Math.PI * Math.sign(next) - cum) / d;
      period = traj.t[i - 1] + frac * (traj.t[i] - traj.t[i - 1]);
    }
    cum = next;
    prevTheta = theta;
  }
  return {
    apogee: rMax,
    perigee: rMin,
    semiMajorAxis: (rMax + rMin) / 2,
    eccentricity: (rMax - rMin) / (rMax + rMin),
    period,
  };
}

/** The slope of a line through the origin least-squares fit to T² = slope·a³. */
export function thirdLawFit(points: { a3: number; t2: number }[]): { slope: number; slopeError: number } {
  let sumXY = 0;
  let sumXX = 0;
  for (const p of points) {
    sumXY += p.a3 * p.t2;
    sumXX += p.a3 * p.a3;
  }
  const slope = sumXX > 0 ? sumXY / sumXX : NaN;
  let ssRes = 0;
  for (const p of points) {
    const residual = p.t2 - slope * p.a3;
    ssRes += residual * residual;
  }
  const dof = Math.max(points.length - 1, 1);
  const slopeError = Math.sqrt(ssRes / dof / sumXX);
  return { slope, slopeError };
}

/** Kepler's third law, T²/a³ = 4π²/GM, independent of any orbit's own shape. */
export const THIRD_LAW_SLOPE = (4 * Math.PI * Math.PI) / GM;

export const IMPACT_DEFAULTS = { x0: 3, y0: 4, vx0: 2000, vy0: 1500, tmax: 20000 };
export const IMPACT_LIMITS = {
  position: { min: -9, max: 9, step: 0.1 },
  velocity: { min: -6000, max: 6000, step: 50 },
  tmax: { min: 2000, max: 100000, step: 1000 },
} as const;

export const CIRCULAR_DEFAULTS = { r0: 3 };
export const CIRCULAR_LIMITS = { r0: { min: 1.1, max: 9, step: 0.1 } } as const;

export const KEPLER_DEFAULTS = { x0: 0, y0: 3, vx0: 5900, vy0: 0 };
export const KEPLER_LIMITS = {
  position: { min: -9, max: 9, step: 0.1 },
  velocity: { min: -9000, max: 9000, step: 50 },
} as const;
