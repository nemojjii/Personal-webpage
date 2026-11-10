"""
Part 1: independently re-verify the already-PROVEN closed forms from
"The Geometry of Disagreement" for several graph families, by constructing
the paper's explicit witness vectors in code and checking them exactly.
"""
import sys, json, math, time
from fractions import Fraction
sys.path.insert(0, "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc")
from lattice import (
    exact_pi, verify_in_dual_lattice, max_norm, exhaustive_min_norm,
)

results = []


def record(family, param, n, m, mu_exact, theorem, verified_membership, verification_mode, note=""):
    delta_star_mult = 1 - 2 * mu_exact  # delta*(G) = pi * this
    results.append({
        "family": family,
        "param": param,
        "n": n,
        "m": m,
        "mu": str(mu_exact),
        "mu_float": float(mu_exact),
        "delta_star_coeff": str(delta_star_mult),  # delta* = pi * coeff
        "delta_star_float": float(delta_star_mult) * math.pi,
        "theorem": theorem,
        "verified_membership": verified_membership,
        "verification_mode": verification_mode,
        "note": note,
    })


# ─────────────────────────── 1. Complete graphs K_n ────────────────────────

def Kn_edges(n):
    return [(i, j) for i in range(n) for j in range(i + 1, n)]


def three_cluster_lambda(n, edges):
    base, rem = divmod(n, 3)
    sizes = [base + (1 if i < rem else 0) for i in range(3)]
    sizes.sort(reverse=True)
    A_size, B_size, C_size = sizes
    group_of = {}
    for v in range(0, A_size):
        group_of[v] = 0
    for v in range(A_size, A_size + B_size):
        group_of[v] = 1
    for v in range(A_size + B_size, n):
        group_of[v] = 2
    sizes_by_group = {0: A_size, 1: B_size, 2: C_size}
    m = len(edges)
    lam = [Fraction(0)] * m
    for j, (u, v) in enumerate(edges):
        gu, gv = group_of[u], group_of[v]
        if gu == gv:
            continue
        nxt = (gu + 1) % 3
        if gv == nxt:
            lam[j] = Fraction(sizes_by_group[(gv + 1) % 3], n)
        else:
            lam[j] = -Fraction(sizes_by_group[(gu + 1) % 3], n)
    return lam, sizes


print("=== K_n ===")
EXHAUSTIVE_BOUND = {6: 2, 7: 1}  # n -> bound used for a TRUE exhaustive check
for n in range(3, 13):
    edges = Kn_edges(n)
    m = len(edges)
    lam, sizes = three_cluster_lambda(n, edges)
    ok, reason = verify_in_dual_lattice(n, edges, lam)
    nrm = max_norm(lam)
    expected = Fraction(math.ceil(n / 3), n)
    assert ok, f"K{n} construction failed dual-lattice check: {reason}"
    assert nrm == expected, f"K{n} norm mismatch: {nrm} vs {expected}"

    mode = "constructed+confirmed membership"
    note = ""
    if n <= 5 or n in EXHAUSTIVE_BOUND:
        bound = EXHAUSTIVE_BOUND.get(n, 2)
        t0 = time.time()
        exh_norm, best_t, rank, tried, _ = exhaustive_min_norm(n, edges, bound=bound)
        dt = time.time() - t0
        assert exh_norm == expected, f"K{n} exhaustive minimum {exh_norm} != {expected}"
        mode = f"constructed+confirmed membership+exhaustive minimum verified (bound={bound}, rank={rank}, {tried} vectors tried, {dt:.1f}s)"
    else:
        rank = (n - 1) * (n - 2) // 2
        note = f"rank={rank} too large for exhaustive brute force here; minimality relies on the paper's proof (Theorem 4.2), not re-derived independently"

    print(f"K{n}: sizes={sizes} mu={nrm} mode={mode}")
    record("K_n (complete)", n, n, m, nrm, "Theorem 4.2", True, mode, note)

# ─────────────────────────── 2. Cycles C_n ─────────────────────────────────

print("=== C_n ===")
for n in range(3, 13):
    edges = [(i, (i + 1) % n) for i in range(n)]
    m = len(edges)
    B, L, Pi = exact_pi(n, edges)
    lam = [Pi[i][0] for i in range(m)]  # Pi(epsilon_0), the one-edge witness
    ok, reason = verify_in_dual_lattice(n, edges, lam)
    nrm = max_norm(lam)
    expected = Fraction(1, n)
    assert ok and nrm == expected, f"C{n} failed: ok={ok} reason={reason} norm={nrm} expected={expected}"

    exh_norm, best_t, rank, tried, _ = exhaustive_min_norm(n, edges, bound=3)
    assert exh_norm == expected, f"C{n} exhaustive {exh_norm} != {expected}"
    mode = f"constructed+confirmed membership+exhaustive minimum verified (bound=3, rank={rank})"
    print(f"C{n}: mu={nrm} mode={mode}")
    record("C_n (cycle)", n, n, m, nrm, "Theorem 4.8(c), N=2", True, mode)

