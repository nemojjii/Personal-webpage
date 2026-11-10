# Section 6 — Computational Methods and Verification

Working notes for Section 6 of *The Geometry of Disagreement: Stable
Non-Consensus States in Circle-Valued Network Dynamics*, written up so the
tables and numbers here can be dropped into the paper directly. Everything
below was actually run, not estimated; raw per-graph data and figures live
outside the repository (scratchpad), since they are large working files, not
something to version — ask if you want them regenerated or bundled
separately for an archival DOI.

## 6.1 Computational Methods and Reproducibility

**Tools.** Two independent pipelines, kept deliberately separate so a bug in
one could not hide in the other:

- An **exact** pipeline (Python, `fractions.Fraction`) that builds the
  oriented incidence matrix B, the Laplacian L = BBᵀ, its pseudoinverse
  L⁺ = (L + J/n)⁻¹ − J/n (all exact rational Gauss–Jordan inversion), and
  the cycle-space projector Π = I − BᵀL⁺B. By Lemma 3.2, F\*(G) = Π(ℤᴱ).
  Dual-lattice membership of a candidate λ is checked two independent ways:
  Bλ = 0 exactly, and the circulation of λ around every fundamental cycle
  of a spanning tree is an exact integer (Lemma 3.1). Both checks are run on
  every witness reported below.
- A **numeric** pipeline (NumPy/SciPy, float64) used only for *searching* —
  never for the final claim — via one-edge witnesses (Lemma 4.6/Prop 5.1)
  and batched random three-phase colourings (Section 5.2), vectorised over
  thousands of colourings at once for speed.

**Environment.** macOS 26.6.2 (Darwin 25.6.0, arm64). Python 3.11.15
(numpy 2.4.6, scipy 1.17.1, matplotlib 3.11.0) for the search/simulation
pipeline; a separate stock Python 3.9.6 is also present on the machine but
unused here. nauty 2.9.3 (`geng`), installed via Homebrew, for exhaustive
non-isomorphic graph enumeration. A custom graph6 decoder was written for
speed at n = 9 scale and validated against `networkx.from_graph6_bytes` on
all 538 graphs at n = 3–7 with zero mismatches before being trusted at
scale.

**Models implemented.** The regularised intrinsic circle consensus model
$M_\delta$ of Section 3.3 exactly as stated — $\dot\theta_v = \sum_{u\sim v}
\Gamma_\delta(\mathrm{wrap}(\theta_u-\theta_v))$ — and, for comparison, the
identical-oscillator Kuramoto model $\dot\theta_v = \sum_{u\sim v}
\sin(\theta_u-\theta_v)$. Integration for E1 and E3:
`scipy.integrate.solve_ivp`, `method="DOP853"`, `rtol=1e-10`, `atol=1e-12`,
with a terminal event firing at $\max_v|\dot\theta_v| < 10^{-9}$ (cap
$t=2000$, never reached in practice). **E2 uses a different, fixed-step
RK4 integrator (dt = 0.01)**, not `solve_ivp` — flagged explicitly here
since it is a real difference between the two scripts, not a typo: E2
needs many short, identically-spaced trajectories to fit a decay slope by
linear regression over a chosen time window, for which a fixed step is the
simpler and more directly controllable choice; it does not affect E1/E3,
which use the adaptive integrator throughout. Classification exactly as
agreed: **sync** if $\max_e|\Delta_e|<10^{-6}$; **core** if additionally
$\max_e|\Delta_e|<\pi-\delta-10^{-6}$ and $\|B\Delta\|_\infty<10^{-8}$;
else **other** (none occurred in any run below). One implementation detail
worth recording: `wrap` is implemented to map into $[-\pi,\pi)$, whereas
the paper's own convention (Section 3.3) is $(-\pi,\pi]$; this has no
numerical effect here since $\Gamma_\delta(\pm\pi)=0$ under either
convention, so the antipodal point is force-free either way, but it would
matter if the code were reused for something that evaluates $\Delta_e$
itself at exactly $\pm\pi$.

