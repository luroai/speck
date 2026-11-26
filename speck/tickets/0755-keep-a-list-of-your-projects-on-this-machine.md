---
id: "0755"
title: "Keep a list of your projects on this machine"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T09:32:23.220Z"

---
# 0755 · Keep a list of your projects on this machine

**Status:** 🔨 building

## Problem
speck only knows a project while its panel is running, as each panel registers itself in the home folder (0516). A service that runs every project needs a list of them that lasts, whether their panels are running or not.

## Outcome
`speck projects` lists, adds and removes the projects on this machine, kept in the home folder.

## Acceptance criteria
1. `speck projects add [<folder>]` adds the speck project at that folder (or the current one) to a list in the home folder, by its real path, and says so; adding one already listed says it's there and changes nothing.
2. `speck projects add` refuses a folder that isn't a git repository with speck set up (no `speck/config.yml` and `.speck/`), saying why, and adds nothing.
3. `speck projects` lists each project with its name, folder, the speck version in its `.speck/`, and whether its panel and its `speck run` are running; a listed folder that no longer exists is shown as missing.
4. `speck projects remove <name or folder>` takes it off the list and touches nothing in the project.
5. The brief's command table describes `speck projects`, `speck projects add` and `speck projects remove`. No test that passed before this change fails.

## Out of scope
- Starting anything: the service ticket after this does that.
- The panel.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- Keep the list beside the other home-folder files (`homeSettingsDir()` in `scripts/home-settings.mjs`, `~/.config/speck/`), not in any repo: it holds personal folder paths.
- A project's name is its folder's name, as the project menu shows it today (`scripts/panel-projects.mjs`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
