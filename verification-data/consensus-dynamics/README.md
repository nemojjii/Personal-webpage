# Consensus dynamics — verification data

Supporting scripts and small result tables for `section-6-verification-notes.md`
(project root), the computational-verification pass for *The Geometry of
Disagreement*. Raw per-graph certificates and the large E1 simulation CSV are
not kept here (hundreds of MB) — only the aggregate summaries below.

## Contents

- `scripts/lattice.py` — exact (Fraction) lattice machinery: Π = I − BᵀL⁺B,
  dual-lattice membership checks, and the rank-dimensional winding-number
  parameterization used for exhaustive minimum-norm searches.
- `scripts/graph6.py` — a minimal graph6 decoder (validated against
  `networkx.from_graph6_bytes` on all 538 graphs at n=3–7, zero mismatches).
- `scripts/witness_search.py` — the numeric (float64) search for existence
  witnesses: one-edge, batched three-phase colouring, local-search fallback.
- `scripts/sim.py` — the regularized ICC model and plain Kuramoto, integrated
  with `scipy.integrate.solve_ivp` (DOP853).
- `scripts/part1.py` — Part ① re-verification of the paper's proven closed
  forms (K_n, C_n, theta graphs, subdivided tetrahedra, tripartite graphs).
  → `part1_results.json`
- `scripts/part2_small.py`, `scripts/part2_n9.py` — Theorem 6.1's exhaustive
  witness search for every 2-connected graph on 3–9 vertices.
  → `theorem6_1_n3to8_summary.json`, `n9_result.json`
- `scripts/run_E1.py`, `run_E2.py`, `run_E3.py` — the three simulation
  experiments. → `E1_summary.json`, `E1_above_deltastar.json`,
  `E2_results.json`, `E3_results.json`

## Running it yourself

Requires `nauty` (`brew install nauty`) and Python with numpy/scipy
(the scripts hardcode no paths that assume a specific Python install —
point any Python 3.9+ with numpy/scipy/fractions at them). Generate graph
lists first: `geng -c -C <n> > n<n>.g6` for each n, matching OEIS A002218
(1, 3, 10, 56, 468, 7123, 194066 for n=3..9).