**Prior work.** No pre-existing certificate file was available in this
environment (an `icc_R8_certificates.zip` referenced in earlier planning
notes could not be located); the exhaustive-witness search and verifier
below were written from scratch, not loaded from a prior run. The easy/hard
split this method finds at n = 9 (141,265 / 52,801) matches a figure already
anticipated in those same planning notes, which is a useful cross-check but
not something this run depended on.

**Code and data.** This repository (`academic-site`) carries the aggregate
tables, this write-up, all verification/simulation scripts, and — since
6.4 — the full per-graph Theorem 6.1 certificates (6.4 MB, all 201,726
non-K4 graphs). Only the bulky, purely-derived simulation CSVs and figures
(E1's per-seed raw output, E2/E3 plots) stay local-only, since they are
fully reproducible from the committed scripts and seeds rather than being
independent evidence in their own right. Before citing "code available
at…" in the manuscript, push this repository (or extract the
`verification-data/` directory) to a citable location — GitHub + a Zenodo
DOI is the natural choice, MIT for code / CC-BY 4.0 for data.

## 6.2 Finite Verification: Every 2-Connected Graph on 3–9 Vertices

**Theorem 6.1 (finite verification).** *Every 2-connected graph with at
most nine vertices, other than $K_4$, satisfies $\mu(G)<1/2$. Consequently,
a connected graph with at most nine vertices satisfies $\mu(G)<1/2$ if and
only if it has a block that is neither a bridge nor $K_4$.*

**Method.** Rather than a pre-built certificate file, every 2-connected
graph on 3–9 vertices was enumerated directly with `geng -c -C n`, and for
every one of them *other than $K_4$* an explicit witness
$\lambda\in F^*(G)\setminus\{0\}$ with $\|\lambda\|_\infty<1/2$ was
constructed and verified exactly — an **existence certificate**, in the
spirit of the paper's own certificates, not a search for the true minimiser
$\mu(G)$ itself. The search order, cheapest first:

1. **One-edge witness** (Lemma 4.6): if any edge has effective resistance
   $R_e>1/2$, then $\lambda=\Pi(\varepsilon_e)$ witnesses
   $\|\lambda\|_\infty=1-R_e<1/2$ (Proposition 5.1). Resistances for every
   edge of a graph are obtained from one float64 pseudoinverse per graph.
2. **Three-phase colouring** (Corollary 5.5): for graphs that fail step 1
   ("hard" graphs, Section 5.1), up to 4,000 random 3-colourings are tried
   at once (fully vectorised — one batched matrix multiply handles all of
   them), taking the one with smallest nonzero $\|\lambda_c\|_\infty$.
3. **Local search fallback**: if step 2 does not clear $1/2$, up to five
   random-restart hill-climbing searches (single-vertex recolouring moves)
   are run. (In practice, this fallback was never needed — step 2 always
   succeeded.)

Every candidate winner, regardless of which step found it, is then
*exactly* reconstructed in the Fraction pipeline and checked: $B\lambda=0$
exactly, integer circulation on every fundamental cycle, and
$0<\|\lambda\|_\infty<1/2$ as an exact fraction. $K_4$ is excluded from this
search and confirmed separately, exactly, by a true exhaustive search of
its rank-3 lattice (bound $\pm3$ on each of the three winding-number
coordinates): the minimum nonzero $\|\lambda\|_\infty$ over all 342
candidates is exactly $1/2$, matching Theorem 4.2/Proposition 4.5 — i.e.
no witness below $1/2$ exists for $K_4$, as the theorem requires.

**Coverage — complete, not a sample.**

