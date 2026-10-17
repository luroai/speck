---
id: "0279"
title: "Choose the model that builds tickets"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0278"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T18:42:22.421Z"

---
# 0279 · Choose the model that builds tickets

**Status:** 🔨 building

## Problem
There's no setting for the builder's model: builds run on whatever model `build_command` starts the builder with, which for Claude Code is your own default. You can choose the reviewer's model in the Settings view but not the builder's.

## Outcome
A `builder_model` setting chooses the model every build runs on, and the Settings view lets you pick it from the builder's models.

## Acceptance criteria
1. A new setting, `builder_model`, is in the config template, blank by default, with a comment saying what it does, and `speck config set` accepts it. Blank leaves the model to the builder's own default, as today.
2. When `builder_model` is set and the builder is `claude`, every build `speck run` starts or resumes runs on that model: the command it runs passes it as `--model <value>`. When it's blank, the command is exactly as today.
3. The Settings view shows `builder_model` in "Building and reviewing", under `builder`, with an explanation. With `builder: claude` it offers "(default)", `fable`, `opus`, `sonnet` and `haiku`, each saying it means the newest model of that kind. With `builder: codex` it offers Codex's models as 0276 does for the reviewer, and with any other builder a text box.
4. A saved value that isn't in the list still shows, marked as not in the list, and isn't changed unless you change it.
5. When the builder isn't `claude` and `builder_model` is set, `speck run` says in one line, when it starts, that `builder_model` is only passed to Claude Code builds, and starts builds as today.

## Out of scope
- A different model per ticket: `speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`.
- The builder's effort.
- Builds started by hand with `/speck-build`, which run on the session's own model.

## Notes
- Checked 2026-10-17: `claude --model <model>` takes an alias (`fable`, `opus`, `sonnet`) for the newest model of that kind, or a full model name (`claude --help`, Claude Code 2.1.301).
- `build_command` is read in `scripts/run.mjs` (`DEFAULT_BUILD_COMMAND`, and `resumeArgv` in `scripts/hand-back.mjs` for resumed builds).
- Failing before this build: none
- Self-check: a `builder_model` that YAML reads as a number (`builder_model: 5`) is now passed as `--model 5` rather than ignored.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
