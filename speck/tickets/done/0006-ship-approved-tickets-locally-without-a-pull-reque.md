---
id: "0006"
title: "Ship approved tickets locally without a pull request"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: ""       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-08-ship-locally-without-a-pr.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T16:09:04.507Z"
finished: "2026-10-08T16:16:15.245Z"

---
# 0006 · Ship approved tickets locally without a pull request

**Status:** ✅ done

## Problem
speck's main users are solo builders who want to build things bigger than a single prompt. Today every approved ticket goes through a GitHub PR, which needs the GitHub CLI, a login and branch protection, and runs into GitHub's rule that you can't approve your own PR. For a solo builder the PR is mostly a place to click Merge, and the repo already holds the ticket, the review rounds and `product.md`.

## Outcome
`/speck-build` takes a ticket from `ready` to reviewer-approved with no PR: the branch waits locally with status `approved`. The user ships it by running `/speck-ship <id>`, which merges it into the base branch, pushes and tidies up. Agents never ship on their own.

## Acceptance criteria
1. `approved` is a valid status between `reviewing` and `done`. When the reviewer approves, the build fills in the ticket's review and delivery logs, sets `approved` and commits on the ticket branch. It opens no PR and needs no GitHub CLI. `speck status` lists approved tickets before every other status, as waiting for the user.
2. `speck ship <id>` refuses, with a plain-English reason and nothing changed, unless the ticket is `approved`, `speck next` says `ship`, the working tree is clean, no commit after the last reviewed commit changes files outside `speck/`, and the test command passes.
3. When those checks pass, `speck ship <id>` sets the ticket to `done` on the branch, merges the branch into the base branch with a merge commit, deletes the branch and leaves the user on the base branch. If the merge conflicts, it aborts, leaves the base branch as it was and says so.
4. If the base branch has a remote, `speck ship` pushes it and reports a failed push, such as a protected branch, with a fix. With no remote, it skips the push and says so. `speck doctor` reports the GitHub CLI as optional.
5. The `speck-ship` skill runs `speck ship`, and only when the user asks: in Claude Code it sets `disable-model-invocation: true`. The build skill, review skill, AGENTS.md pointer written by `speck init` and `docs/brief.md` say agents never merge or ship unless the user runs `/speck-ship`.

## Out of scope
- PR ship mode for teams (`ship: pr`): parked in speck/ideas/2026-10-08-pr-ship-mode.md, a later ticket.
- Squash or rebase merges; only a merge commit.
- Shipping several tickets at once, or automatic rebasing onto a moved base branch.
- Ticket 0002 (GitHub setup docs), which now belongs with PR mode.

