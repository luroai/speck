---
id: "0492"
title: "Call a ticket that isn't code a task"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0492 · Call a ticket that isn't code a task

**Status:** 📋 ready

## Problem
A ticket that isn't a code change is called a "document task" (`task: document`), but its build can do any job whose result it leaves in `outputs/`: an email draft, a plan, a report or research. "Document" undersells it, and the same word also means the README and `docs/` in speck's rules for acceptance criteria.

## Outcome
A ticket is code or a task, `kind: code | task`, and everything speck shows people calls a ticket that isn't code a task.

## Acceptance criteria
1. A ticket's kind is `kind: code` (the default) or `kind: task`. `speck new` and `templates/ticket.md` write `kind: code`, with the comment `# code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)`. `speck lint` refuses any other value, and a `kind: task` ticket needs a valid `output:` as a document ticket does today.
2. A ticket with only `task: code` or `task: document` works exactly as one with `kind: code` or `kind: task`, and where a ticket has both, `kind` wins. speck never rewrites a ticket's old line itself.
3. Nothing speck prints, nothing the panel shows (text, tags, tooltips, accessible names and the review pack) and nothing the reviewer's prompt says for a task ticket calls it a document task or document ticket, or calls its result a document. The panel's tag for one reads `task`, with the tip `Task: the build does a task and leaves its result in outputs/, not code`, and a finished one's closed card reads `Read the result`.
4. A task ticket's build, review, review pack with its links to its files, `speck output`, and waiting for you to ship it all work as before. No test that passed before this change fails.

## Out of scope
- The skills, `docs/brief.md` and the README (0493).
- The `outputs/` folder and the `output:` field, which keep their names.
- "Document" in speck's rules for criteria about the README and `docs/`, which keeps that meaning.

## Notes
- Asked for by the user on 2026-10-24: rename "documents" on tickets to "Task", "because I think the document support actually does it all already". The user chose `kind: code | task`, with the old `task:` lines still read, over changing only the words people read.
- Today: `TASKS` and `ticketTask` in `scripts/core.mjs`, `scripts/lint.mjs`, `scripts/output.mjs`, `scripts/pack.mjs`, `scripts/review.mjs`, `scripts/ship.mjs` (a document task waits for you to ship it), `scripts/pr-ship.mjs`, `scripts/panel.mjs`, the `speck output` line in `scripts/speck.mjs`'s usage, `templates/ticket.md`, `templates/reviewer-document.md`, and in the panel `taskTag` and the card's kind in `templates/panel.js`, the `Finished · read the document` words in `templates/panel-model.js`, and the pack's file links in `templates/panel-popups.js`.
- One ticket has `task: document` today: `speck/tickets/done/0358-…`. Every other ticket file has `task: code`.
- Unchained: 0489 changes only the first line of `speck help` and the comment at the top of `scripts/speck.mjs`, and 0491 the reviewer prompt's point 2 in `templates/reviewer-prompt.md`, not `reviewer-document.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
