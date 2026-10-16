---
id: "0219"
title: "Restart a build that was stopped before it started its ticket"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-resume-a-build-stopped-before-it-started.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0218","0227"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T02:56:06.257Z"

---
# 0219 · Restart a build that was stopped before it started its ticket

**Status:** 🔨 building

## Problem
When `speck stop` ends a build before it has run `speck start`, the ticket is left blocked in the main checkout with no branch. `/speck-build <id>` can't pick it up, because `speck start` refuses a ticket that isn't ready, and the stop message wrongly says the branch and work were kept.

## Outcome
A ticket stopped before its build started can be built again with `/speck-build <id>`, with no fixing by hand.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `speck start <id>` on a blocked ticket with no branch starts it as it would a ready ticket: it makes the branch (and the worktree, when worktrees are on) and sets the status to building.
2. `speck start <id>` on a blocked ticket that has a branch behaves as today.
3. `speck stop` on a build that hadn't started its ticket still leaves the ticket blocked (0072 AC2), but says it was stopped before it started and that `/speck-build <id>` starts it again, instead of saying its branch and work were kept.
4. `speck start` still refuses a ticket in any other status that isn't ready, as today, and no test that passed before this change fails.

## Out of scope
- Sending a ticket stopped before it started back to ready instead of blocked.

## Notes
- The refusal is in `cmdStart` in `scripts/speck.mjs`; the stop message is in `stopBuild()` in `scripts/run.mjs`. `skills/speck-build/SKILL.md` already tells the builder to run `speck start` on a blocked ticket.
- The note's open question is settled as blocked, as 0072 AC2 and `test/stop-0072.test.mjs` require.
- Failing before this build: none
- Self-check: no changes. A blocked ticket with no branch starts whatever blocked it, so a draft someone set blocked by hand would start too; no speck flow blocks a draft, so it's left as a known limit.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
