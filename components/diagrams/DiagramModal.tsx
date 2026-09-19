"use client";

import { useEffect } from "react";
import type { Group, Term } from "../../lib/terms";
import { AutoGraph } from "./AutoGraph";
import { CustomDiagram } from "./CustomDiagram";
import { ModelDiagram } from "./ModelDiagram";

function diagramTitle(term: Term): { title: string; caption: string } {
  const d = term.diagram;
  if (d.kind === "custom") return { title: d.title, caption: d.caption ?? "" };
  if (d.kind === "model")
    return {
      title: `${term.name}, visualized`,
      caption: "The same prompt, two views — the machinery, then the bill.",
    };
  return {
    title: `How \u201C${term.name}\u201D connects`,
    caption: "Every relationship, one hop out. Click a neighbor to open its term.",
  };
}

export function DiagramModal({
  term,
  terms,
  groups,
  onClose,
  onTermClick,
}: {
  term: Term;
  terms: Term[];
  groups: Group[];
  onClose: () => void;
  onTermClick: (termId: string) => void;
}) {
  const { title, caption } = diagramTitle(term);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="rise-in relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-line bg-paper shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper/95 px-6 py-5 backdrop-blur-sm sm:px-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Relationship diagram
            </div>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h2>
            {caption && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{caption}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close diagram"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-card text-xl leading-none text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          {term.diagram.kind === "auto" && (
            <AutoGraph term={term} terms={terms} groups={groups} onTermClick={onTermClick} />
          )}
          {term.diagram.kind === "custom" && <CustomDiagram diagram={term.diagram} />}
          {term.diagram.kind === "model" && <ModelDiagram term={term} />}
        </div>
      </div>
    </div>
  );
}
