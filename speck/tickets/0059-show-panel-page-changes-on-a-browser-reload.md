---
id: "0059"
title: "Show panel page changes on a browser reload"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:18:33.948Z"

---
# 0059 · Show panel page changes on a browser reload

**Status:** 🔨 building

## Problem
`speck panel` reads `templates/panel.html` once when it starts and keeps sending that copy. After a ticket that changes the page ships, the user has to find and restart the panel process before a browser reload shows the change, which is easy to miss and looks like the ticket didn't work.

## Outcome
Reloading the panel in the browser shows the current `templates/panel.html`, without restarting `speck panel`.

## Acceptance criteria
1. With `speck panel` running, editing `templates/panel.html` and then requesting `/` returns the edited page, with the repo name, base branch and token filled in as before.
2. The token in the page stays the same across reloads for the life of the server, so **Set ready** works from a page loaded before or after the edit.
3. If `templates/panel.html` can't be read when `/` is requested (for example, it's missing), the server replies 500 with a plain-text reason naming the file and keeps running; `/api/state` still works.
4. `/api/state` and the 2-second refresh behave as before.

## Out of scope
- Changes to the server code (`scripts/speck.mjs`, such as new `/api/state` fields): those still need `speck panel` restarted.
- Reloading the page by itself, or a reload button or notice in the panel.
- Watching files or restarting the server automatically.

## Notes
- Today the page is read in `cmdPanel` in `scripts/speck.mjs`, before the server starts.
- product.md's `panel` entry needs to say page changes show on a reload, and server changes need a restart.
- Self-check: the placeholders are now filled with replacement functions, so a page or repo name containing `$&` or `$1` is served as written (test added); a `panel.html` that is a folder also gives the plain-text 500 (test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
