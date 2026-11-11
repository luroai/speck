---
id: "0643"
title: "Read Cursor's usage from its usage screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0642"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:50:18.333Z"

---
# 0643 · Read Cursor's usage from its usage screen

**Status:** 🔨 building

## Problem
Cursor reports its usage nowhere speck can read it from a run: only its interactive `/usage` screen shows it. Without it, speck can't tell how much of Cursor's monthly allowance is left.

## Outcome
speck reads Cursor's usage from its `/usage` screen and keeps it as it keeps Claude's and Codex's.

## Acceptance criteria
1. `speck agents` reads Cursor's usage, when Cursor's CLI is installed and signed in, by opening its interactive agent with no prompt, showing `/usage` and closing it, so no model runs: the plan, when it resets, how much of the included usage, Auto and API is used as a percentage, and the on-demand spend and limit.
2. It keeps that reading as 0642 keeps the others, and reads it again only when the last reading is more than 10 minutes old, or after a Cursor run speck started ends.
3. When the screen can't be read within 20 seconds, or doesn't show what it expects, speck keeps the last reading, says in one line why it couldn't read a new one, and stops everything it started.
4. speck still needs no packages: it works on Linux and macOS with what the system has.
5. No test that passed before this change fails.

## Out of scope
- Estimating Cursor's usage from the tokens speck records.

## Notes
- Checked 2026-11-11 (Cursor CLI 2026.11.11): `/usage` in the interactive `agent` shows `Usage • Premium`, `Resets 12 Nov`, rows Included, Auto and API with `N% used`, and `On-Demand $0` with `No monthly limit`, without a model turn. In print mode (`agent -p`) `/usage` is sent to the model as a prompt, `agent usage` is taken as a prompt too, and `agent about --format json` gives only `subscriptionTier`.
- It was read by hand through a pseudo-terminal and a terminal emulator. Node has no pseudo-terminal of its own: `script` (util-linux on Linux, BSD `script` on macOS, with different flags) gives one, and the screen's drawing codes have to be followed to read the text.
- Cursor can change this screen in any release, so a test with a recorded screen should fail loudly when the parser no longer finds the rows.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
