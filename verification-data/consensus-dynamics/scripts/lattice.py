"""
Exact and numeric lattice tools for the regularized intrinsic circle
consensus (ICC) model from "The Geometry of Disagreement" (Iris Kim).

Graph convention: vertices are 0..n-1. Each edge e=(u,v) with u<v is
oriented u->v (tail u, head v). B is the n x m oriented incidence matrix.
L = B B^T is the (unweighted) graph Laplacian.

F(G)  = integral flows = ker(B) ∩ Z^E
F*(G) = dual lattice = { lambda in ker(B) : <lambda, f> in Z for all f in F(G) }
mu(G) = min { ||lambda||_inf : lambda in F*(G), lambda != 0 }

Lemma 3.2: F*(G) = Pi(Z^E), where Pi = I - B^T L^+ B is the orthogonal
projection of R^E onto the cycle space W = ker(B).
"""

from fractions import Fraction
import itertools
import numpy as np


# ───────────────────────────── exact (Fraction) tools ─────────────────────

def frac_matmul(A, B):
    n, k = len(A), len(A[0])
    k2, m = len(B), len(B[0])
    assert k == k2
    out = [[Fraction(0)] * m for _ in range(n)]
    for i in range(n):
        Ai = A[i]
        for p in range(k):
            a = Ai[p]
            if a == 0:
                continue
            Bp = B[p]
            Oi = out[i]
            for j in range(m):
                Oi[j] += a * Bp[j]
    return out


def frac_identity(n):
    return [[Fraction(1) if i == j else Fraction(0) for j in range(n)] for i in range(n)]


def frac_invert(A):
    """Exact Gauss-Jordan inversion of a square Fraction matrix."""
    n = len(A)
    M = [row[:] + idrow for row, idrow in zip(A, frac_identity(n))]
    for col in range(n):
        piv = None
        for r in range(col, n):
            if M[r][col] != 0:
                piv = r
                break
        if piv is None:
            raise ValueError("singular matrix")
        M[col], M[piv] = M[piv], M[col]
        pv = M[col][col]
        M[col] = [x / pv for x in M[col]]
        for r in range(n):
            if r == col:
                continue
            factor = M[r][col]
            if factor != 0:
                M[r] = [a - factor * b for a, b in zip(M[r], M[col])]
    return [row[n:] for row in M]


def edges_of(adj_n, edge_list):
    """edge_list: list of (u,v) with u<v. Returns (n, m, edges)."""
    return adj_n, len(edge_list), edge_list


def incidence_fraction(n, edges):
    m = len(edges)
    B = [[Fraction(0)] * m for _ in range(n)]
    for j, (u, v) in enumerate(edges):
        B[u][j] = Fraction(-1)
        B[v][j] = Fraction(1)
    return B


def laplacian_fraction(n, B):
    m = len(B[0])
    L = [[Fraction(0)] * n for _ in range(n)]
    for i in range(n):
        for k in range(n):
            s = Fraction(0)
            for j in range(m):
                s += B[i][j] * B[k][j]
            L[i][k] = s
    return L


def exact_pi(n, edges):
    """Return (B, L, Pi) all as exact Fraction matrices."""
    B = incidence_fraction(n, edges)
    L = laplacian_fraction(n, B)
    one_over_n = Fraction(1, n)
    Lshift = [[L[i][k] + (one_over_n if True else 0) for k in range(n)] for i in range(n)]
    # L + J/n
    for i in range(n):
        for k in range(n):
            Lshift[i][k] = L[i][k] + one_over_n
    Linv = frac_invert(Lshift)
    # L^+ = Linv - J/n
    Lplus = [[Linv[i][k] - one_over_n for k in range(n)] for i in range(n)]
    # sanity: L @ Lplus @ ones == 0 is automatic; skip costly checks here,
    # done once in the test harness instead.
    Bt = [[B[j][i] for j in range(n)] for i in range(len(edges))]  # m x n
    # BtLplus = B^T L^+  (m x n)
    BtLplus = frac_matmul(Bt, Lplus)
    # BtLplusB = B^T L^+ B (m x m)
    BtLplusB = frac_matmul(BtLplus, B)
    m = len(edges)
    Pi = [[(Fraction(1) if i == j else Fraction(0)) - BtLplusB[i][j] for j in range(m)] for i in range(m)]
    return B, L, Pi


def pi_apply(Pi, k_vec):
    m = len(Pi)
    return [sum(Pi[i][j] * k_vec[j] for j in range(m)) for i in range(m)]


def bt_apply(n, edges, x_vec):
    """B^T x for vertex vector x -> edge vector."""
    return [x_vec[v] - x_vec[u] for (u, v) in edges]


def b_apply(n, edges, lam):
    """B lam for edge vector lam -> vertex vector (divergence)."""
    out = [Fraction(0)] * n
    for j, (u, v) in enumerate(edges):
        out[u] -= lam[j]
        out[v] += lam[j]
    return out


