---
id: "0591"
title: "Have speck's own log lines speak in the first person"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0576"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:30:56.036Z"

---
# 0591 · Have speck's own log lines speak in the first person

**Status:** 🔨 building

## Problem
In the redesign, speck speaks in the first person wherever its face appears, the Pipeline log included. Today `speck run`'s log speaks about speck in the third person, and the panel can't tell speck's own lines from the tool's.

## Outcome
`speck run`'s log gives the engineering manager's own lines in the first person, marked so the panel can tell them apart.

## Acceptance criteria
1. `speck run` writes the engineering manager's own lines in the first person, for example "0412: I'll look into it, as watch is decide: …" and "0561: I went with the recommendation: …".
2. Its lines about the tool's own work stay as they are, such as "Started 0554: speck build 0554" and "Shipped 0550.".
3. The panel can tell each line in the log that is the engineering manager's from the rest.
4. `speck status` still names the engineering manager by its chosen name (0576).
5. No test that passed before this change fails.

## Out of scope
- How the log looks (0592).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Lines today: `scripts/foreman-agent.mjs` ("speck will look into it"), `scripts/go-with.mjs`, `scripts/foreman-fix.mjs`, `scripts/split-off.mjs`; the panel reads them with `runLogLine` in `templates/panel-model.js`. Waits for 0576, which changes the same lines.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a tool line can't be taken for the manager's, as only the mark counts and a test feeds first-person words without it; a `runLogLine` result gains `speck` only on a marked line, so what it returns for the tool's lines is unchanged.
- Pictures: none, because the look of the log doesn't change here (0592 does that); only the words of the manager's lines do.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
