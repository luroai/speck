---
id: "0660"
title: "Build a ticket at the level it names"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-set-up-your-team-instead-of-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T11:56:01.061Z"

---
# 0660 · Build a ticket at the level it names

**Status:** 🔨 building

## Problem
Since 0659 a ticket can name its own builder model and effort, but you have to know and type the right model for each one. You think about tickets as "quick", "deep" or "graphics work", not in model names, and a project that uses the same few combinations over and over has to repeat them on every ticket.

## Outcome
`speck/config.yml` holds named build levels, each giving a builder, model and effort, and a ticket that names a level is built with them.

## Acceptance criteria
1. A `levels:` map in `speck/config.yml` names each level, and each level can give `builder`, `builder_model` and `builder_effort`, each optional. A project whose config has no `levels:` gets three: `quick` with `builder_effort: low`, `balanced` with nothing set, and `deep` with `builder_effort: max`. A config that has `levels:` gets exactly the levels it lists, which can include others, such as `graphics`.
2. A ticket with `level: <name>` is started, resumed and handed back with that level's builder, model and effort, each passed as 0659 passes a ticket's own. For each of the three, a value on the ticket itself wins over the level's, and a value the level leaves out falls back to the settings, so a ticket with `level: balanced` or a blank `level` builds exactly as it would without one.
3. `speck check` refuses a ticket whose `level` isn't one of the project's levels, naming the levels there are, and refuses a level whose `builder_effort` is one it would refuse in the settings. The same-family ready check uses the builder and model the level gives the ticket.
4. When speck run moves a ticket's build to another agent on `builder_bench` because of a usage limit, it doesn't pass the level's model or effort to that agent, as it doesn't pass the ticket's own (0659).
5. A ticket `speck new` makes has a blank `level` line with a comment saying what blank means, the `speck/config.yml` that `speck init` writes lists the three default levels, and `docs/brief.md` has a Build levels paragraph saying the order a ticket's value, its level's and the settings' are used in.

## Out of scope
- Changing levels from the team page: 0661.
- Picking a ticket's level in the panel: 0662. `speck set <id> level <name>` or an edit to the ticket does it.
- Levels for the reviewer or QA.
- Virgil or the ticket writer picking a ticket's level by itself.

## Notes
- Level names are lowercase letters, digits and hyphens. The panel shows them with a capital first letter.
- Levels live in `speck/config.yml`, as tickets that name them are shared with the project. A level's model is free text in its builder's own format, as `builder_model` is.
- Builds on 0659's resolution in `scripts/build-model.mjs` and `scripts/ticket-builder.mjs`. Likely files also `scripts/core.mjs` (`ticketAgents`), `scripts/same-model.mjs`, `scripts/builder-stand-in.mjs`, `scripts/lint.mjs`, `templates/ticket.md`, `templates/config.yml`, `docs/brief.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
