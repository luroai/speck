---
id: "0774"
title: "Write the other fake agents' call files whole"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-write-the-other-fake-agents-call-files-whole.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:57:36.883Z"

---
# 0774 · Write the other fake agents' call files whole

**Status:** 🔨 building

## Problem
The fake agents in several `speck run` tests write each call file with a plain write while the test reads the folder, so on a busy machine a test can read half a file and fail for no real reason. 0742 fixed this for the 0289 fake only.

## Outcome
Every fake agent in speck's tests writes its call files so a reader never sees half of one.

## Acceptance criteria
1. The fake agents in run-0110, run-0194, run-cursor-0290, run-builder-0312, run-settings-0549, machine-builds-0726 and `test/support/provider-builder.mjs` write each call file under another name and rename it into place, as the 0289 fake does since 0742.
2. No fake agent in `test/` writes a file another part of its test reads while it runs with a plain write.
3. No test that passed before this change fails.

## Out of scope
- Tests that don't use a fake agent.

## Notes
- From 0742's build. None of these has been seen to fail this way yet.
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
