---
id: "0422"
title: "Show a build log like a log"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0421"] # ticket ids that must be done first
created: 2026-10-23

---
# 0422 · Show a build log like a log

**Status:** 📋 ready

## Problem
The build log is how you see that a build is really moving, like watching the model work. But it's one block of plain monospace text: times, tool calls, the agent's messages and failures all look the same, and a long line that wraps starts again at the left edge, so it reads as a new entry.

## Outcome
The build log reads like a log: times in a column of their own, each kind of entry in its own colour, and wrapped lines indented under their entry.

## Acceptance criteria
1. Each entry's time (`HH:MM:SS`) is in a column of its own, in the muted colour, and the entry's text starts after it.
2. Tool calls (lines starting `→`), the agent's messages, failures (`✗ exit code <n>` and `Build ended: …`) and speck's own note that earlier lines aren't shown each have a colour of their own. Each colour has a contrast of at least 4.5:1 against the log's background, in both the light and the dark look.
3. When an entry's text wraps, and when an agent message runs over several lines, every line after the first starts where the entry's text starts, past the time column, so the entry reads as one block. A blank line between two messages shows as one gap.
4. Selecting and copying the log still gives its plain text with the times, and the log keeps its scroll place through the refresh, as today.

## Out of scope
- What goes into the log (`scripts/build-log.mjs`).
- The pipeline log (0415).

## Notes
- The user asked for this on 2026-10-23. It's what they use most to trust that work is moving.
- The lines come from `readableLog` in `scripts/build-log.mjs` (0291, 0340, 0341, 0342). The panel shows them with `logText` and `showLog` in `templates/panel.html`.
- Waits for 0421: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
