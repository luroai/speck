---
id: "0022"
title: "Set a ticket to reviewing when its review starts"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:44:06.399Z"

---
# 0022 · Set a ticket to reviewing when its review starts

**Status:** 🔨 building

## Problem
Before the first review round, the builder runs `speck set <id> status reviewing` and makes a separate commit, every ticket. It's a manual step and an extra commit that the first review could do itself.

## Outcome
Starting a ticket's first review round sets it to `reviewing`, with no separate step.

## Acceptance criteria
1. When `speck review <id>` starts round 1 on a ticket in `building`, the ticket is set to `reviewing` before the reviewer runs. The change is left uncommitted alongside the new round, as round results are today.
2. If the round fails (the reviewer errors, or the tree isn't committed), the status is left as it was.
3. `speck record` for round 1 does the same for reviewers the builder runs itself.
4. The build skill no longer asks for a separate `speck set <id> status reviewing` and commit.

## Out of scope
- Setting `building` automatically.

## Notes
- Pre-check: no ambiguities found, and no external facts. Note that `speck review` already lets the ticket's Review rounds section stay uncommitted. The status change will be committed with the builder's next fix commit.
- Round 2's clean-tree check now also accepts the uncommitted building → reviewing change (and its header line) next to round 1, so a builder who commits only code between rounds isn't refused. Any other uncommitted ticket edit is still refused.
- The 0023 self-check test anchored on the removed `speck set <id> status reviewing` sentence. It now anchors on the sentence that replaces it, with the same check.
- Self-check: no changes. Known gap: if `speck review` is interrupted (Ctrl-C) while the reviewer runs, the ticket stays `reviewing` with no round. Re-running the review, or `speck set <id> status building`, puts it right.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
