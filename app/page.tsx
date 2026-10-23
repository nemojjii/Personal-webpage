import Link from "next/link";

import { WorkGrid } from "@/components/collection/WorkGrid";
import { SelectedWork } from "@/components/home/SelectedWork";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryList } from "@/components/ui/EntryRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroField } from "@/components/viz/HeroField";
import { allEntries, getEntries, splitFeatured } from "@/lib/content";
import { isWork } from "@/lib/types";
import { toWorkCard } from "@/lib/works";
import { site } from "@/site.config";

export default function HomePage() {
  const research = splitFeatured(getEntries("research"));
  const featuredResearch = [...research.featured, ...research.rest].slice(0, 3);
  const projects = splitFeatured(getEntries("projects"));
  const featuredProjects = [...projects.featured, ...projects.rest].slice(0, 2);
  // Featured works first, then the most recently added, across books and films.
  const works = allEntries().filter(isWork);
  const fromCollection = [...works.filter((w) => w.featured), ...works.filter((w) => !w.featured)]
    .slice(0, 6)
    .map(toWorkCard);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-x-clip">
        <div className="shell relative pt-16 pb-14 sm:pt-24 lg:pt-28 lg:pb-16">
          <div className="rise max-w-[36rem]">
            <p className="label">
              {site.name}
              {site.affiliation ? (
                <>
                  <span aria-hidden="true" className="mx-2 text-rule">
                    /
                  </span>
                  {site.affiliation}
                </>
              ) : null}
            </p>

            <h1 className="mt-6 font-serif text-hero leading-[1.02] tracking-[-0.025em] text-balance">
              {site.headline}
            </h1>

            <div className="mt-7 flex max-w-[32rem] flex-col gap-y-4 font-serif text-[1.1875rem] leading-[1.68] text-ink-soft sm:text-[1.25rem]">
              {site.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <p className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-[0.8125rem]">
              <Link href="/about" className="link-quiet text-ink">
                More in About
              </Link>
              <Link href="/research" className="link-quiet text-ink">
                Research
              </Link>
              <Link href="/cv" className="link-quiet text-ink">
                CV
              </Link>
            </p>
          </div>

          {/* Interwoven harmonic ribbons — see components/viz/HeroField.tsx.
              No frame: from lg the field stands beside the text and runs to the
              right edge of the viewport, fading towards the words; below lg it
              is a full-bleed band beneath the introduction. Decorative, so it
              is hidden from assistive technology. */}
          <div
            className="rise absolute -top-6 -bottom-4 left-[40.5rem] right-[calc(-1_*_max(0px,_(100vw_-_76rem)_/_2))] hidden lg:block"
            style={{ animationDelay: "160ms" }}
            aria-hidden="true"
          >
            <HeroField fade={{ left: 0.34, right: 0.04, top: 0.16, bottom: 0.18 }} />
          </div>
          <div
            className="rise relative mt-12 ml-[calc(50%_-_50vw)] h-[clamp(13rem,54vw,22rem)] w-screen lg:hidden"
            style={{ animationDelay: "160ms" }}
            aria-hidden="true"
          >
            <HeroField fade={{ top: 0.2, bottom: 0.22, left: 0.05, right: 0.05 }} />
          </div>

          <p className="mt-3 max-w-[22rem] font-sans text-[0.6875rem] leading-relaxed text-ink-muted">
            <span className="font-mono text-ink-soft">
              H = V·s/L + E·Σ Aᵢ cos(kᵢ·r − ωᵢt + φᵢ)
            </span>
            <br />
            Three families of streamlines, each the level sets of its own stream
            function: a bent, slowly turning drift that breathes along the flow,
            with travelling waves under a slow envelope. Every line stays open;
            where the families cross, weight and opacity give the depth.
          </p>
        </div>
      </section>

      <div className="shell">
      <SelectedWork />

      {/* ── Research ────────────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-20">
        <SectionHeading
          action={
            featuredResearch.length ? { label: "All research", href: "/research" } : undefined
          }
        >
          Research
        </SectionHeading>
        {featuredResearch.length ? (
          <EntryList entries={featuredResearch} className="mt-2 border-t-0" />
        ) : (
          <div className="mt-6">
            <EmptyState>Research will be listed here.</EmptyState>
          </div>
        )}
      </section>

      {/* ── Projects ───────────────────────────────────────────────────── */}
      {featuredProjects.length ? (
        <section className="pt-16 sm:pt-20">
          <SectionHeading action={{ label: "All projects", href: "/projects" }}>
            Projects
          </SectionHeading>
          <EntryList entries={featuredProjects} className="mt-2 border-t-0" />
        </section>
      ) : null}

      {/* ── The Collection ─────────────────────────────────────────────── */}
      {fromCollection.length ? (
        <section className="pt-16 sm:pt-20">
          <SectionHeading action={{ label: "The Collection", href: "/collection" }}>
            From the collection
          </SectionHeading>
          <WorkGrid items={fromCollection} variant="strip" showKind className="mt-7" />
        </section>
      ) : null}
      </div>
    </>
  );
}
