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
source: "speck/ideas/2026-10-08-ship-locally-without-a-pr.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
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
