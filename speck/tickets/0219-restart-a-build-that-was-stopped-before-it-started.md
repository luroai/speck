---
id: "0219"
title: "Restart a build that was stopped before it started its ticket"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-resume-a-build-stopped-before-it-started.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0218","0227"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T02:56:06.257Z"
approved: "2026-10-16T02:59:35.427Z"

---
# 0219 · Restart a build that was stopped before it started its ticket

**Status:** 👍 approved

## Problem
When `speck stop` ends a build before it has run `speck start`, the ticket is left blocked in the main checkout with no branch. `/speck-build <id>` can't pick it up, because `speck start` refuses a ticket that isn't ready, and the stop message wrongly says the branch and work were kept.

## Outcome
A ticket stopped before its build started can be built again with `/speck-build <id>`, with no fixing by hand.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `speck start <id>` on a blocked ticket with no branch starts it as it would a ready ticket: it makes the branch (and the worktree, when worktrees are on) and sets the status to building.
2. `speck start <id>` on a blocked ticket that has a branch behaves as today.
3. `speck stop` on a build that hadn't started its ticket still leaves the ticket blocked (0072 AC2), but says it was stopped before it started and that `/speck-build <id>` starts it again, instead of saying its branch and work were kept.
4. `speck start` still refuses a ticket in any other status that isn't ready, as today, and no test that passed before this change fails.

## Out of scope
- Sending a ticket stopped before it started back to ready instead of blocked.

## Notes
- The refusal is in `cmdStart` in `scripts/speck.mjs`; the stop message is in `stopBuild()` in `scripts/run.mjs`. `skills/speck-build/SKILL.md` already tells the builder to run `speck start` on a blocked ticket.
- The note's open question is settled as blocked, as 0072 AC2 and `test/stop-0072.test.mjs` require.
- Failing before this build: none
- Self-check: no changes. A blocked ticket with no branch starts whatever blocked it, so a draft someone set blocked by hand would start too; no speck flow blocks a draft, so it's left as a known limit.

## In plain words
If you stop a build before it has really got going, its ticket is still put on hold, but you can now build it again just by asking for it to be built, with no tidying up by hand first. The message you see when you stop it now says it was stopped before it started and how to start it again, instead of wrongly saying its work was kept. To see it, stop a build in the first moments after it's launched, then build that ticket again. Worth knowing: any ticket on hold that was never started can now be started this way.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 100,676
- Elapsed since build started: 3 min
- Changed lines: 14 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes): a ticket someone set blocked by hand while still a draft would also start, as speck start can't tell it from one speck stop blocked; no speck flow blocks a draft. A restarted ticket keeps its "Stopped by you on …" blocked question text, as a resumed blocked ticket with a branch does today.

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
    "reviewed_sha": "1b40cf5d712f482eaed56a32fb717be9c2347727",
    "thread_id": "01a142a6-19f2-7bd3-945a-bfe98453c66f",
    "seconds": 22,
    "usage": {
      "input_tokens": 100125,
      "cached_input_tokens": 57216,
      "cache_write_input_tokens": 0,
      "output_tokens": 551,
      "reasoning_output_tokens": 9
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T02:59:26.395Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdStart accepts blocked tickets after checking for existing branches. Passing restart-0219 tests verify branch creation, worktree creation when enabled, building status and start commit, including restart after stopBuild."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStart's existing-branch refusal is unchanged and precedes the status check. Passing AC2 test verifies the worktree path is reported and the blocked ticket and commit remain unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/run.mjs stopBuild selects its message by branch existence. Passing AC3 tests verify both messages and blocked status; existing stop-0072 tests also passed, including stopping before the ticket starts."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify refusal without branch creation or commits for draft, building, reviewing, approved, done and cancelled tickets. Recorded output confirms all 47 tests across the five reported files passed. The whole-suite check remains speck ship's responsibility."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "A build stopped before its ticket started can now be restarted without manual repairs. The stop message explains how to restart it, while existing builds retain their previous behaviour. The tests exercise the actual start and stop code, and all 47 recorded tests passed. No blocking issues found."
  }
}
```

</details>
