import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";

import "katex/dist/katex.min.css";
import "./globals.css";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { professionalLinks } from "@/lib/links";
import { site } from "@/site.config";

const garamond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-garamond",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.affiliation}`,
    template: `%s — ${site.titleSuffix}`,
  },
  description: site.description,
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.affiliation}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

/**
 * schema.org Person, assembled from site.config so it can never disagree with
 * what the pages say. Fields that are not filled in are left out entirely
 * rather than published empty.
 */
function personSchema() {
  const profiles = professionalLinks()
    .filter((link) => !link.href.startsWith("mailto:"))
    .map((link) => link.href);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    description: site.description,
    ...(site.links.email ? { email: `mailto:${site.links.email}` } : {}),
    ...(site.position ? { jobTitle: site.position } : {}),
    ...(site.affiliation
      ? { affiliation: { "@type": "CollegeOrUniversity", name: site.affiliation } }
      : {}),
    knowsAbout: ["Chemical physics", "Mathematics", "Mathematical modeling"],
    ...(profiles.length ? { sameAs: profiles } : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${garamond.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          // Serialised once at build time from site.config.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema()) }}
        />
        <a
          href="#main"
          className="no-print sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]
                     focus:border focus:border-accent focus:bg-paper focus:px-4 focus:py-2
                     focus:font-sans focus:text-[0.8125rem] focus:text-accent"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="pt-[var(--nav-h)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
