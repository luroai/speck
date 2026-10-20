---
id: "0333"
title: "Run the Foreman on Cursor"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0330","0332"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:09:59.495Z"
approved: "2026-10-20T12:13:16.283Z"

---
# 0333 · Run the Foreman on Cursor

**Status:** 👍 approved

## Problem
The Foreman runs only on Claude Code or Codex (`FOREMAN_AGENTS` in `scripts/foreman-agent.mjs`). Someone set up with Cursor alone, as on a work laptop, can't use the Foreman at all, and with a Cursor builder and the Foreman left blank it falls back to Claude Code, which may not be installed.

## Outcome
The Foreman can run on Cursor, on `foreman_model` when it's set, and is Cursor by default when the builder is.

## Acceptance criteria
1. `speck config set foreman cursor` and the Settings view accept `cursor` as the Foreman's agent.
2. With `foreman: cursor`, `speck run` starts the Foreman with Cursor's CLI (`agent`, or `cursor-agent` when only that is installed) as `-p --force --trust --output-format stream-json`, with `--model <foreman_model>` when it's set and left out when it's blank, and the brief as the prompt.
3. With `foreman` blank and `builder: cursor`, the Foreman runs on Cursor.
4. With `foreman` blank and any other builder, it runs as today: Codex for a Codex builder, Claude Code otherwise.
5. No test that passed before this change fails.

## Out of scope
- `foreman_effort` for Cursor: Cursor's model names carry the effort, so it isn't passed.
- Limiting which commands a Cursor Foreman may run, as Claude Code's `--allowedTools` does. It runs as Cursor builds do, as a Codex Foreman runs as Codex builds do.

## Notes
- `foremanAgentOf` and `foremanArgv` in `scripts/foreman-agent.mjs`; the Settings view's choices come from `FOREMAN_AGENTS` (`scripts/settings.mjs`). The Foreman's brief points at `.claude/skills/speck-foreman/SKILL.md` for any agent but Codex (`skillPath`), which Cursor reads.
- Cursor builds already start as `agent -p --force --trust --output-format stream-json` (`scripts/cursor-build.mjs`), so the Foreman's output is read like a Cursor build's.
- Checked 2026-10-20: Cursor's CLI takes `--model`, `--force`, `--trust` and `--output-format stream-json` (`agent --help` on this machine).
- Failing before this build: none
- Self-check: no changes. The 0287 test listing the Foreman's choices as exactly blank, claude and codex now lists cursor too, as this ticket adds it.

## In plain words
The Foreman, which looks into work that stops for a reason speck has no steps for, can now run on Cursor. Choose `cursor` for it in the Settings view's Foreman group, or leave it blank when Cursor builds your tickets and it uses Cursor by itself. If you set a model for it, Cursor runs on that one. The effort setting isn't passed to Cursor, as Cursor's model names already include it.

To see it, turn fixing on in the Foreman group with Cursor as the builder. The next time work stops for an unknown reason, the Foreman's log shows Cursor at work.

Worth keeping an eye on: a Cursor Foreman can run any command, as Cursor builds can, and only its instructions keep it to speck's own commands. A Claude Code Foreman is limited to them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 117,640
- Elapsed since build started: 3 min
- Changed lines: 31 (limit 5000)
- Follow-ups: none. Known limit (out of scope by the ticket): a Cursor Foreman isn't limited to speck's own commands, as a Claude Code one is.

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
    "reviewed_sha": "1f54512f052767c3e9dbe6e0f183d8e9d86b077d",
    "thread_id": "01a1593a-6aca-7031-adcf-72ef87a3acb6",
    "seconds": 25,
    "usage": {
      "input_tokens": 116947,
      "cached_input_tokens": 72064,
      "cache_write_input_tokens": 0,
      "output_tokens": 693,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:13:07.492Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs validates against FOREMAN_AGENTS, which now includes cursor; scripts/settings.mjs exposes the same choices. Passing 0333 AC1 test exercises config set and Settings choices."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/foreman-agent.mjs foremanArgv uses cursorCli(), the shared Cursor headless flags, optional --model and the brief. Three passing 0333 AC2 tests cover arguments, both CLI names and the Foreman queue's invocation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanAgentOf defaults to cursor for a Cursor builder. Passing 0333 AC3 test covers omitted and blank foreman settings and confirms Cursor arguments."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanAgentOf retains Codex for a Codex builder and Claude otherwise. Passing 0333 AC4 test covers Codex, Claude, Gemini, missing and unknown builders."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded targeted run reports 183 passed, zero failed and three skipped. The only existing test adjustment adds Cursor to the expected Settings choices, matching the requested behaviour. No regression identified in the change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Foreman can now run on Cursor and defaults to it for Cursor builders. Command selection, model handling and existing defaults are covered by passing tests. The changes stay within the ticket's scope; no blocking concerns found."
  }
}
```

</details>
