---
id: "0673"
title: "Re-review only what changed after approval in a merge round"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:05.771Z"

---
# 0673 · Re-review only what changed after approval in a merge round

**Status:** 🔨 building

## Problem
When a ship is refused for a conflict or for tests that fail on the change as it would land, the build merges the base branch in and the change is reviewed again. That merge round gives the reviewer the branch's whole change against the base branch, so it reads again everything it has already approved. This repo has had 155 merge rounds, and a ticket whose ship is refused takes 12.6 minutes from its first ship attempt to shipped, against 3.8 for one that ships cleanly.

## Outcome
A merge round gives the reviewer only what changed since it approved: how each conflict was resolved and anything the build changed after.

## Acceptance criteria
1. In a merge round that follows a merge of the base branch, the diff in the reviewer's prompt holds what the merge changed beyond a clean merge (each resolved conflict, and anything else changed by hand in the merge commit) and every change committed after it. A file the base branch changed and the ticket didn't isn't in it, nor is a part of the ticket's change that the merge left as it was approved. When that leaves nothing, the prompt says so in words, and the round still runs.
2. The prompt names the commit the reviewer approved, says the base branch has been merged in since, and gives the command that prints the whole change against the base branch, for the reviewer to run when it needs the rest.
3. Every other round is given what it is today: round 1 the whole change, a later round the changes since the last review, and a round before the first approval whose branch has merged the base branch in, the whole change as merged.
4. `docs/brief.md` (Merge rounds), `skills/speck-review/SKILL.md` and the Conflict step of `skills/speck-build/SKILL.md` each say what a merge round shows the reviewer, and none still says it's the whole change against the base branch.
5. No test that passed before this change fails.

## Out of scope
- When a round counts as a merge round, and `limits.max_merge_rounds`.
- What `speck ship` checks and tests before it lands a change.
- A round before the first approval.

## Notes
- Decision: what the base branch brought in was reviewed in its own tickets, and `speck ship` tests the two together as they would land (0192), so the merge round's job is the resolution and any fix.
- `reviewSince` in `scripts/review.mjs` picks where the diff starts, and the prompt's lines for a round after a merge are just above it (0097, 0241).
- Checked 2026-11-15: `git show --remerge-diff <merge>` prints what a merge commit changed beyond git's own merge of its two parents, and runs on git 2.53.0 here. It came in git 2.36 (git's release notes). `speck ship` already uses `git merge-tree --write-tree`, which came in git 2.38, so a git that can ship has it.
- Failing before this build: none
- What this gives up: a second read of the whole change sometimes finds what round 1 missed. 0667 had 4 review rounds, 3 of them merge rounds, and its first merge round raised two findings on the ticket's own change. After this, a merge round finds only what the merge and the changes after it got wrong.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
