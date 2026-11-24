---
id: "0741"
title: "Fix tmp-cleanup's check for Node's default reporter"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-24-fix-tmp-cleanup-for-nodes-default-reporter.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:12:02.545Z"

---
# 0741 · Fix tmp-cleanup's check for Node's default reporter

**Status:** 🔨 building

## Problem
`test/tmp-cleanup.test.mjs` AC1 AC2 expect TAP's `# fail 2` from a nested `node --test` run, but Node's default reporter prints `ℹ fail 2` when its output is captured. Every `speck test --files` run includes this check, so five builds on 2026-11-24 saw it fail for no fault of their own and spent review rounds explaining it.

## Outcome
tmp-cleanup's checks, and related-0676's failing-run check, pass whatever reporter Node uses by default.

## Acceptance criteria
1. `test/tmp-cleanup.test.mjs` AC1 and AC2 pass on the Node this machine runs, when the temporary folder is cleaned up, and still fail when it isn't.
2. related-0676's AC1 tests, which read a failing run's fail count, pass on the same Node.
3. No test that passed before this change fails.

## Out of scope
- Other tests, which already pass `--test-reporter=tap` to the runs they read.

## Notes
- Failing before this build: none
- The recorded result is from Node 22.23.3, which prints TAP when piped. The failures show on Node 24.18.1 (the one bundled with Cursor's server, `~/.cursor-server/bin/`), checked there before and after.
- Self-check: no changes
- Raised by the builds of 0719, 0720, 0722, 0724 and 0727; their four other notes are dropped as duplicates of this one.
- Other tests that read `# fail` already spawn their fixture with `--test-reporter=tap`, which may be the simplest fix.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