# ─────────────────────── 3. Theta graphs theta(a,a,a) ──────────────────────

print("=== theta(a,a,a) ===")
for a in range(2, 7):
    n = 2 + 3 * (a - 1)
    edges = []
    for k in range(3):
        prev = 0  # hub u
        for step in range(a - 1):
            v = 2 + k * (a - 1) + step
            edges.append((prev, v))
            prev = v
        edges.append((prev, 1))  # hub v
    m = len(edges)
    assert m == 3 * a and n == 2 + 3 * (a - 1)

    expected = Fraction(2, 3 * a)
    exh_norm, best_t, rank, tried, lam = exhaustive_min_norm(n, edges, bound=3)
    ok, reason = verify_in_dual_lattice(n, edges, lam)
    assert ok, reason
    assert exh_norm == expected, f"theta(a={a}) {exh_norm} != {expected}"
    mode = f"constructed+confirmed membership+exhaustive minimum verified (bound=3, rank={rank})"
    print(f"theta({a},{a},{a}): n={n} m={m} mu={exh_norm} mode={mode}")
    record(f"theta(a,a,a)", a, n, m, exh_norm, "Theorem 4.8(c), N=3", True, mode)

# ───────────────────── 4. Subdivided tetrahedra K4^(a) ─────────────────────

print("=== K4^(a) ===")
K4_edges = Kn_edges(4)
for a in range(1, 7):
    if a == 1:
        n, edges = 4, K4_edges
    else:
        n = 4 + 6 * (a - 1)
        edges = []
        next_v = 4
        for (u0, v0) in K4_edges:
            prev = u0
            for step in range(a - 1):
                nv = next_v
                next_v += 1
                edges.append((prev, nv))
                prev = nv
            edges.append((prev, v0))
    m = len(edges)
    assert m == 6 * a

    expected = Fraction(1, 2 * a)
    exh_norm, best_t, rank, tried, lam = exhaustive_min_norm(n, edges, bound=3)
    ok, reason = verify_in_dual_lattice(n, edges, lam)
    assert ok, reason
    assert exh_norm == expected, f"K4^({a}) {exh_norm} != {expected}"
    mode = f"constructed+confirmed membership+exhaustive minimum verified (bound=3, rank={rank})"
    note = "This IS K4 itself — the paper's exceptional graph: mu=1/2 exactly, no stable disagreement for any delta>0." if a == 1 else ""
    print(f"K4^({a}): n={n} m={m} mu={exh_norm} mode={mode} {note}")
    record("K4^(a) (subdivided tetrahedron)", a, n, m, exh_norm, "Theorem 4.8(c), N=4", True, mode, note)

# ──────────────────── 5. Balanced complete tripartite K_{a,a,a} ────────────

print("=== K_{a,a,a} ===")
for a in range(1, 5):
    n = 3 * a
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if i // a != j // a:
                edges.append((i, j))
    m = len(edges)
    assert m == 3 * a * a

    lam = [Fraction(0)] * m
    for j, (u, v) in enumerate(edges):
        cu, cv = u // a, v // a
        diff = (cv - cu) % 3
        lam[j] = Fraction(1, 3) if diff == 1 else Fraction(-1, 3)
    ok, reason = verify_in_dual_lattice(n, edges, lam)
    nrm = max_norm(lam)
    expected = Fraction(1, 3)
    assert ok and nrm == expected, f"K_{{{a},{a},{a}}} failed: ok={ok} {reason} norm={nrm}"

    rank = 3 * a * a - n + 1
    mode = "constructed+confirmed membership"
    note = ""
    if rank <= 10:
        exh_norm, best_t, rk, tried, _ = exhaustive_min_norm(n, edges, bound=2)
        assert exh_norm == expected, f"K_{{{a},{a},{a}}} exhaustive {exh_norm} != {expected}"
        mode = f"constructed+confirmed membership+exhaustive minimum verified (bound=2, rank={rk})"
    else:
        note = f"rank={rank} too large for exhaustive brute force here; minimality relies on the paper's proof (Theorem 5.7), not re-derived independently"

    print(f"K_{{{a},{a},{a}}}: n={n} m={m} mu={nrm} mode={mode}")
    record("K_{a,a,a} (balanced tripartite)", a, n, m, nrm, "Theorem 5.7(a)", True, mode, note)

# ─────────────────────────────── output ─────────────────────────────────

out_path = "/private/tmp/claude-501/-Users-iris-academic-site/f49dfcf5-0b9f-4836-b603-0d50db02e0dc/scratchpad/icc/part1_results.json"
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nWrote {len(results)} rows to {out_path}")
