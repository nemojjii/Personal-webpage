import type { ReactNode } from "react";

const KINDS = {
  theorem: "Theorem",
  lemma: "Lemma",
  proposition: "Proposition",
  definition: "Definition",
  conjecture: "Conjecture",
  remark: "Remark",
  proof: "Proof",
} as const;

export type TheoremKind = keyof typeof KINDS;

/**
 * A mathematical environment.
 *
 *   <Theorem kind="definition" name="Perceptual metric" number="2.1">
 *     Let $(M, g)$ be ...
 *   </Theorem>
 */
export function Theorem({
  kind = "theorem",
  name,
  number,
  children,
}: {
  kind?: TheoremKind;
  name?: string;
  number?: string | number;
  children: ReactNode;
}) {
  const isProof = kind === "proof";
  return (
    <div
      className={`my-8 print-avoid-break border-l pl-5 ${
        isProof ? "border-rule" : "border-accent-soft/60"
      }`}
    >
      <p className="!mt-0 !mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.14em] uppercase text-accent">
        {KINDS[kind]}
        {number ? <span className="ml-1.5 text-ink-muted">{number}</span> : null}
        {name ? (
          <span className="ml-2 font-serif text-[0.95rem] normal-case tracking-normal text-ink-soft italic">
            {name}
          </span>
        ) : null}
      </p>
      <div className={isProof ? "text-ink-soft" : "italic"}>{children}</div>
      {isProof ? <p className="!mt-2 text-right text-ink-muted">□</p> : null}
    </div>
  );
}
