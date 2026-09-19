import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadGroups, loadTerms } from "../../../lib/content";
import { GlossaryBrowser } from "../../../components/glossary/GlossaryBrowser";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return loadTerms()
    .filter((t) => t.status === "published")
    .map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const term = loadTerms().find((t) => t.id === slug);
  if (!term) return { title: "Term not found — AI Glossary" };
  return {
    title: `${term.name} — AI Glossary`,
    description: term.tagline,
  };
}

export default async function TermPage({ params }: Props) {
  const { slug } = await params;
  const terms = loadTerms().filter((t) => t.status === "published");
  const groups = loadGroups();
  const term = terms.find((t) => t.id === slug);
  if (!term) notFound();

  return <GlossaryBrowser terms={terms} groups={groups} activeSlug={term.id} />;
}
