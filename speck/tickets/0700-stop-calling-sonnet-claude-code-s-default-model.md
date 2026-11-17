---
id: "0700"
title: "Stop calling Sonnet Claude Code's default model"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-17
started: "2026-11-17T19:13:59.448Z"

---
# 0700 · Stop calling Sonnet Claude Code's default model

**Status:** 🔨 building

## Problem
The Builder, reviewer and level lists offer "Claude Code · Sonnet (default)", and picking it saves a blank model, which leaves the choice to Claude Code. speck assumes Claude Code's own default is Sonnet (0403, `defaultModelOf` in `scripts/settings.mjs`), but it depends on the account: on a Max plan it's Opus. So someone who picks Sonnet gets every build on Opus, at several times the cost, while the panel says Sonnet. It happened in a project on 17 November: ticket 0002 showed "Claude Code · default model" and was built with claude-opus-5-5.

## Outcome
Picking a Claude model in any list saves that model, and nothing claims to know Claude Code's default.

## Acceptance criteria
1. In the Builder's list, each level's list and every other list that offers Claude Code's models, each of Fable, Opus, Sonnet and Haiku saves its own name (`fable`, `opus`, `sonnet`, `haiku`) as the model, and none of them is labelled "(default)".
2. Those lists also offer "Claude Code · its own default", which saves a blank model, and its words don't name a model.
3. A saved blank Claude model is shown wherever the panel shows a builder or level, as "Claude Code · its own default" (in the Level menu and a ticket's Builder fact too), never as Sonnet or another model by name.
4. A list whose saved Claude model is `sonnet` shows Claude Code · Sonnet as its choice, and one whose saved model is blank shows Claude Code · its own default.
5. Codex's, Cursor's and model providers' defaults are named as today. No test that passed before this change fails.

## Out of scope
- Reading Claude Code's real default from the account or its settings.
- Changing settings people have already saved.

## Notes
- Found 2026-11-17. `defaultModelOf` returns `'sonnet'` for claude; `roleEntries` in `templates/panel-settings.js` then makes the blank entry stand in for Sonnet.
- Checked 2026-11-17: Claude Code takes `--model sonnet` and the other aliases (as `scripts/build-model.mjs` passes builder_model), and with no `--model` it uses the account's own default, which was Opus on this machine.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
