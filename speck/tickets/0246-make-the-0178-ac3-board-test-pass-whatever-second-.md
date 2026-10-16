---
id: "0246"
title: "Make the 0178 AC3 board test pass whatever second it runs in"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-fix-the-0178-ac3-test-that-fails-by-chance.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:07:26.319Z"

---
# 0246 · Make the 0178 AC3 board test pass whatever second it runs in

**Status:** 🔨 building

## Problem
"0178 AC3: the panel works out the same queue, Plan, Shipped list and figures from the cut-down board" sometimes fails by chance: it works out the panel's model from two boards one after the other, and a live elapsed-time counter can tick over a second between them (`6013:28` against `6013:29`). Each such failure costs a second test run, shows in the flaky log and can hand an approved ticket back.

## Outcome
The test gives the same result whichever second it runs in.

## Acceptance criteria
1. The test passes even when a second passes between working out its two models: shown by working them out with the page's clock a second apart.
2. It still fails when the cut-down board gives the panel a different queue, Plan, Shipped list or figures than the whole board does: shown by a check that a board cut wrongly (for example with one finished ticket left out) doesn't compare equal.
3. No test that passed before this change fails. No code outside `test/` changes.

## Out of scope
- The other tests that fail by chance (0207 fixed four).
- Any change to the panel or to how the board is cut down.

## Notes
- The test is in `test/panel-0178.test.mjs`; `panelModel()` is in `test/support/panel.mjs`.
- Seen in 0211's whole-suite run on 2026-10-15, passing when run again.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
