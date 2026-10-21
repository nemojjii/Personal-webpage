import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkPage, workMetadata } from "@/components/collection/WorkPage";
import { getEntries, getEntry } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEntries("books").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("books", slug);
  if (!entry || entry.collection !== "books") return {};
  return workMetadata(entry);
}

export default async function BookPage({ params }: Params) {
  const { slug } = await params;
  const entry = getEntry("books", slug);
  if (!entry || entry.collection !== "books") notFound();

  return <WorkPage entry={entry} siblings={getEntries("books")} navLabel="Other books" />;
}
