---
id: "0340"
title: "Show when each Cursor build log entry happened"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T20:26:02.603Z"
approved: "2026-10-20T20:28:11.098Z"

---
# 0340 · Show when each Cursor build log entry happened

**Status:** 👍 approved

## Problem
A Cursor build's log in the panel has no times on its lines, while a Claude Code build's lines each start with `HH:MM:SS` (0080). The log reader only reads an ISO `timestamp` string, and Cursor's stream-json events carry `timestamp_ms`, a number of milliseconds since 1970, instead. Its shell-command lines get no time either way. Someone following a Cursor build can't tell when anything happened or whether it's stuck.

## Outcome
Lines in a Cursor build's log show when they happened, as Claude Code builds' lines do.

## Acceptance criteria
1. In the build log of an open queue row, each line that starts an entry from a Cursor event with a `timestamp_ms` number (an agent message, or a shell command starting) begins with that time as `HH:MM:SS`, 24-hour, in the local time of the machine the panel runs on, then a space, as 0080 does for Claude Code events.
2. A Cursor event with no `timestamp_ms`, or one that isn't a usable number, shows its line without a time, and the rest of the log shows as before.
3. No time is added to the other lines of a multi-line agent message, to blank lines, to a failed shell command's `✗` line, or to the build's final result and `Build ended: …`, as for Claude Code.
4. Claude Code and Codex build logs show exactly as before.
5. No test that passed before this change fails.

## Out of scope
- Times on Codex build log lines, whose events carry no time (0342).
- Lines for Cursor's reads, edits and searches, which aren't shown at all yet (0341).
- The failure message under a queue row and `speck run`'s output in the terminal, as in 0080.

## Notes
- Builds on 0080. The reader is `readable` in `scripts/build-log.mjs`: `clock` takes only an ISO `timestamp` string, and the Cursor shell branch (`tool_call` with `shellToolCall`) adds no time.
- Checked 2026-10-20: a real Cursor stream (`agent -p --force --trust --output-format stream-json --model auto`, the CLI on this machine) gave `timestamp_ms` numbers such as `1792511607818` on its `thinking`, `assistant` and `tool_call` events, and none on `system`, `user`, the last `assistant` event or `result`. Read through `readablePiece` with `times: true`, its lines came out as `I'll run \`ls\`, then reply with done.` and `→ Shell: ls` with no time, while a Claude Code event with `timestamp` gave `13:00:05 Reading the ticket.`.
- Test it by calling `readablePiece` directly with Cursor-shaped events.
- Failing before this build: none
- Self-check: a number is read as a time only from `timestamp_ms`, never from `timestamp`, so a Claude Code event whose `timestamp` is a number still shows no time (0080's AC3 test caught the first version).
- Pictures: none, because the change is only a time at the start of some log lines' text, with no change to the panel's layout or styles; the tests check the exact lines the panel shows.

## In plain words
When Cursor builds a ticket, its build log in the panel now shows the time each message and each command started, the same way Claude Code builds already did. To see it, open a running Cursor build's row in the queue: its lines start with a time such as 17:26:45. Lines where Cursor gives no time, such as its final summary, still show without one, and Claude Code and Codex logs look the same as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 91,814
- Elapsed since build started: 2 min
- Changed lines: 13 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "a73f92febd9679102a2c2c40bdff0f9ea839e999",
    "thread_id": "01a15aff-9c22-7c41-8e8d-705901f19905",
    "seconds": 21,
    "usage": {
      "input_tokens": 91132,
      "cached_input_tokens": 52608,
      "cache_write_input_tokens": 0,
      "output_tokens": 682,
      "reasoning_output_tokens": 20
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T20:28:03.879Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/build-log.mjs readable() formats numeric timestamp_ms values using local Date getters and prefixes agent messages and starting shell commands. The passing 0340 AC1 test checks exact HH:MM:SS output, including a half-hour timezone and midnight rollover."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "clock() rejects non-numbers, non-finite values and invalid dates. The passing 0340 AC2 test covers missing values, wrong types and out-of-range numbers while checking subsequent valid entries."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "readable() prefixes only the initial message text and shell-start line. Passing 0340 AC3 tests verify multiline text, blank lines, both shell-failure forms, final results, Build ended output and repeated-result suppression."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing 0340 AC4 test checks Claude Code and Codex output. Existing 0080, 0291 and build-log tests also passed; ISO timestamp handling and Codex output branches remain unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded targeted run reports 140 passes, zero failures and three skips across 143 tests. No existing tests were changed. The whole-suite check remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Cursor messages and starting shell commands now show their local time. Missing or invalid times remain hidden, and continuation lines, results and other build formats retain their previous behaviour. The tests exercise the change directly and all reported checks passed. No blocking concerns found."
  }
}
```

</details>
