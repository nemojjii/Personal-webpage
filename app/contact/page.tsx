import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/PageHeader";
import { Mark } from "@/components/viz/Mark";
import { professionalLinks } from "@/lib/links";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${site.name}.`,
  alternates: { canonical: "/contact" },
};

/** The channels this page is prepared for, in the order they should appear. */
const CHANNELS = [
  { key: "email", label: "Email" },
  { key: "github", label: "GitHub" },
  { key: "scholar", label: "Google Scholar" },
  { key: "orcid", label: "ORCID" },
  { key: "linkedin", label: "LinkedIn" },
] as const;

export default function ContactPage() {
  const links = professionalLinks();
  const byKey = new Map(links.map((link) => [link.key, link]));
  const extras = links.filter((link) => !CHANNELS.some((c) => c.key === link.key));

  return (
    <div className="shell py-16 sm:py-20">
      <div className="mx-auto max-w-[46rem]">
        <PageHeader eyebrow="Correspondence" title="Contact" intro={site.contactNote} />

        <dl className="mt-12">
          {CHANNELS.map((channel) => {
            const link = byKey.get(channel.key);
            return (
              <div
                key={channel.key}
                className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-6 border-b border-rule-soft py-4 sm:grid-cols-[10rem_1fr]"
              >
                <dt className="label">{channel.label}</dt>
                <dd className="min-w-0">
                  {link ? (
                    <a
                      href={link.href}
                      className="link-quiet break-words font-sans text-[0.9375rem] text-ink"
                      {...(link.href.startsWith("mailto:")
                        ? {}
                        : { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {link.display}
                    </a>
                  ) : (
                    <span className="font-sans text-[0.9375rem] text-ink-muted" aria-label="not listed">
                      —
                    </span>
                  )}
                </dd>
              </div>
            );
          })}

          {extras.map((link) => (
            <div
              key={link.key}
              className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-6 border-b border-rule-soft py-4 sm:grid-cols-[10rem_1fr]"
            >
              <dt className="label">{link.label}</dt>
              <dd className="min-w-0">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-quiet break-words font-sans text-[0.9375rem] text-ink"
                >
                  {link.display}
                </a>
              </dd>
            </div>
          ))}
        </dl>


        <div className="mt-16 flex items-center gap-5 border-t border-rule pt-8">
          <Mark className="shrink-0 text-accent" size={36} />
          <p className="font-serif text-[1rem] leading-relaxed text-ink-soft italic">
            {site.affiliation}
          </p>
        </div>
      </div>
    </div>
  );
}
