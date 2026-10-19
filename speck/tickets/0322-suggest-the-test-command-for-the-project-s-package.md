---
id: "0322"
title: "Suggest the test command for the project's package manager"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-suggest-the-test-command-for-the-project-s-package-manager.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:27:12.678Z"

---
# 0322 · Suggest the test command for the project's package manager

**Status:** 🔨 building

## Problem
`speck detect` suggests `npm test` for any project whose `package.json` has a real test script, even when the project uses pnpm, yarn or bun. Setup then offers a test command the project doesn't normally use, and the user has to correct it: Carbon, which uses pnpm, is one.

## Outcome
`speck detect` suggests the test command for the package manager the project uses.

## Acceptance criteria
1. With a real test script in `package.json`, `speck detect` suggests `pnpm test` when the project uses pnpm, `yarn test` when it uses yarn, `bun run test` when it uses bun (`bun test` would run Bun's own test runner, not the project's script), and `npm test` otherwise.
2. The package manager is the one `package.json`'s `packageManager` field names (for example `pnpm@9.1.0`), and when there's no such field, the one its lockfile shows, as the install command speck already suggests is chosen.
3. The suggested install command and test command always name the same package manager.
4. Projects without a real test script get the same suggestion as today.

## Out of scope
- Test runners other than a `package.json` test script.

## Notes
- From `speck/ideas/2026-10-10-suggest-the-test-command-for-the-project-s-package-manager.md`. Decided: `packageManager` wins over the lockfile when they disagree, as it's what the project says it uses.
- The suggestion is in `suggestCommands` in `scripts/detect.mjs`, which picks the install command from the first lockfile it finds.
- The Foreman (2026-10-19 07:09 UTC) asked you: For bun projects, should speck detect suggest 'bun run test' (recommended, as 'bun test' starts Bun's own test runner instead of the project's test script) rather than 'bun test' as criterion 1 says?. Why: The build found that criterion 1's 'bun test' would run the wrong tests for bun projects, and changing a criterion is the user's call, so it stopped without starting.
- Checked 2026-10-19: `bun test` runs Bun's built-in test runner, while `bun run test` runs `package.json`'s `test` script; `pnpm test` and `yarn test` run the script (found by the 0322 build).
- You dismissed the Foreman's question (2026-10-19 07:26 UTC): For bun projects, should speck detect suggest 'bun run test' (recommended, as 'bun test' starts Bun's own test runner instead of the project's test script) rather than 'bun test' as criterion 1 says?

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
