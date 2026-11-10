"""
Numeric (fast, float64) search for a witness lambda in F*(G)\\{0} with
||lambda||_inf < 1/2, for a 2-connected graph G. Returns enough info to
reconstruct and exactly re-verify the witness afterwards.

Strategy, cheapest first:
  1. one-edge witness (Lemma 4.6/Prop 5.1): lambda = Pi(eps_e) for an edge e
     with effective resistance R_e > 1/2 gives ||lambda||_inf = 1-R_e < 1/2.
  2. batched random three-phase colorings (Section 5.2/Corollary 5.5):
     try many colorings at once, vectorized, take the best.
  3. local hill-climbing on the coloring (flip one vertex's color at a time)
     from several random restarts, if (2) didn't clear 0.5.

Everything here is float64 for speed; exact re-verification happens
separately via lattice.py on the winning construction.
"""
import numpy as np


def build_B_L_Lplus(n, edges):
    m = len(edges)
    B = np.zeros((n, m))
    for j, (u, v) in enumerate(edges):
        B[u, j] = -1.0
        B[v, j] = 1.0
    L = B @ B.T
    J = np.ones((n, n))
    Lplus = np.linalg.inv(L + J / n) - J / n
    return B, L, Lplus


def one_edge_witness(B, Lplus):
    """Returns (best_edge_idx, best_norm) where best_norm = 1 - R_e,
    minimized over edges (i.e. R_e maximized)."""
    LB = Lplus @ B
    R = np.einsum("vm,vm->m", B, LB)
    norms = 1.0 - R
    e = int(np.argmin(norms))
    return e, float(norms[e])


def batched_coloring_search(n, edges, B, Lplus, rng, num_colorings=4000):
    m = len(edges)
    colors = rng.integers(0, 3, size=(num_colorings, n))  # (K, n)
    u_idx = np.array([u for u, v in edges])
    v_idx = np.array([v for u, v in edges])
    cu = colors[:, u_idx]  # (K, m)
    cv = colors[:, v_idx]
    diff = (cv - cu) % 3
    r_c = np.where(diff == 1, 1.0 / 3, np.where(diff == 2, -1.0 / 3, 0.0))  # (K, m)

    b_c = r_c @ B.T  # (K, n) = divergence of r_c at each vertex, per coloring
    psi = b_c @ Lplus.T  # (K, n), since Lplus symmetric this is Lplus @ b_c per row
    correction = psi @ B  # (K, m) = (B^T psi)^T computed as psi @ B (since (B^T psi_row)_e = psi_v - psi_u = (psi @ B)[row,e] given B[u,e]=-1,B[v,e]=+1)
    lam_c = r_c - correction  # (K, m)

    norms = np.max(np.abs(lam_c), axis=1)
    # A coloring with lambda == 0 (e.g. every vertex the same color, or any
    # other degenerate case) is NOT a valid witness (mu requires a NONZERO
    # vector) — exclude near-zero norms before taking the minimum.
    norms_for_argmin = np.where(norms > 1e-6, norms, np.inf)
    best_i = int(np.argmin(norms_for_argmin))
    if not np.isfinite(norms_for_argmin[best_i]):
        # every sampled coloring was degenerate (should be astronomically
        # rare) — fall back to the smallest truly-nonzero one found, or
        # signal failure via a large sentinel norm.
        return colors[0], float("inf"), lam_c[0]
    return colors[best_i], float(norms[best_i]), lam_c[best_i]


def lambda_from_coloring(n, edges, B, Lplus, coloring):
    m = len(edges)
    u_idx = np.array([u for u, v in edges])
    v_idx = np.array([v for u, v in edges])
    cu = coloring[u_idx]
    cv = coloring[v_idx]
    diff = (cv - cu) % 3
    r_c = np.where(diff == 1, 1.0 / 3, np.where(diff == 2, -1.0 / 3, 0.0))
    b_c = B @ r_c  # (n,)
    psi = Lplus @ b_c
    lam_c = r_c - (B.T @ psi)
    return lam_c


def _nz_norm(lam):
    """Max-norm, but zero (invalid, non-witness) vectors read as +inf so
    hill-climbing never settles on the trivial lambda=0 solution."""
    n = float(np.max(np.abs(lam)))
    return n if n > 1e-6 else float("inf")


def local_search(n, edges, B, Lplus, rng, start_coloring, max_iters=200):
    coloring = start_coloring.copy()
    lam = lambda_from_coloring(n, edges, B, Lplus, coloring)
    best_norm = _nz_norm(lam)
    improved = True
    it = 0
    while improved and it < max_iters:
        improved = False
        it += 1
        order = rng.permutation(n)
        for v in order:
            orig = coloring[v]
            best_local = best_norm
            best_c = orig
            for c in range(3):
                if c == orig:
                    continue
                coloring[v] = c
                lam2 = lambda_from_coloring(n, edges, B, Lplus, coloring)
                nrm2 = _nz_norm(lam2)
                if nrm2 < best_local:
                    best_local = nrm2
                    best_c = c
            coloring[v] = best_c
            if best_local < best_norm - 1e-12:
                best_norm = best_local
                improved = True
    lam = lambda_from_coloring(n, edges, B, Lplus, coloring)
    return coloring, _nz_norm(lam)


def find_witness(n, edges, rng, num_colorings=4000, local_restarts=5):
    """
    Returns a dict describing how (if at all) a witness with norm < 0.5 was
    found: {'method', 'norm', 'edge' or 'coloring'}.
    """
    B, L, Lplus = build_B_L_Lplus(n, edges)
    e, norm1 = one_edge_witness(B, Lplus)
    if norm1 < 0.5 - 1e-9:
        return {"method": "one-edge", "norm": norm1, "edge": e}

    coloring, norm2, _ = batched_coloring_search(n, edges, B, Lplus, rng, num_colorings)
    if norm2 < 0.5 - 1e-9:
        return {"method": "coloring", "norm": norm2, "coloring": coloring.tolist()}

    best_norm = norm2
    best_coloring = coloring
    for _ in range(local_restarts):
        start = rng.integers(0, 3, size=n)
        c2, n2 = local_search(n, edges, B, Lplus, rng, start)
        if n2 < best_norm:
            best_norm = n2
            best_coloring = c2

    if best_norm < 0.5 - 1e-9:
        return {"method": "coloring+local-search", "norm": best_norm, "coloring": best_coloring.tolist()}

    return {"method": "UNRESOLVED", "norm": best_norm, "coloring": best_coloring.tolist(),
            "one_edge_norm": norm1, "edge": e}
