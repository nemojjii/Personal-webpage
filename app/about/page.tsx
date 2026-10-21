import type { Metadata } from "next";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { Mdx } from "@/components/content/mdx";
import { Prose } from "@/components/content/Prose";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
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
            <Prose className="prose-sections">
              <Mdx source={page.body} />
            </Prose>
          ) : (
            <EmptyState>This page has not been written yet.</EmptyState>
          )}
        </ArticleLayout>
      </div>
    </div>
  );
}
