---
id: "0278"
title: "Offer Claude's models when Claude reviews"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0277"]               # ticket ids that must be done first
created: 2026-10-17

---
# 0278 · Offer Claude's models when Claude reviews

**Status:** 📋 ready

## Problem
With `claude-subagent` as the reviewer, the Settings view offers `reviewer_model` only as a text box, so you have to know which names Claude accepts. Codex gets a list (0276), but Claude Code has no command that lists its models.

## Outcome
With Claude as the reviewer, the Settings view offers Claude's model names to pick from, and each one always means the newest model of its kind.

## Acceptance criteria
1. With `reviewer: claude-subagent`, the Settings view offers `reviewer_model` as a list: "(default)" for blank, then `fable`, `opus`, `sonnet` and `haiku`.
2. Each name in that list has a few words saying it means the newest model of that kind, for example "the newest Opus".
3. A saved value that isn't in the list, such as a full model name, still shows, marked as not in the list, and isn't changed unless you change it.
4. `reviewer_effort` for `claude-subagent` offers what it offers today.

## Out of scope
- The builder's model: 0279.
- Codex's list (0276).

## Notes
- Checked 2026-10-17: Claude Code's Agent tool, which the builder uses to start a claude-subagent reviewer, takes a model of `sonnet`, `opus`, `haiku` or `fable` (the tool's own schema in this session).
- Checked 2026-10-17: `claude --model` takes an alias such as `fable`, `opus` or `sonnet` for the newest model of that kind (`claude --help`, Claude Code 2.1.301).
- The list of models offered per reviewer is in `scripts/settings.mjs` (0276).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
