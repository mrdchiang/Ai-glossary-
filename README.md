# AI Glossary

A public website that teaches AI terminology to laypeople through a clean term
browser plus **interactive relationship diagrams** — not just a flat dictionary.
Each term gets a plain-language definition, a concrete real-world example, and a
node-and-edge diagram showing how it connects to other terms.

v1 plan: data-model-first, Next.js + React Flow, fully static, deployed on Vercel.
See the project plan for milestones M0–M8.

## Quickstart

```bash
npm install
npm run dev        # local dev server
npm run validate   # validate content/ against the Zod schema + graph rules
npm run build      # static export → out/
```

`npm run build` runs a fully static export (`output: "export"` in
`next.config.ts`), so the site can be hosted on any static host.

## Project structure

```
content/
  groups.json          # the 5 term groups (id, name, tagline, color, sort)
  terms/*.json         # one JSON file per term — this is the CMS for v1
lib/
  terms.ts             # Zod schemas, types, buildTermGraph() — client-safe (no node builtins)
  content.ts           # server-only: loadGroups(), loadTerms(), validateContent()
  diagrams.ts          # shared diagram helpers: edge verbs, pill edges, graph layout builders
scripts/
  validate.mts         # `npm run validate` entrypoint (run with tsx)
app/
  page.tsx             # home: hero, DeepSeek case-study spotlight, groups + term cards
  glossary/page.tsx    # glossary browser (defaults to first term)
  glossary/[slug]/page.tsx   # glossary browser with term preselected (deep linkable)
components/
  glossary/
    GlossaryBrowser.tsx  # two-panel browser: searchable/filterable list + detail
    TermDetail.tsx       # tagline, definition, example callout, chips, footnotes, diagram button
  diagrams/
    DiagramModal.tsx   # modal shell: ESC/backdrop close, picks diagram by kind
    GraphCanvas.tsx    # shared React Flow wrapper (themed nodes, pill edge labels)
    nodes.tsx          # TermNode + InfoNode custom node renderers
    AutoGraph.tsx      # center term + 1-hop neighbors, derived from edges
    CustomDiagram.tsx  # hand-authored graphs (agentic loop)
    ModelDiagram.tsx   # two-panel model case study (DeepSeek)
    PromptJourney.tsx  # interactive pipeline + vagueness slider + token-burn meter
```

## Adding a term

1. Copy `content/terms/token.json` to `content/terms/<your-id>.json`.
2. Fill in every field (see schema below). Keep `id` identical to the filename.
3. Run `npm run validate` — it fails the build on dangling edge targets, unknown
   groups, id/filename mismatches, and bad diagram node references.
4. Set `"status": "published"` when it's ready; drafts are validated but hidden.

## Content authoring rules

- **Plain language first.** Write for a smart non-technical coworker. If you use
  jargon, define it in the same sentence. Aim for an 8th-grade reading level.
- **Every term gets a felt example.** `example.title` + `example.body` must anchor
  the concept in something the reader has experienced — a bill, a product, a
  meeting — not just define it again.
- **Footnotes are for technical depth.** Things like temperature, parameter
  counts, or protocol details go in `footnotes[]` (collapsed in the UI), never in
  the main definition.
- **Edges are curated, max 8 per term.** Relationship `type` must be one of:
  `is-a`, `part-of`, `uses`, `enables`, `causes`, `contrasts-with`,
  `governed-by`, `instance-of`, `related-to`. Give each edge a short human `label`
  for the diagram (e.g. `"label": "runs inside"`). Reverse edges are derived
  automatically — only store each relationship once, on the source term.
- **Diagrams:** `{"kind": "auto"}` (generated from edges — the default, zero
  authoring cost), `{"kind": "custom", ...}` (hand-authored nodes/edges for
  compound concepts like the agentic loop), or `{"kind": "model", ...}` (exactly
  two panels: `under-the-hood` + `prompt-journey`, reserved for model case
  studies like DeepSeek).

## Term schema (summary)

```jsonc
{
  "id": "kebab-case, must match filename",
  "name": "Display Name",
  "group": "foundations | model-landscape | agentic-systems | access-safety | real-world-behavior",
  "status": "draft | published",
  "tagline": "≤140 chars, shown on cards",
  "definition": "2–4 sentences, plain language",
  "whyItMatters": "one paragraph: why a non-technical person should care",
  "example": { "title": "…", "body": "concrete, felt, real-world" },
  "footnotes": [{ "label": "…", "body": "…" }],   // optional, collapsed in UI
  "edges": [{ "to": "other-term-id", "type": "uses", "label": "calls", "note": "…" }],
  "diagram": { "kind": "auto" }
}
```

## Roadmap

- **M0–M1** (done): repo scaffold, content pipeline, 6 anchor terms.
- **M2–M5** (done): two-panel glossary browser UI (search, group filters, deep
  links), term detail design, React Flow diagrams — auto graphs for every term,
  custom agentic-loop diagram, DeepSeek two-panel case study with interactive
  token-burn visual.
- **M6–M8**: home/about/models pages polish, content expansion to ~25 terms, launch.
- **Post-v1**: review queue, Postgres backend, auto-discovery cron with a human
  review gate (never auto-publish).