| $n$ | 2-connected graphs (OEIS A002218) | Excluded ($K_4$) | Witnesses found & exactly verified | Anomalies |
|---|---|---|---|---|
| 3 | 1 | 0 | 1 | 0 |
| 4 | 3 | 1 | 2 | 0 |
| 5 | 10 | 0 | 10 | 0 |
| 6 | 56 | 0 | 56 | 0 |
| 7 | 468 | 0 | 468 | 0 |
| 8 | 7,123 | 0 | 7,123 | 0 |
| 9 | 194,066 | 0 | 194,066 | 0 |
| **Total** | **201,727** | **1** | **201,726** | **0** |

Every one of the 201,726 graphs other than $K_4$ was resolved and exactly
verified — not a sample, and not merely a numeric pass. (The numeric search
and the exact re-verification both ran to completion on every single
graph.) This figure, 201,726, matches the count the paper's own introduction
already anticipates for this range.

Resolution method at each $n$ (one-edge vs. three-phase colouring):

| $n$ | one-edge (easy) | colouring (hard) |
|---|---|---|
| 3 | 1 | 0 |
| 4 | 2 | 0 |
| 5 | 8 | 2 |
| 6 | 44 | 12 |
| 7 | 378 | 90 |
| 8 | 5,644 | 1,479 |
| 9 | 141,265 | 52,801 |

**Runtime.** n ≤ 8 (search + exact verification of every graph): 25.5 s.
n = 9 (194,066 graphs): numeric search + exact verification of every
single graph, 1,033.4 s (≈ 17.2 min) at a sustained throughput of
≈ 188 graphs/s.

**Anomalies.** None. No graph other than $K_4$ resisted the search; no
exact verification failed on a numerically-found candidate. (One bug was
caught and fixed during development of the search code: the batched
three-phase search could converge to the *trivial* all-vertices-one-colour
assignment, giving $\lambda=0$ — not a valid witness, since $\mu$ requires a
nonzero vector. The search was corrected to exclude near-zero norms before
taking an argmin; after the fix, re-running the full n = 3–8 sweep gave
zero anomalies.)

## 6.3 Exploratory Simulations and Observational Results

### E1 — Basin-of-attraction survey on $K_3$–$K_9$

Protocol exactly as agreed (Section 6.1): $N=2000$ random seeds per
(graph, $\delta$) pair, $\theta_v(0)\sim\mathrm{Unif}[0,2\pi)$ i.i.d.

| Graph | $\delta^*(K_n)$ (rad) | $\delta=0.05$ | $\delta=0.1$ | $\delta=0.2$ | $\delta=0.4$ |
|---|---|---|---|---|---|
| $K_3$ | 1.0472 | 23.4% [21.5,25.3] | 25.1% [23.2,27.0] | 20.7% [19.0,22.5] | 14.1% [12.6,15.7] |
| $K_4$ | 0 | 0.0% | 0.0% | 0.0% | 0.0% |
| $K_5$ | 0.6283 | 36.6% [34.5,38.7] | 31.6% [29.6,33.7] | 29.8% [27.8,31.8] | 19.2% [17.5,21.0] |
| $K_6$ | 1.0472 | 5.7% [4.7,6.7] | 6.7% [5.6,7.8] | 5.1% [4.2,6.1] | 4.5% [3.7,5.5] |
| $K_7$ | 0.4488 | 42.0% [39.8,44.1] | 40.1% [37.9,42.2] | 32.9% [30.9,35.0] | 16.5% [14.9,18.2] |
| $K_8$ | 0.7854 | 12.8% [11.4,14.3] | 12.5% [11.1,14.0] | 12.6% [11.2,14.1] | 8.4% [7.2,9.6] |
| $K_9$ | 1.0472 | 47.8% [45.6,50.0] | 43.6% [41.4,45.8] | 34.9% [32.8,37.0] | 3.0% [2.3,3.8] |

