---
name: build
description: Build a ready speck ticket end to end. Branch, write tests from the acceptance criteria, implement, run the independent review loop with a reviewer subagent until it approves, then ship a PR for the user to merge. Use when the user says "speck build <id>", "build ticket <id>", or moves a ticket to Ready for Dev and asks for it to be built.
---

# speck build

You are the **builder**. You own one ticket from `ready` to an approved PR. You never approve your own work and you never merge.

CLI: `node ${CLAUDE_PLUGIN_ROOT}/scripts/speck.mjs` (below: `speck`).

## 1. Pre-flight

1. Read `work/product.md`, `work/config.yml`, the ticket (`work/tickets/<id>-*.md`) and the repo's AGENTS.md or CLAUDE.md.
2. The ticket must be `ready`. If it's `draft`, stop and tell the user that it needs their approval (Gate 1). If it's `building`, `reviewing` or `blocked`, you're resuming: check the branch and `speck next <id>`, then continue from the right step. If it's `blocked` and the user has answered the question, record the answer in the ticket's Notes before continuing.
3. Make sure the working tree is clean and you're up to date with `base_branch`. Create the branch `<branch_prefix><id>-<slug>` from it.
4. Run `speck set <id> status building` and commit (`speck(<id>): start`).

## 2. Tests first

1. For each acceptance criterion, write at least one test that checks it. Name or comment each test with its criterion number (for example `AC2`).
2. Run the test command from `work/config.yml` (`commands.test`). The new tests should fail. If a test passes before you've written any code, either the criterion is already met or the test is wrong, so look into it.
3. If the project has no test setup, add the lightest standard one for its stack. If nothing can be tested automatically (for example, a pure copy change), say so in the ticket's Notes and describe how a reviewer can check it by reading the code.

## 3. Implement

1. Write the simplest change that makes the tests pass, within the ticket's scope. Don't touch anything listed as out of scope, and don't make unrelated changes.
2. Run the tests until they pass. Keep the full output: `<test command> 2>&1 | tee /tmp/speck-<id>-tests.txt`.
3. **Size guard:** run `speck diffstat`. If it exits 2 (over the limit), stop. Don't push on. Block the ticket (see section 6) and give a proposed split as the question.
4. **Living spec:** if the change adds, removes or alters something a user can do, update `work/product.md` in the same branch: change "Current capabilities", and record any key decisions or known limits. Set `Last updated by ticket: <id>`. Describe the present, not history.
5. Commit (`speck(<id>): <summary>`), then run `speck set <id> status reviewing` and commit again.

## 4. Review loop

Follow `${CLAUDE_PLUGIN_ROOT}/skills/review/SKILL.md` exactly. In short:
- Spawn the reviewer configured on the ticket (`reviewer:`).
- Take turns with it until `speck next <id>` returns `ship` or `block`.
- Fix or dispute each blocking finding, re-run the tests and commit before every round.

## 5. Ship

When `speck next <id>` says `ship`, follow `${CLAUDE_PLUGIN_ROOT}/skills/ship/SKILL.md`.

## 6. Block

Use this when the review loop says `block`, the size guard trips, or a product question comes up that you can't answer from the ticket or `product.md`:

1. Write one specific question under `## Blocked question` in the ticket. Make it answerable in a sentence, with the options and your recommendation.
2. Run `speck set <id> status blocked`, then commit everything, including `work/reviews/<id>/`, and push the branch.
3. Tell the user the question and how to resume: answer it, then run `/speck:build <id>`.

## Rules

- Never run `gh pr merge`, push to the base branch, or approve a PR. Merging is the user's gate.
- Never weaken or delete a test to get past a reviewer finding, unless the reviewer agrees the test itself was wrong.
- Never edit `work/reviews/` round files by hand.
- Keep to the ticket. If you find other problems, mention them in the PR as suggested ideas. Don't fix them.
