import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas (client-safe: no node builtins — safe to import from "use client"
// components). Filesystem loading lives in lib/content.ts (server only).
// ---------------------------------------------------------------------------

export const GroupSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(60),
  tagline: z.string().max(200),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sort: z.number().int(),
});
export type Group = z.infer<typeof GroupSchema>;

export const EdgeTypeSchema = z.enum([
  "is-a",
  "part-of",
  "uses",
  "enables",
  "causes",
  "contrasts-with",
  "governed-by",
  "instance-of",
  "related-to",
]);
export type EdgeType = z.infer<typeof EdgeTypeSchema>;

export const TermEdgeSchema = z.object({
  to: z.string().regex(/^[a-z0-9-]+$/),
  type: EdgeTypeSchema,
  label: z.string().max(40).optional(),
  note: z.string().max(200).optional(),
});
export type TermEdge = z.infer<typeof TermEdgeSchema>;

// --- Diagram kinds ---

const AutoDiagramSchema = z.object({ kind: z.literal("auto") });

const CustomNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(60),
  kind: z.enum(["input", "step", "decision", "output"]).optional(),
  blurb: z.string().min(1).max(200),
});
const CustomEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().max(40).optional(),
});
const CustomDiagramSchema = z.object({
  kind: z.literal("custom"),
  title: z.string().min(1).max(80),
  caption: z.string().max(300).optional(),
  nodes: z.array(CustomNodeSchema).min(2),
  edges: z.array(CustomEdgeSchema).min(1),
});

const ModelNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(60),
  blurb: z.string().min(1).max(300),
});
const ModelEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().max(40).optional(),
});
const ModelPanelSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(80),
  caption: z.string().max(300).optional(),
  nodes: z.array(ModelNodeSchema).min(2),
  edges: z.array(ModelEdgeSchema),
  annotation: z.string().max(600).optional(),
});
const ModelDiagramSchema = z.object({
  kind: z.literal("model"),
  panels: z.array(ModelPanelSchema).length(2),
});

export const DiagramSchema = z.discriminatedUnion("kind", [
  AutoDiagramSchema,
  CustomDiagramSchema,
  ModelDiagramSchema,
]);
export type Diagram = z.infer<typeof DiagramSchema>;

// --- Term ---

export const TermSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(60),
  group: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "published"]).default("draft"),
  tagline: z.string().min(10).max(140),
  definition: z.string().min(40).max(1200),
  whyItMatters: z.string().min(20).max(600),
  example: z.object({
    title: z.string().min(2).max(80),
    body: z.string().min(40).max(1200),
  }),
  analogies: z.array(z.string().max(200)).max(2).optional(),
  footnotes: z
    .array(
      z.object({
        label: z.string().min(2).max(60),
        body: z.string().min(10).max(1500),
      }),
    )
    .max(4)
    .optional(),
  edges: z.array(TermEdgeSchema).max(8),
  diagram: DiagramSchema,
});
export type Term = z.infer<typeof TermSchema>;

// ---------------------------------------------------------------------------
// Parsing helper (used by the server-only loader in lib/content.ts)
// ---------------------------------------------------------------------------

export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  label: string,
): z.infer<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid ${label}:\n${issues}`);
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Loading (server only) is in lib/content.ts — this module stays client-safe.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Graph: derive reverse edges so every term knows who points at it
// ---------------------------------------------------------------------------

export interface RelatedEntry {
  term: Term;
  type: EdgeType;
  label?: string;
  note?: string;
  direction: "outgoing" | "incoming";
}

export interface TermGraph {
  byId: Map<string, Term>;
  /** term id -> related terms, outgoing and incoming */
  related: Map<string, RelatedEntry[]>;
}

export function buildTermGraph(terms: Term[]): TermGraph {
  const byId = new Map(terms.map((t) => [t.id, t]));
  const related = new Map<string, RelatedEntry[]>();
  for (const t of terms) related.set(t.id, []);
  for (const t of terms) {
    for (const e of t.edges) {
      const target = byId.get(e.to);
      if (!target) continue; // validateContent() throws on these; be lenient here
      related.get(t.id)!.push({
        term: target,
        type: e.type,
        label: e.label,
        note: e.note,
        direction: "outgoing",
      });
      related.get(e.to)!.push({
        term: t,
        type: e.type,
        label: e.label,
        note: e.note,
        direction: "incoming",
      });
    }
  }
  return { byId, related };
}

// ---------------------------------------------------------------------------
// Validation (server only — used by scripts/validate.mts via lib/content.ts)
// ---------------------------------------------------------------------------

/** Throw if any diagram edge references a node id that doesn't exist. */
export function validateDiagramIds(term: Term): void {
  const check = (nodeIds: Set<string>, edges: { from: string; to: string }[], where: string) => {
    for (const e of edges) {
      if (!nodeIds.has(e.from)) {
        throw new Error(`term "${term.id}" ${where}: edge "from" references unknown node "${e.from}"`);
      }
      if (!nodeIds.has(e.to)) {
        throw new Error(`term "${term.id}" ${where}: edge "to" references unknown node "${e.to}"`);
      }
    }
  };
  const d = term.diagram;
  if (d.kind === "custom") {
    check(new Set(d.nodes.map((n) => n.id)), d.edges, "diagram");
  } else if (d.kind === "model") {
    for (const panel of d.panels) {
      check(new Set(panel.nodes.map((n) => n.id)), panel.edges, `diagram panel "${panel.id}"`);
    }
  }
}