Cell values are the **core rate** — the fraction of 2,000 random starts
settling into a non-synchronous core equilibrium — with 95% Wilson
intervals. $K_4$ gives exactly 0% at every $\delta$ tested, as the theorem
requires. None of 0.05/0.1/0.2/0.4 happen to exceed $\delta^*(K_n)$ for any
$n\neq4$ in this table, so a **supplementary run** was added, one $\delta$
chosen just above $\delta^*(K_n)$ for each $n$:

| Graph | $\delta^*(K_n)$ | $\delta$ tested (above) | core rate |
|---|---|---|---|
| $K_3$ | 1.0472 | 1.1972 | 0 / 2000 |
| $K_5$ | 0.6283 | 0.7783 | 0 / 2000 |
| $K_6$ | 1.0472 | 1.1972 | 0 / 2000 |
| $K_7$ | 0.4488 | 0.5988 | 0 / 2000 |
| $K_8$ | 0.7854 | 0.9354 | 0 / 2000 |
| $K_9$ | 1.0472 | 1.1972 | 0 / 2000 |

The core rate drops to **exactly zero** the moment $\delta$ crosses
$\delta^*(K_n)$, for every $n$ tested — sharply **consistent with**
Corollary 3.4's "only if" direction as well as its "if" direction. (Both
directions are already proven in the paper; what the simulation adds is
not a new proof but a clean empirical picture of where the cutoff falls
in practice, and a check that nothing in the implementation contradicts
it.)

### E2 — Decay-rate check

$K_6$'s (2,2,2) three-cluster equilibrium ($\lambda_2(L)=6$) and the
octahedron $K_{2,2,2}$ ($\lambda_2(L)=4$, confirmed directly from the
Laplacian spectrum: eigenvalues $\{0,4,4,4,6,6\}$), $\delta=0.1$, 10
perturbation trials each at $\|\eta^\perp\|=10^{-3}$ and $10^{-1}$, fitting
the slope of $\log\|\xi(t)\|$ against $t$:

| Configuration | $\lambda_2$ (theory) | $\|\eta^\perp\|$ | fitted rate | rel. error |
|---|---|---|---|---|
| $K_6$ (2,2,2) | 6.0 | $10^{-3}$ | 6.0001 | 0.001% |
| $K_6$ (2,2,2) | 6.0 | $10^{-1}$ | 6.0003 | 0.005% |
| $K_{2,2,2}$ octahedron | 4.0 | $10^{-3}$ | 4.0000 | 0.0005% |
| $K_{2,2,2}$ octahedron | 4.0 | $10^{-1}$ | 4.0000 | 0.0002% |

Both configurations converge to within 0.01% of $\lambda_2(L)$, confirming
Proposition 3.5's exponential rate exactly. One genuine subtlety surfaced
and is worth recording: because the octahedron's Laplacian spectrum has
*two* nonzero eigenvalues (4 and 6, each with multiplicity 3 and 2), a
generic random perturbation excites both modes, and an **early-time** fit
of the decay slope reads a few percent *faster* than $\lambda_2$ (the
$e^{-6t}$ component has not yet died away). Fitting the tail instead
(here, $t\in[2.5,5.0]$, late enough for the faster mode to be negligible
but early enough to stay above the float64 noise floor) recovers
$\lambda_2$ to four decimal places. This is consistent with — not a
contradiction of — Proposition 3.5, whose bound $|\xi(t)|\le
e^{-\lambda_2t}|\eta_0^\perp|$ is an upper bound, not a claim that every
mode decays at exactly that rate.

### E3 — ICC vs. Kuramoto on dense graphs

$\delta=0.1$ for the ICC law, $N=2000$ shared seeds per graph, same
initial conditions fed to both laws:

