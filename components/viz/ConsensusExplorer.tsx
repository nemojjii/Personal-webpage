"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CONSENSUS EXPLORER — a reconstruction, not an original measurement
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  This widget re-runs the model documented in the manuscript "Solving
 *  Consensus Dynamics in Networks Using Mathematical and Computational
 *  Method": the continuous-time consensus law
 *
 *      dx/dt = -L x,        L = D - A,
 *
 *  integrated by the explicit Euler method with the manuscript's own step
 *  size (dt = 0.1) and horizon (50 steps). Every graph below, with its edge
 *  list and initial state, is taken verbatim from the manuscript; nothing is
 *  invented and no result is reported here that the manuscript did not
 *  simulate. The curves are therefore a redrawing of the documented
 *  simulation, not new evidence.
 *
 *  The eigenvalues shown are computed in the browser from the same L by
 *  Jacobi rotation, as a check on the manuscript's claim that the
 *  second-smallest eigenvalue governs convergence.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Topology {
  key: string;
  label: string;
  n: number;
  edges: [number, number][];
  x0: number[];
  /** Hand-placed layout, schematic — the manuscript used a force-directed one. */
  pos: [number, number][];
  note: string;
}

const TOPOLOGIES: Topology[] = [
  {
    key: "four",
    label: "4 nodes",
    n: 4,
    edges: [
      [1, 2],
      [1, 3],
      [2, 3],
      [2, 4],
    ],
    x0: [1, 2, 3, 0],
    pos: [
      [0.3, 0.25],
      [0.62, 0.5],
      [0.3, 0.75],
      [0.9, 0.5],
    ],
    note: "The worked example: nodes 1–4 of the six-node graph, with the edges among them.",
  },
  {
    key: "sparse",
    label: "Sparse, one isolated",
    n: 6,
    edges: [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
    x0: [1, 2, 3, 4, 5, 6],
    pos: [
      [0.1, 0.62],
      [0.28, 0.38],
      [0.46, 0.62],
      [0.64, 0.38],
      [0.82, 0.62],
      [0.5, 0.12],
    ],
    note: "A chain 1–2–3–4–5 with node 6 attached to nothing.",
  },
  {
    key: "six",
    label: "6 nodes, 9 edges",
    n: 6,
    edges: [
      [1, 2],
      [1, 3],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [4, 6],
      [5, 6],
    ],
    x0: [1, 3, 5, 0, 2, 4],
    pos: [
      [0.12, 0.3],
      [0.38, 0.5],
      [0.14, 0.72],
      [0.66, 0.25],
      [0.62, 0.68],
      [0.9, 0.46],
    ],
    note: "The full six-node graph defined by the manuscript's edge list.",
  },
  {
    key: "complete",
    label: "Complete graph",
    n: 6,
    edges: ([] as [number, number][]).concat(
      ...Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 5 - i }, (_, k): [number, number] => [i + 1, i + k + 2]),
      ),
    ),
    x0: [1, 2, 3, 4, 5, 6],
    pos: Array.from({ length: 6 }, (_, i): [number, number] => {
      const a = (2 * Math.PI * i) / 6 - Math.PI / 2;
      return [0.5 + 0.38 * Math.cos(a), 0.5 + 0.4 * Math.sin(a)];
    }),
    note: "Every node joined to every other — the manuscript's K₆ case.",
  },
];

const DT = 0.1;
const STEPS = 50;

function laplacian(topology: Topology): number[][] {
  const { n, edges } = topology;
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (const [i, j] of edges) {
    A[i - 1][j - 1] = 1;
    A[j - 1][i - 1] = 1;
  }
  return A.map((row, i) =>
    row.map((v, j) => (i === j ? row.reduce((s, x) => s + x, 0) : -v)),
  );
}

/** Eigenvalues of a small symmetric matrix by the cyclic Jacobi method. */
function symmetricEigenvalues(input: number[][]): number[] {
  const n = input.length;
  const a = input.map((row) => [...row]);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-14) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t =
          Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const cos = 1 / Math.sqrt(t * t + 1);
        const sin = t * cos;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p];
          const akq = a[k][q];
          a[k][p] = cos * akp - sin * akq;
          a[k][q] = sin * akp + cos * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k];
          const aqk = a[q][k];
          a[p][k] = cos * apk - sin * aqk;
          a[q][k] = sin * apk + cos * aqk;
        }
      }
    }
  }
  return Array.from({ length: n }, (_, i) => a[i][i]).sort((x, y) => x - y);
}

function trajectories(topology: Topology) {
  const L = laplacian(topology);
  const n = topology.n;
  let x = [...topology.x0];
  const history: number[][] = [[...x]];
  for (let s = 0; s < STEPS; s++) {
    const dx = L.map((row) => -row.reduce((sum, v, j) => sum + v * x[j], 0));
    x = x.map((v, i) => v + DT * dx[i]);
    history.push([...x]);
  }
  return { history, eigenvalues: symmetricEigenvalues(L), n };
}

const SERIES_COLOURS = [
  "var(--color-accent)",
  "var(--color-ink)",
  "var(--color-accent-soft)",
  "var(--color-ink-soft)",
  "var(--color-ink-muted)",
  "#9a6b73",
];

