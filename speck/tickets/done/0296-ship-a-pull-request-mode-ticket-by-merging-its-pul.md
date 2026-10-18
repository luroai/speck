---
id: "0296"
title: "Ship a pull request mode ticket by merging its pull request"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0295"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T14:26:55.074Z"
approved: "2026-10-18T14:40:43.545Z"
finished: "2026-10-18T14:43:10.513Z"

---
# 0296 · Ship a pull request mode ticket by merging its pull request

**Status:** ✅ done

## Problem
In pull request mode (0295), an approved ticket has a pull request, but speck has no way to ship it: merging through GitHub, tidying up, and doing nothing more when you've already merged it on GitHub.

## Outcome
In pull request mode, shipping a ticket merges its pull request on GitHub and tidies up, the same way whether you ship it, speck run's queue ships it, or you merge it on GitHub yourself.

## Acceptance criteria
1. With `ship_mode: pr`, `speck ship <id>` merges the ticket's pull request with `gh` once its checks pass, then brings the local base branch up to date, files the ticket as done, and removes its worktree and branch, as a local ship does.
2. When the pull request has already been merged on GitHub, `speck ship <id>` only tidies up.
3. When the pull request can't be merged (failing checks, a conflict, or a review GitHub requires), nothing changes locally, and speck says why in one line. speck run's queue tries it again once the pull request changes.
4. speck run's queue ships pull request mode tickets this way when `auto_ship` covers them, and notices a pull request merged on GitHub and tidies up after it.
5. With `ship_mode: local`, shipping works exactly as today.

## Out of scope
- Approving pull requests on GitHub.

## Notes
- Checked 2026-10-18: `gh pr merge <number> --merge` and `gh pr view <number> --json state,mergeable,statusCheckRollup` behave as needed: gh 2.101.0 has `pr merge -m/--merge` (it enables auto-merge instead only on a branch that requires a merge queue) and `pr view --json` offers `state`, `mergeable`, `mergeStateStatus`, `reviewDecision` and `statusCheckRollup`.
- Failing before this build: none
- Self-check: a pull request whose head commit gh doesn't give is now refused with a plain message, instead of being treated as behind the branch.
- Pictures: none, because the only change in the panel is the wording of ship_mode's explanation in the Settings view, with no change to any layout.
- The speck-ship skill doesn't mention pull request mode: an older test (ship.test.mjs AC1) keeps "pull request" out of the build, review and ship skills, so that's left as a follow-up rather than loosening it.

## In plain words
In pull request mode, shipping a ticket now merges its pull request on GitHub, instead of saying to merge it there yourself. Before merging, speck checks the same things a local ship does, including running the whole test suite on the change as it would land, and that GitHub has nothing in the way. Then it brings your copy of the main branch up to date, files the ticket as done and removes its branch. If you merged the pull request on GitHub yourself, shipping only does the tidying up.

To see it, set ship_mode to "pr", approve a ticket so it gets a pull request, then press Ship or run /speck-ship. With auto_ship on, speck run does it by itself, and it notices a pull request you merged on GitHub and tidies up after it within about a minute.

