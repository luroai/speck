---
name: speck-ticket
description: Turn an idea, a conversation or a request into one or more small, numbered speck tickets in speck/tickets/, checked against the size rules. Use when the user says "make a ticket", "speck ticket", "ticket this", or wants an idea ready for development.
---

# speck ticket

Turn an idea into small tickets. **A ticket is one agent, one sitting, one branch.** If it's bigger than that, split it. Never stretch a ticket to fit.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## Steps

1. **Gather context.** Read the source idea (`speck/ideas/…`) or the conversation, then `speck/product.md`.
2. **Check for overlap.** Before you run `speck new`, run the overlap check in the `speck-capture` skill (in the folder next to this one), under "Check for overlap first". Compare the work with every idea note, every ticket in `speck/tickets/` and `speck/tickets/done/` (problem, outcome and acceptance criteria, not only titles) and `speck/product.md`. If it finds an overlap, name each match the way that section describes and ask whether to add to the existing item, go ahead anyway or stop. Create nothing until the user answers. The source idea you're ticketing doesn't count as an overlap with itself. If nothing overlaps, say so in one line and carry on.
3. **Find the outcomes.** List the distinct outcomes a user or PM could observe. Each outcome is a candidate ticket. If there's more than one, plan a split and order the tickets with `after:`.
4. **Create each ticket** with `speck new "<title>" --source=speck/ideas/<file>.md`. This assigns the next number and fills in builder and reviewer from config. Then edit the file:
   - **Title:** one outcome, imperative, with no "and" joining two outcomes. Change it with `speck set <id> title "…"` so the ticket's header heading stays in sync. Don't edit the `# <id> · <title>` heading or `**Status:**` line under the frontmatter by hand: speck rewrites them.
   - **Problem:** who is affected and why it matters, in 1–3 sentences.
   - **Outcome:** what is true when it ships.
   - **Acceptance criteria:** 1–5 numbered, testable statements about behaviour, not implementation. Each one will become a test before any code is written, so make it checkable: inputs, expected result and edge cases.
   - **Out of scope:** what this ticket deliberately won't do. Point to sibling tickets where relevant.
   - **Notes:** constraints and decisions only. No design essays.
   - **Estimate:** `size` S (a small, contained change) or M (several files or one new component). If it feels L, split it. Set `risk: high` if it touches auth, payments, data deletion, migrations, infrastructure or secrets. Set `priority` from 1 to 5 if the user gave one; otherwise use 3.
5. **Check it:** run `speck lint <id>` for every ticket. Fix every ✗. Address the ! warnings, or keep them deliberately and say why.
6. **Present the tickets** to the user: id, title, size/risk and acceptance criteria, plus any assumptions you made. Ask only questions that change the acceptance criteria.
7. **Don't mark tickets ready.** Moving a ticket to `ready` is the user's gate (Gate 1). If the user explicitly approves, run `speck set <id> status ready`. That command re-runs the lint and refuses if the ticket fails.

## Rules

- Don't invent requirements. If something material is unknown, put it in the summary as a question rather than guessing in the acceptance criteria.
- Prefer two S tickets over one M ticket when they can ship independently.
- Don't write implementation plans in the ticket. The builder decides how.
