---
id: "0067"
title: "Restart speck panel by itself when its code changes"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0067 · Restart speck panel by itself when its code changes

**Status:** 📋 ready

## Problem
`speck panel` keeps running the code it started with. When a shipped ticket changes the server, the open panel breaks or shows old behaviour until the user finds the process and restarts it by hand (for example, every build log read "Couldn't load the log yet" because the running server predated the log route from 0051). 0059 made a browser reload pick up page changes, but not server changes, so a reload alone isn't enough.

## Outcome
`speck panel` always runs the current code: when its code changes it restarts by itself on the same port, so a browser reload always shows the latest panel.

## Acceptance criteria
1. Within 5 seconds of any of the code files `speck panel` runs from changing on disk (for example when a ticket ships), the server is running the new code on the same port, with no command from the user: `/`, `/api/state` and any other route answer as the new code does.
2. A page left open across the restart recovers by itself, as it does from a disconnect today, and keeps what's open and the list showing. **Set ready** works from that page without reloading it.
3. Several changes close together, such as a merge that writes several files, cause at most one restart once they've settled, never one per file.
4. If the new code fails to start, the old server keeps serving, the page shows that `speck panel` couldn't restart with the first line of the error, and the next change tries again.
5. Stopping `speck panel` (Ctrl+C) stops it for good, with no process left behind, and it prints its URL once when it starts, not on every restart.

## Out of scope
- Reloading the page by itself: the user reloads to see page changes, as 0059 allows.
- Restarting `speck run` or any other command.
- Changes to `speck/config.yml`: the panel already reads tickets and ideas afresh on every request.

## Notes
- Follows 0059, which re-reads `templates/panel.html` on each page load but left server changes needing a restart.
- Today the page's token is made afresh on each start (`cmdPanel` in `scripts/speck.mjs`), so criterion 2 needs the token to survive a restart.
- In a repo set up with `speck init`, the panel runs from `.speck/scripts/`, which changes only when `init` is re-run; here it runs from `scripts/`.
- product.md's `panel` entry needs updating, including the line that 0059 added about server changes needing a restart.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
