---
id: "0314"
title: "Keep the Claude reviewer away from your MCP servers and connectors"                # one outcome, no "and"
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
started: "2026-10-18T22:33:14.211Z"
approved: "2026-10-18T22:34:44.998Z"

---
# 0314 · Keep the Claude reviewer away from your MCP servers and connectors

**Status:** 👍 approved

## Problem
The built-in `reviewer: claude` (0292) runs Claude Code without your settings and without file-editing tools, but it still loads your MCP servers and claude.ai connectors, such as Gmail and Drive. A reviewer only needs to read the code, and shouldn't be able to reach anything else of yours.

## Outcome
The Claude reviewer runs with no MCP servers or connectors, only Claude Code's own read-only tools.

## Acceptance criteria
1. `speck review` starts the Claude reviewer with `--strict-mcp-config` and no `--mcp-config`, so it loads no MCP servers from any configuration.
2. Later rounds, which resume the reviewer's session, are started the same way.
3. The reviewer's other options (no settings sources, no editing tools, its model and effort) are as today.
4. A review round with the Claude reviewer still records its verdict, as today.

## Out of scope
- Command reviewers set up under `reviewer_options`.

## Notes
- From `speck/ideas/2026-10-18-keep-the-claude-reviewer-off-your-connectors.md` (inbox, from 0292). The reviewer's arguments are `CLAUDE_ARGS` in `scripts/reviewers.mjs`.
- Checked 2026-10-18: `claude --help` (Claude Code 2.1.301) lists `--strict-mcp-config`: "Only use MCP servers from --mcp-config, ignoring all other MCP configurations".
- Checked 2026-10-18: claude.ai connectors count as MCP configurations that `--strict-mcp-config` leaves out. A session started with the reviewer's arguments listed the claude.ai Claude Docs, Gmail and Google Drive servers (49 `mcp__` tools) in its init record; with `--strict-mcp-config` added it listed no MCP servers and no `mcp__` tools.
- Failing before this build: none
- Self-check: narrowed the brief's new sentence, which said the reviewer could reach nothing but the repo (its read-only commands can still read local files), to say it can't reach mail, cloud files or other services through MCP; added a test that the brief's reviewer command includes `--strict-mcp-config`.

## In plain words
When Claude reviews a ticket, it no longer gets your connected services, such as Gmail, Google Drive or any other tool servers you've added to Claude Code. It only has the tools it needs to read and check the code. Reviews otherwise work as before: same model, same effort, same read-only limits, and the verdict is recorded the same way. To see it, run a review with Claude as the reviewer: it can't open your mail or files in the cloud. A reviewer you've set up with your own command is not affected.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 86,154
- Elapsed since build started: 2 min
- Changed lines: 7 (limit 5000)
- Follow-ups: none. No pictures: nothing anyone sees changed.
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
    "reviewed_sha": "349e7920e433643a01ce0635499d278fae919054",
    "thread_id": "01a15126-ce3c-7e42-a540-bddbb485a37d",
    "seconds": 17,
    "usage": {
      "input_tokens": 85604,
      "cached_input_tokens": 64000,
      "cache_write_input_tokens": 0,
      "output_tokens": 550,
      "reasoning_output_tokens": 22
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:34:36.601Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/reviewers.mjs: CLAUDE_ARGS includes --strict-mcp-config and no --mcp-config. Passing 0314 AC1 test captures the actual arguments sent to the stand-in Claude executable."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "BUILT_IN.claude uses CLAUDE_ARGS for both command and resume_command. Passing 0314 AC2 test checks resumed rounds and fresh fallback after a failed resume."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The only executable change is the added flag in CLAUDE_ARGS. Passing 0314 AC3 test verifies settings sources, permissions, excluded editing tools, output format, model and effort."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0314 AC4 test exercises the review command and checks the saved round's reviewer and verdict finding. runCommandReview still parses the output and calls saveRound."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The built-in Claude reviewer now excludes MCP servers and connectors in both initial and resumed reviews. Its existing restrictions and verdict recording remain intact. The reported tests passed, exercise the command arguments and saved verdict, and introduce no blocking concerns."
  }
}
```

</details>
