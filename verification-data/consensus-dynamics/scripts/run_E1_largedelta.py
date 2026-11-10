"""
E1 at large delta, addressing the review's point that every prior run
stayed at delta<=0.4 -- squarely inside the region where Lemma 7.7 (if
cited correctly) predicts core equilibria are the only possible outcome
besides sync. This sweep is the first to probe whether 'other' (a ramp
equilibrium -- some edge sitting exactly on or having crossed into the
ramp, Section 7.4/7.8's open question) ever actually occurs.

K4-K9, delta in {0.8, 1.2, 1.6, 2.0, 2.5}, N=2000 seeds each, same
protocol/classification as the original run_E1.py.
"""
import sys, time, json, csv, math
sys.path.insert(0, "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc")
import numpy as np
from sim import run_icc

def Kn_edges(n):
    return [(i, j) for i in range(n) for j in range(i + 1, n)]

def mu_complete(n):
    return math.ceil(n / 3) / n

def delta_star(n):
    return math.pi * (1 - 2 * mu_complete(n))

def wilson_ci(k, n, z=1.96):
    if n == 0:
        return (0.0, 0.0, 0.0)
    phat = k / n
    denom = 1 + z * z / n
    center = (phat + z * z / (2 * n)) / denom
    half = (z * math.sqrt(phat * (1 - phat) / n + z * z / (4 * n * n))) / denom
    return (phat, max(0.0, center - half), min(1.0, center + half))

BASE = "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc"
N_SEEDS = 2000
DELTAS = [0.8, 1.2, 1.6, 2.0, 2.5]
NS = list(range(4, 10))  # K4..K9

csv_path = f"{BASE}/E1_largedelta_raw.csv"
summary_rows = []
other_events = []

t0 = time.time()
with open(csv_path, "w", newline="") as cf:
    writer = csv.writer(cf)
    writer.writerow(["graph", "n", "delta", "seed", "status", "t_final", "max_abs_delta",
                      "div_norm", "lambda_inf", "converged"])
    for n in NS:
        edges = Kn_edges(n)
        dstar = delta_star(n)
        for delta in DELTAS:
            counts = {"sync": 0, "core": 0, "other": 0}
            rng = np.random.default_rng(2000000 + 1000 * n + int(delta * 1000))
            for seed in range(N_SEEDS):
                theta0 = rng.uniform(0, 2 * np.pi, size=n)
                r = run_icc(edges, n, delta, theta0)
                counts[r["status"]] = counts.get(r["status"], 0) + 1
                writer.writerow([f"K{n}", n, delta, seed, r["status"], r["t_final"],
                                  r["max_abs_delta"], r["div_norm"], r["lambda_inf"], r["converged"]])
                if r["status"] == "other":
                    other_events.append({
                        "graph": f"K{n}", "n": n, "delta": delta, "seed": seed,
                        "t_final": r["t_final"], "max_abs_delta": r["max_abs_delta"],
                        "div_norm": r["div_norm"], "converged": r["converged"],
                        "theta_final": r["theta_final"].tolist(),
                    })
            phat, lo, hi = wilson_ci(counts["core"], N_SEEDS)
            row = {
                "graph": f"K{n}", "n": n, "delta": delta, "delta_star": dstar,
                "below_delta_star": delta < dstar,
                "sync": counts["sync"], "core": counts["core"], "other": counts.get("other", 0),
                "core_rate": phat, "core_rate_ci_lo": lo, "core_rate_ci_hi": hi,
            }
            summary_rows.append(row)
            print(f"K{n} delta={delta} (delta*={dstar:.4f}): sync={counts['sync']} "
                  f"core={counts['core']} other={counts.get('other',0)}")

dt = time.time() - t0
print(f"\nE1-large-delta total time: {dt:.1f}s")
print(f"Total 'other' events across all {len(NS)*len(DELTAS)*N_SEEDS} runs: {len(other_events)}")

with open(f"{BASE}/E1_largedelta_summary.json", "w") as f:
    json.dump(summary_rows, f, indent=2)
with open(f"{BASE}/E1_largedelta_other_events.json", "w") as f:
    json.dump(other_events, f, indent=2)
