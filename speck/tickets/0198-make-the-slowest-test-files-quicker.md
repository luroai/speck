---
id: "0198"
title: "Make the slowest test files quicker"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15

---
# 0198 · Make the slowest test files quicker

**Status:** 📋 ready

## Problem
speck's full suite takes about 2.5 minutes, and longer when two builds share the machine, and a build runs it 2 to 5 times plus once more at ship. A few test files take about a minute each on their own, and a full run can't end before its slowest file does. On 2026-10-15 the tests of 0176, 0175 and 0177 took 79, 67 and 59 seconds in all.

## Outcome
The five slowest test files run quicker and still check everything they did.

## Acceptance criteria
1. At the start of the build, each test file in `test/` is timed on its own (`node --test <file>`, three times, keeping the middle time), and the five slowest are listed with their times in the ticket's Notes.
2. After the change, each of those five files, timed the same way, takes at least a quarter less time than at the start, or the Delivery log says, for that file, why it can't without dropping a check. The Delivery log gives each file's time before and after.
3. Every criterion that a changed test checked is still checked: no test is removed, skipped or marked todo, and no assertion is weakened. A wait for a fixed time is replaced by waiting for what it was waiting for, with a time limit.
4. No test that passed before this change fails.

## Out of scope
- Running fewer full suites per build (0197).
- Test files outside the five slowest.
- Changing how `npm test` runs the files.

## Notes
- Asked for 2026-10-15: "Builds take too long."
- Measured 2026-10-15 (whole suite, 1,727 tests, 146 s on 16 cores): total time of each ticket's tests: 0176 79 s, 0175 67 s, 0177 59 s, 0155 39 s, 0067 36 s, 0187 36 s, 0160 35 s. The likely files are `test/build-log-0176.test.mjs`, `test/reap-0175.test.mjs`, `test/panel-0177.test.mjs`, `test/panel-0155.test.mjs`, `test/panel-0067.test.mjs`, `test/panel-0187.test.mjs` and `test/panel-0160.test.mjs`, but AC1's own timing decides.
- Checked 2026-10-15: `node --test` runs files in name order whatever order they're given in (Node v22.23.3), so starting slow files first isn't an option.
- See the "Quick tests" section of `AGENTS.md` for what makes a test slow.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
