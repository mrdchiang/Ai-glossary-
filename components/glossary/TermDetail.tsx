"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildTermGraph, type Group, type Term } from "../../lib/terms";
import { EDGE_VERBS } from "../../lib/diagrams";
import { DiagramModal } from "../diagrams/DiagramModal";

function Eyebrow({ group }: { group?: Group }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-medium">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: group?.color ?? "#a8a29e" }}
      />
      <span className="text-ink-soft">{group?.name}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        {title}
      </h2>
      <div className="mt-2.5 text-[17px] leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

function diagramButtonLabel(term: Term): string {
  if (term.diagram.kind === "model") return `See ${term.name}, visualized`;
  if (term.diagram.kind === "custom") return "See it as a diagram";
  return "View relationship diagram";
}

export function TermDetail({
  term,
  terms,
  groups,
}: {
  term: Term;
  terms: Term[];
  groups: Group[];
}) {
  const router = useRouter();
  const [diagramOpen, setDiagramOpen] = useState(false);

  const group = groups.find((g) => g.id === term.group);
  const graph = buildTermGraph(terms);
  const related = (graph.related.get(term.id) ?? []).sort((a, b) =>
    a.direction === b.direction
      ? a.term.name.localeCompare(b.term.name)
      : a.direction === "outgoing"
        ? -1
        : 1,
  );

  return (
    <article className="rise-in" key={term.id}>
      <Eyebrow group={group} />
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        {term.name}
      </h1>
      <p className="mt-3 max-w-2xl font-serif text-xl italic leading-relaxed text-ink-soft">
        {term.tagline}
      </p>

      <button
        onClick={() => setDiagramOpen(true)}
        className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(15,118,110,0.3)] transition-all hover:bg-accent-deep hover:shadow-[0_6px_20px_rgba(15,118,110,0.4)] active:scale-[0.98]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <circle cx="4" cy="4" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="14" cy="4" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="9" cy="14" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M6 5.5 7.8 12M12 5.5 10.2 12M6.4 4h5.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {diagramButtonLabel(term)}
      </button>

      <Section title="What it is">
        <p>{term.definition}</p>
      </Section>

      <Section title="Why it matters">
        <p>{term.whyItMatters}</p>
      </Section>

      <section className="mt-9 overflow-hidden rounded-2xl border border-accent/25 bg-accent-tint">
        <div className="border-b border-accent/15 px-6 pt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-deep">
            A concrete example
          </h2>
          <p className="mt-1.5 font-serif text-xl font-semibold">{term.example.title}</p>
        </div>
        <p className="px-6 py-5 text-[16px] leading-relaxed text-ink/85">{term.example.body}</p>
      </section>

      {related.length > 0 && (
        <Section title="How it connects">
          <div className="flex flex-wrap gap-2.5">
            {related.map((r) => (
              <Link
                key={`${r.direction}-${r.term.id}`}
                href={`/glossary/${r.term.id}`}
                className="group inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-card py-2 pl-2 pr-4 transition-all hover:-translate-y-px hover:border-accent/50 hover:shadow-[0_4px_12px_rgba(15,118,110,0.12)]"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      groups.find((g) => g.id === r.term.group)?.color ?? "#a8a29e",
                  }}
                />
                <span className="truncate text-[15px] font-semibold group-hover:text-accent-deep">
                  {r.term.name}
                </span>
                <span className="shrink-0 text-[13px] text-ink-faint">
                  {r.direction === "outgoing" ? "" : "← "}
                  {r.label ?? EDGE_VERBS[r.type] ?? r.type}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {term.footnotes && term.footnotes.length > 0 && (
        <section className="mt-9">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            For the technical reader
          </h2>
          <div className="mt-2.5 space-y-2.5">
            {term.footnotes.map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-line bg-card px-5 py-4 open:shadow-[0_2px_10px_rgba(28,25,23,0.06)]"
              >
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-ink-soft marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 inline-block transition-transform group-open:rotate-90">
                    →
                  </span>
                  {f.label}
                </summary>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink/80">{f.body}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {diagramOpen && (
        <DiagramModal
          term={term}
          terms={terms}
          groups={groups}
          onClose={() => setDiagramOpen(false)}
          onTermClick={(termId) => {
            setDiagramOpen(false);
            router.push(`/glossary/${termId}`);
          }}
        />
      )}
    </article>
  );
}
