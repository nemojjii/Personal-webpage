import type { Metadata } from "next";
import Link from "next/link";

import { GenerativeArtPlayground } from "@/components/art/GenerativeArtPlayground";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Generative Art Playground",
  description:
    "An interactive space where mathematical rules become visual compositions: complex-plane transformations, vector-field streamlines and parametric curves, in International Klein Blue.",
  alternates: { canonical: "/projects/generative-art" },
};

export default function GenerativeArtPage() {
  return (
    <div className="shell py-16 sm:py-20">
      <PageHeader
        eyebrow="Projects / Interactive"
        title="Generative Art Playground"
        intro={
          <>
            <em>Mathematics, taken apart and watched.</em> Three small visual systems — a grid bent
            by a complex mapping, a field of flowing lines, a curve traced from one changing
            parameter — each exactly what its equation says and nothing more. Part of{" "}
            <Link href="/projects/mathematics-perception-and-expression" className="link-quiet text-ink">
              Mathematics, Perception, and Artistic Expression
            </Link>
            , the question this page puts a hand to rather than argues.
          </>
        }
      />

      <div className="mt-12">
        <GenerativeArtPlayground />
      </div>

      <p className="mt-14 border-t border-rule-soft pt-6 font-sans text-[0.8125rem] leading-relaxed text-ink-muted">
        No compositions here are original mathematical discoveries — every mapping, field and curve
        is a standard one. What is here is the chance to move its parameters and watch. International
        Klein Blue, used within each canvas, is a digital approximation of the pigment; this page
        does not claim to reproduce it exactly.
      </p>
    </div>
  );
}
