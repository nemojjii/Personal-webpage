# Consensus dynamics — verification data

Supporting scripts and small result tables for `section-6-verification-notes.md`
(project root), the computational-verification pass for *The Geometry of
Disagreement*. The large E1 simulation CSV (per-seed, per-graph, per-δ raw
output) is not kept here (several MB, pure derived data, fully reproducible
from `run_E1.py`) — only its aggregate summaries below. The per-graph
Theorem 6.1 certificates, by contrast, **are** kept here (`certificates/`,
~6.4 MB) since they are the actual evidence behind "every one of 201,726
graphs checked out," not just a derived summary of it.

## Contents

- `certificates/certificates_n{3..9}.jsonl` — one line per 2-connected graph
  on n vertices (matching `geng -c -C n`, OEIS A002218), giving its graph6
  string and the minimal evidence needed to reconstruct and re-verify its
  Theorem 6.1 witness exactly: `{"g6": ..., "e": <edge index>}` for a
  one-edge witness, `{"g6": ..., "c": [0,1,...]}` for a three-phase
  colouring witness, or `{"g6": ..., "k4": true}` for K4 (the one graph
  with no witness, by design — see `scripts/part2_small.py`/`part2_n9.py`
  for the exhaustive confirmation that none exists below 1/2 for K4).
  `certificates/manifest.json` records the exact format, the RNG seed used
  for this archival run (a fresh, documented seed — not the same run as the
  original aggregate numbers, since a witness only needs to exist, not be
  reproduced bit-for-bit), and per-n/grand totals (zero anomalies).
- `scripts/save_certificates.py` — regenerates the files above from
  `n{3..9}.g6` (nauty output).

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
- `certificates_bounded_degree/` — Section 6.5's extension of the
  Theorem 6.1 search beyond n=9: every 2-connected 4-regular graph on
  10–14 vertices and every 2-connected 5-regular graph on 10 or 12
  vertices (108,667 graphs, same certificate format as `certificates/`,
  5.0 MB). `scripts/part3_bounded_degree.py` regenerates it from
  `d4_n{10..14}.g6`/`d5_n{10,12}.g6` (nauty, `-d{k} -D{k}` for exact
  k-regularity).
- `scripts/run_E1_largedelta.py` — Section 6.5's large-δ ramp-equilibrium
  search ($K_4$–$K_9$, δ∈{0.8,1.2,1.6,2.0,2.5}). →
  `E1_largedelta_summary.json`, `E1_largedelta_other_events.json` (the
  raw per-seed CSV is not kept here, same reasoning as E1's).

## Running it yourself

Requires `nauty` (`brew install nauty`) and Python with numpy/scipy
(the scripts hardcode no paths that assume a specific Python install —
point any Python 3.9+ with numpy/scipy/fractions at them). Generate graph
lists first: `geng -c -C <n> > n<n>.g6` for each n, matching OEIS A002218
(1, 3, 10, 56, 468, 7123, 194066 for n=3..9).
