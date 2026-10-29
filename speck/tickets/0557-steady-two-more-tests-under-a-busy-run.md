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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
