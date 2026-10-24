import Link from "next/link";

import { professionalLinks } from "@/lib/links";
import { navigation, secondaryNavigation, site } from "@/site.config";

export function Footer() {
  const links = professionalLinks();
  const year = new Date().getFullYear();

  return (
    <footer className="no-print mt-24 border-t border-rule sm:mt-32">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] sm:py-14">
        <div>
          <p className="font-serif text-[1.125rem] leading-snug">{site.name}</p>
          <p className="mt-1.5 font-sans text-[0.8125rem] text-ink-soft">{site.affiliation}</p>
          {site.footerNote ? (
            <p className="mt-4 max-w-[26rem] font-serif text-[0.9375rem] leading-relaxed text-ink-soft italic">
              {site.footerNote}
            </p>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <h2 className="label mb-3">Sections</h2>
          <ul className="flex flex-col gap-y-1.5">
            {[...navigation.slice(1), ...secondaryNavigation]
              .flatMap((item) => [
                { ...item, nested: false },
                // A child whose destination is identical to its own parent's
                // (Little Laboratory's dropdown lists itself first, so a
                // visitor without a hover-only desktop dropdown can still
                // reach it — see components/site/NavDropdown.tsx) is already
                // reachable by the parent link right above it here, so
                // listing it again would repeat both the name and the link.
                ...(item.children ?? [])
                  .filter((child) => child.href !== item.href)
                  .map((child) => ({ ...child, nested: true })),
              ])
              .map((item) => (
                <li key={item.href} className={item.nested ? "pl-3" : ""}>
                  <Link
                    href={item.href}
                    className={`font-sans text-[0.8125rem] text-ink-soft transition-colors duration-200 hover:text-accent`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div>
          <h2 className="label mb-3">Elsewhere</h2>
          {links.length ? (
            <ul className="flex flex-col gap-y-1.5">
              {links.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="font-sans text-[0.8125rem] text-ink-soft transition-colors duration-200 hover:text-accent"
                    {...(link.href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-[0.8125rem] text-ink-soft">
              <Link href="/contact" className="link-quiet">
                Contact
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="shell flex items-center justify-between gap-4 border-t border-rule-soft py-6">
        <p className="font-sans text-[0.75rem] text-ink-soft">
          © {year} {site.name}
        </p>
        <span aria-hidden="true" className="font-serif text-[0.75rem] tracking-[0.5em] text-rule">
          ❖
        </span>
      </div>
    </footer>
  );
}
