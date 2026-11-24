---
id: "0726"
title: "Cap builds across every project on this machine"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:15:44.235Z"

---
# 0726 · Cap builds across every project on this machine

**Status:** 🔨 building

## Problem
`max_parallel_builds` applies to each project on its own, so several projects' speck runs can start many builds at once; five builds ran this machine out of memory. 0678 capped test runs across projects, but not builds.

## Outcome
A home-folder setting caps how many builds go at once across every project on the machine.

## Acceptance criteria
1. `speck config set machine_parallel_builds <n>` saves a limit in the home folder, as `machine_parallel_tests` is saved, and `speck config show` shows it after `max_parallel_builds`.
2. With it set to n, the speck runs of every project on this machine start no new build while n builds are running across all of them; ready tickets wait and start as builds end.
3. Each project's `max_parallel_builds` still applies within that project.
4. Unset, each project's `max_parallel_builds` alone applies, as today, and values `speck config set` refuses for `machine_parallel_tests` (such as 0) are refused the same way.
5. No test that passed before this change fails.

## Out of scope
- Showing or changing it in the panel's Settings.
- The rest of one panel for every project, which stays in the idea.

## Notes
- Failing before this build: test/tmp-cleanup.test.mjs AC1 (Node 24 no longer emits TAP `# fail 2` for a piped `node --test` child; also breaks several 0676 location parses the same way). Unchanged here. The recorded full-suite result was pass.
- Self-check: no changes (invalid home values refuse; unset leaves projects alone; a freed claim opens a slot again; adopted builds force-claim so they still count)
- Follow 0678's pattern for test turns: `scripts/home-settings.mjs` (`HOME_SETTINGS`) and its machine-wide turn-taking.
- Shares `scripts/home-settings.mjs` with the ticket that shows the machine-wide test limit in Settings; left unchained, as one adds a setting and the other adds the panel's save path.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
