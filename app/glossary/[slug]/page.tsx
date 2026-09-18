import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildTermGraph, loadGroups, loadTerms, type Term } from "../../../lib/terms";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return loadTerms().map((t) => ({ slug: t.id }));
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

const EDGE_VERBS: Record<string, string> = {
  "is-a": "is a type of",
  "part-of": "is a component of",
  uses: "uses",
  enables: "enables",
  causes: "causes",
  "contrasts-with": "contrasts with",
  "governed-by": "is governed by",
  "instance-of": "is an instance of",
  "related-to": "relates to",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="mt-3 leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

function DiagramPreview({ term }: { term: Term }) {
  const d = term.diagram;
  if (d.kind === "auto") {
    return (
      <p className="text-sm text-stone-500">
        Interactive relationship diagram lands in M4 — generated automatically from this
        term&rsquo;s connections below.
      </p>
    );
  }
  if (d.kind === "custom") {
    return (
      <div>
        <p className="font-medium">{d.title}</p>
        {d.caption && <p className="mt-1 text-sm text-stone-500">{d.caption}</p>}
        <ol className="mt-4 space-y-2">
          {d.nodes.map((n, i) => (
            <li key={n.id} className="flex gap-3 rounded-lg border border-stone-200 bg-white p-3">
              <span className="font-mono text-sm text-stone-400">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <span className="font-medium">{n.label}</span>
                <p className="text-sm text-stone-600">{n.blurb}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-stone-500">
          Interactive node-and-edge version lands in M5 — the data above already drives it.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {d.panels.map((panel) => (
        <div key={panel.id}>
          <p className="font-medium">{panel.title}</p>
          {panel.caption && <p className="mt-1 text-sm text-stone-500">{panel.caption}</p>}
          <ol className="mt-4 space-y-2">
            {panel.nodes.map((n, i) => (
              <li key={n.id} className="flex gap-3 rounded-lg border border-stone-200 bg-white p-3">
                <span className="font-mono text-sm text-stone-400">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <span className="font-medium">{n.label}</span>
                  <p className="text-sm text-stone-600">{n.blurb}</p>
                </div>
              </li>
            ))}
          </ol>
          {panel.annotation && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {panel.annotation}
            </p>
          )}
        </div>
      ))}
      <p className="text-sm text-stone-500">
        Interactive two-panel version lands in M5 — the data above already drives it.
      </p>
    </div>
  );
}

export default async function TermPage({ params }: Props) {
  const { slug } = await params;
  const terms = loadTerms();
  const groups = loadGroups();
  const term = terms.find((t) => t.id === slug);
  if (!term) notFound();

  const group = groups.find((g) => g.id === term.group);
  const graph = buildTermGraph(terms);
  const related = (graph.related.get(term.id) ?? []).sort((a, b) =>
    a.direction === b.direction ? a.term.name.localeCompare(b.term.name) : a.direction === "outgoing" ? -1 : 1,
  );

  return (
    <article className="py-12">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← All terms
      </Link>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: group?.color ?? "#999" }}
        />
        <span className="text-stone-500">{group?.name}</span>
      </div>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{term.name}</h1>
      <p className="mt-3 text-lg text-stone-600">{term.tagline}</p>

      <Section title="What it is">
        <p>{term.definition}</p>
      </Section>

      <Section title="Why it matters">
        <p>{term.whyItMatters}</p>
      </Section>

      <section className="mt-10 rounded-xl border border-teal-900/15 bg-teal-50 p-6">
        <h2 className="font-serif text-xl font-semibold">A concrete example</h2>
        <p className="mt-1 font-medium">{term.example.title}</p>
        <p className="mt-2 leading-relaxed text-stone-700">{term.example.body}</p>
      </section>

      {related.length > 0 && (
        <Section title="How it connects">
          <ul className="space-y-2">
            {related.map((r) => (
              <li
                key={`${r.direction}-${r.term.id}`}
                className="flex items-baseline justify-between gap-4 rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <Link
                  href={`/glossary/${r.term.id}`}
                  className="font-medium hover:underline"
                >
                  {r.term.name}
                </Link>
                <span className="text-sm text-stone-500">
                  {r.direction === "outgoing" ? "→" : "←"}{" "}
                  {r.label ?? EDGE_VERBS[r.type] ?? r.type}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Diagram">
        <DiagramPreview term={term} />
      </Section>

      {term.footnotes && term.footnotes.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold">Footnotes</h2>
          <div className="mt-3 space-y-2">
            {term.footnotes.map((f, i) => (
              <details
                key={i}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-stone-600">
                  {f.label}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">{f.body}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
