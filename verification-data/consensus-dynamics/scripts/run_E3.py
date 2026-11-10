import sys, json, time
sys.path.insert(0, "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc")
import numpy as np
from sim import run_icc, run_kuramoto


def Kn_edges(n):
    return [(i, j) for i in range(n) for j in range(i + 1, n)]


def Kn_minus_perfect_matching(n):
    assert n % 2 == 0
    matching = {(i, i + 1) for i in range(0, n, 2)}
    return [(i, j) for (i, j) in Kn_edges(n) if (i, j) not in matching]


def Kn_minus_hamiltonian_cycle(n):
    cycle = set()
    for i in range(n):
        a, b = i, (i + 1) % n
        cycle.add((min(a, b), max(a, b)))
    return [(i, j) for (i, j) in Kn_edges(n) if (i, j) not in cycle]


def min_degree(n, edges):
    deg = [0] * n
    for u, v in edges:
        deg[u] += 1
        deg[v] += 1
    return min(deg)


def mu_bar_density_bound(n, dmin):
    # Theorem 5.9(a): mu(G) <= 1/3 + 2(n-dmin) / (3(2dmin-n+2)), valid when 6dmin>5n-2
    return 1.0 / 3 + (2 * (n - dmin)) / (3 * (2 * dmin - n + 2))


BASE = "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc"
N_SEEDS = 2000
DELTA = 0.1

graphs = [
    ("K5", 5, Kn_edges(5)),
    ("K6", 6, Kn_edges(6)),
    ("K8", 8, Kn_edges(8)),
    ("K12 minus perfect matching", 12, Kn_minus_perfect_matching(12)),
    ("K18 minus Hamiltonian cycle", 18, Kn_minus_hamiltonian_cycle(18)),
]

results = []
t0 = time.time()
for name, n, edges in graphs:
    dmin = min_degree(n, edges)
    density_condition = 6 * dmin > 5 * n - 2
    mu_bar = mu_bar_density_bound(n, dmin) if density_condition else None

    icc_counts = {"sync": 0, "core": 0, "other": 0}
    kur_counts = {"sync": 0, "non-sync-equilibrium": 0, "other": 0}
    rng = np.random.default_rng(777 + n)
    tg0 = time.time()
    for seed in range(N_SEEDS):
        theta0 = rng.uniform(0, 2 * np.pi, size=n)
        r_icc = run_icc(edges, n, DELTA, theta0)
        icc_counts[r_icc["status"]] = icc_counts.get(r_icc["status"], 0) + 1
        r_kur = run_kuramoto(edges, n, theta0.copy())
        kur_counts[r_kur["status"]] = kur_counts.get(r_kur["status"], 0) + 1
    dt_g = time.time() - tg0

    row = {
        "graph": name, "n": n, "m": len(edges), "d_min": dmin,
        "density_condition_6dmin_gt_5n_minus_2": density_condition,
        "mu_bar_bound": mu_bar,
        "icc_delta": DELTA,
        "icc_sync": icc_counts.get("sync", 0), "icc_core": icc_counts.get("core", 0),
        "icc_other": icc_counts.get("other", 0),
        "icc_nonsync_rate": (icc_counts.get("core", 0) + icc_counts.get("other", 0)) / N_SEEDS,
        "kuramoto_sync": kur_counts.get("sync", 0),
        "kuramoto_nonsync": kur_counts.get("non-sync-equilibrium", 0) + kur_counts.get("other", 0),
        "kuramoto_nonsync_rate": (kur_counts.get("non-sync-equilibrium", 0) + kur_counts.get("other", 0)) / N_SEEDS,
        "time_s": dt_g,
    }
    results.append(row)
    print(f"{name} (n={n}, d_min={dmin}, density ok={density_condition}, mu_bar<={mu_bar}): "
          f"ICC nonsync rate={row['icc_nonsync_rate']:.4f} (core={row['icc_core']}) | "
          f"Kuramoto nonsync rate={row['kuramoto_nonsync_rate']:.4f} | time={dt_g:.1f}s")

print(f"\nTotal E3 time: {time.time()-t0:.1f}s")
with open(f"{BASE}/E3_results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)
