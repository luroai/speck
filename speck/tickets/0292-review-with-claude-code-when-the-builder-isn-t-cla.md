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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
