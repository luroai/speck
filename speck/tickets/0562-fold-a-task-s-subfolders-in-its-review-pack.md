---
id: "0562"
title: "Fold a task's subfolders in its review pack"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0561"]                # ticket ids that must be done first
created: 2026-10-29

---
# 0562 · Fold a task's subfolders in its review pack

**Status:** 📋 ready

## Problem
In a task's review pack, every file in its output folder, however deep, is its own button labelled with its path from the project root. A research run with dozens of files in a subfolder becomes a long wall of buttons, and on a phone the repeated `outputs/<folder>/` at the start of each label takes a line of its own.

## Outcome
A task's review pack lists the files at the top of its output folder one by one, and each subfolder as one folded row, with each file named from inside the output folder.

## Acceptance criteria
1. In the panel's review pack for a task, each file at the top of its output folder is a row labelled with its name alone, and each folder directly inside the output folder is one row, folded at first, giving its name and how many files it holds however deep, for example `imports/ · 48 files` (`1 file` for one).
2. Pressing a folder's row unfolds it to a row for each file it holds however deep, labelled with its path inside that folder, in the same order as today, and pressing it again folds it. Each file's row opens it as today's buttons do: a Markdown file formatted in the panel, any other in a new tab.
3. Each file's row shows its full path from the project root as its tooltip.
4. A folder's row can be reached and pressed with the keyboard, and tells a screen reader whether it's unfolded.
5. No test that passed before this change fails.

## Out of scope
- `speck pack`'s Result list in the terminal, which keeps listing every file.
- The summary and where the Ship part goes (0561).

## Notes
- Asked for 2026-10-29, for the 0.21.1 patch release: a research task's review pack listed dozens of log files, each as its own button above Ship, so the user had to scroll past all of them to ship it.
- Waits for 0561: both change `documentsPart` in `templates/panel-popups.js` and the `.pack-documents` styles in `templates/panel-popups.css`. The summary's "Start here" row stays first, as 0561 leaves it, and isn't counted in a folder.
- The panel is a phone-width column (keep it thin): the rows are for a narrow screen first.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
