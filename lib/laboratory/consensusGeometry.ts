/**
 * The regularized intrinsic circle consensus (ICC) model of "The Geometry of
 * Disagreement: Stable Non-Consensus States in Circle-Valued Network
 * Dynamics" (Kim), restated exactly as the paper's Section 3.3 and computed
 * closed-form invariants from Sections 4 and 5.3 — μ(G) for complete graphs
 * (Theorem 4.2) and for cycles (Theorem 5.7 / the cycle case of 4.8(c)).
 */

export type GraphKind = "complete" | "cycle";

export interface GraphSpec {
  kind: GraphKind;
  n: number;
}

/** wrap(x) to the paper's (−π, π] representative. */
export function wrap(x: number): number {
  const twoPi = 2 * Math.PI;
  let r = x % twoPi;
  if (r <= -Math.PI) r += twoPi;
  if (r > Math.PI) r -= twoPi;
  return r;
}

/** Γ_δ: identity on the central linear branch, linear ramp to 0 at the antipodal point. */
export function gammaDelta(x: number, delta: number): number {
  const ax = Math.abs(x);
  const branch = Math.PI - delta;
  if (ax <= branch) return x;
  const sign = x < 0 ? -1 : 1;
  return (((Math.PI - delta) / delta) * (Math.PI - ax)) * sign;
}

export function edgesFor(spec: GraphSpec): [number, number][] {
  const { kind, n } = spec;
  const edges: [number, number][] = [];
  if (kind === "complete") {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]);
  } else {
    for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]);
  }
  return edges;
}

function neighborsFor(spec: GraphSpec): number[][] {
  const adj: number[][] = Array.from({ length: spec.n }, () => []);
  for (const [u, v] of edgesFor(spec)) {
    adj[u].push(v);
    adj[v].push(u);
  }
  return adj;
}

/** θ̇ from the model's defining sum, one RHS evaluation. */
function derivative(theta: number[], adj: number[][], delta: number): number[] {
  const n = theta.length;
  const out = new Array<number>(n).fill(0);
  for (let v = 0; v < n; v++) {
    let sum = 0;
    for (const u of adj[v]) sum += gammaDelta(wrap(theta[u] - theta[v]), delta);
    out[v] = sum;
  }
  return out;
}

/** One fixed-step RK4 step, wrapping phases back into a 2π-periodic representative each step. */
export function stepRK4(theta: number[], adj: number[][], delta: number, dt: number): number[] {
  const n = theta.length;
  const k1 = derivative(theta, adj, delta);
  const t2 = theta.map((th, i) => th + (dt / 2) * k1[i]);
  const k2 = derivative(t2, adj, delta);
  const t3 = theta.map((th, i) => th + (dt / 2) * k2[i]);
  const k3 = derivative(t3, adj, delta);
  const t4 = theta.map((th, i) => th + dt * k3[i]);
  const k4 = derivative(t4, adj, delta);
  const next = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    next[i] = theta[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return next;
}

export function buildAdjacency(spec: GraphSpec): number[][] {
  return neighborsFor(spec);
}

export interface ConsensusState {
  maxAbsDelta: number;
  maxSpeed: number;
  edgeDeltas: number[];
}

/** Per-edge wrapped differences, the maximum of their absolute values, and the fastest-moving vertex. */
export function measure(theta: number[], adj: number[][], edges: [number, number][], delta: number): ConsensusState {
  const edgeDeltas = edges.map(([u, v]) => wrap(theta[v] - theta[u]));
  const maxAbsDelta = edgeDeltas.reduce((m, d) => Math.max(m, Math.abs(d)), 0);
  const speeds = derivative(theta, adj, delta);
  const maxSpeed = speeds.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
  return { maxAbsDelta, maxSpeed, edgeDeltas };
}

export type Settlement = "evolving" | "synchronized" | "non-synchronous" | "near-antipodal";

export function classify(state: ConsensusState, delta: number): Settlement {
  const SETTLED_SPEED = 2e-4;
  const SYNC_GAP = 2e-3;
  if (state.maxSpeed > SETTLED_SPEED) return "evolving";
  if (state.maxAbsDelta < SYNC_GAP) return "synchronized";
  if (state.maxAbsDelta < Math.PI - delta - 1e-3) return "non-synchronous";
  return "near-antipodal";
}

/** μ(K_n) = ⌈n/3⌉/n, Theorem 4.2. */
export function muComplete(n: number): number {
  return Math.ceil(n / 3) / n;
}

/** μ(C_n) = 1/n — the n = 2 case of Theorem 4.8(c), N = 2, a = n. */
export function muCycle(n: number): number {
  return 1 / n;
}

export function mu(spec: GraphSpec): number {
  return spec.kind === "complete" ? muComplete(spec.n) : muCycle(spec.n);
}

/** δ*(G) = π(1 − 2μ(G)) — Corollary 3.4's critical regularisation width. */
export function deltaStar(muValue: number): number {
  return Math.max(0, Math.PI * (1 - 2 * muValue));
}

/**
 * The three-cluster minimiser of Theorem 4.2's proof: vertices split into
 * three groups as equal in size as possible, placed at phases 0, 2πc/n and
 * 2π(a+c)/n. For K₄ this is the (2,1,1) split whose two singleton groups
 * land exactly antipodal — the configuration behind Figure 1(b).
 */
export function threeClusterPhases(n: number): number[] {
  const base = Math.floor(n / 3);
  const rem = n % 3;
  const a = base + (rem > 0 ? 1 : 0);
  const b = base + (rem > 1 ? 1 : 0);
  const c = base;
  const phaseA = 0;
  const phaseB = (2 * Math.PI * c) / n;
  const phaseC = (2 * Math.PI * (a + c)) / n;
  const theta = new Array<number>(n);
  let i = 0;
  for (let k = 0; k < a; k++) theta[i++] = phaseA;
  for (let k = 0; k < b; k++) theta[i++] = phaseB;
  for (let k = 0; k < c; k++) theta[i++] = phaseC;
  return theta;
}

/** The q = 1 twisted state on a cycle: θ_v = 2πv/n, the minimiser attaining μ(C_n) = 1/n. */
export function twistedCyclePhases(n: number): number[] {
  return Array.from({ length: n }, (_, v) => wrap((2 * Math.PI * v) / n));
}

/** A small seeded PRNG (mulberry32) so a "random" preset is reproducible across renders. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomPhases(n: number, seed: number): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => wrap(rand() * 2 * Math.PI));
}
