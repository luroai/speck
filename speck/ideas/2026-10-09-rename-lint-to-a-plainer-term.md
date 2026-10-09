# Rename "lint" to a plainer term

Captured: 2026-10-09 · Status: idea

## What
Replace the term "lint" (`speck lint <id>`, and "lint passes" in tickets and docs) with something plainer, such as `speck check <id>`, called the "ready check" in prose.

## Why
"Lint" is programmer jargon and doesn't say what the check does. speck is aimed at PMs and founders who don't read code, and the user asked what "lint passes" meant. The panel already calls the same checks the **Readiness** list, so the CLI and the panel use two names for one thing.

## Notes
- Came up while drafting 0074, whose criterion 4 ("`speck lint` passes") was also weak: it adds little to criterion 1 and could be read two ways. Dropping that criterion is still undecided.
- Options discussed: `speck check` ("the check passes"), `speck readiness` (matches the panel but clunky), and "ready check" as the name in prose. The suggestion was `speck check` plus "ready check", with the same name on the panel's Readiness list.
- "lint" appears 116 times across 15 files: the skills, docs, CLI, panel and tests. Builders follow the skills, so their wording matters.
- Keep `speck lint` working as an alias, so older skills in other projects don't break.
- Open question: what to call the errors (✗) and warnings (!) it reports.
