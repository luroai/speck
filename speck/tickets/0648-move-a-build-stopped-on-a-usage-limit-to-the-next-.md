---
id: "0648"
title: "Move a build stopped on a usage limit to the next builder"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0647"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:26:16.065Z"

---
# 0648 · Move a build stopped on a usage limit to the next builder

**Status:** 🔍 reviewing

## Problem
A build that stops partway on its agent's usage limit waits for the reset, even when it's hours away and another builder on the bench is free.

## Outcome
A build stopped on a usage limit more than an hour from resetting is carried on by the next builder on the bench, from its branch and ticket.

## Acceptance criteria
1. When a build stops on its agent's usage limit and the reset is more than 60 minutes away, or unknown, `speck run` starts the ticket again on the first agent on `builder_bench` that's ready and not limited, in the same worktree and on the same branch, with a message saying it carries on another agent's build and to read the ticket's Notes and the branch's commits first.
2. When the reset is 60 minutes away or less, or no bench agent is free, it waits and carries on the build's own session after the reset, as 0622 does.
3. The ticket's Notes say which agent took over, why and when, and the ticket's `builder` records the new agent.
4. The reviewer still has to come from a different family than the agent that finishes the build.
5. No test that passed before this change fails.

## Out of scope
- Moving a build back to its first agent after the reset.

## Notes
- 0622 and 0623 carry builds on after the reset (`carryOn` in `scripts/usage-limit.mjs`).
- Failing before this build: none
- The takeover is `scripts/build-take-over.mjs`, given to speck run's usage-limit queue as `takeOver`: while an agent is held, each build stopped on it is offered to builder_bench on each check (so a bench agent that frees up later, with the reset still over an hour away, takes it then), using 0647's `standInFor` for the choice and the reviewer-family skip. The new builder and the Notes line are committed on the ticket's branch in its worktree (or on the base branch for a ticket stopped before `speck start`), before the build starts there with a fresh session and a new log.
- Found failing without this change: `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off…` (test/usage-limit-0622.test.mjs). On a machine where Cursor is installed and signed in, 0647's stand-in moves the test's new ticket to the real Cursor, which takes the only build slot. It fails the same with this build's changes stashed. Left as a follow-up, not changed here.
- Self-check: a ticket whose branch exists but isn't checked out in any folder fell back to the main checkout and would have been recorded on the base branch; it now waits for the reset, said once.