Worth keeping an eye on: when the pull request can't be merged (failing or unfinished checks, a conflict, or a review GitHub requires), nothing changes and speck says why in one line; speck run tries again once the pull request changes. On a main branch that only takes pull requests, the "done" note can't be pushed, so the panel says it wasn't pushed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A successful gh command does not necessarily mean the PR has merged: the ticket explicitly notes that a required merge queue can enable auto-merge instead.; F2 PR shipping never runs the whole test suite.; F3 A refused base-branch push merely prints a warning and then reports successful shipping.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 514,428
- Elapsed since build started: 14 min
- Changed lines: 260 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The speck-ship and speck-setup skills don't mention pull request mode: `speck/ideas/2026-10-18-tell-the-skills-about-pull-request-mode.md`.
  - On a protected base branch the done ticket's commit can't be pushed: `speck/ideas/2026-10-18-file-a-pull-request-mode-ticket-as-done-on-a-protected-branch.md`.
  - The panel's Ship button and speck run's waiting messages say "ship" for both modes; worth checking their wording reads right in pull request mode.

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
    "reviewed_sha": "d4209c3261a785be2368a0db5be710f537a81509",
    "thread_id": "01a14f71-7a0c-7343-b865-f95c2dcd872b",
    "seconds": 45,
    "usage": {
      "input_tokens": 188174,
      "cached_input_tokens": 133504,
      "cache_write_input_tokens": 0,
      "output_tokens": 1229,
      "reasoning_output_tokens": 47
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:37:24.412Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing AC1 tests cover immediate merges, but shipPrTicket in scripts/pr-ship.mjs proceeds to cleanup solely on gh's exit status, without confirming the PR is merged. It also omits the local ship's whole-suite validation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipPrTicket handles MERGED separately; passing AC2 tests exercise cleanup without another merge and refusal when local commits were omitted."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests exercise failing checks, conflicts, required reviews, GitHub refusal, unchanged local state and queue retry after PR changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise prQueue selection, auto_ship eligibility, external-merge cleanup and prLook change detection."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdShip retains shipTicket for local mode; the passing AC5 test verifies local merging without gh, alongside the reported existing shipping tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs:153",
        "issue": "A successful gh command does not necessarily mean the PR has merged: the ticket explicitly notes that a required merge queue can enable auto-merge instead. The code immediately files the ticket as done and deletes its branches and worktree, potentially before its code reaches the base branch.",
        "suggested_fix": "Re-read the PR after the command and only tidy up after confirming MERGED. Leave queued PRs intact for a later queue check. Add a test where gh succeeds but the PR remains OPEN.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs:145",
        "issue": "PR shipping never runs the whole test suite. shipChecks verifies approval and commit history only; local shipping separately tests the candidate merge. Consequently PR mode can ship with failing configured tests, including when GitHub has no checks configured. This bypasses the repository's explicit requirement that speck ship always tests the ticket as it would land.",
        "suggested_fix": "Run the configured shipping tests against the candidate merged with the current remote base before requesting the GitHub merge, preserving the existing failure safeguards. Add a test proving a failing suite prevents the merge.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs:108",
        "issue": "A refused base-branch push merely prints a warning and then reports successful shipping. Unlike local shipping, it never records error.unpushed, so the panel cannot show 'Merged, but not pushed'. This is particularly likely on the protected branches PR mode serves, leaving the done-ticket commit only on this computer while the queue reports success.",
        "suggested_fix": "Preserve the existing unpushed ship-state reporting when the done-ticket push fails, and test a protected-branch push refusal.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main flows have passing tests, but shipping needs three safeguards before approval: run the required tests, confirm GitHub actually merged before cleanup, and visibly track failed pushes of the completed ticket."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e77c18492c53ebe903ba4ce4121f91ea7417599f",
    "thread_id": "01a14f71-7a0c-7343-b865-f95c2dcd872b",
    "seconds": 28,
    "usage": {
      "input_tokens": 322946,
      "cached_input_tokens": 251264,
      "cache_write_input_tokens": 0,
      "output_tokens": 2079,
      "reasoning_output_tokens": 138
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:40:17.879Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pr-ship.mjs now tests the candidate merge, requests the GitHub merge and confirms MERGED before cleanup. Passing AC1 tests cover normal shipping, queued merges, failing tests, local catch-up and refused pushes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipPrTicket's MERGED path skips merging and runs tidy. Passing AC2 tests verify cleanup without another merge and protection of unmerged local commits."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "whyNotMergeable refuses failing checks, conflicts and required reviews. Passing AC3 tests verify one-line explanations, unchanged local state and queue retries after PR changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "prQueue selects eligible open PRs and externally merged PRs; shipPrTicket enforces automatic-shipping eligibility. Passing AC4 tests exercise both paths and PR change detection."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdShip continues to use shipTicket for local mode. The passing AC5 test verifies local shipping without gh; reported existing shipping tests also pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "Cleanup previously started when gh succeeded without confirming that GitHub had merged the PR.",
        "suggested_fix": "Implemented: re-read the PR and require MERGED before cleanup. The passing queued-merge test verifies that an open PR remains intact.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "PR shipping previously skipped the configured whole-suite shipping check.",
        "suggested_fix": "Implemented: testLanding fetches the remote base and tests the candidate merge using the existing shipping helpers. The passing failure test verifies that failing tests prevent the GitHub merge.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "A refused push previously appeared as successful shipping without preserving the panel's unpushed state.",
        "suggested_fix": "Implemented: tidy throws an error carrying unpushed metadata. The passing protected-branch test verifies the retained ship state and queue message.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The three blocking issues are fixed and covered by passing tests. Shipping now checks the tests, waits for GitHub to confirm the merge before cleanup, and records failed pushes visibly. All acceptance criteria pass."
  }
}
```

</details>