| Graph | $n$ | $d_{\min}$ | $6d_{\min}>5n-2$? | $\bar\mu(G)$ bound (Thm 5.9a) | ICC non-sync rate | Kuramoto non-sync rate |
|---|---|---|---|---|---|---|
| $K_5$ | 5 | 4 | yes | ≤ 0.4667 | 32.7% | 0.0% |
| $K_6$ | 6 | 5 | yes | ≤ 0.4444 | 6.3% | 0.0% |
| $K_8$ | 8 | 7 | yes | ≤ 0.4167 | 10.6% | 0.0% |
| $K_{12}$ minus a perfect matching | 12 | 10 | yes | ≤ 0.4667 | 38.1% | 0.0% |
| $K_{18}$ minus a Hamiltonian cycle | 18 | 15 | yes | ≤ 0.4762 | 17.1% | 0.0% |

Every graph here satisfies the Theorem 5.9(a) density condition (confirmed,
not assumed), and therefore also the Kassabov–Strogatz–Townsend threshold
for Kuramoto synchronisation — matching the observed 0.0% non-sync rate for
Kuramoto on every graph, exactly. The regularised geodesic law, on the very
same graphs with the very same initial conditions, leaves a substantial,
non-vanishing fraction (6.3%–38.1%) in stable disagreement. This is the
paper's comparative claim (Corollary 5.10) made concrete: the same network,
two coupling laws, opposite stability conclusions.

### E4

Not run (optional per the plan; the n ≤ 9 exhaustive result in 6.2 already
gives strong evidence that no non-K₄ graph behaves like K₄, and probing
ramp-boundary equilibria specifically was judged lower priority than
completing 6.2 and E1–E3 in full).

## 6.4 Computational Limitations and Verification Scope

**What was and was not checked.** Theorem 6.1 and the search in 6.2 concern
only *core* equilibria — configurations with every edge strictly inside the
central linear branch $|\Delta_e|<\pi-\delta$ (Section 3.3). Nothing here
says anything about equilibria with an edge sitting on the ramp itself; the
paper is explicit (Section 7) that this case is open, and E4 (not run — see
6.3) was the planned first probe of it. The 6.2 search is an **existence**
search, not a minimisation: every certificate shows $\mu(G)<1/2$, not the
exact value of $\mu(G)$ itself, for the 201,726 non-$K_4$ graphs. Where the
*exact value* is also claimed (the Appendix), that is stated and checked
separately, with the box-bound argument above, and only for the 28 rows
where it was computationally tractable.

**Certificates are archived, not just asserted.** Every one of the 201,726
witnesses behind the 6.2 table is saved, not merely re-derivable from a
fixed seed: `verification-data/consensus-dynamics/certificates/` in this
repository holds one newline-delimited JSON file per $n\in\{3,\dots,9\}$
(`certificates_n{n}.jsonl`), each line giving a graph's graph6 string and
the minimal evidence needed to reconstruct its witness exactly — an edge
index for a one-edge witness, or a 0/1/2 colouring for a three-phase
witness (K4 is recorded with no witness, by design). Total size 6.4 MB
across all seven files (194,066 lines for n=9 alone), well within the
~5 MB ballpark expected for data of this shape. This removes the earlier
reproducibility gap: the original run stored only aggregate counts, so
reproducing it exactly depended on numpy's random-number generator
producing identical draws across versions, which is not guaranteed. The
archived certificates were generated by a second, independent run
(`scripts/save_certificates.py`, documented seed 20261110, not the same
seed as the first run) and gave the identical grand totals — zero
anomalies, 147,342 one-edge witnesses, 54,384 colouring witnesses — a
useful consistency check in its own right, in addition to closing the
archival gap.

**Reproducibility.** Running `scripts/save_certificates.py` (or
`part2_small.py`/`part2_n9.py`) again, with nauty's `geng` producing the
same graph lists (deterministic — nauty's enumeration order does not
depend on any RNG), will find *a* valid witness for every non-K4 graph
again, but not necessarily the *same* witness per graph, since the search
is randomised and existence (not a canonical choice) is all that is
claimed. This is why the certificates are archived directly rather than
left to regeneration.

