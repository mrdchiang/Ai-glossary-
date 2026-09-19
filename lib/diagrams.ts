import type { Edge, Node } from "@xyflow/react";
import {
  buildTermGraph,
  type Diagram,
  type Group,
  type Term,
} from "./terms";

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export const EDGE_VERBS: Record<string, string> = {
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

export function edgeLabel(e: { type: string; label?: string }): string {
  return e.label ?? EDGE_VERBS[e.type] ?? e.type;
}

/** Data payload for every custom diagram node. */
export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  blurb?: string;
  groupColor?: string;
  groupName?: string;
  /** visual role */
  variant: "center" | "term" | "info" | "note";
  /** custom-diagram node kind: input | step | decision | output */
  kind?: string;
  /** term id — makes term nodes clickable */
  termId?: string;
  clickable?: boolean;
}

export type FlowNode = Node<FlowNodeData>;

const INK = "#1c1917";
const INK_SOFT = "#57534e";
const LINE = "#e8e0cf";
const ACCENT = "#0f766e";

/** Pill-styled edge label shared by every diagram. */
export function pillEdge(partial: Partial<Edge> & { id: string; source: string; target: string }): Edge {
  return {
    type: "smoothstep",
    animated: false,
    style: { stroke: "#b8ab8f", strokeWidth: 1.75 },
    labelStyle: {
      fontSize: 11,
      fontWeight: 600,
      fill: INK_SOFT,
      fontFamily: "Inter, ui-sans-serif, sans-serif",
    },
    labelBgStyle: { fill: "#fffdf9", fillOpacity: 1, stroke: LINE, strokeWidth: 1 },
    labelBgPadding: [10, 5] as [number, number],
    labelBgBorderRadius: 999,
    ...partial,
  } as Edge;
}

function groupOf(groups: Group[], term: Term): Group | undefined {
  return groups.find((g) => g.id === term.group);
}

// ---------------------------------------------------------------------------
// Auto graph: center term + 1-hop neighbors on an ellipse
// ---------------------------------------------------------------------------

export function buildAutoGraph(term: Term, terms: Term[], groups: Group[]) {
  const graph = buildTermGraph(terms);
  const related = (graph.related.get(term.id) ?? []).sort((a, b) =>
    a.direction === b.direction
      ? a.term.name.localeCompare(b.term.name)
      : a.direction === "outgoing"
        ? -1
        : 1,
  );

  const centerGroup = groupOf(groups, term);
  const nodes: FlowNode[] = [
    {
      id: `term-${term.id}`,
      type: "termNode",
      position: { x: 0, y: 0 },
      data: {
        label: term.name,
        blurb: term.tagline,
        groupColor: centerGroup?.color,
        groupName: centerGroup?.name,
        variant: "center",
      },
    },
  ];

  const n = related.length;
  const RX = 380;
  const RY = 270;
  related.forEach((r, i) => {
    const angle = n === 1 ? 0 : (i / n) * Math.PI * 2 - Math.PI / 2;
    const g = groupOf(groups, r.term);
    nodes.push({
      id: `term-${r.term.id}`,
      type: "termNode",
      position: { x: Math.cos(angle) * RX, y: Math.sin(angle) * RY },
      data: {
        label: r.term.name,
        blurb: r.term.tagline,
        groupColor: g?.color,
        groupName: g?.name,
        variant: "term",
        termId: r.term.id,
        clickable: true,
      },
    });
  });

  const edges: Edge[] = related.map((r) => {
    const label = edgeLabel(r);
    return r.direction === "outgoing"
      ? pillEdge({
          id: `e-${term.id}-${r.term.id}`,
          source: `term-${term.id}`,
          target: `term-${r.term.id}`,
          label,
        })
      : pillEdge({
          id: `e-${r.term.id}-${term.id}`,
          source: `term-${r.term.id}`,
          target: `term-${term.id}`,
          label,
        });
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Custom diagram: ring layout, terminal "output" node in the center
// ---------------------------------------------------------------------------

const KIND_ACCENT: Record<string, string> = {
  input: ACCENT,
  step: "#78716c",
  decision: "#b45309",
  output: "#115e59",
};

export function kindAccent(kind?: string): string {
  return KIND_ACCENT[kind ?? ""] ?? INK_SOFT;
}

export function buildCustomGraph(diagram: Extract<Diagram, { kind: "custom" }>) {
  const center = diagram.nodes.find((nd) => nd.kind === "output");
  const ring = diagram.nodes.filter((nd) => nd !== center);

  const RX = 360;
  const RY = 250;
  const nodes: FlowNode[] = ring.map((nd, i) => {
    const angle = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: nd.id,
      type: "infoNode",
      position: { x: Math.cos(angle) * RX, y: Math.sin(angle) * RY },
      data: {
        label: nd.label,
        blurb: nd.blurb,
        variant: "info",
        kind: nd.kind,
      },
    };
  });
  if (center) {
    nodes.push({
      id: center.id,
      type: "infoNode",
      position: { x: 0, y: 0 },
      data: {
        label: center.label,
        blurb: center.blurb,
        variant: "info",
        kind: center.kind,
      },
    });
  }

  const edges: Edge[] = diagram.edges.map((e, i) =>
    pillEdge({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      label: e.label,
      // the loop-back edge reads better as a smooth curve
      type: e.label ? "default" : "smoothstep",
    }),
  );

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Model panel ("under the hood"): horizontal chain; backward-edge nodes drop
// below their target (e.g. the training-cost side node).
// ---------------------------------------------------------------------------

export function buildModelPanelGraph(panel: Extract<Diagram, { kind: "model" }>["panels"][number]) {
  const STEP_X = 320;
  const DROP_Y = 250;

  const pos = new Map<string, { x: number; y: number }>();
  panel.nodes.forEach((nd, i) => pos.set(nd.id, { x: i * STEP_X, y: 0 }));

  // Side nodes: any edge pointing "backwards" (to a node earlier in listed
  // order) belongs to a side node — drop it below its target.
  for (const e of panel.edges) {
    const fromIdx = panel.nodes.findIndex((nd) => nd.id === e.from);
    const toIdx = panel.nodes.findIndex((nd) => nd.id === e.to);
    if (fromIdx > toIdx) {
      const target = pos.get(e.to)!;
      pos.set(e.from, { x: target.x, y: DROP_Y });
    }
  }

  const nodes: FlowNode[] = panel.nodes.map((nd) => {
    const p = pos.get(nd.id)!;
    const isSide = p.y !== 0;
    return {
      id: nd.id,
      type: "infoNode",
      position: p,
      data: {
        label: nd.label,
        blurb: nd.blurb,
        variant: isSide ? "note" : "info",
        kind: isSide ? undefined : "input",
      },
    };
  });

  const edges: Edge[] = panel.edges.map((e, i) =>
    pillEdge({ id: `e-${i}`, source: e.from, target: e.to, label: e.label }),
  );

  return { nodes, edges };
}
