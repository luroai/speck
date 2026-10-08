---
id: "0012"
title: "Run a reviewer from a command set in config"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T21:31:53.751Z"
finished: "2026-10-08T21:41:10.387Z"

---
# 0012 · Run a reviewer from a command set in config

**Status:** ✅ done

## Problem
`speck review` can only run Codex, and every other reviewer is driven by the builder through skill instructions, with the builder saving the verdict file itself. A Cursor, Gemini or Claude Code user has no reviewer speck can run for them, and outside Codex the builder could record its own approval.

## Outcome
Any reviewer agent with a non-interactive mode can be set up in `speck/config.yml` as a command, and `speck review <id>` runs it and records the verdict itself, so the builder never handles the verdict.

## Acceptance criteria
1. With a reviewer whose entry under `reviewer_options` in `speck/config.yml` has a `command` (for example `reviewer: cursor` with `command: "cursor-agent -p --output-format json"`), `speck review <id>` runs that command from the repo root, sends the full review prompt (the same text `speck prompt <id>` prints, including the verdict schema) on stdin, and records the round with `reviewer: <name>` and the reviewed commit.
2. Placeholders `{model}` and `{effort}` in the command are replaced with the ticket's resolved `reviewer_model` and `reviewer_effort`. A placeholder whose value is blank is removed together with the flag word just before it (for example `--model {model}` disappears entirely), so the reviewer runs on its own default.
3. The verdict is read from the command's stdout: either the whole output as JSON, a ```` ```json ```` fenced block, or a JSON envelope whose `result` string holds the verdict. Anything else, or a non-zero exit, fails with a plain error that quotes the last five lines of stderr, and no round is recorded.
4. Every round after the first sends the full round-1 prompt again, followed by every earlier verdict and builder response in order and the diff since the last review, so a reviewer with no memory of earlier rounds can keep finding ids stable.
5. `reviewer: codex` with no `command` behaves exactly as today, and a reviewer with no `command` and no built-in adapter still points the user at `speck record`, as today.

## Out of scope
- Resuming the reviewer's own session between rounds (0013).
- Moving Codex or `claude-subagent` onto the command adapter.
- Sandboxing the reviewer: read-only stays a prompt instruction for command reviewers, and the docs must say so.

