---
id: "0338"
title: "Keep a handed-back ticket out of red while speck run is handling it"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:54:58.974Z"

---
# 0338 · Keep a handed-back ticket out of red while speck run is handling it

**Status:** 🔨 building

## Problem
When an auto-ship fails, the ticket's row in the Build list turns red and says "Ship it from its review pack", even when speck run has already handed it back to its build and will ship it again by itself. On 2026-10-20, 0335 sat red, asking the user to act, through two failed ships while its build looked into them and a fix ticket (0337) mended main, then shipped with nobody's help. Red should mean the user is needed.

## Outcome
A ticket whose auto-ship failed is red only when nothing in speck run will carry it on, and otherwise shows that speck run is handling it.

## Acceptance criteria
1. An approved ticket whose last auto-ship didn't finish, and whose build speck run has resumed and is still running, isn't red, shows no Ship hint, and says it was handed back to its build, which is working on it.
2. Once that build has ended with the ticket still approved, while speck run is on and at least one other ticket is ready, building, reviewing or approved, the ticket isn't red, shows no Ship hint, and says it will be shipped again when main or its branch has a new commit.
3. It's red, with the Ship hint as today, when speck run is off, when no other ticket is ready, building, reviewing or approved, or when the ticket is blocked.
4. In every case above, the failed ship's own message is still shown on the ticket.
5. No test that passed before this change fails.

## Out of scope
- Why the ships failed (a test that fails by chance under load: `speck/ideas/2026-10-17-leave-chance-failures-out-of-a-hand-back.md`).
- The Foreman's detail and `speck status`, which already say "waiting to ship: its build is still running".

## Notes
- The row's state is worked out in `templates/panel.html` (around `auto_failed`, `exit_label`, `red` and `ship_hint`, line 868 on). `build_running` is on every ticket in `speck status --json` (`scripts/speck.mjs`), and `runOn` says whether speck run is on. speck run records a hand-back as `handed_back` and `hand_backs` in the ticket's run record (`scripts/hand-back.mjs`).
- AC2's rule, another ticket ready or in flight, stands for "a new commit on main is on its way": when one ships, speck run's queue tries this ticket again. With none, nothing will change, so the user is needed.
- Test it with the fake page from `fakePage()` in `test/support/panel.mjs`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes (the run-record reader went into `scripts/hand-back.mjs` rather than `scripts/speck.mjs`, which the 600-line check caps)

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