def spanning_tree_edges(n, edges):
    """BFS spanning tree from vertex 0. Returns set of edge indices in tree."""
    adj = {i: [] for i in range(n)}
    for idx, (u, v) in enumerate(edges):
        adj[u].append((v, idx))
        adj[v].append((u, idx))
    seen = [False] * n
    seen[0] = True
    tree_idx = set()
    stack = [0]
    while stack:
        u = stack.pop()
        for v, idx in adj[u]:
            if not seen[v]:
                seen[v] = True
                tree_idx.add(idx)
                stack.append(v)
    assert len(tree_idx) == n - 1, "graph not connected"
    return tree_idx


def fundamental_cycles(n, edges):
    """
    For a BFS spanning tree, return for each non-tree edge e its fundamental
    cycle as a signed {-1,0,+1} vector over all edges (length m), using the
    convention of Lemma 3.1: traverse the cycle through e from tail to head.
    """
    tree_idx = spanning_tree_edges(n, edges)
    adj = {i: [] for i in range(n)}
    for idx, (u, v) in enumerate(edges):
        if idx in tree_idx:
            adj[u].append((v, idx, +1))  # tree edge u->v: going u to v is +1
            adj[v].append((u, idx, -1))  # going v to u along this tree edge is -1

    # find tree-path from each vertex to root 0 via BFS, recording path of (edge_idx, sign)
    # NOTE: adj[u].append((v, idx, sign_uv)) records the sign for traversing
    # u -> v. path_to_root wants the sign for v -> parent(v) = v -> u, which
    # is the OPPOSITE sign, hence the negation below.
    parent_edge = {0: None}
    parent = {0: None}
    order = [0]
    seen = {0}
    qi = 0
    while qi < len(order):
        u = order[qi]
        qi += 1
        for v, idx, sign_uv in adj[u]:
            if v not in seen:
                seen.add(v)
                parent[v] = u
                parent_edge[v] = (idx, -sign_uv)
                order.append(v)

    def path_to_root(v):
        """Return list of (edge_idx, sign) walking from v up to root 0 (v->...->0)."""
        path = []
        while v != 0:
            idx, sign = parent_edge[v]
            path.append((idx, sign))
            v = parent[v]
        return path

    m = len(edges)
    cycles = []
    for j, (u, v) in enumerate(edges):
        if j in tree_idx:
            continue
        vec = [Fraction(0)] * m
        vec[j] = Fraction(1)  # traverse e from tail u to head v: +1
        # now go from v back up to root, then down from root to u, i.e.
        # path v -> 0 (reverse of path_to_root(v), so signs flip) then 0 -> u
        # (path_to_root(u) reversed again). Simpler: cycle = e + path(v->root) ... but
        # path_to_root gives v->root with each step's natural tree-edge sign
        # for traversal v -> parent(v). We want v -> root: same direction as
        # path_to_root, so signs as given.
        for idx, sign in path_to_root(v):
            vec[idx] += sign
        # then root -> u is the reverse of path_to_root(u)
        for idx, sign in path_to_root(u):
            vec[idx] -= sign
        cycles.append(vec)
    return cycles


def circulation(vec_a, vec_b):
    return sum(a * b for a, b in zip(vec_a, vec_b))


def verify_in_dual_lattice(n, edges, lam):
    """
    Exact check that lam (list of Fraction) is in F*(G): B lam == 0 exactly,
    AND circulation around every fundamental cycle is an integer.
    Returns (ok: bool, reason: str).
    """
    div = b_apply(n, edges, lam)
    if any(d != 0 for d in div):
        return False, f"not divergence-free: B@lambda = {div}"
    cycles = fundamental_cycles(n, edges)
    for cyc in cycles:
        c = circulation(lam, cyc)
        if c.denominator != 1:
            return False, f"non-integer circulation {c} on a fundamental cycle"
    return True, "ok"


def max_norm(lam):
    return max(abs(x) for x in lam)


def is_nonzero(lam):
    return any(x != 0 for x in lam)


# ───────────────────────────── numeric (float) fast path ──────────────────

def numeric_pi_and_lplus(n, edges):
    m = len(edges)
    B = np.zeros((n, m))
    for j, (u, v) in enumerate(edges):
        B[u, j] = -1.0
        B[v, j] = 1.0
    L = B @ B.T
    J = np.ones((n, n))
    Lplus = np.linalg.inv(L + J / n) - J / n
    Pi = np.eye(m) - B.T @ Lplus @ B
    return B, L, Lplus, Pi


def edge_effective_resistances(Lplus, B):
    """R_e = b_e^T L+ b_e for b_e = B @ e_e, vectorized over all edges."""
    # columns of B are b_e already
    # R_e = sum_v,w B[v,e] Lplus[v,w] B[w,e]
    LB = Lplus @ B  # n x m
    R = np.einsum("vm,vm->m", B, LB)
    return R


# ───────────── rank-dimensional (winding-number) parameterization ─────────
#
# Lemma 3.1: the fundamental cycles {chi_e : e not in T} form a basis of both
# the lattice F(G) and the real vector space W. So every lambda in W is
# lambda = sum_i c_i chi_i for real c, and lambda is in F*(G) (Lemma 3.1's
# membership test) iff <lambda, chi_j> is an integer for every j. Writing
# Gram[i][j] = <chi_i, chi_j> (an exact integer matrix, rank x rank), this
# condition is Gram @ c = t for an integer vector t, i.e.
#   F*(G) = { sum_i c_i chi_i : c = Gram^{-1} t, t in Z^rank }.
# This re-parameterizes F*(G) by an INTEGER vector of dimension rank =
# m-n+1 (the winding numbers around each fundamental cycle), which is what
# makes an exhaustive minimum-norm search tractable for small rank.

