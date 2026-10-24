---
id: "0475"
title: "Chain tickets only when they change the same part of a file"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0475 · Chain tickets only when they change the same part of a file

**Status:** 📝 draft

## Problem
The ticket skill chains a new ticket after every open ticket that changes the same files, so they're built one after another. Two tickets that change different parts of one file, which git usually merges cleanly, still wait for each other, and most of a release's panel tickets end up in one long chain while the other build slots sit idle.

## Outcome
The ticket skill chains tickets only when they're likely to change the same part of a file, so tickets that change different parts of one file can build side by side.

## Acceptance criteria
1. The ticket skill's chaining step compares, for each file a new ticket and an open ticket are both likely to change, the parts of it each will change: the same functions, the same style rules for the same elements, or the same section of a document. It sets `after:` only when those parts overlap, or when it can't tell which parts a ticket will change (checked by review).
2. A file both change in different parts doesn't chain them. When presenting tickets, the skill says, in one line per ticket, each `after:` it set with the file and part that caused it, and each file it shares with another open ticket but left unchained, with the parts that differ (checked by review).
3. The rest of the step stays: it never makes a loop of `after:` links, changes only the new ticket, and the triage steps that make tickets from inbox notes follow it too. The copies of the skill that `speck init` installs say the same as `skills/speck-ticket/SKILL.md`.
4. No test that passed before this change fails.

## Out of scope
- `speck run` deciding by itself which tickets to build at once.
- Changing tickets that already exist.
- Splitting the panel's files (0472 to 0474), which makes this step chain less often.

## Notes
- Asked for by the user on 2026-10-24, so that more tickets build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots.
- Today: step 6 of `skills/speck-ticket/SKILL.md`, "Chain tickets that change the same files" (0205), which came from 0188 and 0189 clashing at ship on 2026-10-15.
- The risk: tickets left unchained that do clash cost a merge round when the second ships, as about a quarter of 0450 to 0467 did, at about a minute of review each. The step should chain when in doubt.
- Moved into 0.15.0 by the user on 2026-10-24, to build alongside the file splits (0472 to 0474): it changes only the ticket skill and its installed copies, which no other open ticket changes. It doesn't re-chain the tickets already queued.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