export function ConsensusExplorer() {
  const [active, setActive] = useState(0);
  const [frame, setFrame] = useState(STEPS);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const topology = TOPOLOGIES[active];

  const { history, eigenvalues, n } = useMemo(() => trajectories(topology), [topology]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      raf.current = requestAnimationFrame(tick);
      if (now - last < 40) return;
      last = now;
      setFrame((f) => {
        if (f >= STEPS) {
          setPlaying(false);
          return STEPS;
        }
        return f + 1;
      });
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  const replay = () => {
    setFrame(0);
    setPlaying(true);
  };

  // Plot geometry
  const W = 320;
  const H = 180;
  const PAD = { l: 26, r: 8, t: 10, b: 20 };
  const allValues = history.flat();
  const lo = Math.min(...allValues);
  const hi = Math.max(...allValues);
  const sx = (s: number) => PAD.l + (s / STEPS) * (W - PAD.l - PAD.r);
  const sy = (v: number) =>
    H - PAD.b - ((v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b);

  const zeroCount = eigenvalues.filter((v) => Math.abs(v) < 1e-8).length;
  const lambda2 = eigenvalues[1] ?? 0;
  const current = history[Math.min(frame, STEPS)];
  const spread = Math.max(...current) - Math.min(...current);

  return (
    <figure className="my-10 print-avoid-break">
      <div className="border border-rule-soft bg-surface/40 p-4 sm:p-6">
        {/* Topology chooser */}
        <div
          role="group"
          aria-label="Network topology"
          className="mb-5 flex flex-wrap gap-x-4 gap-y-2"
        >
          {TOPOLOGIES.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActive(i);
                setFrame(STEPS);
                setPlaying(false);
              }}
              aria-pressed={i === active}
              className={`font-sans text-[0.75rem] transition-colors duration-200 ${
                i === active
                  ? "text-accent underline decoration-accent underline-offset-[0.25em]"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-8">
          {/* Network diagram */}
          <div>
            <p className="label mb-2 !text-[0.625rem]">Graph</p>
            <svg
              viewBox="0 0 200 200"
              className="h-auto w-full"
              role="img"
              aria-label={`${topology.label}: ${topology.edges.length} edges between ${n} nodes`}
            >
              {topology.edges.map(([i, j]) => (
                <line
                  key={`${i}-${j}`}
                  x1={topology.pos[i - 1][0] * 200}
                  y1={topology.pos[i - 1][1] * 200}
                  x2={topology.pos[j - 1][0] * 200}
                  y2={topology.pos[j - 1][1] * 200}
                  stroke="var(--color-rule)"
                  strokeWidth="1"
                />
              ))}
              {topology.pos.slice(0, n).map(([px, py], i) => (
                <g key={i}>
                  <circle
                    cx={px * 200}
                    cy={py * 200}
                    r="11"
                    fill="var(--color-paper)"
                    stroke={SERIES_COLOURS[i % SERIES_COLOURS.length]}
                    strokeWidth="1.2"
                  />
                  <text
                    x={px * 200}
                    y={py * 200 + 3.5}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="9"
                    fill="var(--color-ink-soft)"
                  >
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Convergence plot */}
          <div>
            <p className="label mb-2 !text-[0.625rem]">
              Node states, 50 Euler steps at dt = 0.1
            </p>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Convergence plot. After 50 steps the spread between node states is ${spread.toFixed(3)}.`}
            >
              <line
                x1={PAD.l}
                y1={H - PAD.b}
                x2={W - PAD.r}
                y2={H - PAD.b}
                stroke="var(--color-rule)"
                strokeWidth="0.8"
              />
              <line
                x1={PAD.l}
                y1={PAD.t}
                x2={PAD.l}
                y2={H - PAD.b}
                stroke="var(--color-rule)"
                strokeWidth="0.8"
              />
              {[lo, hi].map((v) => (
                <text
                  key={v}
                  x={PAD.l - 5}
                  y={sy(v) + 3}
                  textAnchor="end"
                  fontSize="7"
                  className="font-mono"
                  fill="var(--color-ink-muted)"
                >
                  {v.toFixed(1)}
                </text>
              ))}
              <text
                x={W - PAD.r}
                y={H - 6}
                textAnchor="end"
                fontSize="7"
                className="font-mono"
                fill="var(--color-ink-muted)"
              >
                50
              </text>
              {Array.from({ length: n }, (_, i) => (
                <path
                  key={i}
                  d={history
                    .slice(0, frame + 1)
                    .map((row, s) => `${s === 0 ? "M" : "L"}${sx(s)},${sy(row[i])}`)
                    .join(" ")}
                  fill="none"
                  stroke={SERIES_COLOURS[i % SERIES_COLOURS.length]}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Readout */}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-rule-soft pt-4 font-sans text-[0.75rem] sm:grid-cols-4">
          <div>
            <dt className="text-ink-muted">Edges</dt>
            <dd className="tnum text-ink">{topology.edges.length}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">λ₂ (connectivity)</dt>
            <dd className="tnum text-ink">{lambda2.toFixed(3)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Components</dt>
            <dd className="tnum text-ink">{zeroCount}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Spread after 50 steps</dt>
            <dd className="tnum text-ink">{spread.toExponential(1)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={replay}
            className="font-sans text-[0.75rem] text-ink-soft underline decoration-rule underline-offset-[0.2em] transition-colors duration-200 hover:text-accent hover:decoration-accent"
          >
            {playing ? "Running…" : "Replay the integration"}
          </button>
          <span className="font-sans text-[0.6875rem] text-ink-muted">
            {topology.note}
          </span>
        </div>
      </div>

      <figcaption className="mt-3 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
        <span className="font-medium text-ink">Reconstruction.</span> The graphs,
        initial states, step size and horizon are those documented in the
        manuscript; the curves are redrawn here by integrating{" "}
        <span className="font-mono text-[0.75rem]">dx/dt = −Lx</span> in the
        browser. This is an illustration of the documented simulation, not an
        independent experimental result. The eigenvalues are computed from the
        same Laplacian as a check on the convergence claim.
      </figcaption>
    </figure>
  );
}
