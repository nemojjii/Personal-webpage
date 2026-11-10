import type { Metadata } from "next";
import Link from "next/link";

import { ConsensusGeometryExplorer } from "@/components/laboratory/ConsensusGeometryExplorer";
import { VerifiedResultsTable } from "@/components/laboratory/VerifiedResultsTable";
import { Prose } from "@/components/content/Prose";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEntry } from "@/lib/content";

const HREF = "/research/geometry-of-disagreement-explorer";

export const metadata: Metadata = {
  title: "Geometry of Disagreement — Experiment & Proof",
  description:
    "An interactive instrument for the regularised intrinsic circle consensus model: watch a graph's phases evolve, and see μ(G) and the critical regularisation width δ*(G) computed live for complete graphs and cycles.",
  alternates: { canonical: HREF },
};

export default function GeometryOfDisagreementExplorerPage() {
  const paper = getEntry("research", "consensus-dynamics-in-networks");

  return (
    <div className="shell py-14 sm:py-16">
      <div className="mx-auto max-w-[60rem]">
        <PageHeader
          eyebrow={
            <>
              {paper ? (
                <Link href={paper.href} className="link-quiet">
                  {paper.title}
                </Link>
              ) : (
                <Link href="/research" className="link-quiet">
                  Research
                </Link>
              )}
              <span className="mx-1 text-rule">/</span> Experiment &amp; proof
            </>
          }
          title="The Geometry of Disagreement"
          intro={
            <>
              <em>
                Can a network hold a stable disagreement, rather than settle into agreement?
              </em>{" "}
              A companion instrument for &ldquo;The Geometry of Disagreement: Stable
              Non-Consensus States in Circle-Valued Network Dynamics,&rdquo; built on the paper&rsquo;s
              own regularised model and its single governing invariant, μ(G).
            </>
          }
        />

        <div className="mt-10">
          <ConsensusGeometryExplorer />
        </div>

        <div className="mt-10">
          <VerifiedResultsTable />
        </div>

        <div className="mx-auto mt-14 max-w-[40rem]">
          <Prose>
            <p>
              Each vertex of the chosen graph carries a phase on the circle, and every edge pulls
              its two endpoints toward each other along the shorter arc — except within a ramp of
              width δ next to the antipodal point, where the pull is relaxed linearly to zero. The
              paper shows that whether this dynamics can settle into a stable disagreement, rather
              than full agreement, is decided by a single number computed from the graph alone:
              μ(G), the smallest maximum-norm nonzero vector of a lattice attached to its cycles.
              A stable non-synchronous equilibrium exists for every small enough δ exactly when
              μ(G) &lt; 1/2 (Theorem 3.7).
            </p>
            <p>
              Complete graphs make the invariant exact: μ(K<sub>n</sub>) = ⌈n/3⌉/n for every n ≥ 3
              (Theorem 4.2). That formula is not monotone — it equals 1/3 whenever 3 divides n, and
              reaches its largest value, 1/2, only at n = 4. K₄ is therefore the one complete graph
              on at least three vertices with no stable disagreement for any regularisation width
              at all, a fact the instrument above lets you watch directly: set the graph to K₄ and
              nearly any starting configuration drifts toward synchrony, where K₃, K₅, K₆ and K₇ can
              instead settle into a lasting, moving disagreement.
            </p>
            <p>
              This page runs the model itself in the browser — a small, fixed-step Runge&ndash;Kutta
              integration of the paper&rsquo;s own differential equation, not an approximation of it —
              so what you see settle, or fail to settle, is the dynamics the theorems above are
              about.
            </p>
            <p>
              Beyond the five families tabulated above, the paper&rsquo;s central conjecture — that
              K₄ is the <em>only</em> 2-connected graph with μ(G) ≥ 1/2 — was checked exactly for
              every single 2-connected graph on three to nine vertices: all 201,726 of them other
              than K₄ (enumerated with nauty, matching OEIS A002218). A one-edge witness (Lemma 4.6)
              resolved 147,342 of them; a three-phase colouring construction (Section 5.2),
              searched and then exactly re-verified, resolved the remaining 54,384. Every witness
              checked out — zero exceptions. Separately, simulating the model directly (not just
              computing μ) across 2,000 random starts per graph at several regularisation widths
              is consistent with the predicted sharp cutoff: for K₃, K₅&ndash;K₉, a nonzero fraction of runs
              settle into a lasting disagreement whenever δ sits below δ*(G), and that fraction
              drops to exactly zero, out of 2,000, the moment δ crosses above it — while K₄ stays at
              zero throughout. On five dense graphs (K₅, K₆, K₈, and two larger graphs just past the
              density threshold of Theorem 5.9), the same seeds run through plain Kuramoto coupling
              synchronised every time, while this paper&rsquo;s geodesic coupling left a real,
              non-vanishing fraction in stable disagreement — the same graph, two coupling laws,
              opposite outcomes.
            </p>
          </Prose>
        </div>

        <p className="mx-auto mt-10 max-w-[40rem] font-sans text-[0.8125rem]">
          <Link href="/laboratory" className="link-quiet">
            More experiments in the Little Laboratory <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
