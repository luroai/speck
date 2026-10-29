---
id: "0561"
title: "Start a task's review pack with its summary"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:21:47.485Z"

---
# 0561 · Start a task's review pack with its summary

**Status:** 🔨 building

## Problem
A task that leaves many files, such as a research run with dozens of logs, shows each one as a button at the top of its review pack, above Ship, with nothing to say which to read first. A task always waits for you to ship it, so you scroll past every file each time, especially on a phone, and have no starting point for checking the work.

## Outcome
A task's build writes a summary of its result at the top of its output folder, and the task's review pack opens with that summary, then Ship, then the rest of its files.

## Acceptance criteria
1. The `speck-build` skill's section on tasks tells the build to write `summary.md` at the top of the ticket's output folder, and to keep it up to date in later rounds. It says the summary gives what the task found or made, which files to read and which are only supporting material (checked by review).
2. In the panel's review pack for a task whose output folder has a file named `summary.md` (in any case) at its top, that file's button comes first, labelled "Start here", and pressing it shows it formatted, as other Markdown files are. The Ship part (Ship, or what stands in its place) comes straight after it, and the task's other files after that.
3. A task with no `summary.md` at the top of its output folder shows its files as today, above the Ship part. A `summary.md` inside a subfolder isn't taken as the summary.
4. `speck pack <id>` lists the summary first under Result when the task has one, and otherwise lists the files as today. A code ticket's pack is unchanged.
5. No test that passed before this change fails.

## Out of scope
- Folding subfolders and shortening the files' labels (0562).
- Writing summaries for tasks built before this ships.
- Making a summary required: a task without one still ships.

## Notes
- Asked for 2026-10-29, for the 0.21.1 patch release: a research task's review pack listed dozens of log files, each as its own button above Ship, so the user had to scroll past all of them to ship it.
- Decided with the user: the Ship part sits under the summary and above the other files, so the list never stands between the summary and Ship.
- Today: `documentsPart` in `templates/panel-popups.js` puts every file above `shipPart`; the files come from `panelDocuments` and `documentLines` in `scripts/output.mjs`. The skill is `skills/speck-build/SKILL.md`, section 2's paragraph on a task. If `docs/brief.md` describes a task's review pack, it's updated to match.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