## 6.5 Pushing Into the Open Region: Bounded-Degree Graphs and Large δ

Two follow-up checks, run in response to review, go beyond the n≤9
exhaustive result and beyond the δ≤0.4 range of the original E1–E3. Both
use exactly the same machinery as 6.2/6.3; nothing new was built.

**Bounded-degree 2-connected graphs beyond n = 9.** The conjecture's open
region (the graphs not settled by the n≤9 exhaustive check or by the
density theorem) is the regime of bounded-degree, moderately dense "hard"
graphs. As a direct, exact probe of that region: every 2-connected
4-regular graph on 10–14 vertices, and every 2-connected 5-regular graph
on 10 or 12 vertices, enumerated with `geng -c -C -d{k} -D{k} n`:

| Degree | $n$ | Graphs | One-edge | Colouring | UNRESOLVED |
|---|---|---|---|---|---|
| 4 | 10 | 59 | 13 | 46 | 0 |
| 4 | 11 | 264 | 115 | 149 | 0 |
| 4 | 12 | 1,542 | 877 | 665 | 0 |
| 4 | 13 | 10,768 | 7,193 | 3,575 | 0 |
| 4 | 14 | 88,126 | 66,773 | 21,353 | 0 |
| 5 | 10 | 60 | 0 | 60 | 0 |
| 5 | 12 | 7,848 | 4 | 7,844 | 0 |
| **Total** | | **108,667** | **74,975** | **33,692** | **0** |

Every one of the 108,667 graphs produced an exactly-verified witness with
$\|\lambda\|_\infty<1/2$ — zero exceptions, zero candidates resisting the
search (the local-search fallback was never invoked). Runtime: 1,979 s
(≈33 min) total, almost all of it ($\approx$1,735 s) the 4-regular n = 14
batch, which is markedly 5-regular-heavier on the "hard" (colouring)
branch as $n$ grows — a trend worth watching if this is pushed further.
As with 6.2, these are existence witnesses, not a minimisation, and this
extends — it does not replace — the n≤9 exhaustive result: it is direct
computational evidence that $\mu(G)<1/2$ continues to hold throughout this
part of the bounded-degree region beyond nine vertices, narrowing what is
left open, though it does not by itself prove the general conjecture.
Certificates (graph6 + witness) for all 108,667 graphs are archived at
`verification-data/consensus-dynamics/certificates_bounded_degree/`
(5.0 MB), in the same format as 6.2's, documented in that directory's own
`manifest.json`.

**Large-δ search for ramp equilibria.** Every simulation in the original
E1–E3 used $\delta\le0.4$. To probe the open question of whether a stable
equilibrium with an edge actually on the ramp can exist (rather than only
synchronous or core outcomes), E1's protocol was rerun on $K_4$–$K_9$ at
$\delta\in\{0.8,1.2,1.6,2.0,2.5\}$, $N=2{,}000$ random starts each
(60,000 runs total):

| Graph | 0.8 | 1.2 | 1.6 | 2.0 | 2.5 |
|---|---|---|---|---|---|
| $K_4$ | sync 2000 | sync 2000 | sync 2000 | sync 2000 | sync 2000 |
| $K_5$ | sync 2000 | sync 2000 | sync 2000 | sync 2000 | sync 2000 |
| $K_6$ | core 5, sync 1995 | sync 2000 | sync 2000 | sync 2000 | sync 2000 |
| $K_7$ | sync 2000 | sync 2000 | sync 2000 | sync 2000 | sync 2000 |
| $K_8$ | sync 2000 | sync 2000 | sync 2000 | sync 2000 | sync 2000 |
| $K_9$ | core 3, sync 1997 | sync 2000 | sync 2000 | sync 2000 | sync 2000 |

