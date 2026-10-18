---
id: "0290"
title: "Start and resume Cursor builds from speck run"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0289"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:05:55.735Z"
approved: "2026-10-18T12:11:41.644Z"

---
# 0290 · Start and resume Cursor builds from speck run

**Status:** 👍 approved

## Problem
speck lists Cursor as a builder, but speck run can't start or resume a Cursor build without a hand-written `build_command`, and it can't resume one at all, since it only resumes by Claude Code's `--session-id`.

## Outcome
With `builder: cursor`, speck run starts each build with Cursor's CLI, passing `builder_model`, and resumes it after a hand-back or a stop.

## Acceptance criteria
1. With `builder: cursor` and `build_command` blank, speck run first makes a chat with `agent create-chat` and keeps its id as the build's session, then starts the build as `agent -p --force --trust --output-format stream-json --resume <session> '/speck-build <id>'`, with `--model <builder_model>` when it's set.
2. A hand-back, a resumed build and the panel's resume command use `agent -p --force --trust --output-format stream-json --resume <session> '<message>'`.
3. speck finds Cursor's CLI as `agent`, or as `cursor-agent` when only that is installed.
4. When `agent create-chat` fails, speck run doesn't start the build, says why in one line, and leaves the ticket ready.
5. Builds with other builders start and resume as they do with 0289.

## Out of scope
- Reading Cursor logs and tokens in the panel: 0291.

## Notes
- Checked 2026-10-18: Cursor's CLI is `agent`; `-p`/`--print` runs without a person, `-f`/`--force` allows commands, `--trust` trusts the workspace in headless mode, `--output-format stream-json` works with `--print`, `--model` picks the model, `--resume [chatId]` resumes a chat, and `agent create-chat` makes an empty chat and returns its id (cursor.com/docs/cli/reference/parameters).
- Checked 2026-10-18: Cursor loads skills from `.agents/skills/`, `.cursor/skills/` and `.claude/skills/` (cursor.com/docs/skills).
- Checked 2026-10-18 by running Cursor CLI 2026.10.16-e3cb207 (installed as both `agent` and `cursor-agent`, signed in) in a scratch repo:
  - `agent create-chat` prints only the chat id and a newline, exit 0.
  - `agent -p --force --trust --output-format stream-json --model auto --resume <id> '/alpha-check'` ran a skill from `.agents/skills/` by its slash name, ran its shell command with no prompts, and exited 0. Without `--trust`, a folder it hasn't seen before stops to ask for trust.
  - stream-json lines: `{"type":"system","subtype":"init","session_id":…,"model":…}`; `user`; `thinking` (subtype `delta`/`completed`); `tool_call` with subtype `started`/`completed` (a shell command's is `tool_call.shellToolCall.args.command`, and on completed `tool_call.shellToolCall.result.success.exitCode`, stdout and stderr); `{"type":"assistant","message":{"content":[{"type":"text","text":…}]}}`; and a final `{"type":"result","subtype":"success","is_error":false,"result":…,"session_id":…,"usage":{"inputTokens":…,"outputTokens":…,"cacheReadTokens":…,"cacheWriteTokens":…}}`. No cost field.
  - On a free Cursor plan only the `auto` model works: a named model fails with "ActionRequiredError: Named models unavailable Free plans can only use Auto". A chat keeps the model it was first run with. So when `builder_model` is blank, speck passes `--model auto` rather than no `--model`.
  - `agent models` prints "Available models", a blank line, then one `<id> - <display name>` per line, with "(current, default)" after the default.
- Checked 2026-10-18: a resumed chat remembers earlier turns (two `-p --resume <id>` runs on one chat from `agent create-chat`: the second recalled a word given in the first).
- Failing before this build: none
- With the user's checked facts, a blank `builder_model` starts a Cursor build with `--model auto`, not without `--model` as AC1 reads: a free plan can only use auto, and a chat keeps the model it first ran on. A resumed build passes no `--model`, as AC2 has it.
- Self-check: `agent create-chat` is given 20 seconds rather than a minute, since speck run waits for it on each check; a failed chat is said once per reason and tried again on the next check, with no run record written.

## In plain words
If you build with Cursor, `speck run` can now start and look after those builds itself. Set `builder: cursor` and leave `build_command` blank (`build_command: ""`). For each ready ticket, speck first opens a new Cursor chat, then runs the build in it, on the model in `builder_model`, or on Cursor's Auto model if you leave that blank, which is the one a free Cursor plan allows. If a build is stopped partway, or a ship sends a ticket back for more work, speck carries on in that same chat.

To see it, set those two settings, set a ticket ready and turn `speck run` on. The run's log shows the build start with its chat id, and once a build is stopped or blocked, the panel offers an `agent -p … --resume …` command to reopen its chat. If Cursor can't open a chat (for example, you're not signed in), `speck run` says why in one line, leaves the ticket ready and tries again shortly after. Codex and Claude Code builds work as before.

Worth keeping an eye on: these builds run Cursor with `--force`, so they can run any command on this machine without asking, as Claude Code and Codex builds already do. While Cursor is opening a chat, `speck run` waits for it, for up to 20 seconds.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 210,485
- Elapsed since build started: 6 min
- Changed lines: 131 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Known limit: speck run waits for `agent create-chat` on each attempt (up to 20 seconds), and retries a failed one on every check, so a Cursor CLI that keeps failing slowly slows speck run's checks.
  - Known limit: the same-model check doesn't know which family a Cursor build runs on, since that depends on `builder_model`.
  - Skipped as a duplicate: `speck detect` lists only `cursor-agent` (`speck/ideas/2026-10-18-speck-detect-finds-cursor-as-agent.md`).
  - Skipped as a duplicate: the setup skill's advice to leave `build_command` blank when someone declines automatic builds now turns them on for Cursor too (`speck/ideas/2026-10-18-setup-s-blank-build-command-advice-for-codex.md`).

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
    "reviewed_sha": "4a34940b27a5739c7dfeab901cbba879acc97a98",
    "thread_id": "01a14eec-0d4e-7ed1-a891-dededd991af4",
    "seconds": 27,
    "usage": {
      "input_tokens": 209821,
      "cached_input_tokens": 146944,
      "cache_write_input_tokens": 0,
      "output_tokens": 664,
      "reasoning_output_tokens": 51
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T12:11:21.927Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs launch creates the chat before starting the process and records its session; cursorStartWords supplies the required flags and model. Passing 0290 AC1 integration test verifies actual process arguments and saved session. Blank model uses auto, as clarified in the ticket Notes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/hand-back.mjs resumeFor selects cursorResumeArgv for Cursor records. Passing 0290 AC2 tests exercise killed-build resumption, hand-back queue arguments and the panel's displayed resume command."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/cursor-build.mjs cursorCli prefers agent and falls back to cursor-agent. Passing 0290 AC3 tests isolate PATH and verify starts, resumes and doctor checks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "createChat returns a single-line failure reason; run.mjs launch returns before creating a run record or starting a build. Passing 0290 AC4 integration test verifies retries, one diagnostic, no build process and ready status."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Existing Codex and custom-command launch paths remain intact. Passing 0290 AC5 tests verify Codex and Claude commands; the existing run-codex-0289 tests also passed. Recorded output confirms 130 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Cursor builds now create and retain a chat, start with the configured model, and resume that chat after interruptions or hand-backs. Failed chat creation leaves tickets ready and explains why. Tests cover the process launches, panel commands and compatibility with existing builders. No blocking issues found."
  }
}
```

</details>
