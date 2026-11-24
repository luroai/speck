---
id: "0721"
title: "Keep speck run's checks from re-reading done tickets' logs"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-keep-speck-run-s-checks-from-re-reading-build-logs.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:39:13.738Z"
approved: "2026-11-24T16:36:06.350Z"

---
# 0721 · Keep speck run's checks from re-reading done tickets' logs

**Status:** 👍 approved

## Problem
An idle speck run still spends about 1.7 s of processor time per check on this repo, mostly reading every ticket's build log and run records and running git, done tickets included. The cost grows with the project's history, on a machine where tests already fail under load.

## Outcome
An idle check costs about the same however many done tickets there are.

## Acceptance criteria
1. A second board check with nothing changed since the first reads no done or cancelled ticket's build log and starts no git process for any done or cancelled ticket.
2. Each spend record file (watch spend and delegated spend) is read at most once per check, however many tickets there are.
3. When a ticket's build log or run record changes, the next check reads it again.
4. `speck status --json` gives the same output on the same repo before and after this change.
5. No test that passed before this change fails.

## Out of scope
- Tickets still in progress, which may need reading on every check.

## Notes
- `statusData` (`scripts/speck.mjs`) works out, for every ticket: spend (`earlierBuilds` in `scripts/spend.mjs` reads the whole log when the run record has no `builder`; `watchSpent`/`delegatedSpent` read jsonl files per ticket) and `shipState`, `prShown`, `buildSession`, `handedBack`. `logTail` is already cached by stat.
- Test by counting file reads and process starts, not by timing, as `test/run-reads-0682.test.mjs` does.
- Failing before this build: none
- Self-check: after round 1, cache only buildExit and shippedCriteriaChanged (not the whole entry), so spend and settings still update; checked missing records/logs and that a warmed board takes up spend and reviewer setting changes.

## In plain words
An idle speck run no longer re-reads every finished ticket's build log or asks git about it on each look at the board. It only looks again when that ticket's log or run record has changed, and it reads the shared spend files once per look however many tickets there are. The board still shows the same facts as before — spend, settings and what a ticket is waiting on stay up to date. To see it, watch speck run's processor use with top while nothing is building: it should stay steadier as the project's history grows. Keep an eye on it: tickets still in progress are read as they were.


## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 closedDeps tracks only the ticket and five run files, but caches the entire board entry.; F2 recent_spend is frozen inside each cached closed entry.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 591,330
- Elapsed since build started: 117 min
- Changed lines: 173 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. Known limit: the tip of the base branch is re-read once per board check; shipped-criteria answers grow with distinct tip+criteria pairs until the process ends.

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
    "reviewed_sha": "bc139b4854b5d4efc53dac384159b2ce261919ac",
    "session": "fresh",
    "thread_id": "01a20e1a-9c87-7df2-8b5b-3331ea21c81a",
    "builder_response": "- Tests run: test/run-reads-0721.test.mjs test/split-0078.test.mjs (and before the first round, `speck test --related test/run-reads-0721.test.mjs`: 1932 passed; the only failure is test/tmp-cleanup.test.mjs AC1 AC2, which also fails on main on this machine — Node's default reporter prints `ℹ fail 2` where the check expects TAP `# fail 2`. Not caused by this change.)\n- Round 1: caches each done/cancelled ticket's board entry by its ticket file and run records (scripts/closed-board.mjs), so a second idle check opens no done ticket's build log and starts no git for it; caches spend jsonl parses in scripts/spend.mjs so each file is read once per check; moves buildExit/buildPaused/buildRunning into scripts/build-records.mjs so scripts/speck.mjs stays under 600 lines.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 185230,
      "cached_input_tokens": 129024,
      "cache_write_input_tokens": 0,
      "output_tokens": 1216,
      "reasoning_output_tokens": 120
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56206,
      "cached": 129024,
      "write": 0,
      "output": 1216
    },
    "cost_usd": 0.1374744,
    "saved_at": "2026-11-24T15:09:51.429Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "statusData returns closedHit entries before log reads or ticket-specific git calls. The passing 0721 AC1 test counts both for done and cancelled tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "spend.mjs jsonLines caches parsed files by stat. The passing 0721 AC2 test counts one read of each shared spend file across multiple tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "closedDeps includes build log and run record stats. The passing 0721 AC3 test changes each and verifies renewed reads and the updated exit code."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The cached whole entry omits dependencies on settings, shared spend files, other tickets and time. Its output can therefore differ from the previous implementation on the same current repo. The AC4 test compares cold and warm calls only, without changing these dependencies or comparing against previous behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied results pass the ticket tests and split compatibility checks. The reported tmp-cleanup failure concerns reporter formatting in unchanged code; the reviewed change provides no evidence of causing it."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/closed-board.mjs",
        "issue": "closedDeps tracks only the ticket and five run files, but caches the entire board entry. Appending watch, delegated or backfilled spend leaves closed tickets' spend totals stale. Changing configuration leaves builder, reviewer and auto-ship fields stale; another ticket finishing leaves waiting_on stale. statusData returns the cached entry before recomputing any of these.",
        "suggested_fix": "Cache the expensive log and git results separately and recompute fields with other dependencies, or include all relevant dependencies in invalidation. Add regression tests that warm the cache, change shared spend, settings and a dependency ticket, then compare the board with a fresh calculation.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "recent_spend is frozen inside each cached closed entry. When spend crosses the seven-day boundary, subsequent checks continue reporting it indefinitely unless a tracked file changes. Previously totalSpent recalculated that window on every check.",
        "suggested_fix": "Recalculate recent_spend from cached spend parts using the current check time. Add a controlled-clock test that warms the cache before the seven-day boundary and checks again after it without changing files.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change avoids repeated log reads and git calls, and the counting tests support that improvement. However, it also freezes information that must keep updating, including costs, settings and recent spending. Those stale board results need fixing before merge."
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
    "reviewed_sha": "93ac4dee3b77f0f7a6e4f757da50109026e290c6",
    "session": "continued",
    "thread_id": "01a20e1a-9c87-7df2-8b5b-3331ea21c81a",
    "builder_response": "- Tests run: test/run-reads-0721.test.mjs\n- F1: fixed. Cache only buildExit (by run record + log stats) and shippedCriteriaChanged (by base tip + criteria text) in scripts/closed-board.mjs; statusData rebuilds every entry each check so spend, settings and waiting_on stay current. Regression: 0721 AC4 (round 1 F1).\n- F2: fixed. recent_spend is computed by totalSpent on every check again; no whole-entry freeze. Regression: 0721 AC4 (round 1 F2).\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 408608,
      "cached_input_tokens": 330240,
      "cache_write_input_tokens": 0,
      "output_tokens": 2010,
      "reasoning_output_tokens": 169
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 22162,
      "cached": 201216,
      "write": 0,
      "output": 794
    },
    "cost_usd": 0.0723856,
    "saved_at": "2026-11-24T15:14:26.706Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cachedBuildExit avoids reopening unchanged logs; cachedShipped avoids ticket-specific git calls. The passing 0721 AC1 test counts log opens and git calls on a second check."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "spend.mjs jsonLines caches parsed files by stat. The passing 0721 AC2 test verifies one read per shared spend file across multiple tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cachedBuildExit keys results on run record and log stats. The passing 0721 AC3 test changes both files and verifies renewed reads and updated output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData now rebuilds entries on every check, including settings, dependencies and current spend. Passing AC4 tests cover unchanged JSON output, updated shared spend and reviewer settings, and recent-spend filtering."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "All six 0721 tests and the supplied compatibility checks pass. The unchanged tmp-cleanup reporter-format failure remains unrelated to this implementation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/closed-board.mjs",
        "issue": "Resolved: whole-entry caching was removed. Board fields now refresh each check; only build-exit and shipped-criteria results are cached by their dependencies.",
        "suggested_fix": "",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: totalSpent again receives the current seven-day cutoff on every check, so recent_spend is no longer frozen.",
        "suggested_fix": "",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The revised change avoids repeated closed-ticket log reads and git checks while keeping board information current. Both previous blocking issues are resolved, and the relevant tests pass. It is ready for the owner's merge decision."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "db69c26830edf68644028bd8c341d3ba0348c2a8",
    "merge": true,
    "session": "continued",
    "thread_id": "01a20e1a-9c87-7df2-8b5b-3331ea21c81a",
    "builder_response": "- Tests run: test/run-reads-0721.test.mjs test/split-0078.test.mjs\n- Merge conflict: scripts/speck.mjs (class: logic). Kept this ticket's move of buildExit/buildPaused/buildRunning into build-records (no pidAlive or logTail imports here) and beginBoardCheck from closed-board.mjs, and main's appChecking / readAgentState imports and withAppCheck wiring for 0713. All six 0721 tests and 0078 AC2 pass; tmp-cleanup still fails on this machine as on main (reporter format), unrelated to the merge.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 588669,
      "cached_input_tokens": 496768,
      "cache_write_input_tokens": 0,
      "output_tokens": 2661,
      "reasoning_output_tokens": 169
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 13533,
      "cached": 166528,
      "write": 0,
      "output": 651
    },
    "cost_usd": 0.0502288,
    "saved_at": "2026-11-24T16:35:59.634Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cachedBuildExit and cachedShipped remain intact after the merge. The passing 0721 AC1 test verifies no closed-ticket log opens or ticket-specific git calls on an unchanged second check."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "spend.mjs retains stat-based jsonLines caching. The passing 0721 AC2 test verifies one read per shared spend file across multiple tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cachedBuildExit still keys results on log and run record stats. The passing 0721 AC3 test verifies renewed reads after changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData rebuilds board entries each check. All three AC4 tests pass, covering unchanged output, refreshed settings and spend, and recent-spend filtering. The merge preserves main's appChecking, readAgentState and withAppCheck wiring."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "All six 0721 tests and supplied split compatibility checks pass after the merge. The unchanged tmp-cleanup reporter-format failure remains unrelated to this change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/closed-board.mjs",
        "issue": "Resolved: whole-entry caching remains removed, so settings, spend and ticket dependencies refresh each check.",
        "suggested_fix": "",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: recent_spend continues to use the current seven-day cutoff on every check.",
        "suggested_fix": "",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves both the caching improvement and main's app-check behaviour. The relevant tests pass, both earlier findings remain resolved, and no new blocking issues were found."
  }
}
```

</details>
