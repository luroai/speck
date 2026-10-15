---
id: "0174"
title: "Stop a killed ship leaving its test run behind"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0175"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:11:29.349Z"

---
# 0174 · Stop a killed ship leaving its test run behind

**Status:** 🔍 reviewing

## Problem
When `speck ship`, `speck test` or a build is killed while its tests run, the test command keeps running, because speck runs it in its own process group. The 0153 tests do this on purpose, and their test command waits for a file that is never made, so each full suite left loops behind that never end. On 2026-10-14, 346 of them, some 18 hours old, pushed the load average above 100, hung the panel and made other tests fail.

## Outcome
Killing a ship, test run or build ends its test command too.

## Acceptance criteria
1. When `speck ship` or `speck test` is killed with SIGKILL while its test command is running, the test command and every process it started have ended within 10 seconds.
2. When a build is stopped with `speck stop <id>`, or from the panel, while it is running the tests, the test command and every process it started have ended within 10 seconds.
3. A test command that isn't killed still runs to the end, and the stall limit from 0152 still ends one that stops writing output.
4. No test that passed before this change fails.

## Out of scope
- The tests that check speck run has stopped too soon (0173).
- speck's own tests leaving processes running, including the 0153 tests that kill a ship part-way through (0175, which took this ticket's old AC3).
- Killing processes left behind before this ships. They were cleared by hand on 2026-10-14.

## Notes
- `scripts/stall.mjs` starts the test command with `detached: true`, so it gets its own process group. The 0153 tests spawn `speck ship` detached and kill its group with SIGKILL, which doesn't reach the test command's group.
- The leftover loops came from `gated()` in `test/ship-0153.test.mjs`: `sh -c 'touch reached; while [ ! -f go ]; do sleep 0.05; done'`. The "killed" tests never write `go`, and the temporary folder is then deleted.
- Two other leftovers were found on the same day: a `speck run` and a `speck panel` started by 0171's tests in `/tmp/speck-test-…` folders. If the same cause doesn't explain them, record what does in Follow-ups instead of fixing them here.
- Failing before this build: none
- AC2 already held before this build: `speck stop` and the panel's Stop build find a build's processes by its session in their environment and by its process tree, which reaches the test command. Its tests pass before and after the change.
- `0109 AC4: a speck test killed outright keeps its turn while the tests it started are still running` relied on a killed `speck test` leaving its tests running, which AC1 reverses. Its test command now takes a second to end when asked to, so it still checks that the next run waits for those tests to end and never overlaps them.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->
If a ship or a test run is killed part-way, its tests now stop too, within a few seconds, instead of running on in the background for good. Those leftovers were what piled up on 2026-10-14 and slowed the machine to a crawl. Stopping a build already ended its tests, and still does. Tests that aren't interrupted run to the end as before, and tests that go quiet for too long are still ended. To see it, start a ship or a test run, kill it, and check a few seconds later that nothing from its tests is still running. One thing to know: anything the tests leave running in the background after they finish is now ended too, a moment after they finish.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- The `speck run` and `speck panel` left by 0171's tests in `/tmp/speck-test-…` folders aren't explained by this cause: they aren't test commands run through speck, so this change doesn't touch them. They were processes started by a test file, which 0175's clean-up now ends when each test file finishes.
- Known limit: a process the tests start in a process group of its own, with its environment cleared, is ended only if a build stop finds it through the build's process tree. A killed ship or test run ends only the test command's own process group.
- Behaviour change worth knowing: a process the tests leave running after the test command has ended (in its process group) is now ended within about half a second of the run finishing, where before it could stay if it had closed its output.

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
    "reviewed_sha": "454aad61fcaa5148b99ab84a95a05c649104e115",
    "thread_id": "01a13f4f-d5fc-7682-b153-5bf3cef236c6",
    "seconds": 28,
    "usage": {
      "input_tokens": 128927,
      "cached_input_tokens": 90624,
      "cache_write_input_tokens": 0,
      "output_tokens": 740,
      "reasoning_output_tokens": 106
    },
    "saved_at": "2026-10-15T11:26:27.218Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/stall.mjs checks for parent loss and adds a watcher that kills the test process group if the runner disappears. Five passing AC1 tests in test/killed-0174.test.mjs exercise SIGKILL of ship/test processes and groups, including --files, and check descendant cleanup."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Two passing AC2 tests exercise speck stop and stopBuild, which scripts/panel.mjs calls for Stop build. Both check that the test command and its descendants stop within the deadline."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Three passing AC3 tests verify normal completion, output and exit status, --files completion, and stall termination with descendant cleanup."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0174-tests.txt: 1780 tests, 1777 passed, 3 skipped, no failures or cancellations. The adjusted 0109 test retains its waiting and non-overlap assertions and passes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Killed ship and test runs now clean up their test processes. Build stopping, normal completion and stall handling remain covered by passing tests. The full suite reports no failures, and I found no blocking issues."
  }
}
```

</details>
