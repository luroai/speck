---
id: "0742"
title: "Steady the 0289 killed-Codex-build test's reads"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-24-steady-the-0289-killed-codex-build-test-s-reads.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:12:03.167Z"

---
# 0742 · Steady the 0289 killed-Codex-build test's reads

**Status:** 🔨 building

## Problem
"0289 AC3: speck run resumes a killed Codex build in its own session" failed in 0711's related run with `Unexpected end of JSON input` on a busy machine, and passed again alone. Its fake `codex` writes each call's file with a plain write while the test reads the folder, so it can read a half-written file.

## Outcome
The 0289 test never reads a half-written call file.

## Acceptance criteria
1. The 0289 AC3 test passes 10 runs out of 10 while the machine is under heavy load.
2. It still fails when speck run doesn't resume the killed build in its own session.
3. No test that passed before this change fails.

## Out of scope
- Other tests with fake agents.

## Notes
- `calls()` and `read()` in `test/run-codex-0289.test.mjs`, about line 45; `until()` about line 174.
- Failing before this build: none
- AC1: 10 of 10 runs of the 0289 killed-build test passed with 48 busy loops on 16 CPUs (load average 55).
- AC2: with the session id taken out of `codexResumeArgv`, the 0289 killed-build test failed; the code was then put back.
- AC3: no test of its own; the related run and ship's suite check it.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
