import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const CONTENT_DIR = path.join(process.cwd(), "content");
const TERMS_DIR = path.join(CONTENT_DIR, "terms");

// ---------------------------------------------------------------------------
// Schemas
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
// Loading
// ---------------------------------------------------------------------------

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, raw: unknown, label: string): z.infer<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid ${label}:\n${issues}`);
  }
  return result.data;
}

export function loadGroups(): Group[] {
  const raw = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "groups.json"), "utf8"));
  const groups = parseOrThrow(z.array(GroupSchema), raw, "content/groups.json");
  return [...groups].sort((a, b) => a.sort - b.sort);
}

export function loadTerms(): Term[] {
  const files = fs.readdirSync(TERMS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(TERMS_DIR, file), "utf8"));
    const term = parseOrThrow(TermSchema, raw, `content/terms/${file}`);
    const expectedId = file.replace(/\.json$/, "");
    if (term.id !== expectedId) {
      throw new Error(
        `content/terms/${file}: term id "${term.id}" does not match filename (expected "${expectedId}")`,
      );
    }
    return term;
  });
}

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
// Validation: the whole content model, in one place. Throws on any problem.
// ---------------------------------------------------------------------------

export function validateContent(): { groups: Group[]; terms: Term[] } {
  const groups = loadGroups();
  const groupIds = new Set(groups.map((g) => g.id));
  if (groupIds.size !== groups.length) {
    throw new Error("content/groups.json: duplicate group id");
  }

  const terms = loadTerms();
  const termIds = new Set(terms.map((t) => t.id));
  if (termIds.size !== terms.length) {
    throw new Error("content/terms: duplicate term id");
  }

  for (const term of terms) {
    if (!groupIds.has(term.group)) {
      throw new Error(`term "${term.id}": unknown group "${term.group}"`);
    }
    for (const edge of term.edges) {
      if (!termIds.has(edge.to)) {
        throw new Error(`term "${term.id}": edge target "${edge.to}" does not exist`);
      }
      if (edge.to === term.id) {
        throw new Error(`term "${term.id}": edge points to itself`);
      }
    }
    validateDiagramIds(term);
  }

  return { groups, terms };
}

function validateDiagramIds(term: Term): void {
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
