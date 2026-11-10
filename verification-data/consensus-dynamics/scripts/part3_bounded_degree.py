"""
Push the Theorem 6.1-style witness search into the region Conjecture 7.2
leaves open: bounded-degree 2-connected graphs beyond n=9. Specifically,
every 4-regular 2-connected graph on 10-14 vertices (100,759 graphs) and
every 5-regular 2-connected graph on 10 or 12 vertices (7,908 graphs).

Same method as Theorem 6.1 (one-edge -> three-phase colouring -> local
search, numeric for speed, exact Fraction re-verification of the winner),
and the same certificate persistence as save_certificates.py. No graph
here is K4 (degree 4/5 on n>=10 can't be), so no exclusion needed.

If find_witness returns UNRESOLVED for anything, that is a genuinely
important event -- a candidate counterexample to Conjecture 7.2 -- and is
recorded prominently, not silently retried away.
"""
import sys, time, json, os
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

OUT_DIR = f"{BASE}/certificates_bounded_degree"
os.makedirs(OUT_DIR, exist_ok=True)

rng = np.random.default_rng(31415926)

targets = [("d4", n) for n in (10, 11, 12, 13, 14)] + [("d5", n) for n in (10, 12)]

grand = {"graphs": 0, "one_edge": 0, "coloring": 0, "local_search": 0, "UNRESOLVED": 0}
per_target = {}
unresolved_detail = []
t0_all = time.time()

for tag, n in targets:
    g6_path = f"{BASE}/{tag}_n{n}.g6"
    lines = [l.strip() for l in open(g6_path) if l.strip()]
    total = len(lines)
    out_path = f"{OUT_DIR}/certificates_{tag}_n{n}.jsonl"
    t0 = time.time()
    counts = {"one_edge": 0, "coloring": 0, "local_search": 0, "UNRESOLVED": 0}
    with open(out_path, "w") as out:
        for g6 in lines:
            gn, edges = decode_graph6(g6)
            assert gn == n
            res = find_witness(n, edges, rng)
            if res["method"] == "UNRESOLVED":
                counts["UNRESOLVED"] += 1
                detail = {"tag": tag, "n": n, "g6": g6, "edges": edges, "result": res}
                unresolved_detail.append(detail)
                out.write(json.dumps({"g6": g6, "UNRESOLVED": True, "detail": str(res)}) + "\n")
                continue

            if res["method"] == "one-edge":
                lam = exact_lambda_one_edge(n, edges, res["edge"])
                record = {"g6": g6, "e": res["edge"]}
                bucket = "one_edge"
            else:
                lam = exact_lambda_from_coloring(n, edges, res["coloring"])
                record = {"g6": g6, "c": [int(x) for x in res["coloring"]]}
                bucket = "coloring" if res["method"] == "coloring" else "local_search"

            ok, reason = verify_in_dual_lattice(n, edges, lam)
            nrm = max_norm(lam)
            if not (ok and is_nonzero(lam) and nrm < Fraction(1, 2)):
                record = {"g6": g6, "EXACT_CHECK_FAILED": True, "candidate": res,
                          "ok": ok, "reason": reason, "norm": str(nrm)}
                counts["UNRESOLVED"] += 1
                unresolved_detail.append({"tag": tag, "n": n, "g6": g6, "edges": edges,
                                          "result": res, "exact_check_failed": True,
                                          "ok": ok, "reason": reason, "norm": str(nrm)})
            else:
                counts[bucket] += 1
            out.write(json.dumps(record) + "\n")

    dt = time.time() - t0
    per_target[f"{tag}_n{n}"] = {"total": total, **counts, "time_s": dt}
    for k in ("one_edge", "coloring", "local_search", "UNRESOLVED"):
        grand[k] += counts[k]
    grand["graphs"] += total
    print(f"{tag} n={n}: total={total} one_edge={counts['one_edge']} coloring={counts['coloring']} "
          f"local_search={counts['local_search']} UNRESOLVED={counts['UNRESOLVED']} time={dt:.1f}s")

dt_all = time.time() - t0_all
with open(f"{OUT_DIR}/manifest.json", "w") as f:
    json.dump({"per_target": per_target, "grand_total": grand, "total_time_s": dt_all,
               "seed": 31415926, "unresolved": unresolved_detail,
               "scope": "4-regular 2-connected n=10..14 (100,759 graphs); "
                        "5-regular 2-connected n=10,12 (7,908 graphs). "
                        "Counts from geng -c -C -d{k} -D{k} n, matching the counts "
                        "quoted in the review that proposed this run.",
               "format": "same as certificates/manifest.json: {g6,e}, {g6,c}, or, if "
                         "anything resisted, {g6, UNRESOLVED: true, detail}."}, f, indent=2)

print(f"\nGRAND TOTAL: {grand}  (time: {dt_all:.1f}s)")
if unresolved_detail:
    print(f"\n!!! {len(unresolved_detail)} UNRESOLVED / FAILED — see manifest.json 'unresolved' !!!")
