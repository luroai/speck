---
id: "0506"
title: "Keep private words out of what speck writes under speck/"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-25

---
# 0506 · Keep private words out of what speck writes under speck/

**Status:** 📋 ready

## Problem
A shipped ticket published the user's machine username: a reviewer quoted an absolute path under the user's home folder as its evidence, and speck wrote that into the ticket's review rounds. Nothing caught it. The private-words test skips `speck/`, so a test result can be reused while only `speck/` changes (0112), and `speck lint` checks a ticket for private words and the home folder's path (0083, 0121) only when it's linted, before the build, not the review rounds, notes and logs written into it afterwards. The user had to rewrite the repo's public history on 2026-10-25 to remove it.

## Outcome
Nothing speck commits under `speck/` publishes a private word or the user's home folder path.

## Acceptance criteria
1. When speck writes text into a ticket (a review round's verdict, findings and evidence, the self-check, notes, the review and delivery logs), it writes any path under the user's home folder as a `~/` path, for example `~/projects/app/outputs/tests/README.md` for the same file under the home folder.
2. `speck ship <id>` refuses, changing nothing, when any file under `speck/` that the ticket's branch adds or changes contains one of the words in `~/.config/speck/private-words` (case-insensitive) or the user's home folder path. Its message names each file and line, without repeating the word, and says to take it out. Without a private-words file, it checks only the home folder path.
3. The ship queue in `speck run` treats that refusal as one the build can fix, handing the ticket back to its build's session with the message, as it does for a ship refused for a failing test.
4. A ship whose `speck/` files contain neither ships as before, and `test/support/private-words.mjs` still skips `speck/` (0112). No test that passed before this change fails.

## Out of scope
- Rewriting history or files already committed.
- Idea notes committed by `/speck-capture` or triage on the base branch, outside a ship.

## Notes
- Asked for by the user on 2026-10-25, before posting speck on Reddit: "fix the private words check". The leak was in `speck/tickets/done/0358-…`, in a review round's evidence.
- Today: `homePathWarnings` and the private-words check in `scripts/lint.mjs` (0083, 0121), which this can reuse; review rounds are written by `scripts/review.mjs`; ship's checks are in `scripts/ship.mjs`; the ship queue's hand-backs in `scripts/ship-queue.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
