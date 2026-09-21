# Term drafts inbox

New term drafts land here as `<kebab-case-id>.json` — one file per term, with
`"status": "draft"` and the `id` field matching the filename.

## How drafts arrive

- **Paste a draft to Atlas in chat** and it will be filed here.
- **Agents working on the glossary** can write files here directly.

## What happens next

The daily review watcher checks every new or changed file against
`CONTRIBUTING.md` and files a pass/fail verdict with concrete fixes in the
review queue (Goals tab → Interactive AI Glossary website → files). You get a
chat note when a draft is ready for your flip to published.

Only David flips drafts to `"published"` — the watcher never does.

## Fixtures

Files starting with `TEST-` are fixtures demonstrating the queue format.
They are checked like real drafts but never published.
