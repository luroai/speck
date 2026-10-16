---
id: "0220"
title: "Show only the refusing speck run's words when Turn on fails"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-keep-another-speck-run-s-lines-out-of-a-turn-on-refusal.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0219"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T03:01:39.573Z"
approved: "2026-10-16T03:09:11.356Z"
finished: "2026-10-16T03:10:44.158Z"

---
# 0220 · Show only the refusing speck run's words when Turn on fails

**Status:** ✅ done

## Problem
When the panel turns speck run on and speck run refuses to start, the panel shows everything written to the shared `run.log` since the click. If another speck run writes a line in that moment (for example "Launched 0012"), that line shows up in the refusal, which mixes another run's news with the reason this one didn't start.

## Outcome
A refusal to turn speck run on shows only what the refusing speck run said.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a speck run started from the panel refuses to start, the refusal shown in the panel contains only what that speck run printed, even when another speck run writes to `run.log` in the same moment.
2. The refusal's own wording is as today (for example "speck run is already running …").
3. Turning speck run on when it can start works as today, and the started speck run still writes its lines to `run.log`.
4. No test that passed before this change fails.

## Out of scope
- The first-line mix-up after a successful Turn on, which 0207 fixed.

## Notes
- `panelRunOn()` in `scripts/panel.mjs` reads `run.log` from where it ended at the click.
- speck run must keep running after the panel exits, so its output can't simply be piped to the panel: the pipe would break when the panel exits.
- Failing before this build: none
- Self-check: no changes

## In plain words
When you turn auto-build on from the panel and it can't start, the message you see now holds only the reason that attempt gave, such as "speck run is already running …". Lines another speck run writes at the same moment no longer creep into it. To see it, turn auto-build on while another speck run is already running in a terminal: the panel shows just the "already running" message. Turning it on when it can start works as before, and its output still goes to the same log. Worth knowing: if speck run ever crashes outright rather than refusing, the panel says it stopped, with its exit code and where to find its output, rather than showing the crash itself.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 339,311
- Elapsed since build started: 8 min
- Changed lines: 31 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limits (no inbox note): a speck run that crashes rather than refusing shows only its exit code and where its output is; and if the panel itself stops before a refusing speck run exits, that run's refusal file is left in speck/.cache/runs/, which git ignores.

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
    "reviewed_sha": "701047297800b80f5c2499fb5a9030567f42b22c",
    "thread_id": "01a142ac-022b-77c0-a2a5-5808aabe6c50",
    "seconds": 25,
    "usage": {
      "input_tokens": 126046,
      "cached_input_tokens": 88320,
      "cache_write_input_tokens": 0,
      "output_tokens": 664,
      "reasoning_output_tokens": 28
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T03:05:55.860Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelRunOn() reads the child-specific refusal file instead of shared run.log. Both 0220 refusal tests passed with unrelated output appended during startup; existing 0128 tests cover displaying the returned message."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdRun() preserves SpeckError.message. The passing 0220 AC1 AC2 test asserts the complete existing lock-refusal wording."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0220 AC3 passed, checking successful startup, watching and launch output in run.log, and removal of the refusal environment variable from builds. Existing 0128 process-survival tests also passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified the full supplied test log: all 33 tests passed across the four reported files. The ticket's committed changes are limited to refusal handling and its tests; whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now shows only the refusing run’s own message, preserving its wording and excluding other runs’ log lines. Successful startup and continued logging remain covered by passing tests. No blocking concerns found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6475438176f7979e52cdc644abb733f9fe8e0c59",
    "merge": true,
    "thread_id": "01a142ac-022b-77c0-a2a5-5808aabe6c50",
    "seconds": 14,
    "usage": {
      "input_tokens": 211543,
      "cached_input_tokens": 166912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1058,
      "reasoning_output_tokens": 28
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T03:09:08.048Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelRunOn() reads the attempt-specific file through takeRefusal(); both 0220 refusal tests passed with unrelated run.log output written during startup."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdRun() writes the unchanged SpeckError.message. The passing 0220 AC1 AC2 test checks the exact existing refusal wording."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0220 AC3 passed, exercising successful startup, continued run.log output and environment-variable removal before builds. The helper move preserves the startup check and detached output handling."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified the recorded results: 38 passed, 3 skipped, no failures. The previously failing 0078 AC2 now passes; panel.mjs has 600 lines and run.mjs 598. No tests were weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still isolates each refusal and preserves its wording, successful startup and logging. Moving the helpers fixes the file-size regression without changing behaviour. No blocking concerns remain."
  }
}
```

</details>
