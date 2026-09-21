// scripts/check-draft.mts
//
// Mechanical checks for glossary term drafts against CONTRIBUTING.md.
// Covers everything checkable without editorial judgment; a human or agent
// applies the Editorial standards (felt examples, definition-first, etc.)
// on top of this report.
//
// Usage: tsx scripts/check-draft.mts <draft.json> [more...]
// Output: JSON on stdout. Exit 0 on a completed run (even when drafts fail).
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { TermSchema, validateDiagramIds } from "../lib/terms.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TERMS_DIR = path.join(REPO, "content", "terms");
const DRAFTS_DIR = path.join(REPO, "content", "drafts");

interface Check {
  check: string;
  severity: "error" | "warning" | "info";
  message: string;
  fix?: string;
}

interface DraftReport {
  file: string;
  id: string | null;
  sha256: string;
  verdict: "pass" | "fail";
  checks: Check[];
}

const err = (check: string, message: string, fix?: string): Check => ({
  check,
  severity: "error",
  message,
  fix,
});
const warn = (check: string, message: string, fix?: string): Check => ({
  check,
  severity: "warning",
  message,
  fix,
});
const info = (check: string, message: string): Check => ({ check, severity: "info", message });

// Marketing-speak banned by CONTRIBUTING.md (hard errors).
const BANNED_WORDS = ["revolutionary", "game-changing", "gamechanger", "game changer", "delve"];
// "leverage" is only banned as a verb — flag for a human to confirm.
const LEVERAGE_RE = /\bleverage[sd]?\b/i;

// Acronym heuristic: ALL-CAPS tokens that should be spelled out on first use.
const ACRONYM_RE = /\b[A-Z]{2,6}\b/g;
const ACRONYM_ALLOWLIST = new Set(["AI"]);

function spelledOut(text: string, acronym: string): boolean {
  // Looks for "<word>-<word>-... <word>" (or space-separated) whose initials
  // match the acronym, e.g. "retrieval-augmented generation" for RAG.
  const initials = acronym.toLowerCase().split("");
  const pattern = initials.map((c) => `${c}[a-z]*`).join("[-\\s]");
  return new RegExp(`\\b${pattern}\\b`, "i").test(text);
}

function textFields(term: any): [string, string][] {
  const fields: [string, string][] = [
    ["tagline", term.tagline],
    ["definition", term.definition],
    ["whyItMatters", term.whyItMatters],
    ["example.title", term.example?.title],
    ["example.body", term.example?.body],
  ];
  (term.analogies ?? []).forEach((a: string, i: number) => fields.push([`analogies[${i}]`, a]));
  (term.footnotes ?? []).forEach((f: any, i: number) => {
    fields.push([`footnotes[${i}].label`, f.label], [`footnotes[${i}].body`, f.body]);
  });
  if (term.diagram?.kind === "custom") {
    fields.push(["diagram.title", term.diagram.title]);
    if (term.diagram.caption) fields.push(["diagram.caption", term.diagram.caption]);
    term.diagram.nodes.forEach((n: any, i: number) => {
      fields.push([`diagram.nodes[${i}].label`, n.label], [`diagram.nodes[${i}].blurb`, n.blurb]);
    });
  }
  return fields.filter(([, v]) => typeof v === "string");
}

