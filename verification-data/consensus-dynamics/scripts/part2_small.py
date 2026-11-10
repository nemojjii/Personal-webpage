import sys, time, json
sys.path.insert(0, "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc")
import numpy as np
from fractions import Fraction
from graph6 import decode_graph6
from witness_search import find_witness
from lattice import (
    exact_lambda_one_edge, exact_lambda_from_coloring,
    verify_in_dual_lattice, max_norm, is_nonzero,
)

rng = np.random.default_rng(12345)

summary = {}
anomalies = []
t0_all = time.time()

for n in range(3, 9):
    lines = [l.strip() for l in open(f"/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc/n{n}.g6") if l.strip()]
    total = len(lines)
    resolved_numeric = 0
    exact_ok = 0
    method_counts = {}
    k4_count = 0
    t0 = time.time()
    for g6 in lines:
        gn, edges = decode_graph6(g6)
        assert gn == n
        m = len(edges)
        is_K4 = (n == 4 and m == 6)
        if is_K4:
            k4_count += 1
            continue  # handled separately
        res = find_witness(n, edges, rng)
        method_counts[res["method"]] = method_counts.get(res["method"], 0) + 1
        if res["method"] == "UNRESOLVED":
            anomalies.append({"n": n, "g6": g6, "edges": edges, "result": res})
            continue
        resolved_numeric += 1
        # exact re-verification
        if res["method"] == "one-edge":
            lam = exact_lambda_one_edge(n, edges, res["edge"])
        else:
            lam = exact_lambda_from_coloring(n, edges, res["coloring"])
        ok, reason = verify_in_dual_lattice(n, edges, lam)
        nrm = max_norm(lam)
        if ok and is_nonzero(lam) and nrm < Fraction(1, 2):
            exact_ok += 1
        else:
            anomalies.append({"n": n, "g6": g6, "edges": edges, "result": res,
                               "exact_check_failed": True, "ok": ok, "reason": reason, "norm": str(nrm)})
    dt = time.time() - t0
    summary[n] = {
        "total": total, "k4_count": k4_count,
        "resolved_numeric": resolved_numeric, "exact_ok": exact_ok,
        "expected_resolved": total - k4_count,
        "method_counts": method_counts, "time_s": dt,
    }
    print(f"n={n}: total={total} K4={k4_count} resolved_numeric={resolved_numeric} exact_ok={exact_ok} "
          f"expected={total-k4_count} methods={method_counts} time={dt:.1f}s")

print(f"\nTotal time: {time.time()-t0_all:.1f}s")
print(f"Anomalies: {len(anomalies)}")
for a in anomalies[:10]:
    print(a)

with open("/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc/part2_small_summary.json", "w") as f:
    json.dump({"summary": summary, "anomalies": anomalies}, f, indent=2, default=str)
