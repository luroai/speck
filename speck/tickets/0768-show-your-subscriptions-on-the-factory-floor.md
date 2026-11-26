---
id: "0768"
title: "Show your subscriptions on the factory floor"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0764","0765","0766"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0766"
started: "2026-11-26T20:32:28.875Z"

---
# 0768 · Show your subscriptions on the factory floor

**Status:** 🔍 reviewing

## Problem
Usage limits decide where work can go, and Settings is the only place that shows them. On the factory floor, the user wants to see each subscription's use next to the work drawing on it.

## Outcome
Under the line, the factory floor shows each of your subscriptions' use, when it resets and how many stations it's feeding now.

## Acceptance criteria
1. For each agent with a usage reading, the floor shows its name, the share used of its tightest window as a number and a segmented gauge in its agent colour, and when that window resets.
2. Each says how many stations across all projects are running on it now, from the projects' summaries.
3. At 90% or more, or limited, its gauge and number turn orange and it says so; an agent with no reading shows none.
4. No test that passed before this change fails.

## Out of scope
- Moving work between agents.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Readings come from `GET /api/usage` (`scripts/subscriptions.mjs`), as Settings and the bridge's warning (0720) use them.
- Failing before this build: not checked
- Self-check: a Codex limit whose type names no window now shows as limited, as the bridge warns about it; a reset day that isn't a real day says the reset isn't known.

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
    "reviewed_sha": "1bb858c635ec1909c91d031f6c0fbd7972e4f774",
    "session": "fresh",
    "thread_id": "01a219a8-2a47-77f0-a2e1-1987216908c9",
    "builder_response": "- Tests run: test/floor-subs-0768.test.mjs test/floor-0765.test.mjs test/foreman-cursor-0333.test.mjs test/panel-0055.test.mjs test/panel-0481.test.mjs, then test/panel-0476.test.mjs on its own. `speck test --related` (486 files) brought in the others; its only failure from this change was 0765 AC2's empty-list answer, kept as it was (no `usage` with no projects). 0333, 0055, 0481 and 0476 failed in that loaded run and pass here; 0476's timing-based touch tests fail again when run beside the other browser tests and pass alone. This branch changes no panel files.\n- How \"stations it's feeding\" is counted: the tickets at the Builder, Reviewer and QA stations of every project's line (0764's summary) whose agent is that subscription's, a Claude subagent counting as Claude Code.\n- \"An agent with no reading shows none\": an agent with no reading, or with every window past its reset, isn't on the floor at all; with none, the section says no readings yet.\n- Pictures: two of the floor (dark only) in the review pack.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 154396,
      "cached_input_tokens": 108032,
      "cache_write_input_tokens": 0,
      "output_tokens": 1117,
      "reasoning_output_tokens": 127
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46364,
      "cached": 108032,
      "write": 0,
      "output": 1117
    },
    "cost_usd": 0.1147012,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T21:00:12.382Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing 0768 AC1 tests exercise tightest-window selection, API delivery and rendering of names, percentages, segmented gauges and reset times."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/floor.js feeding() aggregates agents from each project's summary line. The passing AC2 test covers multiple projects and Claude subagents."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "floorUsage() discards windows with unknown percentages before applying the unnamed Codex limit fallback. An explicit limit can therefore disappear entirely; the existing unnamed-limit test only covers numeric percentages."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied targeted test run reports 151 passed, zero failed and three skipped. No existing tests were weakened in the supplied change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "floorUsage() hides an explicitly limited Codex reading when its window percentages are unknown. Reproduced with a valid read_at, limit_reached:true, limit_type:'unknown' and windows.five_hour.used_percent:null: the result is []. The open-window filter returns before the fallback can mark it limited, so the floor gives no warning precisely when the subscription is unavailable.",
        "suggested_fix": "Apply the unnamed-limit fallback before excluding windows with unknown percentages, and add a regression test verifying that this reading produces a visible orange Limited subscription.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/floor.js",
        "issue": "resetsWhen() checks only that a reset day is between 1 and 31, so impossible dates such as 2027-02-31 display as real reset dates. The builder's self-check claims invalid calendar days are handled, but the test checks only day 45.",
        "suggested_fix": "Validate the complete calendar date and cover an impossible day within the 1–31 range.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The floor shows subscription usage and station counts, and the reported tests pass. One limit-handling gap needs fixing: a subscription explicitly reported as limited can disappear when its usage percentage is unknown."
  }
}
```

</details>
