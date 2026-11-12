---
id: "0664"
title: "Skip full runs for commits that change only speck's notes"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-12

---
# 0664 · Skip full runs for commits that change only speck's notes

**Status:** 📋 ready

## Problem
speck run starts a full run of `commands.test_full` for every new commit on the base branch, including commits that only set a ticket ready, write a ticket or file an idea note. Those runs test the same code as the last one, so they take the machine's time and memory away from builds for nothing.

## Outcome
speck run starts a full run only when the newest commit changes something other than tickets and idea notes since the last full run.

## Acceptance criteria
1. When every file that differs between the base branch's newest commit and the newest commit with a recorded full run is under `speck/tickets/` or `speck/ideas/`, speck run doesn't start a full run of the newest commit.
2. When any other file differs, including a file elsewhere under `speck/` such as `speck/config.yml`, speck run starts a full run of the newest commit as it does today.
3. A skipped commit counts as having the result of the commit it was compared with: while that run failed, the full suite still shows as failing under Needs you, in `speck status` and in speck run's log, naming the commit that ran, and the fix ticket from 0658 isn't made a second time. While that run passed, nothing shows as failing.
4. With no recorded full run on the base branch, speck run starts one as it does today.

## Out of scope
- Making the folders that are skipped a setting.
- Running the full suite less often in other ways, such as once an hour or only before a release.
- Builds' and ships' own test runs, which don't run the full suite.

## Notes
- Some of this repo's tests read its own `speck/tickets/done/`, such as the Built with speck figures check, so a ticket-only change is tested by the next full run that a code change starts, rather than on its own. That's accepted: ships change code, so it isn't long.
- The trigger is `fullSuiteQueue`'s `check` in `scripts/full-suite.mjs`. The commit with a recorded result is found as `recordedAt` and `latestFull` find it now.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