**Zero "other" (ramp) outcomes across all 60,000 runs.** The handful of
non-zero core counts, all at $\delta=0.8$ for $K_6$ and $K_9$, occur
exactly where $\delta$ is still below $\delta^*(K_6)=\delta^*(K_9)\approx
1.0472$ — i.e. they are ordinary core equilibria inside the regime 6.2
already covers, not a new phenomenon. This is a negative result on a
genuinely open question (whether the geodesic model ever settles into a
ramp equilibrium from a generic start): across 60,000 random initial
conditions at regularisation widths well beyond anything tested before,
none were found. It does not settle the question — a measure-zero or
narrow-basin ramp equilibrium could still exist and simply not be hit by
random sampling at this count — but it is real, reportable evidence
against their being common, and is consistent with (not a new proof of)
whatever Section 7's closing discussion of this question already claims.
Raw per-run data (60,001 rows) is local-only, pure derived output; the
summary table above and the (empty) list of "other" events are archived
at `verification-data/consensus-dynamics/E1_largedelta_summary.json` and
`E1_largedelta_other_events.json`.

## Appendix: the re-verified closed forms (companion to Table 1)

**On the "constructed+exhaustive min." check.** For 28 of the 35 rows
below, the table claims not just that the paper's construction gives a
valid witness of the stated norm (always checked, as in 6.2), but that
this witness is the *true minimum* $\mu(G)$ — i.e. that no shorter nonzero
vector exists in $F^*(G)$ at all. That stronger claim needs its own
justification, since it was checked by a *bounded* search over the
fundamental-cycle winding-number coordinates $t=C\lambda$ (Lemma 4.4),
$|t_j|\le b$ for some box bound $b$, and a bounded search can only be
exhaustive if every vector achieving norm at most the claimed value $x$ is
guaranteed to lie inside that box. It is: since $t_j=\langle c_j,\lambda\rangle$
is a sum of $\pm\lambda_e$ over the $\ell_j$ edges on the boundary of face
$j$ (or, outside the planar-dual cases, over the $\ell_j$ edges of the
$j$-th fundamental cycle), $|t_j|\le \ell_j\cdot\|\lambda\|_\infty$. So a
box of radius $b_j=\lceil \ell_j\cdot x\rceil$ on coordinate $j$ provably
contains every $\lambda$ with $\|\lambda\|_\infty\le x$, and is therefore
safe to search exhaustively. This bound, $b_j=\lceil\ell_j\cdot x\rceil$
with $x$ the paper's claimed $\mu(G)$ for that row, was checked directly
against the box actually used for all 28 rows before trusting the
"exhaustive min." label; in every case the box used was at least as large
as this requirement. The remaining 7 rows ($K_n$ for $n\ge8$, and
$K_{3,3,3}$/$K_{4,4,4}$) have cyclomatic rank too large for this to be
practical, and are labelled "constructed, membership only" — the witness
is verified to lie in $F^*(G)$ with the claimed norm, but the true minimum
was not independently re-confirmed by exhaustive search for those rows.

