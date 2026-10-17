---
id: "0264"
title: "Hand a ticket back when it fails tests that pass on a failing base branch"                # one outcome, no "and"
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
after: ["0263"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T08:57:38.722Z"

---
# 0264 · Hand a ticket back when it fails tests that pass on a failing base branch

**Status:** 🔍 reviewing

## Problem
When a ship's tests fail and the base branch's own tests fail too, `speck ship` puts every failure down to the base branch (exit 14, "this isn't the ticket's fault"). That includes tests that pass on the base branch and fail only with the ticket. The ticket's build is then sent back with the "Base branch failing" steps, never hears about its own failures, and has them pointed out only on a later ship, a whole cycle later. 0257 hid three of its own failures this way on 2026-10-17 (0078 AC2, 0233 AC1, 0168 AC4) behind seven README failures on main.

## Outcome
When the base branch is failing, a ship refusal puts only the tests that also fail on the base branch down to the base branch. A ticket that fails tests the base branch passes is handed back to its build, with those tests named.

## Acceptance criteria
1. When tests fail on the ticket as it would land and every one of them also fails on the base branch's own commit, `speck ship` refuses as today: the base branch is blamed, and an auto-ship exits 14.
2. When any test that fails on the ticket as it would land passes on the base branch's own commit, `speck ship` refuses saying the ticket fails tests that pass on the base branch. It names those tests and not the ones that also fail on the base branch. It says the base branch is failing as well. An auto-ship exits 16, so speck run hands the ticket back to its build.
3. In the case in criterion 2, speck run doesn't put shipping on hold.
4. A test counts as failing on the base branch only when a test of the same name fails there. A test that is missing from the base branch, such as one the ticket adds, counts as passing there.

## Out of scope
- Shipping fix tickets during a hold: 0263.
- Running the whole suite during a build.

## Notes
- The refusal is built in `testFailure` in `scripts/ship.mjs`, which already has the failing tests' names (`failingTests` from `scripts/tap.mjs`) for the merged run but only an ok/not-ok result for the base branch's run.
- A test that failed on the merge and then passed on the second, chance-failure run doesn't count as failing (as today).
- `scripts/ship.mjs` is at 579 lines and the limit is 600 (0078 AC2), so code added there may need to move into a module of its own.
- Failing before this build: none
- Self-check: no changes. Known limit, kept as the criteria say: when the base branch's run fails without TAP output, no test counts as failing there, so named failures on the ticket hand it back (AC4).

## In plain words
When a ticket's ship fails its tests while the main branch's own tests are failing too, speck no longer puts all the failures down to the main branch. If some of the failing tests pass on the main branch, the ship's message names just those, says the main branch is failing as well, and speck run sends the ticket back to its build to fix them, rather than pausing all shipping. Only when every failing test also fails on the main branch is the main branch blamed and shipping paused, as before. To see it, ship a ticket that breaks a test while the main branch has a different broken test: the message names only the ticket's broken test. Worth watching: if the main branch's tests crash without naming any test, every failure is put down to the ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups:
- A base branch run that fails without naming any test counts as failing none, so the ticket is handed back (speck/ideas/2026-10-17-blame-the-base-branch-when-its-run-names-no-tests.md).
- Tests that failed in the full run but passed on the second try are still named, and can hand a ticket back (speck/ideas/2026-10-17-leave-chance-failures-out-of-a-hand-back.md).

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
    "reviewed_sha": "1e54a1fc17cd76349d39d07d16fa2fac9a7b2fb8",
    "thread_id": "01a14917-c8df-79b0-93ea-a378a630c619",
    "seconds": 23,
    "usage": {
      "input_tokens": 165003,
      "cached_input_tokens": 107136,
      "cache_write_input_tokens": 0,
      "output_tokens": 800,
      "reasoning_output_tokens": 147
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:01:20.683Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship.mjs:testFailure retains exit 14 when every named failure also fails on the base. Both AC1 tests in test/ship-0264.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "testFailure filters out failures shared with the base, names the remaining tests, acknowledges the failing base and sets together for auto-ship exit 16. Both AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship-queue.mjs puts shipping on hold only for exit 14. The passing AC3 test feeds the real ship's exit 16 into the queue, verifies the build hand-back and confirms another ticket can ship."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "testFailure compares failingTests names using a Set; missing names remain attributed to the ticket. Both AC4 tests passed, covering missing tests and distinct nested test names."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change correctly separates ticket failures from failures already on the base branch. Tickets with their own failures are returned to their builder without putting shipping on hold. All 49 reported tests passed; the tests exercise the changed behaviour, and I found no blocking issues."
  }
}
```

</details>
