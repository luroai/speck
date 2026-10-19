---
id: "0325"
title: "Leave dropped ideas out of speck status's idea count"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:08:30.962Z"
approved: "2026-10-19T07:16:45.056Z"
finished: "2026-10-19T07:24:38.414Z"

---
# 0325 · Leave dropped ideas out of speck status's idea count

**Status:** ✅ done

## Problem
`speck status` counts every idea that isn't ticketed as waiting, including ones triage has dropped, so its `IDEAS (…)` line overstates what's left to shape. Triage on 2026-10-19 dropped 18 notes in one go.

## Outcome
`speck status`'s idea count leaves dropped notes out of what's waiting, and shows inbox notes apart.

## Acceptance criteria
1. The `IDEAS` line in `speck status` counts ideas waiting (status `idea`), inbox notes (`inbox`) and ticketed ones separately, and leaves dropped ones out of all of them.
2. `speck status --json` gives the same counts.
3. Notes with no `Status:` line count as waiting, as today.
4. The counts match what the panel's Ideas and Inbox tabs show.

## Out of scope
- The panel's tabs.

## Notes
- From `speck/ideas/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md`. The line is printed in `scripts/speck.mjs` (search for `IDEAS (`).
- Failing before this build: none
- Self-check: no changes. The counting moved to its own module because `scripts/speck.mjs` was at the 600-line limit; the `speck-status` skill now says the line prints three counts.

## In plain words
The ideas line at the bottom of speck status no longer counts ideas that triage has dropped, so it only shows what's really left. It now gives three numbers: ideas waiting to be shaped, notes in the inbox and ideas already ticketed, and its total adds those up. The first two always match the counts on the panel's Ideas and Inbox tabs. To see it, run speck status and compare the line with the panel. The same three numbers are also in speck status's machine-readable output, for anything that reads it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 412,760
- Elapsed since build started: 8 min
- Changed lines: 29 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "c1dfc050c13cdcc910999210861078849ee04752",
    "thread_id": "01a15300-d732-7e13-bee0-b9b58d5ec0ce",
    "seconds": 28,
    "usage": {
      "input_tokens": 161157,
      "cached_input_tokens": 123136,
      "cache_write_input_tokens": 0,
      "output_tokens": 675,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T07:12:33.873Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/idea-counts.mjs: ideaCounts separates waiting, inbox and ticketed counts and excludes dropped notes in both folders. cmdStatus prints these counts. The passing 0325 AC1 test exercises mixed statuses and an all-dropped case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs: statusData exposes idea_counts using the same ideaCounts function as text output. The passing 0325 AC2 test checks JSON counts and a missing ideas folder."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ideaCounts treats a missing status as waiting. The passing 0325 AC3 test verifies this in text and JSON output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html filters Ideas and Inbox consistently with ideaCounts. The passing 0325 AC4 test compares counts with the actual panel model, including missing, blank and unrecognised statuses."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The status command now separates waiting ideas, inbox notes and ticketed ideas, excluding dropped notes. Text and JSON counts agree with the panel. The reported test run passed with no failures, and I found no blocking issues."
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
    "reviewed_sha": "c668008800234b62ec77736c3c1761081b95f307",
    "merge": true,
    "thread_id": "01a15300-d732-7e13-bee0-b9b58d5ec0ce",
    "seconds": 15,
    "usage": {
      "input_tokens": 249816,
      "cached_input_tokens": 203520,
      "cache_write_input_tokens": 0,
      "output_tokens": 1112,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T07:16:41.444Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/idea-counts.mjs: ideaCounts separates waiting, inbox and ticketed notes and excludes dropped notes from both folders. cmdStatus prints these counts. The 0325 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs: statusData supplies idea_counts using the same function as text output. The 0325 AC2 test passed, checking mixed counts and a missing ideas folder."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ideaCounts classifies notes without a status as waiting. The 0325 AC3 test passed for both text and JSON output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: the Ideas and Inbox filters match ideaCounts. The 0325 AC4 test passed by comparing counts against the actual panel model, including missing, blank and unrecognised statuses."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change still meets all four criteria after the merge. The two older tests now expect the added inbox count while retaining their original count checks. All 174 tests in the supplied run passed or were skipped; no blocking issues found."
  }
}
```

</details>
