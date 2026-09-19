"use client";

import { useMemo } from "react";
import { buildCustomGraph } from "../../lib/diagrams";
import type { Diagram } from "../../lib/terms";
import { GraphCanvas } from "./GraphCanvas";

export function CustomDiagram({
  diagram,
}: {
  diagram: Extract<Diagram, { kind: "custom" }>;
}) {
  const { nodes, edges } = useMemo(() => buildCustomGraph(diagram), [diagram]);
  return <GraphCanvas nodes={nodes} edges={edges} height={540} />;
}
