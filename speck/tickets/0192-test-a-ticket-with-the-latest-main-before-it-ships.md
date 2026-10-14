---
id: "0192"
title: "Test a ticket with the latest main before it ships"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-ship-a-simple-merge-without-another-review.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T23:06:04.002Z"

---
# 0192 · Test a ticket with the latest main before it ships

**Status:** 🔍 reviewing

## Problem
`speck ship` runs the tests on the ticket's branch alone, not on what will actually land: the ticket together with the base branch as it is now. Two tickets that each pass on their own can break the base branch together, and then every ship stops until someone fixes it. That happened twice on 2026-10-14 (0164 with 0165, fixed by 0190; 0177 with 0173, fixed by 0191). And an approved ticket whose base branch has moved on can't ship until a builder merges the base branch in and gets a merge review round, even when the merge is clean, which held up 0175, 0182 and 0183 for most of an evening.

## Outcome
What `speck ship` tests is exactly what lands on the base branch, and an approved ticket ships without another review when it merges into the newer base branch cleanly and its tests pass.

## Acceptance criteria
1. `speck ship` runs the tests on the commit it would put on the base branch (the ticket merged with the base branch as it is now), not on the ticket's branch alone. The commit that lands is the one whose tests passed.
2. If that commit fails tests that pass on the base branch alone, nothing ships, and `speck ship` says the ticket and the base branch's newer changes fail together, naming the failing tests.
3. When the base branch has moved on since the reviewer approved, and the ticket merges into it with no conflicts, `speck ship` ships it without another review round, provided the tests in criterion 1 pass.
4. When the merge has conflicts, `speck ship` refuses and changes nothing, as it does today, so the conflicts go to a merge round.
5. No test that passed before this change fails.

## Out of scope
- Shipping a merge that had conflicts without another review, even simple ones such as added lines or lockfiles (the rest of the idea note).
- A setting to require a review for every clean merge.

## Notes
- `scripts/ship.mjs` runs the tests in the ticket's worktree (`runTests(work, cfg)`), and `shipChecks` refuses a ticket whose files outside `speck/` changed after approval, which any merge of the base branch does.
- Related: 0048 (update a conflicting branch and re-review it), 0101 (the skill for ships that need a merge), 0116 (a ship that needs help inside the build).
- High risk: it changes what guards the base branch. A clean merge is safe to ship unreviewed only because criterion 1 tests the combined result.
- Failing before this build: none
- AC3 and AC4's tests passed before any code: ship already merged a clean, moved-on base branch without a review and already refused conflicts. What's new for AC3 is that the tests run on the merged result first (AC1's tests).
- Self-check: the check that what landed is what was tested now keeps a commit made on the base branch after the tests (it put the base back to before that commit), and the brief's claim about commits made while the tests run is narrowed to what happens after catching up with the remote, each with a test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9972f18e7efd2d77d640b1a449dcf5ea19b89d1c",
    "thread_id": "01a13cb8-25e9-7f92-8a10-0fbe8ec6df9e",
    "seconds": 30,
    "usage": {
      "input_tokens": 156630,
      "cached_input_tokens": 108672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1115,
      "reasoning_output_tokens": 166
    },
    "saved_at": "2026-10-14T23:21:33.872Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 integration tests cover merged trees and concurrent base commits, but scripts/ship.mjs:328–330 exempts arbitrary changes made in the ship commit from verification (F1)."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 integration test exercises refusal and names a failing test. However, results.mjs truncates output before tap.mjs parses it, losing test names for large TAP runs (F2)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 integration test verifies a clean merge into moved-on main ships successfully without adding a review round."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 integration test verifies exit 13, named conflicts and unchanged repository snapshots, with and without a worktree."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full /tmp/speck-0192-tests.txt reports 1691 tests, 1688 passes, 3 skipped and no failures. Existing tests were not weakened in the diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs:328",
        "issue": "The final comparison exempts every path changed between branchSha and the ship commit, rather than only the ticket's status move. A pre-commit hook that modifies and stages application code during the ship commit causes that code to enter the exemption set. Shipping then succeeds even though the landed code differs from what passed tests.",
        "suggested_fix": "Restrict exemptions to the known original and destination ticket paths. Refuse and restore the approved state if any other file changes. Add a regression test with a ship-commit hook that stages an application-code change.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/results.mjs:78",
        "issue": "Failing output is reduced to its final 1 MiB before failingTests parses it. For TAP output exceeding that size, the initial TAP header disappears, so failingTests returns no names even when failing result lines remain. Earlier failing tests can also disappear entirely. This breaks criterion 2 for larger suites.",
        "suggested_fix": "Extract failing test names from the complete output before truncating the retained diagnostic text. Add coverage for TAP output larger than 1 MiB, including a failure near the beginning.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change tests the combined ticket and latest main, and the existing suite passes. Two gaps need fixing: Git hooks can introduce untested code that still ships, and large test logs lose the failing test names promised by the ticket."
  }
}
```

</details>
