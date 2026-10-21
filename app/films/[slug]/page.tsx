import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkPage, workMetadata } from "@/components/collection/WorkPage";
import { getEntries, getEntry } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEntries("films").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("films", slug);
  if (!entry || entry.collection !== "films") return {};
  return workMetadata(entry);
}

export default async function FilmPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry("films", slug);
  if (!entry || entry.collection !== "films") notFound();

  return <WorkPage entry={entry} siblings={getEntries("films")} navLabel="Other films" />;
}
