---
id: "0149"
title: "Install the panel as a home-screen app"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-use-the-panel-from-your-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0148"]                # ticket ids that must be done first
created: 2026-10-13

---
# 0149 · Install the panel as a home-screen app

**Status:** 📝 draft

## Problem
The user opens the panel on their phone many times a day, through a private tunnel. Added to the home screen today, it has no proper name or icon and opens with the browser's address bar, and with a panel per project the icons can't be told apart.

## Outcome
The panel can be added to a phone's home screen as an app: it opens full screen, with speck's icon and a name that says which project it is.

## Acceptance criteria
1. The panel serves a web app manifest at `/manifest.webmanifest` (content type `application/manifest+json`) with `name` and `short_name` that include the project's folder name (for example "speck · speck-site" and "speck-site"), `start_url` and `scope` of `/`, `display` of `standalone`, `background_color` and `theme_color` from the panel's colours, and PNG icons at 192 × 192 and 512 × 512.
2. The page links the manifest with `crossorigin="use-credentials"`, so a browser fetches it with the same login cookies as the page, and also has an `apple-touch-icon` (180 × 180 PNG), `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` (the project's folder name) and a `theme-color` meta tag. The browser tab gets speck's icon instead of a blank one.
3. The manifest and icons are served under the same address checks as the page: from `127.0.0.1`, `localhost` and the `--url` address (0148), and refused with 403 from any other Host. Neither contains the panel's token.
4. In a browser, the page reports no manifest errors, and the manifest's icons load.
5. No test that passed before this change fails.

## Out of scope
- A service worker or working offline.
- Notifications.
- Setting up the tunnel or Cloudflare Access.

## Notes
- Cloudflare Access only lets requests through with its login cookie, and browsers fetch a manifest without cookies unless it's linked with `crossorigin="use-credentials"`; without it the manifest request gets Access's login page and the install quietly falls back.
- On iPhone, a home-screen app keeps its own cookies, so it signs in to Access once by itself.
- The icon follows speck's mark: the ensō circle with the red dot, as in the landing site's favicon.
- Unverified: whether current iOS uses the manifest's icons or only `apple-touch-icon` (both are given, so either works).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
