"use client";

import { useMemo } from "react";
import { buildModelPanelGraph } from "../../lib/diagrams";
import type { Diagram, Term } from "../../lib/terms";
import { GraphCanvas } from "./GraphCanvas";
import { PromptJourney } from "./PromptJourney";

function ConnectorStrip() {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-line bg-card px-5 py-4">
      <span className="hidden shrink-0 rounded-full bg-accent-tint px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-deep sm:inline-block">
        One prompt, two views
      </span>
      <p className="text-sm leading-relaxed text-ink-soft">
        Follow a single prompt through the machine: <strong className="text-ink">what runs</strong>
        <span className="mx-2 inline-block w-10 align-middle sm:w-16" aria-hidden>
          <svg viewBox="0 0 64 8" className="w-full" fill="none">
            <line
              x1="0"
              y1="4"
              x2="58"
              y2="4"
              stroke="#0f766e"
              strokeWidth="2"
              className="flow-dash"
            />
            <path d="M54 1 61 4 54 7" stroke="#0f766e" strokeWidth="2" fill="none" />
          </svg>
        </span>
        <strong className="text-ink">what it costs</strong>
      </p>
    </div>
  );
}

function PanelHeader({ index, title, caption }: { index: string; title: string; caption?: string }) {
  return (
    <div className="border-t-[3px] border-accent pt-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm font-bold text-accent">{index}</span>
        <h3 className="font-serif text-2xl font-semibold tracking-tight">{title}</h3>
      </div>
      {caption && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{caption}</p>}
    </div>
  );
}

export function ModelDiagram({ term }: { term: Term }) {
  const diagram = term.diagram;
  if (diagram.kind !== "model") return null;
  const [underTheHood, promptJourney] = diagram.panels;

  const under = useMemo(() => buildModelPanelGraph(underTheHood), [underTheHood]);

  return (
    <div>
      <ConnectorStrip />
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section>
          <PanelHeader index="01" title={underTheHood.title} caption={underTheHood.caption} />
          <div className="mt-4">
            <GraphCanvas nodes={under.nodes} edges={under.edges} height={480} />
          </div>
          <p className="mt-3 rounded-lg bg-paper-deep/70 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            <strong className="text-ink">About that $5.5M figure:</strong> it covers the final
            training run only — not the years of research, failed experiments, and engineering
            that made it possible. The cost of the last lap, not the whole race.
          </p>
        </section>
        <section>
          <PanelHeader index="02" title={promptJourney.title} caption={promptJourney.caption} />
          <div className="mt-4">
            <PromptJourney panel={promptJourney} />
          </div>
        </section>
      </div>
    </div>
  );
}
