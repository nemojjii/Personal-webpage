import sys, json
sys.path.insert(0, "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc")
import numpy as np
from sim import icc_rhs, wrap


def Kn_edges(n):
    return [(i, j) for i in range(n) for j in range(i + 1, n)]


def tripartite_edges(a):
    n = 3 * a
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if i // a != j // a:
                edges.append((i, j))
    return n, edges


def three_cluster_theta(n, group_of):
    """phases 0, 2pi/3, 4pi/3 for groups 0,1,2 (equal-size case)."""
    theta = np.zeros(n)
    for v in range(n):
        theta[v] = 2 * np.pi * group_of[v] / 3
    return theta


def rk4_trajectory(edges, n, delta, theta0, dt, steps):
    u = np.array([e[0] for e in edges])
    v = np.array([e[1] for e in edges])
    theta = theta0.copy()
    traj = [theta.copy()]
    for _ in range(steps):
        k1 = icc_rhs(0, theta, u, v, delta, n)
        k2 = icc_rhs(0, theta + dt / 2 * k1, u, v, delta, n)
        k3 = icc_rhs(0, theta + dt / 2 * k2, u, v, delta, n)
        k4 = icc_rhs(0, theta + dt * k3, u, v, delta, n)
        theta = theta + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        traj.append(theta.copy())
    return np.array(traj)


def fit_decay_rate(traj, theta_star, t_values, fit_window):
    xi_norms = []
    for theta in traj:
        eta = theta - theta_star  # not yet mean-removed
        eta_perp = eta - np.mean(eta)
        xi_norms.append(np.linalg.norm(eta_perp))
    xi_norms = np.array(xi_norms)
    lo, hi = fit_window
    mask = (t_values >= lo) & (t_values <= hi) & (xi_norms > 1e-13)
    if mask.sum() < 2:
        return None, xi_norms
    slope, intercept = np.polyfit(t_values[mask], np.log(xi_norms[mask]), 1)
    return slope, xi_norms


results = []
BASE = "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc"

configs = [
    ("K6 (2,2,2) three-cluster", *((6, Kn_edges(6)) if True else (None, None)), 6.0),
    ("K_{2,2,2} octahedron", *tripartite_edges(2), 4.0),
]

delta = 0.1
dt = 0.01
steps = 700
t_values = np.arange(steps + 1) * dt
# The Laplacian of K_{2,2,2} has eigenvalues {0,4,4,4,6,6}: a generic random
# perturbation excites BOTH the lambda2=4 and the lambda=6 eigenspaces, so
# the early-time log-norm slope is steeper than -lambda2 until the faster
# (lambda=6) mode decays away. Fit a mid-time tail: late enough that the
# e^{-6t} mode (ratio e^{-2t} relative to e^{-4t}) is negligible, but before
# the signal drops into float64 noise (absolute floor ~1e-16 x |eta0|).
FIT_WINDOW = (2.5, 5.0)

rng = np.random.default_rng(42)

for name, n, edges, lambda2_theory in configs:
    group_of = {v: v // 2 for v in range(n)}  # groups of size 2: {0,1}->0 {2,3}->1 {4,5}->2
    theta_star = three_cluster_theta(n, group_of)
    for mag in [1e-3, 1e-1]:
        slopes = []
        for trial in range(10):
            eta0 = rng.normal(0, 1, size=n)
            eta0 = eta0 - np.mean(eta0)
            eta0 = eta0 / np.linalg.norm(eta0) * mag
            theta0 = theta_star + eta0
            traj = rk4_trajectory(edges, n, delta, theta0, dt, steps)
            slope, xi_norms = fit_decay_rate(traj, theta_star, t_values, FIT_WINDOW)
            slopes.append(slope)
        mean_slope = float(np.mean(slopes))
        results.append({
            "config": name, "n": n, "lambda2_theory": lambda2_theory, "perturb_mag": mag,
            "fitted_decay_rates": slopes, "mean_fitted_rate": -mean_slope,
            "theory_rate": lambda2_theory,
            "rel_error": abs(-mean_slope - lambda2_theory) / lambda2_theory,
        })
        print(f"{name} (n={n}, theory lambda2={lambda2_theory}) mag={mag}: "
              f"fitted rate = {-mean_slope:.4f} (theory {lambda2_theory}), "
              f"rel. error = {abs(-mean_slope - lambda2_theory) / lambda2_theory:.4%}")

with open(f"{BASE}/E2_results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)
