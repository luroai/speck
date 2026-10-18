---
id: "0292"
title: "Review with Claude Code when the builder isn't Claude"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0288"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T10:54:29.066Z"

---
# 0292 · Review with Claude Code when the builder isn't Claude

**Status:** 🔍 reviewing

## Problem
With Codex or Cursor as the builder, the reviewer should come from another family, and Claude is the obvious one. But speck's Claude reviewer (`claude-subagent`) is started by the builder with a tool only Claude Code has, so a Codex or Cursor builder can't use it.

## Outcome
`reviewer: claude` reviews with Claude Code run by speck from the command line, so any builder can be reviewed by Claude.

## Acceptance criteria
1. `reviewer: claude` is a built-in reviewer: `speck review` runs Claude Code without a person, with the round's prompt, read-only (it can read files and run read-only commands but not change files), and reads the verdict from its output as it does for a command reviewer.
2. Later rounds resume the same Claude Code session, as Codex's do.
3. `reviewer_model` and `reviewer_effort` are passed to it when set.
4. `claude` counts as Claude's family for the same-family check, as `claude-subagent` does, and the Settings view and setup offer it.

## Out of scope
- Removing `claude-subagent`.

## Notes
- Reviewer commands are in `scripts/reviewers.mjs`; the review skill is `skills/speck-review/SKILL.md`.
- Checked 2026-10-18: Claude Code 2.1.301. `--permission-mode plan` isn't enforced for this: the model declines writes itself, with no harness denial. `--permission-mode dontAsk` is: in `-p` it runs read-only commands (`git status`, `cat`, the Read tool) and denies everything not pre-approved (`touch`, `echo x > f`, the Write tool), listing each in `permission_denials`. It must be passed explicitly, as a user's `defaultMode: bypassPermissions` otherwise wins. `--disallowedTools Edit Write NotebookEdit` removes the file-writing tools. Allow rules in the project's own settings still apply under dontAsk, unless `--setting-sources=` (empty) is given: checked 2026-10-18 in a trusted folder, a local `Bash(touch:*)` allow rule let `touch` run without it and was denied with it.
- Failing before this build: none
- AC4's family part already held: `modelFamily('claude')` was already `claude`. Its test passed before any code changed and guards it.
- Self-check: added a test that `speck doctor` checks Claude Code is on the PATH for `reviewer: claude`, as the brief now says; dropped an unchecked Gemini example from the brief; ran the built-in command against the real Claude Code 2.1.301 (no Write tool, a Bash write denied, `--resume` keeps the session).

## In plain words
You can now choose Claude Code as the reviewer whatever agent builds your tickets, so a Codex or Cursor build can be checked by Claude. speck starts Claude Code itself for each review, without anyone at the keyboard, and it can read the code and run harmless commands but can't change anything, even if your own Claude Code settings would normally allow it. Later review rounds carry on the same conversation, and the reviewer model and effort you pick are used.

To see it, set the reviewer to "claude" in the panel's Settings view (it's offered once Claude Code is installed and signed in), then build a ticket and read its review pack. Worth keeping an eye on: Claude reviewing Claude's own build still needs same-model review switched on, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups:
  - Keep the Claude reviewer off the user's connectors with `--strict-mcp-config`: speck/ideas/2026-10-18-keep-the-claude-reviewer-off-your-connectors.md.
  - Skipped as a duplicate: an effort only Codex supports (such as `ultra`) reaches `claude --effort` and fails the round. Matches speck/ideas/2026-10-17-check-the-effort-against-the-ticket-s-own-reviewer.md.
  - Known limit: managed (enterprise) Claude Code settings still apply to the reviewer, as `--setting-sources` can't turn them off.

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
    "reviewed_sha": "18c7bb057ff3aa6628b1831ada976b7870eddf80",
    "thread_id": "01a14eaa-b8c4-7180-90e7-5e3d47a7beaa",
    "seconds": 25,
    "usage": {
      "input_tokens": 131481,
      "cached_input_tokens": 81280,
      "cache_write_input_tokens": 0,
      "output_tokens": 813,
      "reasoning_output_tokens": 80
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T10:59:58.484Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/reviewers.mjs routes Claude through runCommandReview and parses its verdict correctly, covered by passing AC1 tests. However, CLAUDE_ARGS uses dontAsk while retaining inherited allow rules, so pre-approved Bash commands can still change files. The test checks arguments against a fake CLI; it does not exercise permission enforcement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewerOptions supplies session_id_path and resume_command; runCommandReview saves and resumes thread_id. Passing AC2 tests cover continuation and fallback with full history."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "CLAUDE_ARGS includes model and effort placeholders, filled by commandArgs using reviewerSettings. The passing AC3 test checks both flags in initial and resumed calls, and their omission when blank."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "modelFamily and sameModelProblem recognise Claude's family. scripts/settings.mjs and templates/panel.html offer Claude and its models; skills/speck-setup/SKILL.md proposes reviewer claude for Codex builders. Passing AC4 tests cover these paths."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/reviewers.mjs",
        "issue": "The built-in reviewer does not enforce the required read-only access when Claude settings already allow writing Bash commands. dontAsk denies commands that need approval, but honours existing allow rules, as the ticket and updated documentation explicitly acknowledge. Removing Edit, Write and NotebookEdit leaves Bash available, so an inherited Bash allow rule can permit file changes during review.",
        "suggested_fix": "Enforce read-only execution independently of inherited Claude permissions, or isolate permission settings and restrict available commands so existing write approvals cannot apply. Add a permission-enforcement check with a pre-existing Bash write allow rule, covering initial and resumed sessions.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Claude review, session continuation, model settings and Settings integration are implemented and covered by passing tests. One issue blocks approval: existing Claude permissions can still let the reviewer change files, despite the ticket requiring read-only access."
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
    "reviewed_sha": "1041d5b7b11a08e441d546ecf6657c3237dfa850",
    "thread_id": "01a14eaa-b8c4-7180-90e7-5e3d47a7beaa",
    "seconds": 20,
    "usage": {
      "input_tokens": 310053,
      "cached_input_tokens": 196096,
      "cache_write_input_tokens": 0,
      "output_tokens": 1511,
      "reasoning_output_tokens": 97
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T11:01:37.815Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdReview selects the built-in Claude command; runCommandReview sends the prompt and records the parsed verdict. CLAUDE_ARGS now disables user, project and local settings, explicitly selects dontAsk and removes file-writing tools. Passing AC1 tests verify the invocation, prompt, verdict parsing and missing-CLI handling. Local claude --help confirms the setting-sources option."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCommandReview saves session_id as thread_id and uses --resume for subsequent rounds. Passing AC2 tests verify session continuation, settings isolation on resume, and fresh-session fallback with full history."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewerSettings and commandArgs supply --model and --effort. The passing AC3 test verifies both initial and resumed invocations and omission of blank values."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "modelFamily and sameModelProblem recognise Claude's family. scripts/settings.mjs and templates/panel.html offer Claude and its models; speck-setup proposes it for other builders. Passing AC4 tests cover family checks, Settings choices and the setup command."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/reviewers.mjs",
        "issue": "Inherited Claude allow rules could permit writing Bash commands despite dontAsk.",
        "suggested_fix": "Addressed by --setting-sources= in the shared arguments for initial and resumed commands. Regression assertions cover initial, resumed and fallback runs; the ticket records a real-CLI enforcement check with an existing Bash write permission.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Claude can now review builds from other agents, retain its session and use the selected model settings. The inherited-permissions issue is fixed. All four criteria pass, with no blocking findings remaining."
  }
}
```

</details>
