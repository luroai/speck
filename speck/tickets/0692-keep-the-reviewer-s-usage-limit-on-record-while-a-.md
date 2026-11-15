---
id: "0692"
title: "Keep the reviewer's usage limit on record while a stand-in reviews"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-remember-the-reviewer-s-limit-while-a-stand-in-reviews.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0692 · Keep the reviewer's usage limit on record while a stand-in reviews

**Status:** 📝 draft

## Problem
When the reviewer is held by a usage limit and a stand-in from `reviewer_bench` takes a round, the recorded round clears that build's record of the limit. Once every build's round has run on a stand-in, no record is left, so each later round asks the limited reviewer first, is refused and only then switches, and speck run's status no longer says the reviewer is waiting for its reset.

## Outcome
A reviewer's usage limit stays on record until it resets, whoever takes the rounds meanwhile.

## Acceptance criteria
1. After a stand-in has taken a round for a limited reviewer, the next round, on any ticket, goes straight to the stand-in, without starting the limited reviewer, until the reviewer's limit resets.
2. Until then, speck run's status and the panel say the reviewer is held by its limit and when it resets, as they do before any stand-in round.
3. Once the limit has reset, the next round goes to the reviewer again.
4. A blocked build is still shown under Needs you while the reviewer is limited, and a build waiting only for the reviewer's reset is carried on as today.

## Out of scope
- A stand-in that's limited too: 0693.

## Notes
- From 0649. The per-build record also marks a build as waiting to be carried on (`reviewerWaiting`), so the limit may want a record of its own, apart from the per-build one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