## Notes
- Running `/speck-ship` is the human gate, as clicking Merge was. `speck pack <id>` stays as the local review pack to read before shipping.
- `speck init`'s next steps should stop telling solo users to set up branch protection and the `speck/review` check.
- Update `speck/product.md`, README and `docs/brief.md`: the workflow now ends at `approved`, then `/speck-ship`.
- Risk is high because it merges, pushes the base branch and deletes branches.
- `product.md` is updated and reviewed during the build. Ship only marks the ticket done and merges, so nothing reaches the base branch unreviewed.
- Moving done tickets into `speck/tickets/done/` is ticket 0007.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
- Round 1 (codex, model default, effort default): changes requested. F1: a code change reverted after approval slipped past the check. F2: an empty test command let ship skip the tests. F3: the build close-out wasn't covered by the AC1 test.
- Round 2: approved. F1–F3 resolved.

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost, PR link. -->
- Attempts: 1. Review rounds: 2 (of 3). Reviewer tokens: 200,603. Elapsed: about 15 min. Changed lines: about 260 (limit 300), excluding tests.
- Follow-up ideas: the PR ship mode (speck/ideas/2026-10-08-pr-ship-mode.md); `init` doesn't rewrite an AGENTS.md pointer written by an older version, so existing installs keep the old "Never merge" wording; Codex skills have no equivalent of `disable-model-invocation`.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "default",
    "reviewer_effort": "default",
    "reviewed_sha": "a353409c7daa7e636c5939ac34052fbf886f445e",
    "thread_id": "01a11c49-d29b-7a52-b493-77fbaaa8dedf",
    "seconds": 41,
    "usage": {
      "input_tokens": 76860,
      "cached_input_tokens": 38144,
      "cache_write_input_tokens": 0,
      "output_tokens": 1054,
      "reasoning_output_tokens": 70
    },
    "saved_at": "2026-10-08T16:13:23.174Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "unclear",
        "evidence": "The status test exercises approved status and ordering. skills/speck-build/SKILL.md instructs log completion and committing, but its test checks only the status instruction and absence of PR commands; it does not verify the required logs and commit."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "scripts/speck.mjs: shipChecks uses an endpoint git diff, which misses changes subsequently reverted. runTests returns true when no test command exists. Existing refusal tests cover neither case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipTicket implements done status, --no-ff merge, branch deletion and conflict rollback. Supplied integration tests exercise successful shipping, conflict recovery and invocation from main."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipTicket and doctorChecks implement remote pushing and optional gh. Supplied tests exercise successful and refused pushes, no remote and optional GitHub CLI."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The ship skill invokes speck ship and sets disable-model-invocation: true. The supplied AC5 test checks the skills, brief and generated AGENTS.md pointer."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "shipChecks compares only the reviewed and current trees. A commit changing code followed by a revert passes, although criterion 2 forbids any post-review commit changing files outside speck/.",
        "suggested_fix": "Inspect changed paths across every commit after the reviewed commit, including merge commits. Add a regression test with a code change followed by its revert.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "runTests treats an unset test command as success and permits shipping without passing tests, contrary to criterion 2.",
        "suggested_fix": "Refuse shipping when commands.test is empty, explain how to configure it, and test that branch, ticket and working tree remain unchanged.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The AC1 build test does not cover the required review log, delivery log or approval commit. These parts of the criterion remain unverified.",
        "suggested_fix": "Add appropriate verification of the complete approval close-out procedure, including both logs and the ticket-branch commit.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The claimed mandatory passing tests and protection against post-review code changes are stronger than the implementation."
    },
    "escalation_question": "",
    "summary": "The local shipping workflow has useful integration coverage, including merge conflicts and failed pushes. It needs fixes before merge: shipping can proceed without a test command and overlooks code changes that were later reverted. Build close-out also needs fuller verification. Sandbox startup failed, so this review relies on the supplied diff and test output."
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
    "reviewer_model": "default",
    "reviewer_effort": "default",
    "reviewed_sha": "7295e8f6e159d5b331480915207f0066d7b7f662",
    "thread_id": "01a11c49-d29b-7a52-b493-77fbaaa8dedf",
    "seconds": 25,
    "usage": {
      "input_tokens": 120833,
      "cached_input_tokens": 76544,
      "cache_write_input_tokens": 0,
      "output_tokens": 1856,
      "reasoning_output_tokens": 96
    },
    "saved_at": "2026-10-08T16:14:19.188Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "STATUSES and cmdStatus support approved and list it first. The passing AC1 tests exercise status handling and verify that the build skill's Approved section requires both logs, setting approved and committing the ticket and review records, without PR commands. This verifies the agent instructions rather than an end-to-end agent run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipChecks checks approval, nextAction, reviewed ancestry and paths from every subsequent commit using git log -m. runTests now refuses an empty command. The passing AC2 refusal test covers unapproved status, dirty files, later code changes, reverted changes, absent approval, missing test configuration and failing tests."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipTicket sets done, creates a --no-ff merge, deletes the ticket branch and leaves the base checked out. Passing AC3 integration tests check successful delivery, conflict rollback and invocation from main."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipTicket pushes the configured base-branch remote and reports push failures with recovery instructions. Passing AC4 tests cover successful pushing, refused pushing, no remote and doctor reporting gh as optional."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The ship skill runs speck ship and has disable-model-invocation: true. The passing AC5 test checks user-only shipping instructions in the build and review skills, docs/brief.md and the AGENTS.md pointer generated by init."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The previous endpoint comparison missed post-review code changes that were later reverted.",
        "suggested_fix": "Implemented: inspect paths across subsequent commits, including merge commits; regression coverage checks a change followed by its revert.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Shipping previously proceeded without a configured test command.",
        "suggested_fix": "Implemented: refuse an empty commands.test with configuration guidance; regression coverage checks refusal and unchanged state.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The build skill test previously omitted the required logs and approval commit.",
        "suggested_fix": "Implemented: verify the Approved section requires both logs before setting approved and explicitly requires committing the ticket and review records. This is appropriate coverage of the skill instructions.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated specification matches the mandatory test configuration and commit-by-commit approval safeguard."
    },
    "escalation_question": "",
    "summary": "The three earlier findings are resolved. Approved tickets now wait for the user, and shipping checks approval and tests before merging locally and optionally pushing. The supplied suite reports all 31 tests passing. Approval is based on the supplied diffs and test output; sandbox startup prevented independent command execution."
  }
}
```

</details>
