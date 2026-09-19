import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  GroupSchema,
  TermSchema,
  parseOrThrow,
  validateDiagramIds,
  type Group,
  type Term,
} from "./terms";

const CONTENT_DIR = path.join(process.cwd(), "content");
const TERMS_DIR = path.join(CONTENT_DIR, "terms");

/** Server-only content loading. Never import from "use client" components. */

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

/** The whole content model, in one place. Throws on any problem. */
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
