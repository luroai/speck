---
id: "0126"
title: "Remove the panel mockup from the repo"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11

---
# 0126 · Remove the panel mockup from the repo

**Status:** 📋 ready

## Problem
`docs/panel-mockup.html` was a design reference for the control panel (0031). The real panel in `templates/panel.html` has replaced it, but the mockup is still in the public repo, and two tests read it, so it can't simply be deleted.

## Outcome
The mockup is no longer in the repo. The tests still check that the panel uses the agreed colours, without reading the mockup.

## Acceptance criteria
1. `docs/panel-mockup.html` does not exist on disk and `git ls-files docs/panel-mockup.html` prints nothing.
2. The 0031 AC3 test in `test/panel.test.mjs` checks the panel page against this exact colour block, written in the test, instead of reading it from the mockup: `--bg: #1c1d20; --panel: #232428; --raise: #2a2b30; --line: #36383e; --line-soft: #2e3035; --text: #d6d8dd; --muted: #8a8e97; --faint: #5f636c; --accent: #7aa7f0; --ok: #62b77a; --warn: #e3a04f; --bad: #e0675d; --run: #5fa8e0; --idea: #b291e6`. The test fails if any of these values is missing from the page or changed.
3. The 0082 AC5 test in `test/luro-0082.test.mjs` no longer checks the mockup for `luroai/speck`. It now checks that the mockup is gone, in the same way as AC1 of this ticket.
4. No test that passed before this change fails.

## Out of scope
- The local mockups in `mockups/`. They are already ignored by git and stay on the user's machine.
- Changing the panel's look or colours.
- Editing finished tickets in `speck/tickets/done/` or idea notes that mention the mockup. They are history.

## Notes
- The colour values in AC2 are copied from the `:root` block of `docs/panel-mockup.html` as it is today, so the panel's palette stays locked to the agreed design.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
