---
id: "0429"
title: "Halve the time of the suite's slowest tests"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0424"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T18:33:20.667Z"

---
# 0429 · Halve the time of the suite's slowest tests

**Status:** 🔨 building

## Problem
Builds that change the panel run its browser tests again and again, 1.5 to 2.5 minutes a time, and every ship runs the whole suite. A few tests take far longer than the rest, so every build and ship waits on them.

## Outcome
The suite's ten slowest tests take half as long, still checking the same things.

## Acceptance criteria
1. In a run of the whole suite with `npm test` on this machine, the ten tests named in Notes take at most 82 seconds together, half the 163 seconds they took in 0418's ship run.
2. Each of the ten still checks everything it checked before: no assertion is removed or loosened. One that checks something only a real browser, panel or process does, such as selecting text or stopping a build, still uses it.
3. No test that passed before this change fails.

## Out of scope
- Tests outside the ten.
- Splitting `templates/panel.html` (0430 to 0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min). Builds already run only their own test files, but the panel's browser tests are slow, and the whole suite runs on every ship (about 160 s).
- The ten slowest tests in 0418's ship run (`speck/.cache/runs/0418.ship.log`), with their times: `0050 AC1-AC5: in a real browser, selections and the build message scroll stay through refreshes` (26.4 s, test/panel-0050.test.mjs); `0176: the board stays quick to read however many tickets are built` (23.5 s, test/build-log-0176.test.mjs); `0060 AC1-AC5: in a real browser, the pane holds the page still…` (22.7 s, test/panel-0060.test.mjs); `0267 AC1, AC3: rewording and reordering the README, the brief, the changelog…` (17.9 s, test/docs-0267.test.mjs); `0177 AC3: answers within 1 second while a reading takes 5 seconds` (12.9 s, test/panel-0177.test.mjs); `0257 AC4-AC5: the panel serves the settings afresh on a GET…` (12.4 s, test/panel-0257.test.mjs); `AC1/AC4: a reason reads back exactly as typed…` (12.2 s, test/cancel.test.mjs); `0040 AC1-AC5: in a real browser, selected text stays selected…` (11.8 s, test/panel-0040.test.mjs); `0072: stop a running build from the CLI` (11.7 s, test/stop-0072.test.mjs); `0159 AC3: b.js() and b.until() give up in their time limits…` (11.6 s, test/panel-0159.test.mjs).
- Some time is in the test's own subject (0177 waits on a reading that takes 5 seconds), so not each one can halve: criterion 1 is the ten together.
- Times vary with load, so measure the ten in one full `npm test` run, as ship runs it.
- Waits for 0424, as 0423 and 0424 change the full-ticket pane that `test/panel-0060.test.mjs` checks. Builds alongside 0426 to 0428 (the user, 2026-10-23), which restyle the page and are unlikely to change these ten tests. If one does, the second to ship needs a merge round.
- Failing before this build: none
- Criterion 1 is about a full `npm test` run, which `speck ship` makes, so no test checks it: a test can't time the suite it's part of. Measured during the build instead, on this machine while other builds ran their tests: the ten, each file run on its own, 122.5 s before and 54.0 s after (44%); the ten files and five others run together, 84.3 s, against 163 s for the ten in 0418's whole-suite run. Criterion 2 is checked by `test/slow-tests-0429.test.mjs` and by the ten tests themselves, criterion 3 by the round's test files and the ship's run.
- What changed: the three browser refresh tests ask the panel for a keep-alive, and so a refresh, every half a second (`SPECK_PANEL_PING_MS`); 0159's `b.until()` and `b.loaded()` tests give the helpers a 1-second limit of their own and check they give up within 2.5 s; 0177's AC3 tests slow only their first reading, not also the one after their write; 0257 uses stand-in agents ahead of the installed ones; the cancel test copies one set-up repo for each reason and runs the reasons at once; 0267 runs its two inner test runs at once; 0060's touch swipes are faster, over the same distances.
- Left as they were: 0176 (halving speck run's check spacing would let a check slowed by load count as more than one, loosening the 5% check) and 0072 (four of its tests at once timed out a build's start under load).
- Self-check: reverted two speed-ups that loosened a check or made a test flaky under load (0176's check spacing, 0072 running four tests at once), and checked that 0060's faster swipe sees the same as the old one.
- Pictures: none, because nothing anyone sees changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
