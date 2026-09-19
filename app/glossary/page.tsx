import type { Metadata } from "next";
import { loadGroups, loadTerms } from "../../lib/content";
import { GlossaryBrowser } from "../../components/glossary/GlossaryBrowser";

export const metadata: Metadata = {
  title: "Browse terms — AI Glossary",
  description: "Search and explore plain-language AI definitions with relationship diagrams.",
};

export default function GlossaryIndex() {
  const terms = loadTerms().filter((t) => t.status === "published");
  const groups = loadGroups();
  return <GlossaryBrowser terms={terms} groups={groups} activeSlug={terms[0]?.id ?? ""} />;
}
