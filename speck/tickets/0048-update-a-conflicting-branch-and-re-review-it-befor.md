---
id: "0048"
title: Resolve a ship conflict without stopping the build                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0046"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0048 · Resolve a ship conflict without stopping the build

**Status:** 📝 draft

## Problem
Builds run in parallel, so a ticket often finishes after another has changed the same files on the base branch. Then `speck ship --auto` refuses with a conflict and the build stops, leaving an approved ticket that someone has to merge by hand and get re-reviewed. That happened to 0039 on 9 October, and it will keep happening as more builds run at once.

## Outcome
When a build's ship hits a conflict, the build brings its branch up to date with the base branch, resolves the conflict, gets the result reviewed and ships, without the user stepping in.

## Acceptance criteria
1. When merging into the base branch conflicts, `speck ship` exits with code 13, a new code, names the conflicting files and changes nothing. Every other refusal keeps its code.
2. `speck review <id>` accepts an `approved` ticket: it sets it to `reviewing`, as round 1 does for `building`, and runs the next round.
3. In a round after the ticket branch has merged the base branch, the reviewer's diff is the branch's whole change against the base branch as merged (what would ship), not the diff since its last review, and the prompt says the round follows a merge.
4. `/speck-build` section 5 says that on exit 13 the builder merges the base branch into the ticket branch in its worktree, resolves the conflicts keeping the intent of both sides, runs the tests, commits, runs a review round whose response lists each file it resolved and how, and on `ship` runs `speck close` and `speck ship <id> --auto` again. After two merges that still end in a conflict, it blocks the ticket with the conflicting files in the question.
5. `speck/product.md` describes the conflict exit code and the merge-and-re-review step.

## Out of scope
- Refused ships that wipe uncommitted changes (0046).
- Rebasing or squashing: the branch merges the base branch in, so reviewed commits stay as they are.
- Choosing which tickets to run together to avoid conflicts.

## Notes
- The extra round counts towards `max_review_rounds` as usual, and the loop blocks when it's reached.
- Builds after 0046, which changes the same ship code.
- 0039's conflict was resolved this way by hand on 9 October, and the reviewer approved the merge in one round.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
