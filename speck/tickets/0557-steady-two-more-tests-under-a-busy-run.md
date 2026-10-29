---
id: "0557"
title: "Steady two more tests under a busy run"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-28-steady-0232-ac3-and-0472-ac3-under-a-busy-run.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:18:29.754Z"

---
# 0557 · Steady two more tests under a busy run

**Status:** 🔨 building

## Problem
0232 AC3 (0176 AC3's check fails for a speck run whose checks cost more than 5% of one core) and 0472 AC3 (in a real browser, every element's computed style is the same as before) fail when the whole suite runs alongside other test runs, on the base code as well. A failure like this at `speck ship` hands a ticket back for nothing.

## Outcome
0232 AC3 and 0472 AC3 pass whether their files run alone or alongside the rest of the suite, and still fail if what they check breaks.

## Acceptance criteria
1. 0232 AC3 passes when the machine is busy and still shows that 0176 AC3's check fails for a speck run whose checks cost more than 5% of one core. The Delivery log says why it failed under load.
2. 0472 AC3 passes while the whole suite runs at the same time and still compares every element's computed style in each of its four ways of seeing the page. The Delivery log says why it failed under load.
3. Each still fails if what it checks breaks (0176 AC3's check no longer catching a speck run that costs too much; an element's computed style changing): the Delivery log says how this was checked.
4. `test/quick-waits-0232.test.mjs` and `test/panel-0472.test.mjs` each pass five runs in a row while the whole suite runs at the same time, and five runs of the file alone, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- 0176 AC3's CPU budget itself.
- Running tests one at a time, or other ways of changing how the suite schedules tests.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From two notes about 0232 AC3: 0542's (this source), where 0232 AC3 failed in all three busy whole-suite runs and 0472 AC3 in two of three, and 0541's (`speck/ideas/2026-10-28-steady-the-0232-ac3-cpu-cost-test-under-load.md`, dropped as the same), where 0232 AC3 failed once at a load average of about 80 on 16 cores.
- Open question from 0541's note, for the builder: whether 0232 AC3 measures CPU time, which load shouldn't change much, or wall time, which it does.
- Earlier steadying: 0540, 0541, 0542.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- AC1, why 0232 AC3 failed under load: it measures CPU time, as 0176 AC3's check does, but the broken copy of speck run spent its "400 ms of CPU" in a loop timed by the clock, and 0176's check counts checks by the clock too. On a busy machine speck run got well under one core, so a check spent less CPU than it was meant to, and a run that can't get the CPU can't be seen spending more than its share of a core times the wait between checks: 0.5 s × under half a core is under the 0.25 s budget. On the base code with the whole suite running, it failed in 3 runs out of 3 (load 57 to 80 on 16 cores: 0.152, 0.212 and 0.226 s a check). Now each check spends 1 s of CPU time, however long that takes, and checks are 2.5 s apart, so a run given only a tenth of a core is still seen over budget. It takes 5 s rather than 2 s.
- AC2, why 0472 AC3 failed under load: in a whole-suite run with the two files run alongside, it failed with "timed out waiting for Settings". The Settings view waits for the agents' model lists, which come from the agents themselves, and that wait took up to 12 s against the 10 s limit (timed with a copy of the test that recorded each call's time; every other call took under 2.1 s). Settings alone now waits up to a minute, stopping as soon as the lists have come, and the comparison in each of the four ways of seeing the page is unchanged.
- AC3, checked by breaking each for a moment and running it (then putting it back): with each check of the broken copy spending 10 ms in place of 1 s, 0232 AC3 failed ("0176 AC3 would pass: … 0.030 s a check"), and with 0176's check counting no CPU at all it failed too ("0.000 s a check"). With one extra rule (`.item .head { letter-spacing: 1px }`) added to the split styles, 0472 AC3 failed ("390 px, mouse, light, Plan, a ticket open: 5 elements' style changed, the first … span.id: width:37.6094px").
- AC4, 2026-10-29: test/quick-waits-0232.test.mjs (9 tests) and test/panel-0472.test.mjs (5 tests) each passed 5 runs out of 5 while `npm test` ran the whole suite again and again beside them (load 45 to 73 on 16 cores, with other sessions' test runs going too), and 5 runs out of 5 alone (load 23 to 54). The whole-suite runs beside them had 2 failures, both timing tests in files this change doesn't touch: 0072 (stop a running build from the CLI) and 0517 AC3 (a slide's first frame within 50 ms); the second suite run passed. An earlier whole-suite run with this change failed only 0150 AC2 ("timed out waiting for the Settings view"), in a file this change doesn't touch, which had also failed in a busy run while 0472 AC3 was being timed.
- AC5: only test files and this ticket changed, no code. The base code's whole suite passed (4445 tests) before the change. `speck test --related` for this change passed (172 tests, 0 failures), with 0176, 0075 and 0100's files, which share the support file it changed.