| Family | Param | n | m | μ(G) | δ*(G) | Theorem | Check |
|---|---|---|---|---|---|---|---|
| K_n (complete) | 3 | 3 | 3 | 1/3 | π·1/3 | Theorem 4.2 | constructed+exhaustive min. |
| K_n (complete) | 4 | 4 | 6 | 1/2 | 0 | Theorem 4.2 | constructed+exhaustive min. |
| K_n (complete) | 5 | 5 | 10 | 2/5 | π·1/5 | Theorem 4.2 | constructed+exhaustive min. |
| K_n (complete) | 6 | 6 | 15 | 1/3 | π·1/3 | Theorem 4.2 | constructed+exhaustive min. |
| K_n (complete) | 7 | 7 | 21 | 3/7 | π·1/7 | Theorem 4.2 | constructed+exhaustive min. |
| K_n (complete) | 8 | 8 | 28 | 3/8 | π·1/4 | Theorem 4.2 | constructed, membership only |
| K_n (complete) | 9 | 9 | 36 | 1/3 | π·1/3 | Theorem 4.2 | constructed, membership only |
| K_n (complete) | 10 | 10 | 45 | 2/5 | π·1/5 | Theorem 4.2 | constructed, membership only |
| K_n (complete) | 11 | 11 | 55 | 4/11 | π·3/11 | Theorem 4.2 | constructed, membership only |
| K_n (complete) | 12 | 12 | 66 | 1/3 | π·1/3 | Theorem 4.2 | constructed, membership only |
| C_n (cycle) | 3 | 3 | 3 | 1/3 | π·1/3 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 4 | 4 | 4 | 1/4 | π·1/2 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 5 | 5 | 5 | 1/5 | π·3/5 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 6 | 6 | 6 | 1/6 | π·2/3 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 7 | 7 | 7 | 1/7 | π·5/7 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 8 | 8 | 8 | 1/8 | π·3/4 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 9 | 9 | 9 | 1/9 | π·7/9 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 10 | 10 | 10 | 1/10 | π·4/5 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 11 | 11 | 11 | 1/11 | π·9/11 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| C_n (cycle) | 12 | 12 | 12 | 1/12 | π·5/6 | Theorem 4.8(c), N=2 | constructed+exhaustive min. |
| theta(a,a,a) | 2 | 5 | 6 | 1/3 | π·1/3 | Theorem 4.8(c), N=3 | constructed+exhaustive min. |
| theta(a,a,a) | 3 | 8 | 9 | 2/9 | π·5/9 | Theorem 4.8(c), N=3 | constructed+exhaustive min. |
| theta(a,a,a) | 4 | 11 | 12 | 1/6 | π·2/3 | Theorem 4.8(c), N=3 | constructed+exhaustive min. |
| theta(a,a,a) | 5 | 14 | 15 | 2/15 | π·11/15 | Theorem 4.8(c), N=3 | constructed+exhaustive min. |
| theta(a,a,a) | 6 | 17 | 18 | 1/9 | π·7/9 | Theorem 4.8(c), N=3 | constructed+exhaustive min. |
| K4^(a) (subdivided tetrahedron) | 1 | 4 | 6 | 1/2 | 0 | Theorem 4.8(c), N=4 | constructed+exhaustive min. |
| K4^(a) (subdivided tetrahedron) | 2 | 10 | 12 | 1/4 | π·1/2 | Theorem 4.8(c), N=4 | constructed+exhaustive min. |
| K4^(a) (subdivided tetrahedron) | 3 | 16 | 18 | 1/6 | π·2/3 | Theorem 4.8(c), N=4 | constructed+exhaustive min. |
| K4^(a) (subdivided tetrahedron) | 4 | 22 | 24 | 1/8 | π·3/4 | Theorem 4.8(c), N=4 | constructed+exhaustive min. |
| K4^(a) (subdivided tetrahedron) | 5 | 28 | 30 | 1/10 | π·4/5 | Theorem 4.8(c), N=4 | constructed+exhaustive min. |
| K4^(a) (subdivided tetrahedron) | 6 | 34 | 36 | 1/12 | π·5/6 | Theorem 4.8(c), N=4 | constructed+exhaustive min. |
| K_{a,a,a} (balanced tripartite) | 1 | 3 | 3 | 1/3 | π·1/3 | Theorem 5.7(a) | constructed+exhaustive min. |
| K_{a,a,a} (balanced tripartite) | 2 | 6 | 12 | 1/3 | π·1/3 | Theorem 5.7(a) | constructed+exhaustive min. |
| K_{a,a,a} (balanced tripartite) | 3 | 9 | 27 | 1/3 | π·1/3 | Theorem 5.7(a) | constructed, membership only |
| K_{a,a,a} (balanced tripartite) | 4 | 12 | 48 | 1/3 | π·1/3 | Theorem 5.7(a) | constructed, membership only |
