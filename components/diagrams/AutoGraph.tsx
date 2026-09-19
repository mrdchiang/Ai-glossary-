"use client";

import { useMemo } from "react";
import { buildAutoGraph } from "../../lib/diagrams";
import type { Group, Term } from "../../lib/terms";
import { GraphCanvas } from "./GraphCanvas";

export function AutoGraph({
  term,
  terms,
  groups,
  onTermClick,
}: {
  term: Term;
  terms: Term[];
  groups: Group[];
  onTermClick?: (termId: string) => void;
}) {
  const { nodes, edges } = useMemo(
    () => buildAutoGraph(term, terms, groups),
    [term, terms, groups],
  );
  return <GraphCanvas nodes={nodes} edges={edges} onTermClick={onTermClick} height={460} />;
}
