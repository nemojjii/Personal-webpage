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

rng = np.random.default_rng(987654321)
BASE = "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc"
log_path = f"{BASE}/n9_progress.log"
result_path = f"{BASE}/n9_result.json"

lines = [l.strip() for l in open(f"{BASE}/n9.g6") if l.strip()]
total = len(lines)

resolved_numeric = 0
exact_ok = 0
method_counts = {}
anomalies = []
t0 = time.time()
CHUNK = 5000

with open(log_path, "w") as logf:
    logf.write(f"start total={total}\n")
    logf.flush()
    for i, g6 in enumerate(lines):
        n, edges = decode_graph6(g6)
        assert n == 9
        res = find_witness(n, edges, rng)
        method_counts[res["method"]] = method_counts.get(res["method"], 0) + 1
        if res["method"] == "UNRESOLVED":
            anomalies.append({"n": n, "g6": g6, "edges": edges, "result": res})
            continue
        resolved_numeric += 1
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

        if (i + 1) % CHUNK == 0 or (i + 1) == total:
            dt = time.time() - t0
            rate = (i + 1) / dt
            eta = (total - (i + 1)) / rate if rate > 0 else -1
            logf.write(f"{i+1}/{total} resolved={resolved_numeric} exact_ok={exact_ok} "
                       f"anomalies={len(anomalies)} elapsed={dt:.1f}s rate={rate:.1f}/s eta={eta:.1f}s\n")
            logf.flush()

dt = time.time() - t0
summary = {
    "total": total, "resolved_numeric": resolved_numeric, "exact_ok": exact_ok,
    "method_counts": method_counts, "time_s": dt, "anomaly_count": len(anomalies),
}
with open(result_path, "w") as f:
    json.dump({"summary": summary, "anomalies": anomalies}, f, indent=2, default=str)

with open(log_path, "a") as logf:
    logf.write(f"DONE: {summary}\n")
print(json.dumps(summary, indent=2))
