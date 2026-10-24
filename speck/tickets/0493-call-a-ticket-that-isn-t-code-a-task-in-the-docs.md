---
id: "0493"
title: "Call a ticket that isn't code a task in the docs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0492", "0490"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T20:41:21.961Z"

---
# 0493 · Call a ticket that isn't code a task in the docs

**Status:** 🔨 building

## Problem
After 0492, speck calls a ticket that isn't code a task, with `kind: code | task`, but its skills, the brief and the README still describe document tasks and `task: document`. Agents following the skills would keep writing the old field.

## Outcome
speck's skills and docs describe `kind: code | task`, and a ticket that isn't code is a task wherever they mention it.

## Acceptance criteria
1. `skills/*/SKILL.md`, `docs/brief.md` and `README.md` name `kind: code` and `kind: task` wherever they named `task: code` or `task: document`, and none of them says "document task", "document ticket" or `task: document`, except one line in the brief saying the old `task:` field is still read.
2. The ticket skill tells the agent to set `kind: task` when the build does a job and leaves its result in `outputs/` rather than changing the project's code, such as an email draft, a plan or a report, with an `output:` folder as today (checked by review).
3. "Document" still means a file written for people to read, such as the README and `docs/`, in the rules for criteria about documents, and those rules don't change (checked by review). `CHANGELOG.md` and `docs/releases/` don't change. No test that passed before this change fails.

## Out of scope
- The code, the panel and the reviewer's prompt (0492).

## Notes
- Asked for by the user on 2026-10-24, with 0492.
- Today: `skills/speck-ticket/SKILL.md` (step 4's Task bullet), `skills/speck-build/SKILL.md` (two mentions), `docs/brief.md` (five) and the README.
- Waits for 0492 (the field it describes) and 0490, which rewrites the README after 0489 and 0491, which change the README, the ticket skill and the brief's rules for documents.
- Failing before this build: none
- Self-check: no changes. The brief's new paragraph on `kind` matches `ticketKind` and `outputProblem`; `test/ship-0355.test.mjs` now finds the brief's lines about how a task ships by the word task rather than document task.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
