---
id: "0659"
title: Build each ticket on the builder settings it names                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-choose-the-builder-s-model-per-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T11:07:53.378Z"

---
# 0659 · Build each ticket on the builder settings it names

**Status:** 🔨 building

## Problem
`builder_model` and `builder_effort` in `speck/config.yml` apply to every build, so a project can't build one ticket on one model and the next on another. Someone whose tickets need different strengths, such as a game with graphics tickets for one model and logic tickets for another, has to change the setting by hand between builds.

## Outcome
A ticket can name its own `builder_model` and `builder_effort`. Each build of that ticket runs on them, and a ticket that leaves them blank builds exactly as it does today.

## Acceptance criteria
1. A ticket with `builder_model: <m>` is started, resumed and handed back on `<m>`, passed the way speck passes the settings' `builder_model` to that builder today (Claude Code and a model provider as `--model <m>`, Codex as `-m <m>`, Cursor as `--model <m>`), in place of the settings' value. This holds when the ticket's `builder:` names an agent other than the one in `speck/config.yml`, whose builds today get no model. A blank or missing ticket value gives the command speck gives today.
2. A ticket with `builder_effort: <e>` is built with `<e>` in place of the settings' `builder_effort`, given to Claude Code as `--effort <e>` and to Codex as `model_reasoning_effort="<e>"`, and not given to Cursor or a model provider, as today. `speck check` refuses a ticket `builder_effort` that the settings' `builder_effort` would refuse, with a message naming the ticket's value.
3. The same-family ready check and the board's builder model use the ticket's `builder_model` when it's set: with `builder: claude`, `reviewer: claude-subagent`, `allow_same_model_review: false` and `reviewer_model: opus`, `speck check` refuses a ticket with `builder_model: opus` and accepts one with `builder_model: sonnet`.
4. When speck run starts or moves a ticket's build to another agent on `builder_bench` because the builder is held by a usage limit, it doesn't pass the ticket's `builder_model` or `builder_effort` to that agent, as it doesn't pass the settings' values today.
5. A ticket `speck new` makes has blank `builder_model` and `builder_effort` lines, each with a comment saying what blank means, and `docs/brief.md` says a ticket's own value overrides the settings', in the Builder model and Builder effort paragraphs.

## Out of scope
- Setting a ticket's builder model or effort from the panel. `speck set <id> builder_model <m>` or an edit to the ticket does it.
- Levels such as Quick, Balanced and Deep, or presets by kind of work, that pick a model and effort for a ticket (1.3, from `speck/ideas/2026-11-10-set-up-your-team-instead-of-settings.md`). They'll resolve to these two fields, with a ticket's own `builder_model` winning.
- Choosing the model for a ticket automatically when it's written.
- Builds started by hand with `/speck-build`, which run on the session's own model.
- Checking that a model name exists: model names stay free text in the builder's own format, as `reviewer_model` is.

## Notes
- Follow `reviewer_model` and `reviewer_effort` on tickets (`reviewerSettings` in `scripts/core.mjs`): a ticket value wins, a blank one falls back to the settings when the build starts.
- The settings' `builder_model` reaches only the builder `speck/config.yml` names (0312). A ticket's value is written for the ticket's own builder, so it reaches that builder whichever it is. A build_command set by hand still gets `--model` only for Claude Code, as today.
- Likely files: `scripts/build-model.mjs`, `scripts/ticket-builder.mjs` (`configFor`), `scripts/same-model.mjs`, `scripts/builder-stand-in.mjs`, `scripts/lint.mjs`, `templates/ticket.md`, `docs/brief.md`.
- Checked 2026-11-12: Claude Code takes `--model <alias or name>` and `--effort <level>`; Codex takes `-m <model>` and `-c model_reasoning_effort="<e>"`; Cursor's agent takes `--model <name>` (as speck passes them today, `scripts/build-model.mjs`, `scripts/codex-build.mjs`, `scripts/cursor-build.mjs`).
- Failing before this build: none
- Self-check: narrowed the brief's claim to say a build_command you've written gives a ticket's model only to Claude Code; a hand-written command passes the ticket's values only when the ticket's builder is the configured one, as it builds every ticket with that builder.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
