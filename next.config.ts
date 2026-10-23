import type { NextConfig } from "next";

/**
 * The canonical host is www.itsmeiris.com — it is what site.config.ts `url`
 * points at, and therefore what every canonical tag, Open Graph URL and
 * sitemap entry uses. The bare apex is attached to the same Vercel project,
 * so this sends it on permanently rather than serving the site twice.
 */
const CANONICAL_HOST = "www.itsmeiris.com";
const APEX_HOST = "itsmeiris.com";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: APEX_HOST }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
      // The biodegradability entry was renamed when its title was corrected to
      // the manuscript's wording ("Molecular Structure Data"). Query strings are
      // carried over automatically.
      {
        source: "/research/chemical-biodegradability-molecular-spectrum-ml",
        destination: "/research/chemical-biodegradability-molecular-structure-ml",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  /**
   * Book covers and film posters, when not a local file under public/, are
   * fetched from one of these hosts — never arbitrary URLs. Keep this list
   * and the allowlist in lib/content.ts (ALLOWED_IMAGE_HOSTS) in sync; a host
   * missing from either place is a broken image, by design.
   *
   *   image.tmdb.org         — TMDB film posters. Free API key (personal,
   *                            non-commercial use); its terms forbid caching
   *                            TMDB content for more than six months, so any
   *                            entry using this host must set `imageFetched`
   *                            and be re-checked by `npm run
   *                            check-image-freshness` (see README).
   *   image.yes24.com        — YES24 Developers Korean book covers. Free
   *                            "Basic" key, issued instantly to a YES24
   *                            account holder (developers.yes24.com). Its
   *                            terms require crediting YES24 and linking back
   *                            to the book's YES24 page — use `imageCredit`
   *                            and `imageSourceUrl` together for every entry
   *                            on this host.
   *   covers.openlibrary.org — Open Library book covers (no key required).
   *                            Its general reuse terms have not been
   *                            confirmed; treat as provisional.
   *
   * Aladin's OpenAPI (the earlier plan for Korean-edition covers) was
   * discontinued: new keys stopped issuing 2026-09-04 and the service for
   * existing keys ends 2026-10-30. Its host is deliberately not listed here.
   */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "image.yes24.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
};

export default nextConfig;
