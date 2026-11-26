---
id: "0773"
title: "Keep test summaries working on Node 24"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-keep-test-summaries-working-on-node-24.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26

---
# 0773 · Keep test summaries working on Node 24

**Status:** 📋 ready

## Problem
speck reads `node --test` output as TAP to say which test files failed and what to run next. On Node 24 the default output is the spec reporter, so a failing `speck test --related` run ends without the command to run next and the reviewer gets the whole output.

## Outcome
`speck test`'s summary of a failing run works whether `node --test` prints TAP or Node's spec reporter.

## Acceptance criteria
1. For a failing run of `node --test {files}` printing Node's spec reporter (as Node 24 does by default), `speck test --related` ends with the failing files and the command to run only them, as it does for TAP.
2. The reviewer's summary of the run names the same failing tests from either output.
3. A passing run is recognised as passing from either output.
4. No test that passed before this change fails.

## Out of scope
- Changing a project's test command.

## Notes
- From 0741's note, checked with Node 24.18.1 (bundled with Cursor's server). This repo's `commands.test_files` is `node --test {files}`.
- Decision: read the spec reporter's output too, rather than adding `--test-reporter=tap` to every project's settings.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
