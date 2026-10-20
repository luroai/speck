---
id: "0337"
title: "Make the 0108 launch test pass again on main"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-20
started: "2026-10-20T12:27:19.846Z"

---
# 0337 · Make the 0108 launch test pass again on main

**Status:** 🔍 reviewing

## Problem
On main, the test `0108 AC2: a ticket committed as ready on the base branch is launched as before` (`test/ready-0108.test.mjs`) fails every time it runs, so every ticket's ship fails on it (0335 was handed back for it on 2026-10-20). It checks that speck run's output has no line matching `/0001[^\n]*commit/i`. Since 96a05182 (0327), when the test's fake build exits at once with the ticket still ready, speck run prints `0001 is still ready, so the build never started it. speck run won't launch it again until its ticket is set ready again and committed. …`, which matches. The test passes on the commit before 96a05182 and fails on 96a05182 and on main.

## Outcome
The 0108 AC2 test passes on main again, still checking that a ticket committed as ready is launched without speck run saying it's waiting for a commit.

## Acceptance criteria
1. `0108 AC2: a ticket committed as ready on the base branch is launched as before` passes on main, run on its own and in the whole suite.
2. It still fails if speck run says a ticket committed as ready is waiting to be committed before it's launched.
3. No test that passed before this change fails.

## Out of scope
- Changing speck run's messages, unless the builder finds the message itself is wrong.

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Found while handing back 0335 on 2026-10-20: `speck ship` said main's tests pass, but this test failed 6/6 on a checkout of main run on its own.
- Failing before this build: none (the recorded result for this code passed)
- Cause: the test, not speck run. Its fake build exits at once, so speck run rightly says 0001 is still ready and "won't launch it again until its ticket is set ready again and committed", and the test's pattern `/0001[^\n]*commit/i` took that for the waiting line. The pattern now matches only the waiting line ("not committed" or "waiting … commit"), shared in `test/support/ready.mjs`; speck run's messages are unchanged.
- Self-check: no changes

## In plain words
Nothing changes in how speck behaves. One of speck's own checks was failing on every run, which held up shipping every ticket. The check was mistaking speck's correct note about a build that never started its ticket for a note saying the ticket was waiting to be saved. It now looks only for the waiting note, so it passes again and still catches the problem it was written for. Once this ships, tickets that were handed back for this failure should ship as normal.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "69671cf7b93632da1a06fcc35fcf6007e396a710",
    "thread_id": "01a15948-f764-74f2-b956-01190187d2cf",
    "seconds": 22,
    "usage": {
      "input_tokens": 80720,
      "cached_input_tokens": 49152,
      "cache_write_input_tokens": 0,
      "output_tokens": 598,
      "reasoning_output_tokens": 25
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:28:58.038Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The recorded output in /tmp/speck-0337-tests.txt confirms the 0108 committed-ready launch test passes. The builder also reports five isolated passes. test/ready-0337.test.mjs checks that the post-build message no longer triggers its assertion. Whole-suite validation remains the ship gate."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0337 AC2 test checks the actual waiting-message template from scripts/run.mjs against the shared waitingLine pattern. The 0108 committed-ready launch test uses that same pattern in assert.doesNotMatch, so emitting that waiting message still fails it."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded run has 125 passes, zero failures and three skips. Changes are limited to the affected assertion, focused regression tests, their shared pattern and ticket metadata; scripts/run.mjs is unchanged. Ship checks the whole suite before merging."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The fix stops the launch test mistaking a later build-exit message for a request to commit the ticket. It still detects the real waiting message, and all tests run passed. No blocking concerns found."
  }
}
```

</details>
