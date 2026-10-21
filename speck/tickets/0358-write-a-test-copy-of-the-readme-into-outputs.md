---
id: "0358"
title: "Write a test copy of the README into outputs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: document               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-21
output: tests
started: "2026-10-21T14:24:07.849Z"

---
# 0358 · Write a test copy of the README into outputs

**Status:** 🔨 building

## Problem
The document task (0350 to 0357) has shipped, but only its own tests have checked it. No real document ticket has gone through `speck run` yet: build, review, the review pack's link, and waiting to be shipped by hand.

## Outcome
A copy of the README sits in `outputs/tests/`, written and reviewed as a document task, and the ticket waits approved for the user.

## Acceptance criteria
1. `outputs/tests/README.md` in the main checkout has exactly the same text as the project's `README.md` as it is on the base branch when the build starts.
2. The build writes no other file in `outputs/tests/`, and the ticket's branch changes no file outside `speck/`.
3. The project's own `README.md` is unchanged.

## Out of scope
- Any change to the README's wording: this is a copy.
- Fixing anything the run turns up: capture it as a follow-up instead.

## Notes
- A trial run of the document task, asked for by the user 2026-10-21, to test on the Linux box before writing real documents.
- Document tasks never auto-ship (0355), so this one should stop at approved. Then try the review pack's link (0354), `speck changes` or "Ask for changes" (0356, 0357), and `speck ship` (0355).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
