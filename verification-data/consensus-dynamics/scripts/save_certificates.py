"""
Re-run the Theorem 6.1 witness search for n=3..9, this time PERSISTING a
compact per-graph certificate (g6 string + the minimal evidence needed to
reconstruct the witness exactly: an edge index for one-edge witnesses, or a
length-n coloring for three-phase witnesses) instead of discarding it after
the aggregate count. K4 (n=4, m=6) is recorded separately with no witness,
since none exists below 1/2 (established exactly in part1/the n=3-8 run via
exhaustive search of its rank-3 lattice: min ||lambda||_inf = 1/2 over all
342 candidates).

Output: one JSONL file per n, certificates_n{n}.jsonl, each line either
  {"g6": "...", "e": <edge index>}                    (one-edge witness)
  {"g6": "...", "c": [c0, c1, ..., c_{n-1}]}           (coloring witness)
  {"g6": "...", "k4": true}                            (K4 — no witness, by design)
"""
import sys, time, json
BASE = "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc"
sys.path.insert(0, BASE)
import numpy as np
from fractions import Fraction
from graph6 import decode_graph6
from witness_search import find_witness
from lattice import (
    exact_lambda_one_edge, exact_lambda_from_coloring,
    verify_in_dual_lattice, max_norm, is_nonzero,
)

OUT_DIR = f"{BASE}/certificates"
import os
os.makedirs(OUT_DIR, exist_ok=True)

rng = np.random.default_rng(20261110)  # fresh, documented seed for this archival run

grand_total = {"graphs": 0, "k4": 0, "one_edge": 0, "coloring": 0, "anomalies": 0}
per_n_summary = {}
t0_all = time.time()

for n in range(3, 10):
    g6_path = f"{BASE}/n{n}.g6"
    lines = [l.strip() for l in open(g6_path) if l.strip()]
    total = len(lines)
    out_path = f"{OUT_DIR}/certificates_n{n}.jsonl"
    t0 = time.time()
    counts = {"k4": 0, "one_edge": 0, "coloring": 0, "anomalies": 0}
    with open(out_path, "w") as out:
        for g6 in lines:
            gn, edges = decode_graph6(g6)
            assert gn == n
            m = len(edges)
            is_K4 = (n == 4 and m == 6)
            if is_K4:
                out.write(json.dumps({"g6": g6, "k4": True}) + "\n")
                counts["k4"] += 1
                continue

            res = find_witness(n, edges, rng)
            if res["method"] == "UNRESOLVED":
                # Should never happen (zero anomalies in the original run);
                # record prominently rather than silently skip.
                out.write(json.dumps({"g6": g6, "UNRESOLVED": True, "detail": str(res)}) + "\n")
                counts["anomalies"] += 1
                continue

            if res["method"] == "one-edge":
                lam = exact_lambda_one_edge(n, edges, res["edge"])
                record = {"g6": g6, "e": res["edge"]}
                bucket = "one_edge"
            else:
                lam = exact_lambda_from_coloring(n, edges, res["coloring"])
                record = {"g6": g6, "c": [int(x) for x in res["coloring"]]}
                bucket = "coloring"

            ok, reason = verify_in_dual_lattice(n, edges, lam)
            nrm = max_norm(lam)
            if not (ok and is_nonzero(lam) and nrm < Fraction(1, 2)):
                record = {"g6": g6, "EXACT_CHECK_FAILED": True,
                          "candidate": res, "ok": ok, "reason": reason, "norm": str(nrm)}
                counts["anomalies"] += 1
            else:
                counts[bucket] += 1

            out.write(json.dumps(record) + "\n")

    dt = time.time() - t0
    per_n_summary[n] = {"total": total, **counts, "time_s": dt}
    for k in ("k4", "one_edge", "coloring", "anomalies"):
        grand_total[k] += counts[k]
    grand_total["graphs"] += total
    print(f"n={n}: total={total} k4={counts['k4']} one_edge={counts['one_edge']} "
          f"coloring={counts['coloring']} anomalies={counts['anomalies']} time={dt:.1f}s "
          f"-> {out_path}")

dt_all = time.time() - t0_all
with open(f"{OUT_DIR}/manifest.json", "w") as f:
    json.dump({"per_n": per_n_summary, "grand_total": grand_total, "total_time_s": dt_all,
               "seed": 20261110,
               "format": "one JSONL file per n: certificates_n{n}.jsonl. Each line is "
                         "{g6, e}, {g6, c} or {g6, k4: true}. Edges are the pairs (u, v) "
                         "with u < v in the order produced by graph6.decode_graph6, which "
                         "is the graph6 bit order: sorted by v, then by u, i.e. (0,1), "
                         "(0,2), (1,2), (0,3), (1,3), (2,3), ...; each edge is oriented "
                         "from u to v. {g6, e}: one-edge witness lambda = Pi epsilon_e for "
                         "the edge with index e in this list. {g6, c}: three-phase "
                         "colouring witness, a length-n list of 0/1/2, with lambda_c = "
                         "Pi r_c and r_c(u,v) = wrap((c(v) - c(u))/3) in {0, 1/3, -1/3}. "
                         "{g6, k4: true}: K4, excluded by design (mu(K4) = 1/2, so no "
                         "witness below 1/2 exists)."}, f, indent=2)

print(f"\nGRAND TOTAL: {grand_total}  (time: {dt_all:.1f}s)")
