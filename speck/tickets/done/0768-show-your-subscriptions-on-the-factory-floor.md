---
id: "0768"
title: "Show your subscriptions on the factory floor"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-26T21:18:17.093Z"
finished: "2026-11-26T21:21:31.200Z"

---
# 0768 · Show your subscriptions on the factory floor

**Status:** ✅ done

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
The factory floor now has a Subscriptions row between the line and the stations. Each agent speck has a usage reading for (Claude Code, Codex, Cursor) gets a panel with how much of its tightest limit is used, as a big number and a bar of 20 blocks in that agent's colour, when that limit resets, and how many stations across all your projects are running on it right now. At 90% or more, or once it's been cut off, the number and bar turn orange and the panel says "Nearly used up" or "Limited". An agent speck has no reading for isn't shown.

To see it, open the factory floor at speck serve's address. The readings are the ones speck saves when a build or review ends, so a reading can be a little behind; one whose reset time has passed is ignored until the next run reads it again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 floorUsage() hides an explicitly limited Codex reading when its window percentages are unknown.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 2 of them merge rounds
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 497,146
- Elapsed since build started: 46 min
- Changed lines: 124 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tidy-up: `speck test --related` brings in about 486 files for any change to `templates/floor.html`, because `test/support/panel.mjs` names it; the floor's helper could be kept apart so a floor change brings in only the floor's tests.
- Skipped (duplicate): `test/panel-0476.test.mjs`'s touch tests fail under a loaded run and pass alone; already named by 0542 (`speck/tickets/done/0542-steady-two-browser-tests-under-a-busy-run.md`) and the full-suite fix tickets 0699, 0734, 0738 and 0754.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f8de37774408df056615e1c3413019c466e405d1",
    "session": "continued",
    "thread_id": "01a219a8-2a47-77f0-a2e1-1987216908c9",
    "builder_response": "- Tests run: test/floor-subs-0768.test.mjs test/floor-0765.test.mjs\n- F1: fixed. floorUsage() (scripts/subscriptions.mjs) now works out the unnamed-limit fallback first and keeps an open window with no share used when it applies; such a window ranks below any with a share, and is shown at 100% and limited. New tests: your reproduction gives ['5 hours', 100, high, limited], and the page draws a limited 100% subscription orange with \"Limited\".\n- F2: fixed. resetsWhen() (templates/floor.js) checks the whole calendar date, as capturedOn does; the AC1 test now covers 2027-02-31 as well as day 45.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 256622,
      "cached_input_tokens": 203904,
      "cache_write_input_tokens": 0,
      "output_tokens": 1775,
      "reasoning_output_tokens": 127
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6354,
      "cached": 95872,
      "write": 0,
      "output": 658
    },
    "cost_usd": 0.0288752,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T21:01:35.207Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "floorUsage() selects the tightest open window; subOf() renders its name, percentage, segmented gauge and reset. Passing AC1 tests cover API delivery, agent colours and reset dates, including impossible calendar dates."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "feeding() counts matching agents across projects' summary lines. The passing AC2 test covers multiple projects, Claude subagents and zero stations."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests cover high usage, limited readings, orange styling and absent readings. The new regression covers an unnamed limit with an unknown percentage; independently calling floorUsage() confirms it remains visible and limited."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported test run has 171 passes, zero failures and three skips. The changes preserve existing tests and add regression coverage for both findings."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "An explicitly limited reading with an unknown percentage previously disappeared.",
        "suggested_fix": "Implemented: apply the unnamed-limit fallback before filtering unknown percentages, with regression coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/floor.js",
        "issue": "Impossible calendar dates previously appeared as valid reset dates.",
        "suggested_fix": "Implemented: validate the complete calendar date, with coverage for 2027-02-31.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The floor shows subscription usage, reset times and station counts, with orange warnings for high usage or limits. Both previous findings are fixed and covered by passing tests. No blocking concerns remain."
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
    "reviewed_sha": "023e510651d9ed2d24887863ebf015c144bad378",
    "merge": true,
    "session": "continued",
    "thread_id": "01a219a8-2a47-77f0-a2e1-1987216908c9",
    "builder_response": "Merge of main (0767, Virgil's dial on the factory floor) into the approved 0768.\n- templates/floor.html (logic): kept main's `floor-top` block (the line with the Engineering manager dial beside it) as it is, and put 0768's Subscriptions section straight after it, so it's still under the line and above the stations.\n- templates/floor.js (added-lines, 3 hunks): kept both sides. The header comment has 0767's paragraph then 0768's; draw() calls drawLine, drawDial, drawSubs, drawStations, drawBoard; the 0768 subscriptions block and the 0767 dial block both stay whole, 0768's closed with its `}` before 0767's begins. No other change.\n- Tests run: test/floor-subs-0768.test.mjs test/floor-dial-0767.test.mjs test/floor-line-0766.test.mjs test/floor-0765.test.mjs test/floor-line-browser-0766.test.mjs test/floor-browser-0765.test.mjs (196 tests, 0 failed).\n- Pictures retaken with the merged layout.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 370793,
      "cached_input_tokens": 312704,
      "cache_write_input_tokens": 0,
      "output_tokens": 2420,
      "reasoning_output_tokens": 127
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5371,
      "cached": 108800,
      "write": 0,
      "output": 645
    },
    "cost_usd": 0.028072,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T21:10:23.085Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "floorUsage() and subOf() retain tightest-window selection and subscription rendering. floor.html places subscriptions below the line and dial, above stations. All five AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "feeding() retains aggregation across projects' summary lines. The AC2 test covering multiple projects, Claude subagents and zero stations passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The limit fallback and orange warning styles remain intact. All four AC3 tests pass, including unknown usage percentages and absent readings."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported merged test run has 193 passes, zero failures and three skips, covering subscriptions, dial, line and floor behaviour. Independent JavaScript syntax validation also passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "An explicitly limited reading with an unknown percentage previously disappeared.",
        "suggested_fix": "Fixed: the unnamed-limit fallback precedes filtering, with passing regression coverage. Preserved through the merge.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/floor.js",
        "issue": "Impossible calendar dates previously appeared as valid reset dates.",
        "suggested_fix": "Fixed: complete calendar-date validation and regression coverage remain intact after the merge.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves subscription usage panels alongside Virgil’s dial. Both earlier fixes remain intact, and the combined tests pass. No blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "3b0786dea40558b67f666b392e9e8578ba9e3397",
    "merge": true,
    "session": "continued",
    "thread_id": "01a219a8-2a47-77f0-a2e1-1987216908c9",
    "builder_response": "Merge of main (0769, open a ticket from the factory floor) into the approved 0768.\n- templates/floor.js (added-lines, 1 hunk): both sides added a block after shipCell(): 0768's subscriptions block (feeding, resetsWhen, drawSubs, subOf) and 0769's opener(). Kept both whole, 0768's closed with its `}` and then 0769's opener, followed by the shared closing brace. No other change. floor.html and floor.css merged cleanly; Subscriptions is still under the line and dial and above the stations.\n- Tests run: test/floor-subs-0768.test.mjs test/floor-open-0769.test.mjs test/floor-dial-0767.test.mjs test/floor-line-0766.test.mjs test/floor-0765.test.mjs test/floor-line-browser-0766.test.mjs test/floor-browser-0765.test.mjs (207 tests, 0 failed).\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 494129,
      "cached_input_tokens": 430208,
      "cache_write_input_tokens": 0,
      "output_tokens": 3017,
      "reasoning_output_tokens": 127
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5832,
      "cached": 117504,
      "write": 0,
      "output": 597
    },
    "cost_usd": 0.0293844,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T21:18:14.209Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "floorUsage(), drawSubs() and subOf() remain intact after the merge. floor.html retains subscriptions below the line and dial. All five AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "feeding() still aggregates matching agents across projects' summary lines. The AC2 test covering multiple projects, Claude subagents and zero stations passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Limit handling, orange styling and absent-reading filtering remain intact. All four AC3 tests pass, including the unknown-percentage limit regression."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported combined run has 204 passes, zero failures and three skips, including subscription and ticket-opening tests. Independent JavaScript syntax validation passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "An explicitly limited reading with an unknown percentage previously disappeared.",
        "suggested_fix": "Fixed: the unnamed-limit fallback and its passing regression coverage remain intact.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/floor.js",
        "issue": "Impossible calendar dates previously appeared as valid reset dates.",
        "suggested_fix": "Fixed: complete calendar-date validation and its passing regression coverage remain intact.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves both subscription panels and ticket opening. Earlier fixes remain intact, and the combined tests pass. No blocking concerns remain."
  }
}
```

</details>
