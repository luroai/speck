---
id: "0191"
title: "Make the 0173 stopped-process check pass on main again"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-14T22:58:16.640Z"
finished: "2026-10-14T23:02:20.699Z"

---
# 0191 · Make the 0173 stopped-process check pass on main again

**Status:** ✅ done

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
Nothing changes in how speck works. One of speck's own checks was failing on the main line of work, and while it failed, finished tickets couldn't ship on their own. A test that turns the background builder off now waits up to 10 seconds for it to stop, rather than checking once straight away, so the check passes again.

To see it: run the full test suite on main after this ships; every test should pass, and the next ticket that auto-ships should go through.

Worth watching: two other timing tests in the same area can miss their 1-second limit when the machine is busy with another build's tests. That's saved as an idea in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,570
- Elapsed since build started: 10 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The 0177 AC3 Stop build and Ship tests missed their 1-second limit once (1306 ms, 1106 ms) while another build's suite ran at the same time. Saved as speck/ideas/2026-10-14-keep-the-0177-one-second-tests-passing-on-a-busy-machine.md.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1d09de42f792ff4457f3c19674064d473bf5292d",
    "thread_id": "01a13ca2-80c4-73a0-ae50-a0d2163a1975",
    "seconds": 31,
    "usage": {
      "input_tokens": 83048,
      "cached_input_tokens": 49024,
      "cache_write_input_tokens": 0,
      "output_tokens": 522,
      "reasoning_output_tokens": 14
    },
    "saved_at": "2026-10-14T22:57:55.518Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The unchanged check in test/stopped-0173.test.mjs passes in the full suite (test 1564). New test 0191 AC1 also runs that exact check and verifies its named passing result and exit status."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 0177 run-switch test now awaits hasStopped(() => !alive(pid)); test/support/stopped.mjs polls every 50 ms with a 10-second limit. The actual run-switch test passes (test 1023). Existing 0173 tests exercise delayed exit and timeout failure."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0191-tests.txt confirms 1680 tests: 1677 passed, 3 skipped, zero failures or cancellations. The branch changes only the intended 0177 assertion and import, adds regression tests, and updates its ticket."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The stopped-process check now waits up to 10 seconds for speck run to exit while preserving the response-speed checks. The original rule remains unchanged, and the full suite passes. No blocking concerns found."
  }
}
```

</details>