## Notes
- The reviewer prompt template and verdict schema are unchanged; this ticket only adds a way to run them.
- Update README, `docs/brief.md` (reviewer table) and `product.md` with a worked example for Cursor and for Claude Code (`claude -p --output-format json`). Check each tool's current flags rather than copying these.
- **Flags checked (2026-10-08).** Claude Code 2.1.294 (`claude --help`): `-p`, `--output-format json`, `--model`, `--effort` and `--permission-mode plan` (read-only). Its JSON output is an envelope with the reply in `result`, plus `session_id` and `usage`. Cursor (`cursor-agent` isn't installed here, so this comes from the CLI docs at cursor.com/docs/cli/reference/output-format): `-p`, `--output-format json`, `--model`, and `--mode ask` for read-only. It gives the same `result` envelope, and on failure it exits non-zero with no JSON. Cursor has no effort flag, so its example leaves `{effort}` out.
- **Live run.** In a throwaway repo, `reviewer: claude` with `command: "claude -p --output-format json --permission-mode plan --model {model} --effort {effort}"` and `reviewer_model: haiku` reviewed a sample ticket with a planted bug, through this branch's `speck review`. Round 1 found the bug and the missing test and returned `changes_requested`. Round 2 had no session memory and got the full-history prompt with the builder's response; it marked all three findings fixed and approved. Both rounds were recorded as `reviewer: claude, model haiku`, with the envelope's `usage`, and round 2 kept `builder_response`.
- Claude's `usage.input_tokens` leaves out cached input, so the pack undercounts a Claude reviewer's tokens. This is listed as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 a well-formed JSON reply that wasn't a valid verdict failed without quoting stderr; F2 later rounds rebuilt the round-1 prompt from current code instead of resending what was sent. Round 2 (codex): approved.

## Delivery log
- Review rounds: 2 (codex, `gpt-6.1-sol`), with 521,841 reviewer tokens. The live Claude command-reviewer run on a sample ticket took 2 rounds on `haiku`.
- Elapsed: about 9 minutes from start to approval (from `speck pack`).
- Changed lines: 166 (excluding tests and `speck/`), against a limit of 1,000.
- During the build, `/tmp` ran out of inodes because of about 8,600 leftover test fixture folders, and the suite failed until they were deleted.
- Follow-up ideas:
  - The test suite never removes the temporary repos it makes in `/tmp`. Add cleanup, because over many runs they fill the inode table.
  - Claude's envelope reports `usage.input_tokens` without cached input, so the pack undercounts a Claude command reviewer's tokens. Add `cache_read_input_tokens` and `cache_creation_input_tokens` when they're present.
  - `speck doctor` doesn't check that a reviewer's command is installed. 0014 covers this.

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
    "reviewed_sha": "e6e54ea6c46e1a98c289bc19f230230b7e0492d9",
    "thread_id": "01a11d72-4aae-79e1-ab7a-59a63e9084ed",
    "seconds": 38,
    "usage": {
      "input_tokens": 190627,
      "cached_input_tokens": 137856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1202,
      "reasoning_output_tokens": 102
    },
    "saved_at": "2026-10-08T21:37:09.659Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: runCommandReview runs from the repo root, supplies fullPrompt on stdin and saves reviewer and reviewed_sha. The 0012 AC1 integration test exercises these behaviours."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "commandArgs resolves placeholders and removes blank placeholders with their preceding flags. The 0012 AC2 integration test covers populated, blank, partially populated and joined arguments, plus values containing shell syntax."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The 0012 AC3 tests exercise the three output formats and process failures. However, structurally invalid JSON verdicts reach saveRound and validateVerdict, whose error omits stderr entirely. The invalid-shape test does not check this required diagnostic."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "historyPrompt rebuilds the initial prompt using the current ticket, product, cumulative diff and current test output. It does not resend the prompt actually supplied in round 1. The AC4 test compares against speck prompt after subsequent changes, so it misses this discrepancy."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdReview retains the built-in Codex path when no command is configured and directs unsupported reviewers to speck record. The 0012 AC5 integration test exercises both paths."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Invalid verdict JSON loses the required stderr diagnostic. For example, stdout containing {\"verdict\":\"approve\"} reaches validateVerdict and fails without quoting the reviewer's last five stderr lines.",
        "suggested_fix": "Validate command output before recording and wrap validation failures with the same stderr tail used for other command failures. Add an integration test supplying an invalid verdict and seven stderr lines, checking that only the last five appear and no round is recorded.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Later rounds replace the original round-1 context with current context. Earlier findings are therefore presented alongside a different initial diff and test output, which can make their original evidence disappear or appear inconsistent.",
        "suggested_fix": "Preserve or reconstruct the actual round-1 prompt, including its original test output, and resend it before the ordered history and current incremental diff. Capture round-1 stdin in the integration test and compare subsequent prompt prefixes against that captured text after changing code and test output.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The capability and sandbox limitations are documented, but the claims that later rounds resend the round-1 prompt and invalid output errors include stderr are not fully true yet."
    },
    "escalation_question": "",
    "summary": "Configured reviewer commands work for the main paths, with meaningful integration tests. Two fixes are needed before merge: preserve the original review context in later rounds and include reviewer error output when a JSON verdict is invalid. I inspected the tests and ran read-only checks; I did not rerun the suite because it writes temporary repositories."
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
    "reviewed_sha": "eb83f2a45b4e98d395b1b1ea67c6b89553990782",
    "thread_id": "01a11d72-4aae-79e1-ab7a-59a63e9084ed",
    "seconds": 21,
    "usage": {
      "input_tokens": 328033,
      "cached_input_tokens": 257024,
      "cache_write_input_tokens": 0,
      "output_tokens": 1979,
      "reasoning_output_tokens": 102
    },
    "saved_at": "2026-10-08T21:40:33.155Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runCommandReview supplies fullPrompt on stdin from the repo root and records reviewer and reviewed_sha. The 0012 AC1 integration test exercises these behaviours and passes in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "commandArgs substitutes resolved settings and removes blank placeholders with their flags. The 0012 AC2 integration test covers populated, blank, joined and shell-sensitive arguments and passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "verdictFromOutput handles JSON, fenced verdicts and result envelopes. runCommandReview now catches verdict validation errors before recording and includes the stderr tail. The AC3 tests cover formats, invalid output, invalid verdict shape and non-zero exits; all pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "roundOnePrompt reads the saved original prompt, and historyPrompt appends earlier verdicts and responses in order followed by the current incremental diff. The revised AC4 test compares against captured round-1 stdin while changing code and test output. A separate passing test covers reconstruction when the cache is missing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdReview retains the built-in Codex adapter without a configured command and directs unsupported reviewers to speck record. The passing 0012 AC5 integration test covers both."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Invalid verdict JSON previously omitted the required stderr diagnostic. This is fixed by validation before recording with the stderr tail appended to validation errors.",
        "suggested_fix": "Completed; the regression test checks the final five stderr lines and that no round is recorded.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Later rounds previously substituted current context for the original round-1 prompt. They now resend the saved original prompt.",
        "suggested_fix": "Completed; the revised regression test compares later stdin against the captured original prompt.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "Documents command reviewers, error handling, history replay and sandbox limitations accurately, including the loss of original test output if the prompt cache must be reconstructed."
    },
    "escalation_question": "",
    "summary": "Both blocking findings are fixed, and the change is ready for the owner's merge decision. Configured reviewers receive the prompt and review history, and failed reviews report useful errors without recording a round. The supplied suite reports 102 passing tests; I verified the code and regression tests without rerunning the write-producing suite."
  }
}
```

</details>
