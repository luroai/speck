---
id: "0292"
title: "Review with Claude Code when the builder isn't Claude"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
- Checked 2026-10-18: Claude Code 2.1.301. `--permission-mode plan` isn't enforced for this: the model declines writes itself, with no harness denial. `--permission-mode dontAsk` is: in `-p` it runs read-only commands (`git status`, `cat`, the Read tool) and denies everything not pre-approved (`touch`, `echo x > f`, the Write tool), listing each in `permission_denials`. It must be passed explicitly, as a user's `defaultMode: bypassPermissions` otherwise wins. `--disallowedTools Edit Write NotebookEdit` removes the file-writing tools. Allow rules in the project's own settings still apply under dontAsk.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
