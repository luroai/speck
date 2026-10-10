---
id: "0091"
title: "Say plainly on Windows that speck doesn't support it yet"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:57:08.603Z"
finished: "2026-10-10T15:08:06.292Z"

---
# 0091 · Say plainly on Windows that speck doesn't support it yet

**Status:** ✅ done

## Problem
speck supports only macOS and Linux for now, and parts of it, such as pausing and stopping builds, rely on them. On Windows, `speck init` and `speck doctor` say nothing about this, so someone there finds out only when something fails.

## Outcome
On Windows, `speck doctor` and `speck init` say plainly that speck doesn't support it yet and suggest WSL.

## Acceptance criteria
1. On Windows, `speck doctor` shows a ✗ item saying speck supports macOS and Linux for now, with the fix: use WSL (Windows Subsystem for Linux) and run speck there.
2. On macOS and Linux, no such item appears, and every other check is unchanged.
3. `speck init` on Windows shows the same item in its checks, so it ends by asking you to fix the ✗ items.

## Out of scope
- Making any speck command work on Windows.

## Notes
- Tests can't run on Windows here, so the check should take the platform as an input that tests can set.
- `doctorChecks`, `cmdDoctor` and `cmdInit` take the platform as an optional last argument (default `process.platform`); test/windows-0091.test.mjs sets it.
- Three tests in luro-0082 and private-words-0084 fail on main too, before this change: they read speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md, which was moved to speck/ideas/done/ when it was ticketed. Not touched here.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 965,223
- Elapsed since build started: 69 min
- Changed lines: 19 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: three tests read an idea note that has since been filed in speck/ideas/done/, so they fail on main (speck/ideas/2026-10-10-fix-tests-that-read-a-filed-idea-note.md).

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
    "reviewed_sha": "e60501a827c6ef636896f215d15b2a0c75b5e850",
    "thread_id": "01a1261d-0f04-7c22-abe5-11a702c4f3f3",
    "seconds": 35,
    "usage": {
      "input_tokens": 336490,
      "cached_input_tokens": 247680,
      "cache_write_input_tokens": 0,
      "output_tokens": 771,
      "reasoning_output_tokens": 31
    },
    "saved_at": "2026-10-10T14:00:34.925Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/install.mjs: doctorChecks adds a required failing Windows item with the support statement and WSL fix; cmdDoctor prints it. Both AC1 tests exercise this behaviour and pass in the supplied output. Independent read-only checks also passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/windows-0091.test.mjs AC2 compares Linux and macOS checks with the Windows list minus its new item. Independent platform comparisons passed, and the diff confirms all existing checks remain unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/install.mjs: cmdInit passes the platform to doctorChecks and uses its failed result for the final fix-items message. The AC3 test runs the actual installation and checks its output without mocking the implementation; it passes in the supplied output."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Windows users now receive a clear unsupported-platform warning and instructions to run speck in WSL. macOS and Linux checks remain unchanged. The tests exercise the requested behaviour. The three reported suite failures come from an existing stale file path on main. No blocking concerns found; installation tests were inspected rather than rerun because this review is read-only."
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
    "reviewed_sha": "445ccbb12b7363d2d3a8b85323ffc59a7d4aff38",
    "thread_id": "01a1261d-0f04-7c22-abe5-11a702c4f3f3",
    "seconds": 19,
    "usage": {
      "input_tokens": 626763,
      "cached_input_tokens": 392064,
      "cache_write_input_tokens": 0,
      "output_tokens": 1199,
      "reasoning_output_tokens": 31
    },
    "saved_at": "2026-10-10T15:06:27.672Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/install.mjs: doctorChecks adds the required Windows ✗ item and WSL fix; cmdDoctor prints it and fails. Both AC1 tests in test/windows-0091.test.mjs pass in the supplied post-merge output. Implementation and tests are unchanged from round 1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doctorChecks adds the item only for win32; existing checks remain unchanged against merged main. The AC2 platform comparison test exercises Linux and macOS and passes; the Linux init test also passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/install.mjs: cmdInit passes platform into doctorChecks and uses its result to print the final fix-items instruction. The AC3 test exercises the actual init implementation and passes in the supplied post-merge output."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves the Windows warning and WSL instructions, with macOS and Linux behaviour unchanged. Main’s licence changes and test-path fix are preserved exactly. The supplied full test run reports 695 passes, no failures and three existing skips. No blocking concerns."
  }
}
```

</details>
