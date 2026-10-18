---
id: "0295"
title: "Open a pull request for an approved ticket in pull request mode"                # one outcome, no "and"
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
after: ["0294", "0287"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T14:08:19.808Z"
approved: "2026-10-18T14:21:59.952Z"
finished: "2026-10-18T14:26:36.574Z"

---
# 0295 · Open a pull request for an approved ticket in pull request mode

**Status:** ✅ done

## Problem
speck ships by merging into the base branch and pushing it, with no pull request. Teams, and projects whose base branch only takes changes through pull requests, can't use it.

## Outcome
In pull request mode, an approved ticket gets a GitHub pull request with its review pack, instead of being merged locally.

## Acceptance criteria
1. A new setting, `ship_mode`, takes `local` (the default, as today) or `pr`. It's in the config template with a comment, `speck config set` accepts it, and the Settings view offers it with an explanation.
2. With `pr`, once a ticket is approved, speck pushes its branch and opens a pull request into the base branch with `gh`, titled with the ticket's id and title, its body the ticket's plain review pack (`speck pack <id> --plain`). The pull request's link is kept on the ticket and shown in the panel.
3. Opening it again for the same ticket finds the existing pull request instead of making a second one.
4. When `gh` isn't installed, isn't signed in, or can't open the pull request, the ticket stays approved, nothing is merged, and the panel and speck run say why in one line.
5. With `local`, approval and shipping work exactly as today.

## Out of scope
- Merging the pull request: 0296.
- Requiring approvals on GitHub.

## Notes
- From `speck/ideas/2026-10-08-pr-ship-mode.md`, opening the pull request only after approval, as the user prefers.
- Checked 2026-10-18: `gh pr create --base <base> --head <branch> --title … --body-file …` and `gh pr list --head <branch>` behave as needed: gh 2.101.0 has `pr create -B/--base -H/--head -t/--title -F/--body-file` and `pr list --head <branch> --state --json`.
- Failing before this build: none
- Self-check: `speck pr`'s note when the link couldn't be written on the ticket now says why (a failed commit, or no checkout of its branch), not always the latter.

## In plain words
There's a new setting for how approved work ships: "local", as before, or "pr". With "pr", once the reviewer approves a ticket, speck sends its changes to GitHub and opens a pull request for it, with the ticket's plain review pack as its description, instead of merging it on your computer. Asking again never opens a second one: speck finds the one it already has.

To see it, pick "pr" for ship_mode in the panel's Settings view, under Shipping. An approved ticket's review pack then shows a link to its pull request. If speck couldn't open it, for example because GitHub's command line tool isn't installed or signed in, the ticket stays approved, nothing is merged, and the review pack and speck run say why in one line.

Worth knowing: in "pr" mode speck doesn't merge anything yet, so the Ship button and /speck-ship say to merge the pull request on GitHub. Merging it from speck comes with the next ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Opening a pull request checks only the ticket's status field.; F2 When the ticket branch is not checked out, openAndKeep reports success but never records pull_request on the ticket.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 637,441
- Elapsed since build started: 14 min
- Changed lines: 271 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The panel hides why a link wasn't written on the ticket when it has the link (reviewer's minor F3): `speck/ideas/2026-10-18-show-why-a-pull-request-link-isn-t-on-its-ticket.md`.
  - In pr mode, the panel still says an approved ticket auto_ship covers is waiting for speck run to ship it, and the Ship button runs a `speck ship` that refuses: skipped as a new idea, as 0296 covers shipping pull request mode tickets from speck, the panel and speck run's queue.
  - The build and ship skills don't mention pr mode yet: skipped as a new idea, for 0296 to cover with the ship side.

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
    "reviewed_sha": "ba509b8e44504192d45419e4f901faabd6ecdaab",
    "thread_id": "01a14f61-729a-7cf1-ab15-908fb295d004",
    "seconds": 26,
    "usage": {
      "input_tokens": 247610,
      "cached_input_tokens": 189184,
      "cache_write_input_tokens": 0,
      "output_tokens": 1116,
      "reasoning_output_tokens": 104
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:19:34.957Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/config.yml, config.mjs checkConfigValue and settings.mjs offer local/pr with an explanation. The three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests passed for a checked-out worktree. However, pull-request.mjs openAndKeep only writes the ticket field when pr.at exists; otherwise the link remains solely in an ignored cache, contrary to the requirement to keep it on the ticket."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "existing() searches for open or merged pull requests, including after a create failure. Both AC3 tests passed and verify that repeated calls create only one pull request."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 tests passed for missing gh, failed authentication and failed creation, checking approved status, unchanged base branch, and panel/queue explanations."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Both AC5 tests passed, exercising local approval without gh and local shipping. The implementation preserves the existing local paths."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pull-request.mjs:59",
        "issue": "Opening a pull request checks only the ticket's status field. It does not verify the review verdict, that the approved commit is an ancestor, or that code has not changed since approval. An approved branch with subsequent unreviewed code is pushed and presented with a pack saying the reviewer approved it. Existing local shipping explicitly rejects this in shipChecks().",
        "suggested_fix": "Validate the branch's review approval and changes since reviewed_sha before pushing or creating a pull request. Add tests for unreviewed commits after approval and an approved status without a valid approving review.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/pull-request.mjs:120",
        "issue": "When the ticket branch is not checked out, openAndKeep reports success but never records pull_request on the ticket. A failed link commit also leaves only a cache record, and the queue then skips the ticket because that cache supplies a URL. This makes the required ticket record permanently optional and loses the link when the cache is removed.",
        "suggested_fix": "Persist the link on the ticket branch even when it needs a temporary worktree, and make failed persistence visible and retryable. Add coverage for an unchecked-out branch and a failed ticket commit.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main pull request flow and local shipping tests pass. Two gaps need fixing: unreviewed changes can be published under an earlier approval, and the pull request link is not always saved on the ticket as promised."
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
    "reviewed_sha": "e3095c8d0a622b2322b9c47998a0fb4f9c68d39c",
    "thread_id": "01a14f61-729a-7cf1-ab15-908fb295d004",
    "seconds": 18,
    "usage": {
      "input_tokens": 386872,
      "cached_input_tokens": 313856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1843,
      "reasoning_output_tokens": 185
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:21:37.212Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The config template defaults ship_mode to local with a comment; checkConfigValue accepts only local/pr; Settings offers both with an explanation. All three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "openPullRequest validates approval with shipChecks, pushes the branch and creates the PR with the ticket title and plainPack body. openAndKeep commits the link, using a temporary worktree when needed. AC2 tests passed, including approval validation, unchecked-out branches and failed-commit recovery."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "existing() finds open or merged PRs before creation and after a creation failure. Both AC3 tests passed; persistence retries also verify that no duplicate is created."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 tests exercise missing gh, failed authentication and failed creation, preserving approval and the base branch while reporting the reason through status, the panel and the run queue."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The two AC5 tests passed, exercising local approval without invoking gh and successful local shipping. The local implementation paths remain intact."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pull-request.mjs",
        "issue": "Resolved: openPullRequest now calls shipChecks before invoking gh or pushing, validating the approving review, its ancestry and subsequent code changes.",
        "suggested_fix": "None required. The new approval-validation test passed.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/pull-request.mjs",
        "issue": "Resolved: unchecked-out branches receive a temporary worktree for committing the link. Failed commits preserve the URL with an error and allow a later attempt to find the existing PR and persist its link.",
        "suggested_fix": "None required. Tests for temporary worktrees, failed commits and queue retry eligibility passed.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "minor",
        "file": "templates/panel.html",
        "issue": "prPart returns immediately when a URL exists, so it hides the accompanying error when the PR opened but its link could not be committed. The command and run log explain this, but the panel shows only the link.",
        "suggested_fix": "Display the link and any accompanying persistence error together, with a panel test covering both fields.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Both blocking issues are fixed, and all acceptance criteria pass. The change is ready for the owner to consider merging. One minor improvement remains: show link-saving errors beside an existing pull request link in the panel."
  }
}
```

</details>
