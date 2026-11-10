"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type ConsensusState,
  type GraphKind,
  type GraphSpec,
  type Settlement,
  buildAdjacency,
  classify,
  deltaStar,
  edgesFor,
  measure,
  mu,
  randomPhases,
  stepRK4,
  threeClusterPhases,
  twistedCyclePhases,
} from "@/lib/laboratory/consensusGeometry";

import { ButtonRow, Controls, LabButton, LabFrame, Note, Readout, Slider } from "./ui";

const DT = 0.02;
const SUBSTEPS_PER_FRAME = 6;
const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 34;
const NODE_R = 6;

const SETTLEMENT_LABEL: Record<Settlement, string> = {
  evolving: "Evolving",
  synchronized: "Synchronized",
  "non-synchronous": "Stable disagreement (non-synchronous equilibrium)",
  "near-antipodal": "Unsettled near the antipodal point",
};

function nodePoint(theta: number): { x: number; y: number } {
  return {
    x: CENTER + RADIUS * Math.sin(theta),
    y: CENTER - RADIUS * Math.cos(theta),
  };
}

function initialPhases(spec: GraphSpec, preset: "random" | "structured", seed: number): number[] {
  if (preset === "random") return randomPhases(spec.n, seed);
  return spec.kind === "complete" ? threeClusterPhases(spec.n) : twistedCyclePhases(spec.n);
}

/**
 * Owns the running phase vector and its animation loop. Remounted (via the
 * caller's `key`) whenever the graph, preset or seed changes, so a fresh run
 * always starts from a freshly computed initial state rather than one read
 * out of a ref during render.
 */
function Simulation({
  spec,
  preset,
  seed,
  delta,
  running,
  onMeasure,
}: {
  spec: GraphSpec;
  preset: "random" | "structured";
  seed: number;
  delta: number;
  running: boolean;
  onMeasure: (state: ConsensusState, settlement: Settlement) => void;
}) {
  const adj = useMemo(() => buildAdjacency(spec), [spec]);
  const edges = useMemo(() => edgesFor(spec), [spec]);

  const [theta, setTheta] = useState<number[]>(() => initialPhases(spec, preset, seed));
  const thetaRef = useRef<number[]>(theta);

  // Reports the current measurement whenever it last became stale — on mount,
  // and whenever δ changes the classification of an unmoving configuration.
  useEffect(() => {
    const m = measure(thetaRef.current, adj, edges, delta);
    onMeasure(m, classify(m, delta));
  }, [adj, edges, delta, onMeasure]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let lastRender = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      let next = thetaRef.current;
      for (let i = 0; i < SUBSTEPS_PER_FRAME; i++) next = stepRK4(next, adj, delta, DT);
      thetaRef.current = next;
      if (now - lastRender >= 33) {
        lastRender = now;
        setTheta(next);
        const m = measure(next, adj, edges, delta);
        onMeasure(m, classify(m, delta));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, adj, edges, delta, onMeasure]);

  const points = theta.map(nodePoint);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      className="h-auto w-full max-w-[22rem]"
      role="img"
      aria-label="Phases of the graph's vertices on the circle, with the graph's edges drawn as chords"
    >
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--color-rule-soft)" strokeWidth={1} />
      {edges.map(([u, v], i) => (
        <line
          key={i}
          x1={points[u].x}
          y1={points[u].y}
          x2={points[v].x}
          y2={points[v].y}
          stroke="var(--color-plot-soft)"
          strokeWidth={1}
          strokeOpacity={0.6}
        />
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={NODE_R} fill="var(--color-paper)" stroke="var(--color-plot)" strokeWidth={1.75} />
      ))}
    </svg>
  );
}