function checkDraft(file: string, existingIds: Set<string>, draftIds: Set<string>): DraftReport {
  const checks: Check[] = [];
  const raw = fs.readFileSync(file, "utf8");
  const sha256 = crypto.createHash("sha256").update(raw).digest("hex");
  const base = path.basename(file);

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return {
      file,
      id: null,
      sha256,
      verdict: "fail",
      checks: [err("valid-json", `File is not valid JSON: ${(e as Error).message}`, "Fix the JSON syntax.")],
    };
  }

  // --- Schema ---
  const parsed = TermSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      checks.push(
        err(
          "schema",
          `${issue.path.join(".") || "(root)"}: ${issue.message}`,
          "Adjust the field to satisfy the schema limits in lib/terms.ts.",
        ),
      );
    }
  }
  const term = parsed.success ? parsed.data : data;

  // --- id matches filename (CONTRIBUTING.md workflow step 1) ---
  const expectedId = base.replace(/\.json$/, "");
  if (term.id !== expectedId) {
    checks.push(
      err(
        "id-matches-filename",
        `term id "${term.id}" does not match filename (expected "${expectedId}")`,
        `Rename the file to ${term.id}.json or change the id field to "${expectedId}".`,
      ),
    );
  }

  // --- New terms start as draft; only David publishes ---
  if (term.status === "published") {
    checks.push(
      err(
        "status-is-draft",
        `status is "published", but new/changed terms must start as "draft" — only David flips to published`,
        'Change "status" to "draft".',
      ),
    );
  }

  // --- Group must exist (never invent one) ---
  const groups = JSON.parse(fs.readFileSync(path.join(REPO, "content", "groups.json"), "utf8"));
  const groupIds = new Set(groups.map((g: any) => g.id));
  if (term.group && !groupIds.has(term.group)) {
    checks.push(
      err(
        "known-group",
        `unknown group "${term.group}" — groups cannot be invented`,
        `Use one of: ${[...groupIds].join(", ")}. If none fits, ask David before proceeding.`,
      ),
    );
  }

  // --- Edges: targets must exist ---
  const allIds = new Set([...existingIds, ...draftIds]);
  for (const edge of term.edges ?? []) {
    if (edge.to === term.id) {
      checks.push(err("no-self-edge", "Edge points to the term itself.", "Remove the self-edge."));
    } else if (!allIds.has(edge.to)) {
      checks.push(
        err(
          "edge-target-exists",
          `edge target "${edge.to}" does not exist (not a term or draft)`,
          `Point the edge at an existing term id, or add "${edge.to}" as its own draft first.`,
        ),
      );
    }
  }

  // --- Diagram kind "model" is reserved — check on raw data so it fires
  // even when the draft has other schema errors ---
  if (data.diagram?.kind === "model") {
    checks.push(
      err(
        "model-diagram-reserved",
        'diagram kind "model" is reserved for model case studies (e.g. DeepSeek)',
        "Ask David before using a model diagram, or switch to auto/custom.",
      ),
    );
  }

  // --- Diagram: edge node ids must match (needs a parsed term) ---
  if (parsed.success) {
    try {
      validateDiagramIds(term);
    } catch (e) {
      checks.push(err("diagram-ids", (e as Error).message, "Point the diagram edge at an existing node id."));
    }
    if (term.diagram?.kind === "custom") {
      const n = term.diagram.nodes.length;
      if (n < 3 || n > 6) {
        checks.push(
          warn(
            "diagram-size",
            `custom diagram has ${n} nodes; the standard says keep it to 3–6 nodes and one clear idea`,
            n < 3 ? "Add the missing step(s), or switch to an auto diagram." : "Split the idea or trim to the essential nodes.",
          ),
        );
      }
    }
  }

  // --- No marketing speak ---
  for (const [field, text] of textFields(term)) {
    for (const word of BANNED_WORDS) {
      if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
        checks.push(
          err(
            "no-marketing-speak",
            `${field} contains banned marketing speak: "${word}"`,
            "Remove it and say the same thing in plain words.",
          ),
        );
      }
    }
    if (LEVERAGE_RE.test(text)) {
      checks.push(
        warn(
          "no-marketing-speak",
          `${field} uses "leverage" — banned as a verb`,
          'If it is used as a verb, replace with "use".',
        ),
      );
    }
  }

  // --- Acronyms spelled out on first use (heuristic) ---
  for (const [field, text] of textFields(term)) {
    const seen = new Set<string>();
    for (const match of text.matchAll(ACRONYM_RE)) {
      const acro = match[0];
      if (ACRONYM_ALLOWLIST.has(acro) || seen.has(acro)) continue;
      seen.add(acro);
      if (!spelledOut(text, acro)) {
        checks.push(
          warn(
            "acronyms-spelled-out",
            `${field} uses acronym "${acro}" with no spelled-out form nearby`,
            `Spell it out on first use, then use ${acro} freely.`,
          ),
        );
      }
    }
  }

  // --- Duplicate of an existing term? ---
  if (existingIds.has(term.id)) {
    const existingRaw = fs.readFileSync(path.join(TERMS_DIR, `${term.id}.json`), "utf8");
    const existingStatus = JSON.parse(existingRaw).status ?? "published";
    checks.push(
      info(
        "duplicate-check",
        `A term with id "${term.id}" already exists (status: ${existingStatus}); this draft revises it.`,
      ),
    );
  }

  const verdict = checks.some((c) => c.severity === "error") ? "fail" : "pass";
  return { file, id: term.id ?? null, sha256, verdict, checks };
}

function main() {
  const files = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (files.length === 0) {
    console.error("Usage: tsx scripts/check-draft.mts <draft.json> [...]");
    process.exit(2);
  }
  const existingIds = new Set(
    fs
      .readdirSync(TERMS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, "")),
  );
  const draftIds = new Set(
    fs
      .readdirSync(DRAFTS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, "")),
  );
  const reports = files.map((f) => checkDraft(path.resolve(f), existingIds, draftIds));
  console.log(JSON.stringify({ drafts: reports }, null, 2));
}

main();
