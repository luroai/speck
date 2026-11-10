---
id: "0622"
title: "Carry a build on by itself once Claude's usage limit resets"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T22:59:55.125Z"
approved: "2026-11-10T23:11:32.192Z"
finished: "2026-11-10T23:15:49.508Z"

---
# 0622 · Carry a build on by itself once Claude's usage limit resets

**Status:** ✅ done

## Problem
When Claude's usage limit is reached, a build stops partway and stays stopped until someone notices: on 2026-11-10 one waited five hours after the limit had reset. The watcher makes it worse, as it looks into the stop on the same agent, hits the same limit and gives up. Yet Claude's own log says when the limit resets.

## Outcome
When a build stops on Claude's usage limit, speck waits until the limit resets, then carries the build on and starts new work again, by itself, and tells you.

## Acceptance criteria
1. When a build's log shows Claude refused it for a usage limit (a `rate_limit_event` whose status is `rejected`), `speck run` records that the limit was reached and when it resets, from that event's `resetsAt`, and says once in its log, for example "Claude's usage limit is reached until 12:30 UTC, so I'll carry on then."
2. Until then, `speck run` starts no build, and no watch agent, on Claude, and doesn't look into a build that stopped on the limit; the bar's status reads "Waiting: usage limit until 12:30".
3. From a minute after the reset time, `speck run` resumes each build that stopped on the limit, once, in its own session, telling it the limit has reset and to carry on from where it stopped, and starts launching ready tickets again. A build that hits the limit again is waited out the same way.
4. When the log shows the limit was reached but gives no reset time, `speck run` tries again after 30 minutes, and every 30 minutes after, until a build gets past it.
5. A build that stops for any other reason is handled as today, and no test that passed before this change fails.

## Out of scope
- A reviewer's usage limit (0623).
- Switching to another agent while one is limited.
- Codex and Cursor builders' limits.

## Notes
- Asked for 2026-11-10: "when the usage comes back into play, I would really like it if the builds just started them by themselves again … I've just wasted half a day there of not moving forwards because a usage limit was hit."
- Seen on 2026-11-10: 0616's build reached Claude's five-hour limit at 11:57 UTC and exited with code 1; the watcher then looked into it on Claude, hit the same limit and took no action; nothing restarted it until it was resumed by hand at 17:03. The limit had reset at 12:30. The build's stream-json log held `{"type":"rate_limit_event","rate_limit_info":{"status":"rejected","resetsAt":1794313800,"rateLimitType":"five_hour",…}}`, after an earlier one with `"status":"allowed_warning"` at 90%, and its result said "resets 12:30pm (UTC)".
- Today: `speck run` handles a build's end in `finished`/`endOf` in `scripts/run.mjs` and starts the watch agent from `lookInto`; a build is resumed in its own session with `resumeFor` in `scripts/hand-back.mjs`, as `resumeKilled` does; the status words' reasons are `SHORT` in `scripts/foreman.mjs`.
- Checked 2026-11-10: Claude Code's stream-json output includes `rate_limit_event` lines with `status` (`allowed`, `allowed_warning`, `rejected`) and `resetsAt` as Unix seconds (this repo's own build logs).
- Relies on Claude Code's stream-json `rate_limit_event`, as above.
- Failing before this build: none
- Self-check: a wait that can't be saved now leaves the build to be handled as any other stop, instead of counting it as waiting with nothing to resume it; added a test.

## In plain words
When Claude's usage limit stops a build, speck now waits for the limit to reset, then picks the build up where it stopped and starts new work again, without you doing anything. While it waits, the status bar reads "Waiting: usage limit until 12:30", and the stopped build isn't counted as needing you. Builds on Codex or Cursor keep going.

To see it, wait for a build to hit the limit with speck run on: its log says when speck will carry on, and a minute after that time the build resumes.

