---
id: "0190"
title: "Fix the 0165 phone tag-size test failing on main"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T20:59:04.574Z"

---
# 0190 · Fix the 0165 phone tag-size test failing on main

**Status:** 🔨 building

## Problem
One test fails on main every time: "0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each". It reports "queue P0: these points of its 44 px tap area miss it", at two points (x 76.9 and 55.4, y 630.5). Because main's tests fail, no ticket can ship automatically: 0175 is approved and waiting on this.

## Outcome
The full test suite passes on main again.

## Acceptance criteria
1. The test "0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each" passes on main.
2. No other test that passed before this change fails.

## Out of scope
- Changing what 0165 asked for (same-size tags with a 44 by 44 px tap area on a phone).

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Seen on main at 59fc8d0 on 2026-10-14, and in every full run during 0175's build that day. The cause hasn't been looked into: the test output shows only that two points of the P0 queue tag's tap area miss it.
- Failing before this build: 0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each. This is the test this fix ticket exists to make pass, so this build fixes it, without changing the test or what 0165 asks for.
- Cause: 0164 gave the queue's Queued line its own stacking layer (`.act { isolation: isolate; }`), so it now sits above the tags' tap areas. On a phone that line starts 6 px below the tags, but each tag's tap area reaches 7.5 px below it, so the line covers the bottom 1.5 px of the tap areas of the tags above it.
- Fix: on a phone, the line under a queue row's top starts 8 px below it rather than 6 px, clear of the tags' tap areas. The line keeps its own layer, so 0164's id taps are unchanged.
- Self-check: the comment on the new rule said it was only for the Queued line, but it covers any line straight under a queue row's top (a paused or blocked ticket's line too, which sits under its badge row and so just gets 2 px more space on a phone), so the comment now says so.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
