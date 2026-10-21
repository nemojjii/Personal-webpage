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
};

export default nextConfig;