Worth keeping an eye on: if Claude doesn't say when the limit resets, speck tries again every 30 minutes, so a few builds may start and be refused until the limit lifts.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Usage-limit recovery is bypassed for builds that end while speck run is stopped.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 523,121
- Elapsed since build started: 12 min
- Changed lines: 195 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: a build handed back on an approved ticket that stops on the limit isn't carried on (`speck/ideas/2026-11-10-carry-on-a-handed-back-build-after-the-usage-limit.md`).
- Known limit: a watch agent already running when the limit is reached uses up its one look at that stop.

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
    "reviewed_sha": "02d220da24c70841316c2eb26057687617dced45",
    "session": "fresh",
    "thread_id": "01a1c7b8-55c9-74e3-a7aa-eb1561ceb65c",
    "builder_response": "- Tests run: test/usage-limit-0622.test.mjs, with `speck test --related`, which also ran every existing test file naming a changed file, and the repo-wide checks.\n- A ticket still `ready` when its build hit the limit is resumed in its session like the others (AC3), rather than launched afresh.\n- With no usable reset time (none, already past, or over 31 days off), it retries after 30 minutes (AC4). The past case is treated as none so a stale time can't loop.\n- The bar: \"Needs you\" still comes first; the limit outranks Shipping and Building.\n",
    "seconds": 52,
    "usage": {
      "input_tokens": 314800,
      "cached_input_tokens": 252544,
      "cache_write_input_tokens": 0,
      "output_tokens": 1398,
      "reasoning_output_tokens": 272
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 62256,
      "cached": 252544,
      "write": 0,
      "output": 1398
    },
    "cost_usd": 0.1637464,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T23:09:20.150Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "limitInLog and usageLimitQueue.ended have passing tests for recording and announcing rejections. However, scripts/run.mjs:231 records an already-ended build's exit during startup without checking its log for a usage limit."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing tests cover launch holds, watch holds and the waiting bar. The startup path in adoptEarlierBuilds bypasses limits.ended, so a refusal occurring while speck run is stopped establishes no hold and new Claude builds can start immediately."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Passing queue and process tests cover resuming once in the original session. A build that finishes on the limit while speck run is stopped is never added to the waiting queue when it restarts, so it is not resumed after reset."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "usageLimitQueue.reached uses RETRY_MS when no usable reset exists. The passing '0622 AC4: with no reset time it tries again after 30 minutes...' test exercises repeated refusals and eventual progress."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests cover unrelated errors, other agents and previously handled refusals. The recorded related-test run reports 842 passed, zero failed and three skipped; no unrelated changes were found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:231",
        "issue": "Usage-limit recovery is bypassed for builds that end while speck run is stopped. Builds deliberately continue running after speck run stops. If Claude then refuses a build and exits, adoptEarlierBuilds records its exit on restart and continues without calling limits.ended. Because the log contains a result, buildKilled also excludes it from automatic recovery. The build stays stopped and new Claude work can launch during the limit.",
        "suggested_fix": "Check the usage-limit log when recovering an already-ended build at startup, before ordinary stop handling. Add a regression test covering a build that reaches the limit while speck run is stopped, then restart and verify the hold and eventual session resume.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal waiting and automatic resume flow is well tested. One recovery gap remains: if a build hits the limit while speck run is stopped, restarting speck misses the refusal, leaves that build stranded and can start more work during the limit."
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
    "reviewed_sha": "6e3308ba2fd5ed72b169f4e799cf4471558aa65b",
    "session": "continued",
    "thread_id": "01a1c7b8-55c9-74e3-a7aa-eb1561ceb65c",
    "builder_response": "- Tests run: test/usage-limit-0622.test.mjs (with the repo-wide checks).\n- F1: fixed. `adoptEarlierBuilds` in scripts/run.mjs now calls `limits.ended` for a build that ended while speck run was off, after recording its exit. New test \"a build that hit the limit while speck run was off is waited out when it starts, and holds new work too\" starts a real speck run over such a record: it failed before the fix, and shows nothing starts before the reset, then the build resumes in its own session and the next ready ticket launches.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 520940,
      "cached_input_tokens": 449152,
      "cache_write_input_tokens": 0,
      "output_tokens": 2181,
      "reasoning_output_tokens": 295
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9532,
      "cached": 196608,
      "write": 0,
      "output": 783
    },
    "cost_usd": 0.0465548,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T23:11:13.890Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/usage-limit.mjs: limitInLog reads rejected events and resetsAt; ended persists the wait and reached announces it once. Passing AC1 tests cover parsing, persistence and duplicate announcements. adoptEarlierBuilds now also detects refusals occurring while speck run was off."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs applies limit holds to launches and resume queues; foremanAgentQueue holds Claude watch agents. foremanView displays the waiting status. Passing AC2 tests cover these paths, and the new startup regression verifies new work stays held."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "usageLimitQueue.check resumes queued builds after the reset plus GRACE_MS, respecting available slots. resume uses the original session and continuation message. Passing AC3 tests cover timing, once-only resumption, repeated limits and startup recovery."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "usageLimitQueue.reached schedules RETRY_MS when no usable reset time exists. Passing AC4 tests exercise repeated 30-minute retries until the build gets past the limit."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests cover unrelated stops, other agents and old refusals. The current test output confirms 147 passed, zero failed and three skipped; the previous related-test run also had no failures. Changes remain within scope."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:231",
        "issue": "Startup previously missed usage-limit refusals from builds that ended while speck run was stopped.",
        "suggested_fix": "Implemented: adoptEarlierBuilds now calls limits.ended after recording the exit. The passing process regression verifies waiting, resuming the original session and holding new work until reset.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Claude builds now wait out usage limits and resume automatically, including when the refusal happens while speck run is stopped. The recovery gap is fixed and covered by a passing regression test. No blocking concerns remain."
  }
}
```

</details>
