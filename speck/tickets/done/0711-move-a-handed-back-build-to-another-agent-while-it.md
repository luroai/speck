---
id: "0711"
title: "Move a handed-back build to another agent while its limit holds"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-move-a-handed-back-build-to-another-agent-while-its-limit-holds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:57:07.169Z"
approved: "2026-11-24T13:43:45.750Z"
finished: "2026-11-24T14:19:46.842Z"

---
# 0711 · Move a handed-back build to another agent while its limit holds

**Status:** ✅ done

## Problem
When an approved ticket's handed-back build stops on its agent's usage limit, speck run only waits for the reset, which can be five hours or more. The ticket can't ship meanwhile, even when another agent on the bench is free.

## Outcome
A handed-back build that stops on a limit moves to a free agent on `builder_bench`, as a building ticket's build does.

## Acceptance criteria
1. When an approved ticket's handed-back build stops on its agent's usage limit with the reset more than an hour away, and an agent on `builder_bench` is free, speck run carries the build on on that agent, and the ticket's Notes gain the take-over line, as for a building ticket.
2. The new agent's message says what the hand-back was for, with the reason and steps speck gave the first build, and for a merge clash tells it to check for an unfinished merge first.
3. While the moved build runs, the ship queue still holds the ticket, and the hand-back count isn't reset or spent again: a third clash still blocks the ticket, as today.
4. With no free agent on the bench, or the reset within an hour, the build waits for the reset, as today.
5. No test that passed before this change fails.

## Out of scope
- Moving review rounds (0692, 0693).

## Notes
- In `scripts/usage-limit.mjs`, `moveOn` filters on `IN_HAND = ['ready','building','reviewing']`, while the resume path uses `inHand()`, which also accepts approved tickets with `handed_back`. `resumeHandBack` (`scripts/hand-back.mjs`) drops `hand_back` from the record, so its kind and reason need keeping for the message. Take-over is `scripts/build-take-over.mjs` (0648).
- Failing before this build: none
- Self-check: added tests for a ticket the build had edited but not committed during the unfinished merge, and for git's index being locked once the branch has moved (the branch is put back). git's errors under a merge now give their first line, which names the problem, not their last.

