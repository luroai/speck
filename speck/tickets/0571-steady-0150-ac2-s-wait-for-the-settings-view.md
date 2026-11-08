---
id: "0571"
title: "Steady 0150 AC2's wait for the Settings view"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-29-steady-0150-ac2-s-wait-for-the-settings-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:08:41.949Z"

---
# 0571 · Steady 0150 AC2's wait for the Settings view

**Status:** 🔨 building

## Problem
0150 AC2 (Enter or Space on the focused button starts or pauses speck run) waits 10 seconds for the Settings view to finish loading its agents' lists. The lists come from the agents themselves, which took up to 12 seconds under load in 0557's runs, so the test failed twice there and a ship on a busy machine could hand a ticket back for nothing.

## Outcome
0150 AC2 passes on a busy machine, and still fails if what it checks breaks.

## Acceptance criteria
1. 0150 AC2 waits for the Settings view to finish loading with a time limit at least as long as 0472 AC3's after 0557.
2. Any other test that waits for "Loading your agents" to go with the 10-second default gets the same limit, and the Delivery log names them.
3. 0150 AC2 still fails if Enter or Space on the focused button doesn't start or pause speck run: the Delivery log says how this was checked.
4. `test/panel-0150.test.mjs` passes five runs in a row while the whole suite runs at the same time, and five runs of the file alone, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- How fast the Settings view reads the agents' lists.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- From 0557's whole-suite runs: "timed out waiting for the Settings view" twice. The wait is in `test/panel-0150.test.mjs`, around line 158.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes
- Pictures: none needed, the ticket changes nothing anyone sees.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

AC2: the only wait for "Loading your agents" to go that used the 10-second default was 0150 AC2's own, in `test/panel-0150.test.mjs`. A search of `test/` found no other `until` on that text: 0472 AC3 already had its limit from 0557 and waits on `settingsView.catalogues`, and the mentions in `test/settings-0407.test.mjs` and `test/settings-0409.test.mjs` are assertions against the fake page, not waits. So no other test changed.

AC3: checked by breaking the real panel in `templates/panel.js` for one run each, then restoring it. A `keydown` listener on the Auto-build button called `preventDefault` for one key. With Enter blocked, 0150 AC2 failed with "timed out waiting for Enter to start it". With Space blocked, it failed with "timed out waiting for Space to pause it". Unbroken, it passed. `test/steady-0571.test.mjs` also checks the test still presses both keys and checks both calls.

AC4: `test/panel-0150.test.mjs` passed five runs of the file alone (9 passed, 0 failed each, 12 to 13 s), and five runs while `npm test` ran the whole suite at the same time (9 passed, 0 failed each, 14 to 20 s, the suite still running at the end of each). The machine's load average was about 57.

AC5: that whole-suite run, under the load above, had 4508 passed, 1 failed and 3 skipped. The failure was 0517 AC3 (each slide's first frame within 50 ms of the lane change), at 81 ms for one frame. It passed three runs out of three when re-run alone on this branch, and this ticket changes only a wait in another test, so it isn't caused by this change. `speck ship` runs the whole suite again before anything lands.
