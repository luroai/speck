---
id: "0644"
title: "Record a Codex or Cursor build's usage limit as Claude's is"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0642"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:51:45.219Z"

---
# 0644 · Record a Codex or Cursor build's usage limit as Claude's is

**Status:** 🔍 reviewing

## Problem
speck records a usage limit and carries the build on after the reset only when Claude stops a build (0622). A Codex or Cursor build that stops on its limit is treated as a build that stopped for an unknown reason.

## Outcome
A Codex or Cursor build that stops on its usage limit is waited out and carried on after the reset, as a Claude build is.

## Acceptance criteria
1. A Codex build whose log ends refused for its usage limit (`usage_limit_exceeded`) is recorded as a usage limit for Codex, with the reset time its message or its session file gives, and `speck run` carries it on a minute after the reset, as 0622 does for Claude.
2. A Cursor build whose output ends refused for its usage limit is handled the same way for Cursor, with the reset time when its message gives one and otherwise a retry after 30 minutes, as 0622 does without one.
3. While an agent's limit is recorded, `speck run` starts nothing on that agent, and `speck status` and the panel say which agent is limited and until when.
4. No test that passed before this change fails.

## Out of scope
- Moving the work to another agent: 0647 and 0648.

## Notes
- Claude's limit is `scripts/usage-limit.mjs` (0622, `holds` is Claude only); reviewers' limits are `scripts/reviewer-limit.mjs` (0623), whose `REFUSED` already matches Codex's "You've hit your usage limit" text.
- Checked 2026-11-11: a refused Codex run ends with `"codex_error_info":"usage_limit_exceeded"` and "…try again at 3:41 AM", a local time without a date.
- Checked 2026-11-11: Cursor's CLI (2026.11.11) has no wording of its own for its limit: the message comes from Cursor's server, and the CLI classes it by error codes such as `PRO_USER_USAGE_LIMIT` and `FREE_USER_USAGE_LIMIT`. So it's matched loosely, as `REFUSED` does.
- Failing before this build: none
- Self-check: a Cursor log has no times, so a clock time in it is now read from when the log was last written, not when speck run reads it, which could have meant waiting until the next day after speck run had been off; a test covers it. run.mjs was at the 600-line limit, so the words for a ready ticket held by a limit come from the limit queue (`heldSays`).

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

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "88e0eb36d43b5960c3862a54a0d34a6a0274e1c8",
    "session": "fresh",
    "thread_id": "01a1cb20-d737-7c70-be7f-64058a9100e5",
    "builder_response": "- Tests run: `speck test --related test/usage-limit-0644.test.mjs`, which ran test/usage-limit-0644.test.mjs and every existing test file naming a changed file (including test/usage-limit-0622.test.mjs, test/reviewer-limit-0623.test.mjs, test/watch-at-0625.test.mjs, test/watch-fallback-0637.test.mjs, test/run-codex-0289.test.mjs and test/run-cursor-0290.test.mjs), plus the repo's checks: 814 pass, 0 fail, 3 skipped.\n- Each of Claude, Codex and Cursor now has its own limit record in the runs folder (Claude's keeps its old file name, so a wait recorded before goes on). Reading Codex and Cursor logs is in scripts/agent-limit.mjs; the refusal wording and reset-time reader moved unchanged from reviewer-limit.mjs to scripts/limit-words.mjs, which reviewer-limit.mjs re-exports.\n- Cursor: the installed CLI (2026.11.11) has no wording of its own for its limit (it shows the server's message, and classes it by codes such as PRO_USER_USAGE_LIMIT), so it's matched loosely, as the ticket's Notes say.\n- AC4 (no test that passed before fails) has no test of its own: the run above and `speck ship`'s full suite check it.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 288962,
      "cached_input_tokens": 222720,
      "cache_write_input_tokens": 0,
      "output_tokens": 842,
      "reasoning_output_tokens": 115
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 66242,
      "cached": 222720,
      "write": 0,
      "output": 842
    },
    "cost_usd": 0.163176,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:02:17.518Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/agent-limit.mjs detects Codex refusals and reads reset times from stamped messages or session files. The passing 0644 AC1 tests cover detection, session fallback, separate recording and resumption at reset plus one minute."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cursorLimitInLog and usageLimitQueue handle Cursor refusals, supplied reset times and the 30-minute fallback. Passing 0644 AC2 tests exercise these paths, including delayed reading of a log."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "usageLimitQueue exposes agent-specific holds and descriptions; run.mjs checks heldSays before launching ready tickets. limitQueues forwards these methods and applies holds to other resume paths. Passing 0644 AC3 tests cover independent holds and foreman/status descriptions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded related-test output confirms 814 passes, zero failures and three skips. Existing tests were not weakened or changed; the shared reset parser was moved unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "scripts/run.mjs:396",
        "issue": "The waiting-ticket explanation still says the build stopped on Claude's usage limit, even when the new shared waiting queue contains a Codex or Cursor build. The overall limit description identifies the correct agent, but this individual ticket explanation can contradict it.",
        "suggested_fix": "Use an agent-neutral explanation or obtain the agent's name from the limit queue.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Codex and Cursor builds now wait out usage limits and resume automatically, with separate records and holds for each agent. The relevant tests pass. One individual ticket explanation still incorrectly names Claude; this does not prevent the change from working."
  }
}
```

</details>
