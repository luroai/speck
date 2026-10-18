---
id: "0315"
title: "File a pull request mode ticket as done without pushing to the base branch"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:34:19.579Z"

---
# 0315 · File a pull request mode ticket as done without pushing to the base branch

**Status:** 🔍 reviewing

## Problem
In pull request mode, shipping merges the ticket's pull request on GitHub, but filing the shipped ticket as done still commits and pushes straight to the base branch. A base branch protected so that it only takes pull requests refuses that push, and protection is the main reason to use pull request mode.

## Outcome
In pull request mode, a ticket is filed as done without anything being pushed straight to the base branch.

## Acceptance criteria
1. With `ship_mode: pr`, the ticket's move to done is committed on the ticket's own branch before its pull request is merged, so it reaches the base branch through the pull request.
2. Shipping in pull request mode pushes nothing straight to the base branch: it merges the pull request, then brings the local base branch up to date from GitHub.
3. A pull request merged on GitHub by hand also leaves its ticket done on the base branch, with no push from speck.
4. With `ship_mode: local`, shipping works exactly as today.

## Out of scope
- Making GitHub's branch protection rules.

## Notes
- From `speck/ideas/2026-10-18-file-a-pull-request-mode-ticket-as-done-on-a-protected-branch.md` (inbox, from 0296).
- Failing before this build: none
- Design: the local ticket branch keeps the ticket `approved` (so the board, `shipChecks` and `speck run`'s queue are unchanged); what `speck pr` pushes to GitHub is the branch plus one `speck(<id>): ship` commit filing the ticket as done, made from the tip alone with the tip's names and dates, so the same tip always gives the same commit. Ship merges with `--match-head-commit` that commit, so a hand merge on GitHub files the ticket too.
- Self-check: no code changes. Checked a missing ticket on the branch, an unreachable remote, a stale done commit after a new branch commit (replaced with a lease), someone else's commit on the remote branch (kept, push refused), and a pull request opened before this change (done commit pushed first, merged on the next ship).

## In plain words
In pull request mode, each ticket's pull request now also marks the ticket as done, so merging it is what files the ticket away. speck no longer pushes anything straight to your main branch, which means a main branch protected to take only pull requests works. That holds whether speck merges the pull request or you merge it yourself on GitHub. To see it, open a ticket's pull request on GitHub: its last change moves the ticket into the done folder. On your own computer the ticket still shows as approved until the pull request is merged. Worth watching: a pull request opened before this change gets that extra change added the first time you ship it, and is merged on the next try, once GitHub has run its checks.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none to the inbox):
- The 0.8.0 changelog says that on a base branch that only takes pull requests the done commit can't be pushed. 0.8.0 is released, so the next release's notes should say this is fixed.
- Known limit: in pull request mode the ticket's `finished` time is the branch tip's commit time, so the same tip always gives the same done commit, rather than the time it was merged.
- Known limit: a pull request opened before this change and merged by hand on GitHub leaves the done ticket on the local base branch only, and speck says so instead of pushing it.

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
    "reviewed_sha": "cb09d22e5c109936c364e4f07cb7fc834db78ef3",
    "thread_id": "01a1512d-bbfd-7052-97bd-18bf25f9176a",
    "seconds": 44,
    "usage": {
      "input_tokens": 290673,
      "cached_input_tokens": 231040,
      "cache_write_input_tokens": 0,
      "output_tokens": 1486,
      "reasoning_output_tokens": 550
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:42:37.496Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pr-done.mjs doneTip/pushDone create and push the done commit above the local branch. Passing 0315 AC1 tests verify the ticket moves, the local ticket stays approved, and updates preserve others' remote commits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/pr-ship.mjs merges with the done commit as --match-head-commit, then catchUp fetches and merges the remote base. tidy no longer pushes the base. Passing 0315 AC2 tests verify this with a hook recording any attempted base push."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0315 AC3 test verifies that a hand merge puts the done ticket on the remote base before speck runs, and subsequent tidying makes no base push."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The local shipping implementation is unchanged. Passing 0315 AC4 test verifies local shipping files the ticket, merges and pushes main without calling gh."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/pr-done-0315.test.mjs:153",
        "issue": "The added documentation test prohibits the exact prose phrase 'pushes the base branch last'. This checks document wording, which the review rules explicitly prohibit. It would also reject a valid explanation that local shipping pushes the base branch last.",
        "suggested_fix": "Remove this prose assertion and check the documentation by review. Keep the behavioural tests that verify no base push occurs in pull request mode.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The implementation meets all four acceptance criteria, and the reported tests exercise the shipping behaviour meaningfully. One blocking test issue remains: remove the assertion that restricts the documentation’s exact wording."
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
    "reviewed_sha": "74e736a478a516375bda67e1f81d45668ce78bcc",
    "thread_id": "01a1512d-bbfd-7052-97bd-18bf25f9176a",
    "seconds": 17,
    "usage": {
      "input_tokens": 415909,
      "cached_input_tokens": 349568,
      "cache_write_input_tokens": 0,
      "output_tokens": 2021,
      "reasoning_output_tokens": 550
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:43:43.683Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pr-done.mjs doneTip and pushDone put the done ticket commit above the ticket branch before merging. Both 0315 AC1 tests passed, checking the move, deterministic commit and safe remote updates."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/pr-ship.mjs shipPrTicket merges the done commit; tidy calls catchUp without pushing the base branch. Passing 0315 AC2 tests verify no attempted base push, local catch-up and migration of older pull requests."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0315 AC3 test verifies a hand merge files the done ticket on the remote base before speck runs, and tidying pushes nothing to the base."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Local shipping code remains unchanged. The passing 0315 AC4 test verifies it files the ticket, merges and pushes main without calling gh."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/pr-done-0315.test.mjs",
        "issue": "The documentation wording assertion has been removed. Behavioural tests remain intact.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Pull requests now carry the done ticket, so merging through speck or GitHub files it without a direct push to the base branch. Local shipping remains unchanged. The blocking test issue is fixed, and the reported run has no failures."
  }
}
```

</details>
