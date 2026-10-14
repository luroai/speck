---
id: "0191"
title: "Make the 0173 stopped-process check pass on main again"                # one outcome, no "and"
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
started: "2026-10-14T22:48:21.730Z"

---
# 0191 · Make the 0173 stopped-process check pass on main again

**Status:** 🔨 building

## Problem
On main, the test "0173 AC2: no test in test/ checks once that a process it stopped has gone" fails. Its output names one test that breaks that rule: `test/panel-0177.test.mjs` line 159, `assert.ok(!alive(…))`. Every build records it as failing before, and auto-ship refuses to ship any ticket while main's tests fail (0183 was held back by it).

## Outcome
The whole suite passes on main again.

## Acceptance criteria
1. "0173 AC2: no test in test/ checks once that a process it stopped has gone" passes on main.
2. The 0177 test that stops `speck run` still checks that it has stopped, by waiting for it to go with a time limit, as 0173 set out.
3. No test that passed before this change fails.

## Out of scope
- Changing what 0173's check looks for.
- Any other change to the 0177 tests.

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Found by 0183's auto-ship (exit 14). Idea note on 0183's branch: speck/ideas/2026-10-14-fix-the-0177-test-that-breaks-the-0173-rule.md.
- Failing before this build: 0173 AC2: no test in test/ checks once that a process it stopped has gone. This fix ticket exists to make it pass: the 0173 test itself is left unchanged (out of scope), and only the 0177 test it names is changed.
- AC3 has no test of its own: the whole suite's output, given to the reviewer each round, shows every test passing.
- One whole-suite run during the build had two other 0177 AC3 tests (Stop build, Ship) miss their 1-second limit (1306 ms, 1106 ms) while another build's suite ran at the same time. Neither is changed here; the next run passed in full.
- Self-check: no changes. 0191 AC1 also asserts the 0173 AC2 line is in the child's output, so a name pattern that matched nothing can't pass it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