def gram_and_basis(n, edges):
    chis = fundamental_cycles(n, edges)
    r = len(chis)
    gram = [[circulation(chis[i], chis[j]) for j in range(r)] for i in range(r)]
    return chis, gram


def lambda_from_t(chis, gram_inv, t_vec):
    """lambda = sum_i c_i chi_i where c = gram_inv @ t_vec (all exact Fraction)."""
    r = len(chis)
    m = len(chis[0])
    c = [sum(gram_inv[i][k] * t_vec[k] for k in range(r)) for i in range(r)]
    lam = [Fraction(0)] * m
    for i in range(r):
        if c[i] == 0:
            continue
        ci = c[i]
        for j in range(m):
            v = chis[i][j]
            if v != 0:
                lam[j] += ci * v
    return lam


def exhaustive_min_norm(n, edges, bound, chis=None, gram=None):
    """
    True exhaustive search for the minimal ||lambda||_inf over nonzero
    lambda in F*(G), by trying every integer t in {-bound..bound}^rank.
    Only tractable when rank is small. Returns (best_norm: Fraction,
    best_t: tuple, rank: int, num_tried: int). Uses float64 for the sweep
    (fast), then re-verifies the winning t exactly with Fractions.
    """
    if chis is None or gram is None:
        chis, gram = gram_and_basis(n, edges)
    r = len(chis)
    m = len(chis[0])
    gram_np = np.array([[float(x) for x in row] for row in gram])
    gram_inv_np = np.linalg.inv(gram_np)
    chis_np = np.array([[float(x) for x in row] for row in chis])  # r x m

    best_norm = None
    best_t = None
    num_tried = 0
    rng = range(-bound, bound + 1)
    for t in itertools.product(rng, repeat=r):
        if all(x == 0 for x in t):
            continue
        num_tried += 1
        c = gram_inv_np @ np.array(t, dtype=float)
        lam = c @ chis_np
        nrm = np.max(np.abs(lam))
        if best_norm is None or nrm < best_norm - 1e-9:
            best_norm = nrm
            best_t = t

    # exact re-verification of the winning t
    gram_inv_exact = frac_invert([[Fraction(x) for x in row] for row in gram])
    lam_exact = lambda_from_t(chis, gram_inv_exact, [Fraction(x) for x in best_t])
    exact_norm = max_norm(lam_exact)
    return exact_norm, best_t, r, num_tried, lam_exact


def exact_lambda_one_edge(n, edges, e_idx):
    """lambda = Pi(epsilon_{e_idx}), exactly — column e_idx of Pi."""
    B, L, Pi = exact_pi(n, edges)
    return [Pi[i][e_idx] for i in range(len(edges))]


def exact_lambda_from_coloring(n, edges, coloring):
    """
    Exact version of witness_search.lambda_from_coloring: coloring is a
    list/array of ints in {0,1,2}, one per vertex. Returns the exact
    Fraction lambda_c = r_c - B^T psi, psi = L+ @ b_c (Lemma 5.4(iii)).
    """
    m = len(edges)
    r_c = [Fraction(0)] * m
    for j, (u, v) in enumerate(edges):
        diff = (int(coloring[v]) - int(coloring[u])) % 3
        if diff == 1:
            r_c[j] = Fraction(1, 3)
        elif diff == 2:
            r_c[j] = Fraction(-1, 3)
    B = incidence_fraction(n, edges)
    L = laplacian_fraction(n, B)
    one_over_n = Fraction(1, n)
    Lshift = [[L[i][k] + one_over_n for k in range(n)] for i in range(n)]
    Linv = frac_invert(Lshift)
    Lplus = [[Linv[i][k] - one_over_n for k in range(n)] for i in range(n)]
    # b_c = B @ r_c  (vertex vector)
    b_c = b_apply(n, edges, r_c)
    # psi = L+ @ b_c
    psi = [sum(Lplus[i][k] * b_c[k] for k in range(n)) for i in range(n)]
    # lambda = r_c - B^T psi ;  (B^T psi)_e = psi_v - psi_u for e=(u,v)
    lam = [r_c[j] - (psi[v] - psi[u]) for j, (u, v) in enumerate(edges)]
    return lam


def is_bridge(n, edges, e_idx):
    """Edge is a bridge iff removing it disconnects the graph."""
    u0, v0 = edges[e_idx]
    adj = {i: [] for i in range(n)}
    for j, (u, v) in enumerate(edges):
        if j == e_idx:
            continue
        adj[u].append(v)
        adj[v].append(u)
    seen = {u0}
    stack = [u0]
    while stack:
        x = stack.pop()
        for y in adj[x]:
            if y not in seen:
                seen.add(y)
                stack.append(y)
    return v0 not in seen
