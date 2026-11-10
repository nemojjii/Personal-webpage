"""Minimal, fast graph6 decoder (no networkx dependency) for bulk use."""


def decode_graph6(s: str):
    """s: a graph6 string (no newline). Returns (n, edges) with edges as
    a list of (u, v), u < v, 0-indexed."""
    data = s.strip().encode("ascii")
    # Single-byte N(n) for n <= 62 (our n is always <= 9, so this suffices).
    n = data[0] - 63
    rest = data[1:]
    bits = []
    for byte in rest:
        v = byte - 63
        for shift in (5, 4, 3, 2, 1, 0):
            bits.append((v >> shift) & 1)
    edges = []
    idx = 0
    for i in range(1, n):
        for j in range(i):
            if bits[idx]:
                edges.append((j, i))
            idx += 1
    return n, edges
