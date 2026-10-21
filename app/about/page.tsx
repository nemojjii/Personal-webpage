import type { Metadata } from "next";
import Link from "next/link";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mark } from "@/components/viz/Mark";
import { getPage } from "@/lib/pages";
import { buildToc } from "@/lib/toc";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name} — academic background, research interests and intellectual interests.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const page = getPage("about");
  const toc = page ? buildToc(page.body) : [];

  return (
    <div className="shell py-16 sm:py-20">
      <div className="mx-auto max-w-[40rem] xl:max-w-[57rem]">
        <PageHeader
          eyebrow={site.affiliation}
          title={page?.title ?? "About"}
          intro={page?.intro}
        />
      </div>

      <div className="mt-12">
        <ArticleLayout toc={toc}>
          {page ? (
            <Prose>
              <Mdx source={page.body} />
            </Prose>
          ) : (
            <EmptyState>This page has not been written yet.</EmptyState>
          )}

          <footer className="no-print mt-20 flex items-center gap-5 border-t border-rule pt-7">
            <Mark className="shrink-0 text-accent" size={40} />
            <p className="font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
              The full record is on the{" "}
              <Link href="/cv" className="link-quiet text-ink">
                CV
              </Link>
              . For correspondence, see{" "}
              <Link href="/contact" className="link-quiet text-ink">
                contact
              </Link>
              .
            </p>
          </footer>
        </ArticleLayout>
      </div>
    </div>
  );
}