## In plain words
When speck hands an approved ticket back to its build, for example to sort out a clash with other shipped work, and that build runs out of its agent's usage allowance with the reset more than an hour away, speck now passes the build to the next free agent on your builder's bench rather than waiting. The new agent is told what the hand-back was for, in the same words the first agent got. When the job was a clash, it's also told to check first for a merge the first agent left half done and to finish that, not start again. The ticket's notes say who took over, when and why, as for any other build that moves. It still doesn't ship while the new agent works, and the move doesn't use up one of the ticket's tries: a third clash still stops it and asks you, as before. With no agent free, or the reset within the hour, it waits and picks up again after the reset, as it did. To see it, watch the Pipeline log when a handed-back build hits its limit: it says which agent carries the build on. Keep an eye on the first few moves that happen partway through a clash, to check the new agent finishes the merge rather than starting it again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 214,853
- Elapsed since build started: 47 min
- Changed lines: 87 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Steady the 0289 killed-Codex-build test, which read a call file the fake Codex was still writing (`Unexpected end of JSON input`) in this build's related run: speck/ideas/2026-11-24-steady-the-0289-killed-codex-build-test-s-reads.md.
  - Let a test run outlast the builder's shell limit while it waits for a turn: one of this build's runs waited the whole 10 minutes behind two other builds' runs and was killed unrun. speck/ideas/2026-11-24-let-a-test-run-outlast-the-builder-s-shell-limit-while-it-waits.md.
  - Known limit: during an unfinished merge, the take-over commits only when the ticket is unchanged there against the branch's last commit, as git's commit hooks don't run for that commit. A ticket the merge brought changes to, or that the build was editing, waits for the reset, said once.
  - Known limit: a reviewing ticket's take-over, such as a handed-back build in its merge round, still gets 0648's message without the hand-back's reason, as that reason can be out of date by then (a ticket blocked by Handed back again, then answered). Its run record still keeps the hand-back count.
  - Known limit, from 0691: a handed-back build that re-approves the ticket and then hits the limit in its last reply is now moved too, and the new agent finds the hand-back already done.

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
    "reviewed_sha": "5b294796a871cd72741c19e4f2123fe824db2b13",
    "session": "fresh",
    "thread_id": "01a20dca-ffd6-7be2-9872-0806f974e262",
    "builder_response": "- Tests run: test/build-take-over-0711.test.mjs test/run-codex-0289.test.mjs\n- The `--related` run (24 files, 476 tests) had one failure, 0289 AC3 \"speck run resumes a killed Codex build in its own session\": `Unexpected end of JSON input` in that test's own polling, which read a calls file while the fake Codex was writing it, at load average ~62 from other builds. That test doesn't touch hand-backs or take-overs. The run above (this ticket's file plus 0289's) passes in full.\n- Approach:\n  - `moveOn` (scripts/usage-limit.mjs) now admits what `inHand` admits, so an approved ticket whose build was handed back (0691) is offered to `takeOver` like a building one.\n  - `resumeHandBack` (scripts/hand-back.mjs) keeps the hand-back's kind and reason in the run record as `handed_back_for`, since `hand_back` itself is dropped. `handBackOf` rebuilds the exact message the first build was resumed with (`handBackMessage`, same kind, reason and count). Its `merges` is true for the Conflict and Tests fail together steps (both start with a merge), and false for Handed back again, whose steps say not to merge.\n  - `buildTakeOver` adds that message, and for steps that merge, a line telling the agent to check for an unfinished merge with `git status` before following them. This applies only to approved tickets. A reviewing ticket's take-over keeps 0648's message, because its record's last hand-back may be out of date (for example a ticket blocked by Handed back again, answered by the user, and carried on). An approved ticket whose record doesn't say what it was handed back for (one handed back before this change, or a malformed record) isn't moved. It waits for the reset, and that's said once.\n  - The new agent's run record keeps `handed_back`, `hand_backs` and `handed_back_for` (`handBackKeeps`), for any status. So the count carries on (the third clash still gets Handed back again, AC3), and a moved build that stops on its own agent's limit still waits and holds the ticket (`inHand`).\n  - `recordTakeOver`: git refuses a partial commit during a merge (\"cannot do a partial commit during a merge\"), so without this a hand-back that stopped partway through its merge could never move. On the ticket's own branch with `MERGE_HEAD` present, `commitDuringMerge` commits the ticket with plumbing: a tree from HEAD with the new ticket blob, `commit-tree`, `update-ref HEAD <new> <old>`, then the ticket's index entry and file. The merge stays unfinished for the new agent, and its merge commit takes the ticket along (tested by finishing it). It only does this when the ticket is unchanged in the index and working tree against HEAD, so the commit holds speck's own change and nothing else, since git's commit hooks don't run for `commit-tree`. Otherwise it waits for the reset, said once. If the index update fails after the ref has moved, the ref and the index entry are put back (tested with `index.lock` held). On the base branch it's unchanged (it still refuses during a merge). This also helps a building ticket's take-over that finds an unfinished merge on its branch.\n- AC4's two tests passed before the change too: they check that behaviour stays as today.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 214214,
      "cached_input_tokens": 150528,
      "cache_write_input_tokens": 0,
      "output_tokens": 639,
      "reasoning_output_tokens": 54
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 63686,
      "cached": 150528,
      "write": 0,
      "output": 639
    },
    "cost_usd": 0.1488148,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:42:45.614Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "usageLimitQueue.moveOn now uses inHand; buildTakeOver records and launches the replacement. Passing 0711 AC1 tests cover agent selection, committed Notes and an unfinished merge, including safe refusal and rollback."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "resumeHandBack preserves handed_back_for; handBackOf and handBackTakeOver supply the reason, original steps and unfinished-merge instruction. Passing AC2 tests exercise these messages and malformed records."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "handBackKeeps preserves the timestamp and count. Passing AC3 tests exercise ship-queue holds, subsequent limits and the third-clash blocking instruction."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests cover an unavailable bench and a reset exactly an hour away, followed by resuming the original session."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported final run: 169 passed, zero failed, three skipped. The previously failing Codex polling test passed on rerun without changes. Inspection found no unrelated implementation changes in the branch diff."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change lets a handed-back build continue with another available agent, carrying its instructions and retry count forward while shipping stays on hold. Tests cover unfinished merges and failure recovery. No blocking issues found."
  }
}
```

</details>
