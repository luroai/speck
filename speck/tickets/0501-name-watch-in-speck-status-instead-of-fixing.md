---
id: "0501"
title: "Name watch in speck status instead of Fixing"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-name-watch-in-speck-status-s-fixing-line.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T12:40:34.799Z"

---
# 0501 · Name watch in speck status instead of Fixing

**Status:** 🔨 building

## Problem
`speck status` still prints `· Fixing on` after the Foreman's word and a `Fixing: fix. …` line when `watch` is `fix`. Since 0487 the setting is called `watch`, and nothing else calls it Fixing, so someone reading `speck status` can't tell which setting the line is about. It's the last of the old names in what speck prints.

## Outcome
`speck status` names the `watch` setting where it said Fixing.

## Acceptance criteria
1. With `watch: fix`, `speck status`'s first line is `SPECK: <word> · watch: fix`, and the line under it is `  watch: fix. ` followed by what `fix` does, as it says today.
2. With `watch: tell` or `watch: off`, the first line is `SPECK: <word>` with nothing after it, as today.
3. `speck status` prints `Fixing` nowhere. The panel's `Fixing` stage word for a build fixing review findings doesn't change. No test that passed before this change fails.

## Out of scope
- `speck status --json`, and what each value of `watch` does.

## Notes
- From the inbox note, raised while building 0487.
- Today: the lines in `scripts/foreman.mjs` (`FIXING_SAYS`, and the status lines near its 0317 comment). Tests that match `Fixing` in status output: `test/foreman-0317.test.mjs`, `test/pipeline-0458.test.mjs`.
- Asked for by the user on 2026-10-25, before releasing 0.15.0.
- Failing before this build: not checked
- Self-check: no changes (an unknown watch value is read as tell, so it shows the word alone; old release notes and the changelog keep Fixing as history).
- Pictures: none, because nothing in the panel changes; only the `speck status` text does.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
