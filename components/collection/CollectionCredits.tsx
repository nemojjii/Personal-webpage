import type { ImageProvider } from "@/lib/works";

/**
 * The attribution each image provider's own terms require, shown only when
 * a work on the current page actually carries one of its images — never a
 * blanket notice for a provider nothing here uses.
 *
 * TMDB (API Terms of Use, themoviedb.org/documentation/api/terms-of-use,
 * "last updated on: October 20, 2023", Para. 3, re-checked 2026-10-23):
 * requires the TMDB logo — "less prominent than the logos or marks that
 * primarily describe or identify Your Application" — and this notice,
 * quoted verbatim with "website" chosen from the template's bracketed
 * placeholder: "This [website, program, service, application, product]
 * uses TMDB and the TMDB APIs but is not endorsed, certified, or
 * otherwise approved by TMDB."
 *
 * YES24 (이용약관 제6조③4, developers.yes24.com/support/terms, re-checked
 * 2026-10-23): requires crediting YES24 as the source wherever its data
 * is shown ("해당 화면에 회사를 출처로 표기할 것") — no exact wording or
 * logo is mandated, so plain text naming YES24 satisfies it. The same
 * clause also requires a link to the item's own YES24 product page from
 * the book's detail area; that is on each work's own page instead
 * (WorkHeader, via `imageSourceUrl`), since that is where a reader would
 * actually follow it.
 */
export function CollectionCredits({ providers }: { providers: Set<ImageProvider> }) {
  if (providers.size === 0) return null;

  return (
    <p className="no-print mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule-soft pt-6 font-sans text-[0.6875rem] leading-relaxed text-ink-muted">
      {providers.has("tmdb") ? (
        <span className="flex items-center gap-x-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small static brand asset, not an optimised photo */}
          <img src="/credits/tmdb-logo.svg" alt="" aria-hidden="true" className="h-3 w-auto opacity-70" />
          <span>
            This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by{" "}
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="link-quiet">
              TMDB
            </a>
            .
          </span>
        </span>
      ) : null}
      {providers.has("yes24") ? (
        <span>
          일부 도서 표지 제공:{" "}
          <a href="https://www.yes24.com/" target="_blank" rel="noopener noreferrer" className="link-quiet">
            YES24
          </a>
        </span>
      ) : null}
    </p>
  );
}
