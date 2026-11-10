"""ICC and Kuramoto simulation, matching the paper's Section 3.3 model and
the earlier-agreed protocol (adaptive RK, DOP853, rtol=1e-10, atol=1e-12,
terminate at max|theta_dot|<1e-9 or t=2000)."""
import numpy as np
from scipy.integrate import solve_ivp


def wrap(x):
    r = np.mod(x + np.pi, 2 * np.pi) - np.pi
    return r


def gamma_delta(x, delta):
    branch = np.pi - delta
    ax = np.abs(x)
    lin = x
    ramp = ((np.pi - delta) / delta) * (np.pi - ax) * np.sign(x)
    return np.where(ax <= branch, lin, ramp)


def icc_rhs(t, theta, adj_u, adj_v, delta, n):
    diff_v_minus_u = wrap(theta[adj_v] - theta[adj_u])
    g = gamma_delta(diff_v_minus_u, delta)
    out = np.zeros(n)
    np.add.at(out, adj_u, g)
    np.add.at(out, adj_v, -g)
    return out


def kuramoto_rhs(t, theta, adj_u, adj_v, n):
    diff = theta[adj_u] - theta[adj_v]
    s = np.sin(diff)
    out = np.zeros(n)
    np.add.at(out, adj_v, s)
    np.add.at(out, adj_u, -s)
    return out


def _speed_event_icc():
    def ev(t, theta, adj_u, adj_v, delta, n):
        rhs = icc_rhs(t, theta, adj_u, adj_v, delta, n)
        return np.max(np.abs(rhs)) - 1e-9
    ev.terminal = True
    ev.direction = -1
    return ev


def _speed_event_kuramoto():
    def ev(t, theta, adj_u, adj_v, n):
        rhs = kuramoto_rhs(t, theta, adj_u, adj_v, n)
        return np.max(np.abs(rhs)) - 1e-9
    ev.terminal = True
    ev.direction = -1
    return ev


def run_icc(edges, n, delta, theta0, t_max=2000.0):
    u = np.array([e[0] for e in edges])
    v = np.array([e[1] for e in edges])
    ev = _speed_event_icc()
    sol = solve_ivp(icc_rhs, [0, t_max], theta0, args=(u, v, delta, n),
                     method="DOP853", rtol=1e-10, atol=1e-12, events=ev, dense_output=False)
    theta_f = sol.y[:, -1]
    edge_deltas = wrap(theta_f[v] - theta_f[u])
    max_abs_delta = np.max(np.abs(edge_deltas))
    # divergence check: B @ Delta (vertex-wise net, should be 0 at a core equilibrium)
    div = np.zeros(n)
    np.add.at(div, u, -edge_deltas)
    np.add.at(div, v, edge_deltas)
    div_norm = np.max(np.abs(div))
    converged = len(sol.t_events[0]) > 0
    t_final = sol.t[-1]

    if max_abs_delta < 1e-6:
        status = "sync"
    elif max_abs_delta < (np.pi - delta - 1e-6) and div_norm < 1e-8:
        status = "core"
    else:
        status = "other"
    lam = edge_deltas / (2 * np.pi)
    lam_inf = float(np.max(np.abs(lam)))
    return {
        "status": status, "t_final": float(t_final), "max_abs_delta": float(max_abs_delta),
        "div_norm": float(div_norm), "converged": bool(converged), "lambda_inf": lam_inf,
        "theta_final": theta_f,
    }


def run_kuramoto(edges, n, theta0, t_max=2000.0):
    u = np.array([e[0] for e in edges])
    v = np.array([e[1] for e in edges])
    ev = _speed_event_kuramoto()
    sol = solve_ivp(kuramoto_rhs, [0, t_max], theta0, args=(u, v, n),
                     method="DOP853", rtol=1e-10, atol=1e-12, events=ev, dense_output=False)
    theta_f = sol.y[:, -1]
    edge_deltas = wrap(theta_f[v] - theta_f[u])
    max_abs_delta = np.max(np.abs(edge_deltas))
    converged = len(sol.t_events[0]) > 0
    status = "sync" if max_abs_delta < 1e-6 else ("non-sync-equilibrium" if converged else "other")
    return {"status": status, "t_final": float(sol.t[-1]), "max_abs_delta": float(max_abs_delta),
            "converged": bool(converged)}
