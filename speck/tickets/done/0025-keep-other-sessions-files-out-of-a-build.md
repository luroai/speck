---
id: "0025"
title: "Keep other sessions' files out of a build"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T11:57:27.546Z"
finished: "2026-10-09T12:08:11.905Z"

---
# 0025 · Keep other sessions' files out of a build

**Status:** ✅ done

## Problem
Other sessions sometimes work in the same checkout during a build. Twice in recent builds their files appeared mid-build, and one `git add -A` committed and pushed five draft tickets that the builder hadn't written. Untracked files from elsewhere also make `speck review` refuse to run, though they aren't part of what's reviewed.

## Outcome
A build commits only the files it changed, and other sessions' untracked files don't block its review.

## Acceptance criteria
1. The build and review skills tell the builder to stage files by name and never to use `git add -A`, `git add .` or `git commit -a`. If files it didn't create or change appear, it leaves them alone and mentions them to the user.
2. `speck review` and `speck record` no longer refuse because of untracked files. They still refuse when tracked files are modified or staged and not committed.
3. `speck ship` is unchanged: it still requires a fully clean tree, including untracked files.

## Out of scope
- Running builds in separate worktrees (see the open question on worktrees).

## Notes
- Pre-check: no ambiguities found, and no external facts.
- `speck record` had no clean-tree check before, so AC2's "still refuse" is new for it: it now shares `speck review`'s check (tracked changes only). Three older tests recorded rounds with tracked edits uncommitted (the reply file swept into a commit by `git add -A`, then rewritten; or ticket and config edits not yet committed). Their setup now commits by name first; what each one checks is unchanged.
- Self-check: my own record test never applied its dirty states (the loop skipped the call), so it passed for the wrong reason; fixed so each case really is dirty. No code changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 requireCommitted exempts the ticket based solely on onlyRoundsChanged(ticket.raw), without checking its staged content.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 612,163
- Elapsed since build started: 10 min
- Changed lines: 24 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: `speck close` still refuses when any untracked file is outside the ticket, so another session's file in the ticket's tree would block closing a build. The ticket only covers review and record, so it's unchanged.

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
    "reviewed_sha": "dce4fff4aa42f4b007205a1dede1051d98d60c1b",
    "thread_id": "01a1208c-ab32-7603-ae13-2b4439e3c0dc",
    "seconds": 43,
    "usage": {
      "input_tokens": 223000,
      "cached_input_tokens": 158208,
      "cache_write_input_tokens": 0,
      "output_tokens": 891,
      "reasoning_output_tokens": 73
    },
    "saved_at": "2026-10-09T12:04:55.208Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both skills explicitly require staging by name, prohibit all three broad staging commands, and require leaving unknown files alone and mentioning them. The 0025 AC1 test checks these instructions."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "requireCommitted in scripts/speck.mjs ignores untracked files and the 0025 AC2 tests exercise ordinary modified and staged files. However, its ticket exception checks only working-tree content against HEAD, allowing unrelated ticket edits staged in the index when the working copy is restored."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipTicket retains its full git status --porcelain check. The 0025 AC3 test verifies an untracked file blocks shipping without changing state."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "requireCommitted exempts the ticket based solely on onlyRoundsChanged(ticket.raw), without checking its staged content. Edit the ticket's problem or criteria, stage it, then restore the working copy from HEAD without resetting the index: the ticket has staged substantive changes, but onlyRoundsChanged returns true and both review and record proceed. This violates the requirement to refuse staged uncommitted changes beyond recorded rounds and the status transition.",
        "suggested_fix": "Check the ticket's index version as well as its working-tree version before exempting it. Add regression tests for both review and record with a substantive ticket edit staged and the working copy restored to HEAD; assert refusal and no round recorded.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The updated description correctly captures the intended behaviour, but its promise to reject staged tracked changes is not fully enforced for the ticket itself."
    },
    "escalation_question": "",
    "summary": "The staging instructions and handling of other sessions' untracked files are implemented, and shipping retains its clean-tree safeguard. One loophole remains: staged changes to the ticket can escape the review checks when its visible copy has been restored. Fix that check and add regression coverage before merging."
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
    "reviewed_sha": "5ee1ea9f84143f2f7bbd5cba15f433538ec5866b",
    "thread_id": "01a1208c-ab32-7603-ae13-2b4439e3c0dc",
    "seconds": 25,
    "usage": {
      "input_tokens": 386810,
      "cached_input_tokens": 302976,
      "cache_write_input_tokens": 0,
      "output_tokens": 1462,
      "reasoning_output_tokens": 73
    },
    "saved_at": "2026-10-09T12:06:54.618Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md and skills/speck-review/SKILL.md require staging by name, prohibit all three broad staging commands, and require leaving unknown files alone and mentioning them. The 0025 AC1 test checks these instructions and passes in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs requireCommitted, called by reviewSetup and cmdRecord, ignores untracked files and checks both working and staged ticket content before allowing the rounds/status exception. The two 0025 AC2 tests and the new F1 regression test exercise acceptance, refusal and the permitted staged-round exception; all pass in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs shipTicket retains its full git status --porcelain check. The 0025 AC3 test verifies that an untracked file blocks shipping without changing state and passes in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Staged substantive ticket changes could previously evade the clean-tree check when the working copy matched HEAD. requireCommitted now checks the index version as well, closing this loophole. The regression test reproduces the original state for both review and record and verifies refusal.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated spec accurately describes staging instructions, tracked-change checks and the unchanged shipping safeguard."
    },
    "escalation_question": "",
    "summary": "All acceptance criteria are met. Other sessions' untracked files no longer block review or recording, while uncommitted tracked changes still do. The staged-ticket loophole is fixed with meaningful regression coverage. Shipping keeps its existing clean-tree requirement."
  }
}
```

</details>
