---
id: "0523"
title: "Count every build of a ticket in its builder spend"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T11:10:32.309Z"
approved: "2026-10-27T11:13:51.908Z"

---
# 0523 · Count every build of a ticket in its builder spend

**Status:** 👍 approved

## Problem
A ticket that `speck run` builds more than once, such as one set ready again after a build that stopped, shows only its latest build's spend: each new build's run record and log replace the last one's. Seven tickets in this repo have lost an earlier build's spend this way, so their builder cost is too low.

## Outcome
A ticket's builder tokens and cost cover every build `speck run` started for it.

## Acceptance criteria
1. When `speck run` starts a new build for a ticket whose earlier build recorded builder spend, and the new build ends with spend of its own, `speck status --json` gives that ticket's `builder_tokens` and `builder_cost_usd` as the sum of the two builds' figures. A third build adds its figures the same way.
2. A build that `speck run` resumed in the same session counts once, at its session's total, as today: it isn't added to the spend of the part before it stopped.
3. When some of a ticket's builds have a known cost and others don't (a Codex or Cursor build, or one whose log has no result line), `builder_cost_usd` is the sum of the known costs and `builder_tokens` the sum of the builds that report tokens. When no build has a known cost, `builder_cost_usd` is null, as today.
4. A ticket built once shows the same `builder_tokens` and `builder_cost_usd` as before this change, and a run record written before this change still reads as it does today.
5. No test that passed before this change fails.

## Out of scope
- Recovering earlier builds' spend that was already overwritten before this change: 0528.
- Pricing Codex and Cursor builds, whose logs report no cost: 0530.
- Builds started by hand with `/speck-build`, which have no run record.

## Notes
- The overwrite: `launch` in `scripts/run.mjs` starts each new build with `startBuild(..., 'w', ...)`, which rewrites `<id>.json` and `<id>.log`; `recordExit` then saves only that log's spend. `builderSpent` in `scripts/spend.mjs` reads `rec.builder`.
- A resumed build appends to its log (`'a'`), and its last result line already covers the whole session (`builderSpend`'s comment), so resumes are already right.
- Keep each build's figures with the time it ended, so 0527 can count them by week or month.
- 0525, 0528 and 0530 add to the same per-ticket spend, so keep the earlier builds' figures somewhere they can add to as well.
- Checked 2026-10-27: 477 run records in `speck/.cache/runs/`; 7 ticket ids have more than one `claude -p "/speck-build <id>"` session in this project's Claude Code transcripts (counted from `~/.claude/projects/<project folder>/*.jsonl`).
- Failing before this build: none
- Self-check: an earlier build whose exit wasn't recorded is counted from its log, but only when that log isn't older than its record, so an old log left when a new build couldn't open its own isn't counted twice.

## In plain words
When `speck run` builds a ticket more than once, for example after you set it ready again because a build stopped, the builder's tokens and cost for that ticket now add up every build instead of showing only the last one. A ticket built once shows the same figures as before. To see it, look at a ticket that was built twice after this change: its builder cost in Shipped is the two builds together. Builds that happened before this change and were already overwritten stay lost. Codex and Cursor builds still add their tokens but no cost, since their logs don't give one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 143,432
- Elapsed since build started: 3 min
- Changed lines: 51 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. Each earlier build is kept in the run record's `earlier_builds` with the time it ended, ready for 0525, 0527, 0528 and 0530 to read or add to.

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
    "reviewed_sha": "e5c9590b055880309a153bb8bb561a743d7e09dd",
    "session": "fresh",
    "thread_id": "01a17d10-8c0d-7ff2-bdfd-bf3d52ee1257",
    "builder_response": "- Tests run: `speck test --related test/spend-0523.test.mjs` (the ticket's own file, plus every test file naming scripts/core.mjs or scripts/run.mjs, and the repo checks). 569 passed, 0 failed, 3 skipped.\n- Design: when `speck run` launches a new build (`launch` in scripts/run.mjs, the only `'w'` start), it reads the old run record with `earlierBuilds` and keeps `earlier_builds: [{ended, tokens, cost_usd}, …]` in the new record: the old record's own earlier_builds plus the build it records (its `builder`, or its log's spend when its exit was never saved). Resumes, hand-backs and recordExit all spread the record, so the list survives them. `builderSpent` sums the latest `builder` with `earlier_builds`, per field over the builds that report it, null when none does.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 142770,
      "cached_input_tokens": 99072,
      "cache_write_input_tokens": 0,
      "output_tokens": 662,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T11:13:44.398Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs launch preserves earlierBuilds before replacing the record and log; scripts/spend.mjs builderSpent sums retained builds. Passing 0523 AC1 tests cover a real launch, status --json and third-build accumulation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "resumeKilled and handBackQueue append logs and preserve the record without calling earlierBuilds. Passing 0523 AC2 checks counting the session total once; existing 0120 tests exercise parsing the final session-wide result."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "builderSpent sums each field independently and returns null when none is known. Passing 0523 AC3 covers mixed known and unknown costs, missing tokens and missing result data."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0523 AC4 tests verify unchanged single-build and legacy-record figures, including missing or invalid spend."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified saved test output: 569 passed, 0 failed, 3 skipped. Existing tests were not modified; the change is confined to preserving and summing builder spend."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change preserves earlier builds’ spend and includes it in the ticket’s totals. Resumed sessions still count once, and unknown costs remain unknown. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>
