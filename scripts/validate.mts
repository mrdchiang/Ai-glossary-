import { validateContent } from "../lib/content.js";

try {
  const { groups, terms } = validateContent();
  const published = terms.filter((t) => t.status === "published").length;
  const drafts = terms.length - published;
  console.log(
    `content valid: ${terms.length} terms (${published} published${drafts ? `, ${drafts} draft` : ""}), ${groups.length} groups`,
  );
} catch (err) {
  console.error("content validation failed:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
