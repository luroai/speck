---
id: "0189"
title: "Stream an open build log as it's written"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0188"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:50:15.421Z"

---
# 0189 · Stream an open build log as it's written

**Status:** 🔨 building

## Problem
An open build log is asked for every second, and each time the panel reads and converts the whole log again, up to 2.5 MB, even when nothing has been added, and even after the build has ended.

## Outcome
An open build log shows new lines as they're written, without the page asking on a timer.

## Acceptance criteria
1. An open build log shows each new entry within 1 second of the build writing it, and the page doesn't ask for the log on a timer.
2. Opening a log shows its last 200 entries straight away, with their times, as it does today.
3. Each update carries only the new entries, and the panel doesn't read the whole log again for each one.
4. A log whose build has ended gets no more updates until a new build of that ticket starts.
5. No test that passed before this change fails, except checks that the page asks for an open log every second, which change to check criterion 1.

## Out of scope
- Logs of builds not started by `speck run`.

## Notes
- `panelLog()` in `scripts/panel.mjs` reads the whole log and runs `readableLog()` over it. A build writes one JSON event per line, and a line can arrive in more than one write, so only whole lines are converted.
- Use the stream 0187 sets up, so a page holds one connection (see 0187's Notes).
- Covers the open-log part of 0179, which 0187 and this ticket replace, and the idea note `speck/ideas/done/2026-10-09-stop-asking-for-a-log-once-its-build-has-ended.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
