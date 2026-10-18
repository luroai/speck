---
id: "0310"
title: "Find Cursor in speck detect by either name"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:32:31.875Z"
approved: "2026-10-18T22:34:57.135Z"

---
# 0310 · Find Cursor in speck detect by either name

**Status:** 👍 approved

## Problem
Cursor's CLI is now called `agent` (it was `cursor-agent`). `speck agents` finds it by either name (0288), but `speck detect`, which setup reads, still looks only for `cursor-agent`, so setup can say Cursor isn't installed when it is.

## Outcome
`speck detect` finds Cursor's CLI by either name, as `speck agents` does.

## Acceptance criteria
1. With only `agent` on the PATH, `speck detect` reports Cursor's CLI as installed.
2. With only `cursor-agent` on the PATH, it reports it installed, as today.
3. With neither, it reports it missing.
4. `speck detect` and `speck agents` agree on whether Cursor is installed.

## Out of scope
- Other agents.

## Notes
- From `speck/ideas/2026-10-18-speck-detect-finds-cursor-as-agent.md` (inbox, from 0288). `speck detect` looks for `cursor-agent` in `scripts/detect.mjs`.
- Failing before this build: none
- Self-check: the brief's `speck detect` row named only `cursor-agent`, so it now says Cursor's CLI is found as `agent` or `cursor-agent`, still reported under the `cursor-agent` key setup reads; a test checks it. `speck agents` now uses the same shared list of names (`CURSOR_CLIS`), so the two can't drift apart.

## In plain words
When you set speck up, it now notices Cursor's command-line tool whether it's installed under its new name (`agent`) or its old one (`cursor-agent`). Before, setup could say Cursor wasn't installed when you had the new version. To see it, install a current Cursor CLI and run speck's setup: Cursor shows as found. One thing to watch: `agent` is a plain name, so another tool with that name would also count as Cursor here, as it already did in the agents list.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The documentation test requires the exact phrase ‘`agent` or `cursor-agent`’.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 341,178
- Elapsed since build started: 2 min
- Changed lines: 13 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: both `speck detect` and `speck agents` count any executable named `agent` on the PATH as Cursor's CLI, without running it to check.

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
    "reviewed_sha": "0b95ef9c4b93e888d519c0ee8fd3658b3b929f81",
    "thread_id": "01a15126-8418-7a71-a0fa-41cb985731b1",
    "seconds": 19,
    "usage": {
      "input_tokens": 129215,
      "cached_input_tokens": 89856,
      "cache_write_input_tokens": 0,
      "output_tokens": 695,
      "reasoning_output_tokens": 66
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:34:19.502Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs agentFacts() checks CURSOR_CLIS.some(onPath). Passing test ‘0310 AC1: with only `agent` on the PATH’ exercises real PATH detection."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 test exercises detectFacts() with only an executable named cursor-agent on PATH."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 test checks an empty PATH directory and one containing only similarly named cursor and agents executables."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "detect.agentFacts() and agents.cursor() use the shared CURSOR_CLIS list. Passing AC4 test compares their results with either name, both names and neither present."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/detect-0310.test.mjs:54",
        "issue": "The documentation test requires the exact phrase ‘`agent` or `cursor-agent`’. Correct edits such as reversing the names or saying ‘either `agent` or the older `cursor-agent`’ would fail. This checks wording as well as command facts, contrary to the review rules.",
        "suggested_fix": "Check that the speck detect row contains each command name independently, without requiring their order or connecting prose, or remove this documentation assertion.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Cursor detection correctly recognises either CLI name and agrees with speck agents. All four acceptance criteria are covered by passing tests. Before approval, loosen one documentation test so harmless wording changes cannot break the suite."
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
    "reviewed_sha": "b702c42bc042276be5b7bc00e3397e552703d87a",
    "thread_id": "01a15126-8418-7a71-a0fa-41cb985731b1",
    "seconds": 10,
    "usage": {
      "input_tokens": 210147,
      "cached_input_tokens": 168064,
      "cache_write_input_tokens": 0,
      "output_tokens": 1121,
      "reasoning_output_tokens": 66
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:34:43.280Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs agentFacts() checks CURSOR_CLIS.some(onPath). The passing AC1 test exercises detectFacts() with only agent on PATH."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 test exercises detectFacts() with only cursor-agent on PATH; CURSOR_CLIS includes this legacy name."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test verifies missing status with an empty PATH directory and with only similarly named cursor and agents executables."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "detect.agentFacts() and agents.cursor() use the same CURSOR_CLIS list. The passing AC4 test compares installation results with either name, both names and neither present."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/detect-0310.test.mjs:54",
        "issue": "The documentation test previously required exact connecting wording and command order.",
        "suggested_fix": "Check the two command names independently, without requiring surrounding wording or order.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Cursor detection now recognises either CLI name and agrees with speck agents. All four acceptance criteria have passing tests. The documentation test now checks command names independently, resolving the previous concern. Approved."
  }
}
```

</details>
