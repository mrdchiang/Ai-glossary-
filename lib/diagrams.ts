import { MarkerType, type Edge, type Node } from "@xyflow/react";
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
  /** circle-node diameter in px (model panel) */
  size?: number;
  /** short label rendered inside a circle node */
  shortLabel?: string;
  /** circle node: put the caption above the circle instead of below */
  captionAbove?: boolean;
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

/** Pick the handle sides facing each other for an edge from `from` to `to`.
 *  Every custom node declares invisible top/right/bottom/left handles, so
 *  edges attach on the sides that point at each other. */
export function facingHandles(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { sourceHandle: string; targetHandle: string } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }
  return dy >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
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

  const edges: Edge[] = related.map((r, i) => {
    const label = edgeLabel(r);
    // Attach edges on the sides facing each other along the ellipse angle.
    const angle = n === 1 ? 0 : (i / n) * Math.PI * 2 - Math.PI / 2;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const handles =
      r.direction === "outgoing"
        ? facingHandles({ x: 0, y: 0 }, dir)
        : facingHandles(dir, { x: 0, y: 0 });
    return r.direction === "outgoing"
      ? pillEdge({
          id: `e-${term.id}-${r.term.id}`,
          source: `term-${term.id}`,
          target: `term-${r.term.id}`,
          label,
          ...handles,
        })
      : pillEdge({
          id: `e-${r.term.id}-${term.id}`,
          source: `term-${r.term.id}`,
          target: `term-${term.id}`,
          label,
          ...handles,
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

  const pos = new Map<string, { x: number; y: number }>();
  nodes.forEach((nd) => pos.set(nd.id, nd.position));

  const edges: Edge[] = diagram.edges.map((e, i) =>
    pillEdge({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      label: e.label,
      // Attach on the sides facing each other (computed from node positions).
      ...facingHandles(
        pos.get(e.from) ?? { x: 0, y: 0 },
        pos.get(e.to) ?? { x: 0, y: 0 },
      ),
      // the loop-back edge reads better as a smooth curve
      type: e.label ? "default" : "smoothstep",
    }),
  );

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Model panel ("under the hood"): classic node-link graph — circular nodes
// scaled by importance, laid out in two rows that snake down so the content
// aspect matches the near-square panel. A single 5-across chain spans
// ~1600px of flow coordinates in a ~530px panel, forcing fitView to zoom to
// ~0.2 and rendering every circle tiny; the two-row layout keeps zoom near
// 0.8 with legible labels. Backward-edge nodes (e.g. the training-cost side
// node) sit directly beneath their target with a labeled edge rising into it.
// ---------------------------------------------------------------------------

const MODEL_CIRCLE_SIZE: Record<string, number> = {
  moe: 150, // the hero: sparse activation is the whole story
  mla: 135,
  tokenizer: 130,
  head: 125,
  cost: 125,
};

const MODEL_SHORT_LABEL: Record<string, string> = {
  tokenizer: "Tokenizer",
  moe: "MoE",
  mla: "MLA",
  head: "Output",
  cost: "$5.5M",
};

/** Smooth bezier link with an arrowhead and an optional pill label. */
function circleEdge(partial: {
  id: string;
  source: string;
  target: string;
  label?: string;
}): Edge {
  return {
    type: "default",
    style: { stroke: ACCENT, strokeWidth: 2, opacity: 0.7 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: ACCENT },
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

export function buildModelPanelGraph(panel: Extract<Diagram, { kind: "model" }>["panels"][number]) {
  const ROW1_Y = 30;
  const ROW2_Y = 300;
  const COL_X = 240;

  const sizeOf = (id: string) => MODEL_CIRCLE_SIZE[id] ?? 130;
  const indexOf = (id: string) => panel.nodes.findIndex((nd) => nd.id === id);
  // A node whose edge points "backwards" (to a node earlier in listed order)
  // is a side node — it sits beneath its target instead of in the chain.
  const isSide = (id: string) =>
    panel.edges.some((e) => e.from === id && indexOf(e.from) > indexOf(e.to));
  const main = panel.nodes.filter((nd) => !isSide(nd.id));
  const side = panel.nodes.filter((nd) => isSide(nd.id));

  // Main chain: up to three across row 1, then the chain snakes down —
  // continuing beneath the last column so each link stays short and vertical.
  const pos = new Map<string, { x: number; y: number }>();
  main.forEach((nd, i) => {
    if (i < 3) {
      pos.set(nd.id, { x: i * COL_X, y: ROW1_Y });
    } else {
      const lastX = 2 * COL_X;
      pos.set(nd.id, { x: lastX - (i - 3) * COL_X, y: ROW2_Y });
    }
  });
  for (const nd of side) {
    const e = panel.edges.find((e) => e.from === nd.id);
    const target = e ? pos.get(e.to) : undefined;
    pos.set(nd.id, { x: target?.x ?? 0, y: ROW2_Y });
  }

  const nodes: FlowNode[] = panel.nodes.map((nd) => {
    const p = pos.get(nd.id) ?? { x: 0, y: 0 };
    const size = sizeOf(nd.id);
    return {
      id: nd.id,
      type: "circleNode",
      position: p,
      // Explicit dimensions: React Flow fits exact bounds on first paint
      // instead of fitting against unmeasured (zero-size) custom nodes.
      width: size,
      height: size,
      data: {
        label: nd.label,
        shortLabel: MODEL_SHORT_LABEL[nd.id] ?? nd.label,
        blurb: nd.blurb,
        size,
        variant: isSide(nd.id) ? "note" : "info",
        // The cost node sits under its target (not floating above it), so
        // its caption goes below like every other node.
        captionAbove: false,
      },
    };
  });

  const edges: Edge[] = panel.edges.map((e, i) => {
    // Side-node edges (e.g. training cost → MoE) carry no pill label: the
    // node's own "One-time cost" eyebrow already says it, and a label would
    // sit inside the caption band between the two rows.
    const fromSide = isSide(e.from);
    return circleEdge({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      label: fromSide ? undefined : e.label,
      // Attach on the sides facing each other (computed from node positions).
      ...facingHandles(
        pos.get(e.from) ?? { x: 0, y: 0 },
        pos.get(e.to) ?? { x: 0, y: 0 },
      ),
    });
  });

  return { nodes, edges };
}