## In plain words
When a build stops partway because its agent has used up its allowance, and the allowance won't come back for more than an hour (or speck can't tell when), speck now hands the build to the next free agent on your builder's bench rather than waiting. The new agent picks up in the same folder and on the same branch, and is told to read the ticket's notes and what's been done so far before carrying on. The ticket's notes say who took over, when and why. If the allowance is back within an hour, or no other agent is free, speck waits and carries on the first agent's build as before. An agent from the same family as the reviewer is never picked, so the review stays independent. To see it, watch the Pipeline log after a build hits its limit: it says which agent carries the build on. Keep an eye on the first few handovers, to check the new agent picks up where the old one left off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups:
  - Keep speck run's tests off your real agents: the 0622 "while speck run was off" test fails on a machine where Cursor is signed in, because 0647's stand-in picks the real Cursor. Saved to the inbox (`speck/ideas/2026-11-11-keep-speck-run-s-tests-off-your-real-agents.md`).
  - Known limit: if the takeover is recorded on the ticket but speck run then can't save its record of the limit, the build isn't started, and the next check records a second Notes line when it moves it. Rare (a disk error) and harmless.
  - Known limit: a ticket stopped before `speck start` (still ready) is recorded on the base branch, and the new agent is told it's on branch main; its `/speck-build` then starts it as usual.

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
    "reviewed_sha": "4153486324bbb6da5d3da0efbae506f9968a9f13",
    "session": "fresh",
    "thread_id": "01a1cb3e-a528-7e53-a317-09b9693ec08e",
    "builder_response": "- Tests run: `speck test --related test/build-take-over-0648.test.mjs` (the ticket's own file, plus the 26 existing files it brought in through scripts/run.mjs and scripts/usage-limit.mjs).\n- One failure there, `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off…` (test/usage-limit-0622.test.mjs), isn't caused by this change: it fails the same with this build's changes stashed. On this machine Cursor is installed and signed in, so 0647's stand-in moves the test's new ticket 0002 to the real Cursor, which takes the only build slot. The quick suite that ship runs leaves this file out, as it starts a real speck run. It's noted in the ticket and left as a follow-up (out of this ticket's scope).\n- AC5: the rest of the related files pass. run.mjs stays at 600 lines (0078's check), with the wiring folded into its existing lines.\n",
    "seconds": 69,
    "usage": {
      "input_tokens": 304974,
      "cached_input_tokens": 244864,
      "cache_write_input_tokens": 0,
      "output_tokens": 1542,
      "reasoning_output_tokens": 537
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 60110,
      "cached": 244864,
      "write": 0,
      "output": 1542
    },
    "cost_usd": 0.1601264,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:35:11.844Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "buildTakeOver selects through standInFor and launches in recordTakeOver's checkout with a fresh session and takeover instructions. Passing 0648 AC1 tests cover branch, worktree, bench choice, unknown resets and the message."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "worthMoving excludes resets within 60 minutes; usageLimitQueue retains carryOn after reset. Passing 0648 AC2 tests cover the boundary, unavailable bench agents and resuming the original session."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "recordTakeOver updates builder and Notes and commits the ticket before launch. Passing 0648 AC3 tests cover the recorded facts, branch commit and refusal paths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "standInFor checks ticketSameModelProblem using the replacement builder. The passing 0648 AC4 test checks reviewer-family exclusion and the resulting ticket."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded related-test output shows 426 passing tests and one 0622 failure. Its trace shows the existing stand-in behaviour occupying the build slot; the reset is within 60 minutes, so the new takeover path does not run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/build-take-over-0648.test.mjs",
        "issue": "The AC3 Notes test matches the generated ticket's entire Notes sentence verbatim, including its phrasing and punctuation. This checks exact wording in a document written for people, which the review rules explicitly prohibit.",
        "suggested_fix": "Check the Notes section for the required facts—old and new agent, takeover time and limit reason—without requiring the complete sentence or its wording.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The takeover behaviour meets the acceptance criteria, including preserving the branch and keeping the reviewer independent. One test must change before approval: it locks the ticket's explanatory note to exact wording instead of checking the facts it must record."
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
    "reviewed_sha": "1a7be5858e2f6bcb6c54b79cd4527cfbd4a5bb3d",
    "session": "continued",
    "thread_id": "01a1cb3e-a528-7e53-a317-09b9693ec08e",
    "builder_response": "- Tests run: test/build-take-over-0648.test.mjs\n- F1: fixed. Both AC3 Notes tests now find the Notes line naming the old and new agent and check only its facts: the takeover time, that it was the usage limit, and the reset time (or that none was known). No sentence wording is matched.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 432758,
      "cached_input_tokens": 366720,
      "cache_write_input_tokens": 0,
      "output_tokens": 2067,
      "reasoning_output_tokens": 537
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5928,
      "cached": 121856,
      "write": 0,
      "output": 525
    },
    "cost_usd": 0.0292916,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:35:50.907Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "buildTakeOver uses standInFor to select a ready, unlimited bench agent and starts it in the ticket's checkout with fresh-session takeover instructions. Passing 0648 AC1 tests cover branch, worktree, selection, unknown resets and the message."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "worthMoving excludes resets 60 minutes away or less; usageLimitQueue preserves the original carryOn path. Passing 0648 AC2 tests cover the boundary, unavailable bench agents and resuming the original session."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "recordTakeOver commits the new builder and takeover Notes before launch. Passing 0648 AC3 tests check the required facts, branch commit and refusal paths without matching the complete Notes sentence."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "standInFor checks ticketSameModelProblem with the replacement builder. The passing 0648 AC4 test verifies reviewer-family exclusion and the resulting ticket."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "This round changes only two test assertions. Recorded output confirms 122 passes, zero failures and three skips, including all 14 ticket tests. The previous related run's 0622 failure was unrelated to the takeover path."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/build-take-over-0648.test.mjs",
        "issue": "The Notes tests previously required the entire generated sentence verbatim. They now check the required facts without locking the complete wording.",
        "suggested_fix": "",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Builds facing a long or unknown usage-limit wait can continue with an available bench agent while keeping their branch and recording the handover. Short waits retain the original session, and reviewer independence is preserved. The test wording issue is resolved."
  }
}
```

</details>