export function ConsensusGeometryExplorer() {
  const [kind, setKind] = useState<GraphKind>("complete");
  const [n, setN] = useState(5);
  const [delta, setDelta] = useState(0.4);
  const [preset, setPreset] = useState<"random" | "structured">("structured");
  const [seed, setSeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const [measured, setMeasured] = useState<{ state: ConsensusState; settlement: Settlement } | null>(null);

  const spec = useMemo<GraphSpec>(() => ({ kind, n }), [kind, n]);
  const muValue = useMemo(() => mu(spec), [spec]);
  const deltaStarValue = useMemo(() => deltaStar(muValue), [muValue]);
  const isExceptionalK4 = kind === "complete" && n === 4;

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = requestAnimationFrame(() => setRunning(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleMeasure = useCallback((state: ConsensusState, settlement: Settlement) => {
    setMeasured({ state, settlement });
    if (settlement !== "evolving") setRunning(false);
  }, []);

  const simKey = `${kind}-${n}-${preset}-${seed}-${resetNonce}`;

  return (
    <LabFrame
      caption={
        <>
          Vertices sit on the circle at their own phase, θ<sub>v</sub>; edges are the graph&rsquo;s
          connections, drawn as chords. The simulation integrates θ̇<sub>v</sub> = Σ Γ<sub>δ</sub>(wrap(θ
          <sub>u</sub> − θ<sub>v</sub>)) over neighbours u with fixed-step RK4 (Δt = {DT}) — a
          visualization of the paper&rsquo;s own model, not a research-grade solver.
        </>
      }
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Simulation
          key={simKey}
          spec={spec}
          preset={preset}
          seed={seed}
          delta={delta}
          running={running}
          onMeasure={handleMeasure}
        />

        <div className="w-full">
          <Controls>
            <label className="block">
              <span className="block font-sans text-[0.6875rem] font-medium tracking-[0.06em] text-ink-soft">Graph</span>
              <div className="mt-1.5 flex gap-4 font-sans text-[0.8125rem] text-ink">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="graph-kind"
                    checked={kind === "complete"}
                    onChange={() => {
                      setKind("complete");
                      setN((prev) => Math.min(Math.max(prev, 3), 7));
                    }}
                    className="accent-accent"
                  />
                  Complete graph K<sub>n</sub>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="graph-kind"
                    checked={kind === "cycle"}
                    onChange={() => {
                      setKind("cycle");
                      setN((prev) => Math.min(Math.max(prev, 5), 10));
                    }}
                    className="accent-accent"
                  />
                  Cycle C<sub>n</sub>
                </label>
              </div>
            </label>

            <Slider
              label="n (vertices)"
              value={n}
              min={kind === "complete" ? 3 : 5}
              max={kind === "complete" ? 7 : 10}
              step={1}
              onChange={setN}
              format={(v) => v.toFixed(0)}
            />

            <Slider
              label="δ (regularisation width)"
              value={delta}
              min={0.02}
              max={Math.PI - 0.02}
              step={0.01}
              onChange={setDelta}
              format={(v) => v.toFixed(2)}
              unit="rad"
            />
          </Controls>

          <Controls>
            <label className="block">
              <span className="block font-sans text-[0.6875rem] font-medium tracking-[0.06em] text-ink-soft">Initial phases</span>
              <div className="mt-1.5 flex gap-4 font-sans text-[0.8125rem] text-ink">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="preset"
                    checked={preset === "structured"}
                    onChange={() => setPreset("structured")}
                    className="accent-accent"
                  />
                  Theorem&rsquo;s minimiser
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="preset"
                    checked={preset === "random"}
                    onChange={() => setPreset("random")}
                    className="accent-accent"
                  />
                  Random
                </label>
              </div>
            </label>
          </Controls>

          <ButtonRow>
            <LabButton onClick={() => setRunning((p) => !p)} pressed={running}>
              {running ? "Pause" : "Run"}
            </LabButton>
            <LabButton onClick={() => setResetNonce((v) => v + 1)}>Reset</LabButton>
            {preset === "random" ? (
              <LabButton onClick={() => setSeed((s) => s + 1)}>Reseed</LabButton>
            ) : null}
          </ButtonRow>

          <Readout
            items={[
              { term: "μ(G)", value: muValue.toFixed(4) },
              { term: "δ*(G)", value: isExceptionalK4 ? "0 (rad)" : `${deltaStarValue.toFixed(4)} rad` },
              { term: "max |Δₑ|", value: measured ? `${measured.state.maxAbsDelta.toFixed(4)} rad` : "—" },
              { term: "Status", value: measured ? SETTLEMENT_LABEL[measured.settlement] : "—" },
            ]}
          />

          {isExceptionalK4 ? (
            <Note>
              K₄ is the paper&rsquo;s exceptional case: μ(K₄) = 1/2 exactly, so δ*(K₄) = 0 and no
              non-synchronous core equilibrium exists for any δ &gt; 0 (Corollary 4.3). The
              &ldquo;Theorem&rsquo;s minimiser&rdquo; preset here places two vertices exactly
              antipodal — the configuration of Figure 1(b) — which is not itself an equilibrium of
              the regularised model and generically drifts toward synchrony rather than settling.
            </Note>
          ) : (
            <Note>
              For {kind === "complete" ? <>K{n}</> : <>C{n}</>}, μ(G) = {muValue.toFixed(4)}, so the
              model has a stable non-synchronous equilibrium for every 0 &lt; δ &lt;{" "}
              {deltaStarValue.toFixed(3)} (Theorem 3.7). Raise δ past that threshold and the same
              initial condition should instead synchronize.
            </Note>
          )}
        </div>
      </div>
    </LabFrame>
  );
}
