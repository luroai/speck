---
id: "0080"
title: "Show when each build log entry happened"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:12:28.941Z"

---
# 0080 · Show when each build log entry happened

**Status:** 👍 approved

## Problem
The panel's build log shows what a build did but not when. Reading it, you can't tell whether a step took seconds or twenty minutes, or how long ago the build last did anything.

## Outcome
Each entry in the panel's build log shows the time it happened.

## Acceptance criteria
1. In the build log of an open queue row, each line that starts an entry from a log event with a timestamp (an agent message, a tool call or a failed tool result) begins with that time as `HH:MM:SS`, 24-hour, in the local time of the machine the panel runs on, then a space.
2. No time is added to the other lines of a multi-line agent message, to blank lines, or to lines from events with no timestamp (the build's final result and `Build ended: …`) or lines that aren't events.
3. An event whose timestamp is missing or can't be read shows its line without a time, and the rest of the log shows as before.
4. Only the build log box changes. The failure message under a queue row and `speck run`'s output in the terminal stay as they are.

## Out of scope
- Dates, elapsed times or durations between entries.
- Timestamps in logs from builders other than Claude Code.

## Notes
- After 0018, which moves the panel's code, including the log endpoint, into its own module.
- Checked 2026-10-10: in Claude Code's `--output-format stream-json` logs (`speck/.cache/runs/0018.log`, `0073.log`), `assistant` and `user` events carry `"timestamp"` as ISO 8601 UTC, for example `2026-10-10T11:56:45.034Z`. `result` and `system` events have none.
- Tests should set `TZ` so the expected local time is fixed.
- Assumption: AC4 keeps the failure message and `speck run`'s output without times. Say if you want times there too.
- Self-check: a timestamp must start like an ISO 8601 date (`YYYY-MM-DDT`) as well as parse, so strings such as `1`, which `Date` reads as a year, show no time; tests cover these and out-of-range dates.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 232,607
- Elapsed since build started: 6 min
- Changed lines: 22 (limit 5000)
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
    "reviewed_sha": "465867c39b0260bfefc1ca2a92305729487518f6",
    "thread_id": "01a125bf-cb34-7f00-ae46-6c5b259bdfcb",
    "seconds": 33,
    "usage": {
      "input_tokens": 231680,
      "cached_input_tokens": 148864,
      "cache_write_input_tokens": 0,
      "output_tokens": 927,
      "reasoning_output_tokens": 25
    },
    "saved_at": "2026-10-10T12:18:41.194Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs readableLog prefixes agent text, tool calls and failed tool results using local Date getters. scripts/panel.mjs panelLog enables times. AC1 unit tests and the real panel endpoint test exercise this, including midnight rollover; independent read-only formatter assertions passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readableLog prefixes each text block only once and leaves result and plain lines unchanged. AC2 tests exercise multiline text, blank lines, plain output, final results, Build ended and duplicate-result suppression."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "readableLog clock checks timestamp type, date prefix and successful parsing, otherwise returning an empty prefix. AC3 tests exercise missing and unreadable values alongside valid surrounding events; independent malformed-timestamp assertions passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Only panelLog opts into times. scripts/speck.mjs buildExit and scripts/run.mjs log-tail reporting retain default formatting. AC4 tests exercise the real state endpoint and speck run output, without mocking the formatter."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s build log now shows local times on entry starts, while continuation lines and other output retain their existing format. All four criteria have meaningful test coverage. Independent formatter checks passed; the supplied full-suite report shows 632 passing tests. No blocking issues or unrelated changes found."
  }
}
```

</details>
