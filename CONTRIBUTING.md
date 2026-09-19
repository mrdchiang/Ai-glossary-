# Contributing to the AI Glossary

This document is the standard for **any contributor — human or AI** — adding or
editing content. Follow it exactly; it exists so terms written by different
systems read as if one author wrote them.

## What this project is

A public website that teaches AI terminology to **smart non-technical people**
(coworkers who've heard words like "token", "harness", or "MCP" and want to
understand them). Every term has a plain-language definition, a concrete
example, and a node-and-edge diagram showing how it connects to other terms.
The diagrams are the differentiator — treat them as first-class content, not
decoration.

## Workflow

1. **Add or edit one file per term:** `content/terms/<kebab-case-id>.json`
   (e.g. `content/terms/context-window.json`). The `id` field must match the
   filename.
2. **New terms start as `"status": "draft"`.** Only David flips terms to
   `"published"`. Nothing you write goes live without his review.
3. **Validate:** `npm run validate` — checks every term against the Zod schema
   in `lib/terms.ts` plus graph rules (edge targets must exist, diagram node
   ids must match). Fix every error; do not work around the validator.
4. **Build:** `npm run build` — must complete with zero errors (static export
   to `out/`).
5. **Look at it.** Serve `out/` and screenshot or open the new/changed term
   page and its diagram. Check: labels legible, no overlapping text, edges
   have arrowheads, nothing clipped on desktop width.
6. **Commit locally** with a clear message (e.g. `Add term: context-window`).
   Never create a remote, push, or deploy without David's explicit approval.

## The term file — field by field

All fields are validated by `TermSchema` in `lib/terms.ts`. Limits are hard.

| Field | Rules |
|---|---|
| `id` | kebab-case (`^[a-z0-9-]+$`), matches filename |
| `name` | 2–60 chars, display name ("Context Window") |
| `group` | One of the 5 existing groups (below). Never invent a group. |
| `status` | `"draft"` for new/changed terms; `"published"` only by David |
| `tagline` | 10–140 chars. One plain sentence saying what the term is. |
| `definition` | 40–1200 chars. Plain language first. No jargon without an immediate plain-English translation in the same sentence. |
| `whyItMatters` | 20–600 chars. Why should a non-technical person care? Tie it to cost, speed, capability, or something they've experienced. |
| `example.title` | 2–80 chars. Names the scenario. |
| `example.body` | 40–1200 chars. A **felt example**: concrete, specific, something the reader has lived through or can picture. Prefer real numbers and real situations over abstractions. |
| `analogies` | Optional, max 2, each max 200 chars. Only if the analogy genuinely clarifies. |
| `footnotes` | Optional, max 4. **Technical detail lives here, never in the definition.** Each has `label` (2–60 chars) and `body` (10–1500 chars). |
| `edges` | Max 8. Typed links to other terms (below). |
| `diagram` | One of `auto` / `custom` / `model` (below). |

## Editorial standards

- **Audience:** an intelligent coworker with no ML background. Write up to
  them, never down. Simple words; never simplified ideas.
- **Definition first, mechanism second.** Say what it *is* before how it works.
- **One idea per sentence.** If a sentence needs a semicolon and a parenthesis,
  split it.
- **No marketing speak.** No "revolutionary", "game-changing", "delve",
  "leverage" (as a verb). No hype about capabilities; no doom either.
- **Numbers beat adjectives.** "Roughly four characters in English" beats
  "very small". Real pricing, real sizes, real limits wherever they exist —
  with caveats where the number is disputed or partial (e.g. "final training
  run only, excludes prior R&D").
- **Examples must be felt.** Bad: "For example, tokens are used in billing."
  Good: "The sentence 'Can you summarize this 40-page contract?' is about 12
  tokens going in — cheap. The 3,000-token summary coming back is where the
  cost lives."
- **Acronyms:** spell out on first use, then use freely.
- **Footnotes are the pressure valve.** Anything a curious engineer would ask
  ("which tokenizer?", "per million tokens, input vs output?") goes in a
  footnote, not the main copy.

## Groups (do not add new ones)

- `foundations` — the basic units everything else is built from
- `model-landscape` — what's inside the models, and how they differ
- `agentic-systems` — when AI stops just chatting and starts doing things
- `access-safety` — who the AI is allowed to be, and what it's allowed to touch
- `real-world-behavior` — what actually happens when these systems meet reality

If a term doesn't fit any group, ask David before proceeding.

## Edges — how terms connect

Each edge: `{ "to": "<term-id>", "type": "<edge-type>", "label": "...", "note": "..." }`.
`to` must be an existing term id. `label` (max 40 chars) is the short verb
shown on the diagram; `note` (max 200) is the hover/long explanation.

Edge types and when to use them:

- `is-a` — the term is a kind of the target ("RAG is-a technique")
- `part-of` — the term is a component of the target ("tokenizer part-of model")
- `uses` — the term relies on the target to work ("harness uses model")
- `enables` — the term makes the target possible ("embeddings enables RAG")
- `causes` — the term produces the target, often as a side effect ("tokens causes token-burn")
- `contrasts-with` — the pair is best understood by comparison
- `governed-by` — the term is constrained by the target ("harness governed-by mcp-restrictions")
- `instance-of` — the term is a specific example of the target ("deepseek instance-of model")
- `related-to` — last resort; if a more specific type fits, use it

Keep edges to the relationships a reader needs. Max 8 per term; 2–4 is typical.

## Diagrams

Three kinds (`DiagramSchema` in `lib/terms.ts`):

- **`{"kind": "auto"}` — the default.** The graph is derived automatically
  from the term's `edges`. Use this for most terms.
- **`custom` — hand-specified node-link diagram.** Use when the term needs a
  specific visual (a process, a loop, an architecture). Fields: `title`
  (≤80 chars), optional `caption` (≤300), `nodes` (2+, each: kebab-case `id`,
  `label` ≤60, `kind` one of `input|step|decision|output`, `blurb` ≤200),
  `edges` (1+, each: `from`, `to` referencing node ids, optional `label` ≤40).
  **Keep it to 3–6 nodes and one clear idea.** Node labels name the thing;
  blurbs explain it in a plain sentence. Edge labels are short verbs.
- **`model` — two-panel model showcase.** Reserved for model case studies
  (e.g. DeepSeek). Do not use without asking David.

Diagram rules for all kinds: labels name things, never sentences; no
overlapping text; every edge needs a visible direction (arrowhead); size nodes
by importance if the story supports it; captions carry the caveats.

## Definition of done

- [ ] Term file follows the schema and every editorial rule above
- [ ] `status` is `"draft"`
- [ ] `npm run validate` passes
- [ ] `npm run build` passes with zero errors
- [ ] You have visually inspected the term page and its diagram (screenshot or browser)
- [ ] Committed locally; nothing pushed or deployed

## Do not

- Change `lib/terms.ts` (the schema), `content/groups.json`, or the site's
  design tokens without discussing it with David first
- Publish terms yourself (`"published"` is David's call)
- Add terms that duplicate an existing term — search `content/terms/` first
- Invent facts, prices, or statistics. If a number is uncertain, say so or
  leave it to a footnote with its caveat
- Create remotes, deploy, or open accounts anywhere
