---
id: "0647"
title: "Start new builds on the next builder while the builder is limited"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0644","0645"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:08:13.514Z"

---
# 0647 · Start new builds on the next builder while the builder is limited

**Status:** 🔍 reviewing

## Problem
When the builder's agent is limited, `speck run` starts no builds until the reset, even with another agent on the builder's bench ready and idle. On 2026-11-10 that cost half a day.

## Outcome
While the builder's agent is limited, `speck run` starts each new build on the first agent on the builder's bench that's ready and not limited.

## Acceptance criteria
1. While the builder's agent is held by a recorded usage limit, `speck run` starts each ready ticket on the first agent on `builder_bench` that's installed, signed in and not limited, with that agent's own build command, and the ticket's `builder` records it.
2. `builder_model` and `builder_effort` aren't passed to a bench agent, as they're in the builder's own format, and the review still refuses a reviewer from the same family as the agent that built it, as config does today.
3. `speck run`'s log and the Pipeline log say once per limit which agent builds instead and why, and once more when the limit resets and new builds go back to the builder.
4. When no agent on the bench is ready and free, builds wait for the reset as they do today.
5. No test that passed before this change fails.

## Out of scope
- A build that already stopped on the limit: 0648.

## Notes
- Each ticket's own builder is already supported (`scripts/ticket-builder.mjs`), and `holds` in `scripts/usage-limit.mjs` says which agent is limited.
- Failing before this build: none
- The stand-in is recorded by committing `builder: <agent>` to the ticket on the base branch in the main checkout (as the panel commits Set ready), before its build starts, so `speck start`'s ready check and every review round see the agent that builds it. When the main checkout isn't on the base branch, or the commit fails, the ticket waits for the reset, said once.
- AC2: a bench agent of the same family as the ticket's reviewer is skipped (unless allow_same_model_review), since the ready check would refuse the ticket with it, so it takes the next one on the bench rather than starting a build that can't be reviewed.
- Only a ticket built on the builder's own agent moves: one whose own builder is another agent that's held waits for that agent, as today.
- Self-check: 0344's test reads run.mjs for `launch(t)`, so the plain launch keeps that call and the stand-in launches on its own branch; run.mjs stays at 600 lines by folding the new lines into existing ones.

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
    "reviewed_sha": "27a8aeafab3fc09176be13bc2196879d5b2eaf69",
    "session": "fresh",
    "thread_id": "01a1cb2c-fb4f-7c63-9f9e-c6215d969f6f",
    "builder_response": "- Tests run: `speck test --related test/builder-stand-in-0647.test.mjs` (the ticket's own file, the repo checks, and every test file that names scripts/run.mjs).\n- Design: scripts/builder-stand-in.mjs picks the stand-in (standInFor), records it on the ticket by committing `builder: <agent>` on the base branch in the main checkout (recordBuilder), and keeps speck run's once-per-limit lines (builderStandIn). run.mjs calls pick() only when the ticket's launch agent is held, and launches the stand-in with its own command (blank build_command to launchPlan), so builder_model/builder_effort are dropped by ticket-builder's configFor.\n- AC2 note: a bench agent whose family matches the ticket's reviewer is skipped unless allow_same_model_review, because the ready check (lint, ticketSameModelProblem) would refuse the ticket with it; the review's own check is unchanged.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 186488,
      "cached_input_tokens": 141312,
      "cache_write_input_tokens": 0,
      "output_tokens": 1028,
      "reasoning_output_tokens": 116
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45176,
      "cached": 141312,
      "write": 0,
      "output": 1028
    },
    "cost_usd": 0.1147632,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:15:33.182Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/run.mjs calls standIns.pick before checking available build slots. pick commits the stand-in immediately, so queued tickets retain that agent even if the builder's limit resets before they start. The AC1 tests exercise selection and launch planning separately and miss this sequence."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticket-builder.mjs configFor removes builder_model and builder_effort for another builder. standInFor checks ticketSameModelProblem with the proposed builder and ticket frontmatter. Both behaviours have passing AC2 tests."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "builderStandIn.check announces that new builds return to the builder, but ready tickets already reassigned while slots were full continue on the stand-in. The passing AC3 test does not exercise queued tickets or the run loop."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "standInFor returns no agent when none qualifies, and run.mjs retains the limit wait. Passing AC4 tests cover unavailable and limited bench agents and tickets assigned to another limited builder."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied related-test run reports 313 passed, zero failed and three skipped. No existing tests were weakened or changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:462",
        "issue": "Stand-in selection commits the ticket's builder before checking whether a build slot is available. With all slots occupied, every ready ticket can therefore be permanently assigned to the stand-in without starting. If the original builder's limit resets before a slot opens, those tickets still start on the stand-in, despite the reset announcement. They also bypass subsequent bench selection because their recorded builder is now another agent.",
        "suggested_fix": "Check available build capacity before selecting and recording a stand-in. Add a regression test covering a ready ticket waiting behind a full build slot, followed by the original builder's limit resetting before capacity becomes available; verify no premature builder commit and that the ticket starts on the original builder.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The fallback selection and review safeguards are implemented, and the reported tests pass. However, tickets waiting for space are reassigned too early and can keep using the fallback after the original builder becomes available. Fix that scheduling issue before merge."
  }
}
```

</details>
