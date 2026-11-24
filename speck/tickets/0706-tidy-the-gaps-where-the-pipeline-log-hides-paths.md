---
id: "0706"
title: "Tidy the gaps where the Pipeline log hides paths"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-tidy-the-gaps-where-the-pipeline-log-hides-paths.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0706 · Tidy the gaps where the Pipeline log hides paths

**Status:** 📝 draft

## Problem
When the Pipeline log takes a file path or command out of a line, the sentence around it can read oddly, such as "Conflicting files:" with nothing after it, or "Resume its session, or run 0457, to carry on." Someone reading on a phone can't tell what was meant.

## Outcome
Every Pipeline log line still reads as a whole sentence after paths and commands are taken out.

## Acceptance criteria
1. For each of these lines as speck writes them today, the Pipeline log shows a sentence with no colon left with nothing after it, no "run", "in", "into" or "of" left with nothing after it, and no "run <id>" where a command was: the merge conflict at ship (`scripts/ship.mjs`), a stopped build's resume line and the paused line (`scripts/run.mjs`), the "Last lines of" line (`scripts/run.mjs`), the cancelled build's filed line (`scripts/cancelled-build.mjs`), the app's uncommitted-changes and `app_url` lines (`scripts/app.mjs`), and the watch agent's "Its log:" line (`scripts/foreman-agent.mjs`).
2. Where a removed path or command carried meaning, the line says what it was in a few words, such as "the conflicting files" or "its build", or leaves out the clause that held it.
3. A line with no path or command in it reads as it does today.
4. No test that passed before this change fails.

## Out of scope
- Showing full paths in the Pipeline log.

## Notes
- The stripping is `runPlain` in `templates/panel-model.js`; its `\bLog:` rule is case-sensitive, so "Its log:" is left behind. Fixing it in `runPlain` or in the source messages is the builder's choice.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
