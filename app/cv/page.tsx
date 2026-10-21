import type { Metadata } from "next";

import { Attachment } from "@/components/ui/Attachment";
import { PrintButton } from "@/components/ui/PrintButton";
import { type CvItem, type CvSection, cvConfig, cvSections } from "@/content/cv";
import { professionalLinks } from "@/lib/links";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Curriculum Vitae",
  description: `Academic curriculum vitae of ${site.name}.`,
  alternates: { canonical: "/cv" },
};

function isEmpty(section: CvSection) {
  return section.kind === "items" ? section.items.length === 0 : section.groups.length === 0;
}

function Item({ item }: { item: CvItem }) {
  return (
    <li className="print-avoid-break grid gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto]">
      <div>
        <h3 className="font-serif text-[1.0625rem] leading-snug">
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-quiet"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
        {item.organisation || item.location ? (
          <p className="mt-0.5 font-sans text-[0.8125rem] text-ink-soft">
            {[item.organisation, item.location].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {item.note ? (
          <p className="mt-1 font-serif text-[0.9375rem] text-ink-soft italic">{item.note}</p>
        ) : null}
        {item.details?.length ? (
          <ul className="mt-2 flex flex-col gap-y-1">
            {item.details.map((detail, i) => (
              <li
                key={i}
                className="grid grid-cols-[1.1rem_1fr] font-sans text-[0.8125rem] leading-[1.6] text-ink-soft"
              >
                <span aria-hidden="true" className="text-ink-muted">
                  —
                </span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {item.period ? (
        <p className="font-sans text-[0.75rem] text-ink-muted tnum sm:pt-1 sm:text-right">
          {item.period}
        </p>
      ) : null}
    </li>
  );
}

export default function CvPage() {
  const links = professionalLinks();
  const sections = cvConfig.showEmptySections
    ? cvSections
    : cvSections.filter((section) => !isEmpty(section));

  return (
    <div className="shell py-16 sm:py-20">
      <div className="mx-auto max-w-[46rem]">
        {/* ── Masthead ───────────────────────────────────────────────────── */}
        <header className="border-b border-rule pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label mb-4">Curriculum Vitae</p>
              <h1 className="font-serif text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1] tracking-[-0.015em]">
                {site.name}
              </h1>
              <p className="mt-2 font-sans text-[0.875rem] text-ink-soft">
                {[site.position, site.affiliation].filter(Boolean).join(" · ")}
              </p>
              {cvConfig.standfirst ? (
                <p className="mt-3 max-w-[32rem] font-serif text-[1.0625rem] leading-relaxed text-ink-soft italic">
                  {cvConfig.standfirst}
                </p>
              ) : null}
            </div>

            <div className="no-print flex flex-wrap items-center gap-4">
              <Attachment
                href={site.cv.pdf}
                label="Download PDF"
                note={site.cv.updated || undefined}
              />
              <PrintButton label="Print this page" />
            </div>
          </div>

          {links.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
              {links.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="font-sans text-[0.8125rem] text-ink-soft transition-colors duration-200 hover:text-accent"
                    {...(link.href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    {link.display}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

        </header>

        {/* ── Sections ───────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-12">
          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`cv-${section.id}`}
              className="grid gap-x-8 gap-y-4 sm:grid-cols-[8.5rem_1fr]"
            >
              <h2
                id={`cv-${section.id}`}
                className="label border-b border-rule-soft pb-1.5 sm:border-b-0 sm:pt-1"
              >
                {section.label}
              </h2>

              <div>
                {isEmpty(section) ? (
                  <p className="font-serif text-[1rem] text-ink-muted italic">
                    Not yet listed.
                  </p>
                ) : section.kind === "items" ? (
                  <ul className="flex flex-col gap-y-7">
                    {section.items.map((item, i) => (
                      <Item key={i} item={item} />
                    ))}
                  </ul>
                ) : (
                  <dl className="flex flex-col gap-y-3">
                    {section.groups.map((group) => (
                      <div
                        key={group.label}
                        className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[7rem_1fr]"
                      >
                        <dt className="font-sans text-[0.8125rem] text-ink">{group.label}</dt>
                        <dd className="font-sans text-[0.8125rem] text-ink-soft">
                          {group.items.join(", ")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
