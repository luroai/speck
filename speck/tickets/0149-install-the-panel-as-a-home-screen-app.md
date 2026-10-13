---
id: "0149"
title: "Install the panel as a home-screen app"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-13T20:35:06.447Z"

---
# 0149 · Install the panel as a home-screen app

**Status:** 🔨 building

## Problem
The user opens the panel on their phone many times a day, through a private tunnel. Added to the home screen today, it has no proper name or icon and opens with the browser's address bar, and it doesn't carry speck's logo.

## Outcome
The panel can be added to a phone's home screen as an app: it opens full screen, named "speck", with the speck logo as its icon.

## Acceptance criteria
1. The panel serves a web app manifest at `/manifest.webmanifest` (content type `application/manifest+json`) with `name` and `short_name` both "speck", `start_url` and `scope` of `/`, `display` of `standalone`, `background_color` and `theme_color` from the panel's colours, and PNG icons at 192 × 192 and 512 × 512.
2. The page links the manifest with `crossorigin="use-credentials"`, so a browser fetches it with the same login cookies as the page, and also has an `apple-touch-icon` (180 × 180 PNG), `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` ("speck") and a `theme-color` meta tag. The browser tab gets speck's icon instead of a blank one.
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
- The logo is the open ensō circle with a red dot at its centre, as in the landing site's hero art and favicon (`site/index.html` in luroai/speck-site). At viewBox 0 0 64 64:
  - the ensō: `M18.5 14.1 A22 22 0 1 0 28.5 10`, stroke `#141413`, round caps, no fill (a circle of radius 22 round 32,32, open at the top left, scaled from the hero's `M128 196 A150 150 0 1 0 196 168`)
  - the dot: `circle cx=32 cy=32 r=2.5`, fill `#b0412e`
- The icons draw that logo centred on a solid `#faf9f5` background (no transparency, which iOS shows as black), with the strokes thick enough to read at 180 px. Commit the source SVG to the repo alongside the PNGs.
- Every project's panel is called "speck", so several projects on one home screen share a name; that's accepted.
- Checked 2026-10-13: current guidance still has iOS taking its home-screen icon from `apple-touch-icon`, with manifest icons used by Android and desktop; Apple's own docs didn't confirm either way. Both are given, so either works.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
