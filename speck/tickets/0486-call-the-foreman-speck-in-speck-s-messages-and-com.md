---
id: "0486"
title: "Call the Foreman speck in speck's messages and commands"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:44:03.734Z"

---
# 0486 · Call the Foreman speck in speck's messages and commands

**Status:** 🔨 building

## Problem
`speck run`, `speck status` and the Pipeline log say "the Foreman" in about forty messages, and you answer it with `speck foreman answer`. With one speck watching the pipeline, the second name is a concept people have to learn for nothing.

## Outcome
speck's messages and commands say speck where they said the Foreman, and the old commands still work.

## Acceptance criteria
1. No message that `speck run`, `speck status` or any other speck command prints, and no line `speck run` writes to its log, contains "Foreman" in any case: each says speck instead, for example `0479: speck (Claude) is looking into it. Log: …`, `speck asks you about 0479: …` and `0479: your answer to speck wasn't carried out, as the ticket has moved on since.` Checked across every string in `scripts/` that becomes such a message, not only a sample. Setting names are excepted (0487).
2. `speck answer <id> "<answer>"` and `speck dismiss <id>` do what `speck foreman answer` and `speck foreman dismiss` do today, refusals included. The agent's own actions are `speck watch resume|reship|fix|ask <id> … --why=<why>`. The old `speck foreman …` forms still work the same, and speck's usage text lists only the new ones.
3. The commits speck's agent makes to a ticket start `speck(<id>): watch:`, and speck still treats a commit starting `speck(<id>): Foreman:` as the agent's own (0349), so tickets with old commits aren't looked into again.
4. The agent-only skill is `speck-watch`: installing speck, or installing it again over an older install, puts in `speck-watch` and takes out `speck-foreman`, as 0116 does for retired skills, and the brief `speck run` gives the agent names `speck-watch`. No test that passed before this change fails.

## Out of scope
- The panel's own wording (0485).
- The setting names (0487).
- The skill's text, the README and the brief (0488): this moves the skill's folder and changes its `name:`.
- File and function names inside `scripts/`, such as `foreman-agent.mjs`.
- CHANGELOG and `docs/releases/`, which record what each release said.

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: the messages in `scripts/foreman-agent.mjs`, `foreman.mjs`, `foreman-answer.mjs`, `foreman-took.mjs`, `foreman-fix.mjs`, `go-with.mjs`, `provider-build.mjs` and `run.mjs`; the commands in `scripts/speck.mjs`; `foremanSubject` in `scripts/build-records.mjs`; `skillPath` in `scripts/foreman-agent.mjs`; `RETIRED_SKILLS` in `scripts/install.mjs`.
- Unchained from 0485: this changes `scripts/` and the skill's folder, 0485 the panel's `templates/`.
- Failing before this build: none
- Self-check: kept reading old Notes lines ("chosen by the Foreman") and old commits (`speck(<id>): Foreman:`) as speck's own, with a test for each; renamed the agent's log file, as `speck run` prints its path; made `cmdWatch` a function declaration, as speck.mjs reads it while the modules load in a cycle.
- Scope: the Settings group's title is Watching here (and in the one line of `templates/panel-settings.js` that finds it), because `speck config show` prints it. The role's name in Your agents (`rolesUsing`) stays Foreman for 0485, which owns it; the CLI's refusal to remove an agent words it as "the agent speck watches with". The skill's own text, the README and the brief still say `speck foreman`, which still works (0488).
- Pictures: none, because nothing the panel draws changes: its Watching group heading and roles are 0485's.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
