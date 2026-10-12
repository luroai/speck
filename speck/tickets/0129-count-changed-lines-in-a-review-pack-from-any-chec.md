---
id: "0129"
title: "Count changed lines in a review pack from any checkout"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T18:43:49.832Z"

---
# 0129 · Count changed lines in a review pack from any checkout

**Status:** 🔨 building

## Problem
`speck pack <id>` says "Changed lines: 0" whenever it's run from a checkout that isn't the ticket's branch, such as the base branch checkout when builds run in worktrees, or after the ticket has shipped. The user then reads a review pack that says nothing changed when plenty did (seen on speck-site ticket 0002: the pack says 0, its delivery log says 158).

## Outcome
The review pack reports the ticket's own changes, wherever it's run from, and never reports 0 because of where it's run.

## Acceptance criteria
1. Run from the base branch checkout while the ticket's branch exists (in its own worktree or not), `speck pack <id>` gives the changed-lines figure for the ticket's branch compared with the point where it left the base branch, excluding tests, lockfiles and `speck/` as today, and lists the sensitive files that branch touches.
2. Run from inside the ticket's own worktree, with its work committed, `speck pack <id>` gives the same changed-lines figure and sensitive files as in criterion 1.
3. For a ticket whose branch no longer exists (for example, shipped and tidied up), the pack shows the changed-lines figure from the ticket's delivery log and says it's the figure recorded at approval. If the delivery log has no figure, it says the count isn't available instead of showing a number.
4. When the ticket's branch no longer exists, the pack says it can't list the sensitive files touched, instead of saying none were touched.
5. No test that passed before this change fails.

## Out of scope
- The plain-English review pack: that's 0130 and 0131.
- Counting a shipped ticket's changes from git history.
- `speck diffstat`, which builds run inside the ticket's own worktree, where it counts correctly.

## Notes
- Cause: `changedLines` in `scripts/core.mjs` compares the current checkout's HEAD and working tree with the base branch, so from the base branch it measures nothing. Reproduced 2026-10-11 in speck-site: `speck pack 0002` on `main` prints "Changed lines (excluding tests and lockfiles): 0".
- The ticket's branch is found the same way `speck ship` finds it (`ticketBranch` in `scripts/ship.mjs`: `<branch_prefix><id>-…`).
- Failing before this build: none
- Built so the pack also reads the ticket (and its review rounds) from the ticket's branch when run elsewhere: the base branch's copy has no rounds until it ships, so without that the pack stops with "No review rounds recorded." before it reaches criterion 1's figure.
- Self-check: added a test that the base branch's own changes, merged into the ticket's branch, aren't counted as the ticket's (they weren't).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
