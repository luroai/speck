---
id: "0718"
title: "Count a delegated Codex session's later turns"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-count-a-delegated-codex-session-s-later-turns.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:24:47.320Z"
approved: "2026-11-24T14:38:19.927Z"
finished: "2026-11-24T15:57:53.551Z"

---
# 0718 · Count a delegated Codex session's later turns

**Status:** ✅ done

## Problem
A Codex session started in a ticket's worktree is recorded once, with the tokens it had when that build ended. If a later build carries the same session on, the extra tokens aren't counted, so the ticket shows less spend than it really cost.

## Outcome
A delegated Codex session carried on by a later build counts at its newest total, once.

## Acceptance criteria
1. When a later build of the same ticket carries on a Codex session already recorded for that ticket, and its tokens have grown, the ticket's spend counts that session at its newest total, once.
2. A sub-agent session started later under an already recorded session is counted.
3. A session whose tokens haven't grown, or one recorded for another ticket, a review round, a watch run or a build itself, isn't counted again.
4. No test that passed before this change fails.

## Out of scope
- Cursor sessions: saved rounds show Cursor reports each run's own usage.

## Notes
- `recordDelegatedSpend` (`scripts/spend.mjs`, called from `scripts/run.mjs` when a build ends) skips any thread already in `run.delegated-spend.jsonl`, and `delegatedOf` keeps the first entry per thread.
- Failing before this build: none
- Self-check: no changes (checked null or missing earlier totals, a smaller rewritten file, another ticket's entry for the same thread, and that the sessions keep their first-seen order).

## In plain words
When a builder hands work to Codex in a ticket's folder and a later build of the same ticket carries that Codex conversation on, the ticket's spend now includes the extra work, rather than only what the conversation had used when the first build ended. Helpers Codex starts later in that conversation count too. Each conversation still counts once, at its latest total, so nothing is added twice.

To see it, look at a ticket's spend in the panel or with `speck spend` after a second build has carried on a Codex conversation from the first: the delegated part shows the larger total. Conversations that belong to other tickets, review rounds, the watcher or the build itself are left out as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 224,400
- Elapsed since build started: 14 min
- Changed lines: 21 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox.
- Known limit (unchanged by this ticket): a sub-agent kept as a session of its own, because its parent's file was missing or outside the time window, is counted again inside its parent if the parent's file turns up later.

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
    "reviewed_sha": "a159c52aae3598f7d1226e19298736fdb4d1338a",
    "session": "fresh",
    "thread_id": "01a20dfd-bbab-7561-ab8a-8f56ffcea822",
    "builder_response": "- Tests run: test/spend-0718.test.mjs, with --related (141 related test files, brought in by scripts/spend.mjs and docs/brief.md); 1574 pass, 0 fail, 3 skipped.\n- Change: countedThreads no longer treats this ticket's own delegated threads as counted (other tickets' still are). recordDelegatedSpend appends a new entry for an already-kept thread only when its total tokens (sub-agents included) have grown; delegatedOf now takes the last kept entry per thread, so a session counts once at its newest total. The brief's sentence on delegated spend says so.\n- The AC3 tests passed before the change: they guard behaviour that must stay.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 223743,
      "cached_input_tokens": 172032,
      "cache_write_input_tokens": 0,
      "output_tokens": 657,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51711,
      "cached": 172032,
      "write": 0,
      "output": 657
    },
    "cost_usd": 0.1271952,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:38:10.043Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/spend.mjs: recordDelegatedSpend appends a replacement total only on token growth; delegatedOf selects the latest entry per thread. Both AC1 tests passed and verify totals across later builds, including spendParts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "recordDelegatedSpend includes codexSubagents when recalculating previously recorded sessions. The passing AC2 test adds a child after the first recording and verifies its tokens and cost count with its parent once."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "countedThreads retains exclusions for other tickets, builds, review rounds and watch runs. The growth guard rejects unchanged or smaller totals. Both AC3 tests passed and exercise these exclusions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded related-test run reports 1574 passed, 0 failed and 3 skipped. Existing tests were not changed; the implementation and branch changes are within the ticket's scope."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Continued delegated Codex sessions now count once at their latest token total, including sub-agents started later. Tests cover updates, costs and duplicate prevention, and all tests run passed. No blocking concerns found."
  }
}
```

</details>
