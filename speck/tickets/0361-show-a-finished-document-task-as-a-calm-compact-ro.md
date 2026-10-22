---
id: "0361"
title: "Show a finished document task as a calm, compact row"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22

---
# 0361 · Show a finished document task as a calm, compact row

**Status:** 📝 draft

## Problem
When a document task's build finishes, its queue row is purple and grows to show "Build finished without shipping" and the last 50 lines of the build's log, in a red-tinted box. It reads like a problem, though the task is done and its document is waiting to be read. Opening the row shows the log a second time, and four or five of these rows together look cluttered.

## Outcome
A document task whose build has finished shows as a short row that says it's finished, with a button to its review pack, where the document is.

## Acceptance criteria
1. In the queue, a ticket with `task: document` and status `approved`, whose build has exited and that isn't shipping, shows its id, title, tags and progress as now, with "Finished · read the document" as its progress sentence in place of "Approved · waiting for you to ship it". It has no "Build finished without shipping" line and no box with the build log's last lines, whether the row is open or closed.
2. That row shows a "Review pack" button while it's closed. Clicking it opens the ticket's review pack, as the Review pack button in an open row does today, with the document's files at the top, and doesn't open or close the row.
3. Opening that row shows the Full ticket and Review pack buttons and the build log, once each, and nothing else that repeats the log.
4. A code ticket, and a document task that's blocked, building, reviewing, shipping, or whose build stopped before finishing or stopped unexpectedly, look exactly as they do today.
5. No test that passed before this change fails, except checks that an approved document task with an exited build shows "Build finished without shipping" or its log's last lines, which are changed to check AC1.

## Out of scope
- Code tickets waiting for you to ship them. They keep today's line and log box.
- The row's purple, which still marks a ticket waiting for you.
- The review pack itself, and how a document task ships (0355).

## Notes
- Today's row comes from `queueItem` and the `exit_label` and `exit_message` fields in `templates/panel.html`. `exit_message` is `build_exit.message`, the log's last 50 lines (0045). The box is `.question.exit.to-ship`: a purple left edge on `.question`'s red-tinted background (0138).
- A document task never ships by itself, whatever `auto_ship` says, so every finished one ends up like this.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
