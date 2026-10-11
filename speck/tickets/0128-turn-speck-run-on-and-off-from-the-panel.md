---
id: "0128"
title: Toggle speck run from the panel                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0127"]              # ticket ids that must be done first
created: 2026-10-11

---
# 0128 · Toggle speck run from the panel

**Status:** 📝 draft

## Problem
To start or stop `speck run` today, the user has to go to a terminal on the box. From the panel, often opened remotely, they can see the queue but can't set it going or stop it.

## Outcome
The panel has one button that turns `speck run` on when it's off and off when it's on.

## Acceptance criteria
1. While speck run is off, the panel shows a button to turn it on. Clicking it starts `speck run` for the repo, and the panel then shows speck run as on.
2. A `speck run` started from the panel keeps running after the page is closed and after the `speck panel` process stops.
3. While speck run is on, the panel shows a button to turn it off. Clicking it stops `speck run` the same way Ctrl-C does: builds already running carry on, and the panel then shows speck run as off. This works for a `speck run` started from a terminal as well as one started from the panel.
4. If `speck run` refuses to start (for example, no `build_command` in `speck/config.yml`, or the checkout isn't on the base branch), the panel shows speck run's own error message and speck run stays off.
5. A request to turn speck run on or off without the panel's token, or from another origin, is refused with 403 and changes nothing, as the panel's other writes are.

## Out of scope
- Showing `speck run`'s on/off state: that's 0127, which this builds on.
- Showing `speck run`'s own output in the panel. It's written to a file under `speck/.cache/runs/` so it isn't lost.
- Changing what `speck run` does once started (max_parallel_builds, which tickets it picks).

## Notes
- Risk is high because this starts a process that launches agents with `build_command` (by default with every permission prompt skipped) from an HTTP request. It must use the same token and Origin checks as the existing panel writes.
- `speck run` already stops cleanly on SIGINT or SIGTERM and leaves its builds running (`scripts/run.mjs`).
- Checked 2026-10-11: a child started with `spawn(..., { detached: true })` and `child.unref()`, with stdio not piped to the parent, keeps running after the parent exits on Linux (Node.js `child_process` docs, `options.detached`; installed Node v22.23.3).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
