---
id: "0543"
title: "Load the panel's files from addresses relative to the page"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-19-load-the-panel-s-font-and-icons-from-relative-addresses.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:40.767Z"

---
# 0543 · Load the panel's files from addresses relative to the page

**Status:** 🔨 building

## Problem
Opened through a proxy that puts the panel under a path, such as cptr's built-in browser at `https://<host>/api/browser/frame/<id>/http/127.0.0.1:4779/`, the panel's header shows "speck" in a plain monospace font instead of Doto's dot-matrix lettering. The stylesheet loads the font from `/fonts/Doto.ttf`, which then points at the proxy's own site root, not the panel.

## Outcome
Every file the panel's page links to, the font included, loads from an address relative to the page, so the panel looks the same under a path as at the site's root.

## Acceptance criteria
1. The page's HTML and stylesheets link to no address that starts with `/`: its stylesheets, scripts, font, icon and manifest are linked relative to the page (such as `fonts/Doto.ttf`, `panel.js`), and the manifest's own icon and start addresses are relative to it.
2. Served at the site's root, as `speck panel` serves it today, the page loads every one of those files, the header's name is drawn in Doto, and the panel works as before.
3. Served under a path by a proxy that forwards `/<prefix>/…` to the panel and nothing else, the page loads its stylesheets, scripts, font, icon and manifest from under `/<prefix>/`, and the header's name is drawn in Doto.
4. Added to a phone's home screen from either address, the app still opens the panel full screen with its icon.
5. No test that passed before this change fails.

## Out of scope
- The page's fetches and event stream (`/api/…`): they work under cptr's proxy today. Making them relative is for a later ticket if a proxy needs it.
- Any change to `speck panel`'s routes.

## Notes
- Found 2026-10-19 from speck-site: `http://127.0.0.1:4779/fonts/Doto.ttf` serves the font, while the same path under cptr's proxy host answers `text/html` (cptr's app page).
- Today: `templates/panel.html` links `/icon.svg`, `/manifest.webmanifest`, `/panel-base.css` and the other stylesheets, and `/panel-model.js` and the other scripts; `templates/panel-base.css` has `url("/fonts/Doto.ttf")`; the routes are in `scripts/panel.mjs` (`icons`, `/fonts/Doto.ttf`). A `url()` in a stylesheet resolves against the stylesheet's own address, which is at the page's level.
- Builds on 0149 (home-screen app) and 0304 (Doto in the header).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
