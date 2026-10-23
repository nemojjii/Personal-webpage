import Link from "next/link";
import type { ReactNode } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { getEntry } from "@/lib/content";
import { chirpPoints } from "@/lib/home/chirp";
import { FOURIER_DEFAULTS, maxActiveAmplitude, sampleTimeDomain } from "@/lib/laboratory/fourier";
import { ROSE_DEFAULTS, sampleCurve } from "@/lib/art/parametric";

/**
 * Three panels, one dimension of the work each, all built the same way: a
 * small server-rendered SVG computed from the same pure model a real
 * instrument elsewhere on the site uses (or, for the research panel, a
 * plainly illustrative shape — see lib/home/chirp.ts), a category label, the
 * verified title, one sentence, and a link to the real thing. Nothing here
 * is animated or interactive; the point is a preview, not a second copy of
 * the instrument.
 */
export function SelectedWork() {
  const research = getEntry("research", "gravitational-waves-binary-black-holes");
  if (!research || research.collection !== "research") return null;

  return (
    <section className="pt-10 sm:pt-12">
      <SectionHeading>Selected Work</SectionHeading>
      <p className="mt-5 max-w-[34rem] font-serif text-[1.0625rem] leading-[1.6] text-ink-soft">
        Three ways the same curiosity has been put to work — a research question,
        a model made interactive, a mathematical structure made visual.
      </p>

      <div className="mt-9 grid gap-x-8 gap-y-12 sm:grid-cols-3">
        <WorkPanel
          category="Research"
          title={research.title}
          description="A classical model of a black-hole inspiral, its orbital frequency sweep set beside LIGO's observed spectrograms."
          href={research.href}
          caption="Illustrative waveform"
        >
          <ChirpPreview />
        </WorkPanel>

        <WorkPanel
          category="Scientific Computing"
          title="Fourier Explorer"
          description="An interactive exploration of finite Fourier synthesis — a signal built one harmonic at a time, and its discrete amplitude spectrum."
          href="/laboratory/fourier-explorer"
        >
          <FourierPreview />
        </WorkPanel>

        <WorkPanel
          category="Generative Art"
          title="Generative Art Playground"
          description="Mathematical structures explored as visual art: complex transformations, vector fields and parametric curves, in International Klein Blue."
          href="/projects/generative-art"
        >
          <ArtPreview />
        </WorkPanel>
      </div>
    </section>
  );
}

function WorkPanel({
  category,
  title,
  description,
  href,
  /** A discreet note shown directly beneath the preview — for a visual that could otherwise be mistaken for real data or output. */
  caption,
  children,
}: {
  category: string;
  title: string;
  description: string;
  href: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="entry-row group block">
      <div className="aspect-square border border-rule-soft bg-surface/40 p-5 transition-colors duration-300 group-hover:border-rule">
        {children}
      </div>
      {caption ? (
        <p className="mt-2 font-sans text-[0.6875rem] text-ink-muted italic">{caption}</p>
      ) : null}
      <p className="mt-4 mb-1.5 label">{category}</p>
      <h3 className="font-serif text-[1.1875rem] leading-snug">
        <span className="entry-title">{title}</span>
      </h3>
      <p className="mt-2 font-serif text-[0.9375rem] leading-[1.55] text-ink-soft">{description}</p>
      <p className="mt-3 font-sans text-[0.75rem] text-ink">
        Explore
        <span aria-hidden="true"> →</span>
      </p>
    </Link>
  );
}

/** Illustrative frequency-sweep shape — see lib/home/chirp.ts. Not observed data. */
function ChirpPreview() {
  const points = chirpPoints(140);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(p.t * 200).toFixed(1)},${(60 - p.y * 48).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 200 120"
      className="h-full w-full"
      role="img"
      aria-label="An illustrative frequency-sweep ('chirp') shape, rising in frequency left to right — not the observed gravitational-wave signal."
    >
      <line x1="0" y1="60" x2="200" y2="60" stroke="var(--color-rule)" strokeWidth="0.75" />
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** The default 3-harmonic sum from Fourier Explorer's own model — lib/laboratory/fourier.ts. */
function FourierPreview() {
  const samples = sampleTimeDomain(FOURIER_DEFAULTS, 2, 70);
  const yMax = Math.max(0.2, maxActiveAmplitude(FOURIER_DEFAULTS));
  const tMax = samples[samples.length - 1]?.t || 1;
  const d = samples
    .map((s, i) => `${i === 0 ? "M" : "L"}${((s.t / tMax) * 200).toFixed(1)},${(60 - (s.sum / yMax) * 46).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 200 120"
      className="h-full w-full"
      role="img"
      aria-label="The sum of three sine-wave harmonics, Fourier Explorer's default composition, over two periods."
    >
      <line x1="0" y1="60" x2="200" y2="60" stroke="var(--color-rule)" strokeWidth="0.75" />
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** A five-petal rose curve, Generative Art Playground's own default — lib/art/parametric.ts. */
function ArtPreview() {
  const points = sampleCurve(ROSE_DEFAULTS, 220);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(100 + p.x * 85).toFixed(1)},${(100 - p.y * 85).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      role="img"
      aria-label="A five-petal rose curve, r equals cosine of 5 theta — Generative Art Playground's default parametric form, in International Klein Blue."
    >
      <path d={d} fill="none" stroke="var(--color-klein)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
