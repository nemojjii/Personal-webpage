import { verifiedResults } from "@/lib/laboratory/consensusVerifiedResults";

import { Disclosure, LabFrame } from "./ui";

const FAMILY_ORDER = [
  "K_n (complete)",
  "C_n (cycle)",
  "theta(a,a,a)",
  "K4^(a) (subdivided tetrahedron)",
  "K_{a,a,a} (balanced tripartite)",
];

const FAMILY_LABEL: Record<string, string> = {
  "K_n (complete)": "Kₙ — complete graph",
  "C_n (cycle)": "Cₙ — cycle",
  "theta(a,a,a)": "θ(a,a,a) — theta graph",
  "K4^(a) (subdivided tetrahedron)": "K₄⁽ᵃ⁾ — subdivided tetrahedron",
  "K_{a,a,a} (balanced tripartite)": "K_{a,a,a} — balanced tripartite",
};

/**
 * This table does not simulate anything — it renders the result of a
 * separate, exact verification pass (Python, `fractions.Fraction`) that
 * constructed each theorem's own witness in code and checked it against the
 * closed form bit-for-bit. See `lib/laboratory/consensusVerifiedResults.ts`.
 */
export function VerifiedResultsTable() {
  const grouped = FAMILY_ORDER.map((family) => ({
    family,
    rows: verifiedResults.filter((r) => r.family === family),
  }));

  return (
    <LabFrame
      caption={
        <>
          Every row is an explicit witness vector constructed in code from the theorem cited,
          checked exactly (Python, exact rational arithmetic — never floating point) against the
          dual-lattice membership conditions of Lemma 3.1/3.2, with its max-norm confirmed to equal
          the closed form bit-for-bit. “Exhaustive” rows additionally confirm, by a true exhaustive
          search of the relevant lattice, that no shorter nonzero vector exists — the construction
          really is μ(G), not merely an upper bound on it.
        </>
      }
    >
      <h3 className="font-serif text-[1.0625rem] font-medium text-ink">
        Proven &amp; independently re-verified results
      </h3>
      <p className="mt-2 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
        The explorer above visualises μ(Kₙ) and μ(Cₙ) live. These are the closed forms behind it —
        and three further families from the paper — each one re-derived from scratch in code and
        checked exactly, not just visually.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {grouped.map(({ family, rows }) => (
          <div key={family}>
            <p className="label !text-ink-muted">{FAMILY_LABEL[family] ?? family}</p>
            <div className="mt-2 max-h-[22rem] overflow-y-auto overflow-x-auto border border-rule-soft">
              <table className="w-full min-w-[32rem] border-collapse font-sans text-[0.75rem] tnum">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-rule-soft text-left text-ink-muted">
                    <th className="px-3 py-2 font-medium">param</th>
                    <th className="px-3 py-2 font-medium">n</th>
                    <th className="px-3 py-2 font-medium">m</th>
                    <th className="px-3 py-2 font-medium">μ(G)</th>
                    <th className="px-3 py-2 font-medium">δ*(G)</th>
                    <th className="px-3 py-2 font-medium">theorem</th>
                    <th className="px-3 py-2 font-medium">verification</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.family}-${r.param}`} className="border-b border-rule-soft/60 last:border-0">
                      <td className="px-3 py-1.5 text-ink">{r.param}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.n}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.m}</td>
                      <td className="px-3 py-1.5 text-ink">{r.mu}</td>
                      <td className="px-3 py-1.5 text-ink-soft">
                        {r.deltaStarCoeff === "0" ? "0" : `π·${r.deltaStarCoeff}`}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-ink-muted">{r.theorem}</td>
                      <td className="px-3 py-1.5">
                        {r.exhaustiveVerified ? (
                          <span className="text-ink">exhaustive minimum ✓</span>
                        ) : (
                          <span className="text-ink-muted">construction confirmed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <Disclosure summary="How the exhaustive checks work, and where they stop">
        <p className="font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
          Lemma 3.1 says the fundamental cycles of a spanning tree form a basis of both the cycle
          space and the flow lattice F(G), so every λ ∈ F*(G) is a combination of them with an
          integer-vector of coefficients (the cycles&rsquo; winding numbers) — a lattice whose
          dimension is the graph&rsquo;s cyclomatic rank m−n+1. Where that rank was small enough
          (cycles: rank 1; theta graphs and subdivided tetrahedra: rank 2–3; K₃–K₇ and the smallest
          tripartite graphs: rank ≤ 15), every integer vector in a bounding box was tried and the
          true minimum re-confirmed exactly. Complete graphs Kₙ for n ≥ 8 and larger tripartite
          graphs have a rank too large to brute-force this way (up to 55, for K₁₂) — there, the
          construction is checked, but its optimality still rests on the paper&rsquo;s own proof,
          not on a re-run search.
        </p>
      </Disclosure>
    </LabFrame>
  );
}
