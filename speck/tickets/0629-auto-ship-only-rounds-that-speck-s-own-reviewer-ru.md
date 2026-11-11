---
id: "0629"
title: "Auto-ship only rounds that speck's own reviewer run recorded"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T10:03:18.551Z"

---
# 0629 · Auto-ship only rounds that speck's own reviewer run recorded

**Status:** 🔨 building

## Problem
Auto-ship merges and pushes a ticket because its ticket file says the reviewer approved it, and the builder writes that file: it can record a verdict with `speck record` or edit its `## Review rounds` by hand. So "no agent approves its own work" holds only while the builder follows its skill, and a ticket that ships by itself has no proof that speck's own reviewer run approved it.

## Outcome
A ticket ships by itself only when its approving round was recorded by speck's own run of the reviewer, unchanged since; anything else waits for you at Ship.

## Acceptance criteria
1. When `speck review` records a round for any reviewer speck runs itself (Codex, Claude, Cursor, a model provider or a command reviewer), it also keeps a receipt for that round in the main checkout's `speck/.cache/`, outside anything the ticket's branch carries, and a ticket approved this way ships with `speck ship <id> --auto` as it does today.
2. `speck ship <id> --auto` refuses, changing nothing and saying why in one line, when the ticket's latest round has no receipt that matches it (its round number, reviewed commit and verdict): a round saved with `speck record`, or one whose record in the ticket was edited after `speck review` saved it. `speck run`'s ship queue then leaves the ticket approved and waiting for you at Ship, with that reason, as it does for any ticket auto-ship doesn't cover.
3. `speck status --json` gives that reason as the ticket's reason not to ship by itself, so the panel shows it waiting for you and why.
4. `speck ship <id>` started by you ships such a ticket as before, and its review pack (`speck pack <id>`, and `--plain`) says which rounds have no matching receipt.
5. No test that passed before this change fails.

## Out of scope
- Sandboxing the builder: a builder that writes a receipt file itself isn't stopped. This closes the paths the skills and the ticket file offer, not a builder set on forging one.
- Reading a ticket's risk from the base branch rather than its branch.
- Any change to how `speck record` saves a round for the `claude-subagent` reviewer, apart from leaving no receipt.

## Notes
- Raised in the 2026-11-10 repo analysis: `speck record` (`scripts/review.mjs` `cmdRecord`) saves any verdict file it's given, and `shipChecks`/`autoShipWhyNot` in `scripts/ship.mjs` trust the ticket's rounds.
- Rounds are saved by `saveRound` in `scripts/review.mjs`, called from the Codex path in `scripts/review.mjs` and from `scripts/reviewers.mjs` for the others.
- Receipts belong in the shared cache every worktree sees (as `sharedCacheDir` in `scripts/results.mjs` uses), not `cacheDir`, which is per checkout.
- With `reviewer: claude-subagent`, every round is saved with `speck record`, so those tickets always wait for you at Ship. This repo reviews with Codex, so it isn't affected.
- Risk high: it changes when code merges and pushes to the base branch without you.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
