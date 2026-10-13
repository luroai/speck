---
id: "0149"
title: "Install the panel as a home-screen app"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-13T20:41:21.293Z"

---
# 0149 · Install the panel as a home-screen app

**Status:** 👍 approved

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
- The PNG icons are drawn from `templates/icons/icon.svg` by `test/support/icons.mjs` (no image tools are installed here); a test checks each committed PNG is exactly what it draws, and that headless Chrome's own drawing of the SVG matches the 180 px icon. Stroke width 5 (of 64), so the ensō reads at 180 px.
- Self-check: no changes

## In plain words
The panel can now be added to a phone's home screen as an app. It opens full screen without the browser's address bar, is called "speck", and has speck's logo (the open ink circle with a red dot) as its icon. The browser tab shows the logo too, instead of a blank icon.

To see it, open the panel on your phone through your private address, then use "Add to Home Screen" (Safari's share menu, or Chrome's menu), and open it from the new icon. On iPhone, the home-screen app keeps its own login, so it asks you to sign in to your tunnel once by itself.

Worth keeping an eye on: the colour of the phone's top bar follows the phone's own light or dark setting, not the look chosen with the panel's button. Every project's panel is called "speck", so several on one home screen share a name.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 108,471
- Elapsed since build started: 6 min
- Changed lines: 47 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The phone's top-bar colour follows the system setting, not the panel's light/dark button: speck/ideas/2026-10-13-match-the-phone-s-top-bar-to-the-panel-s-chosen-look.md.
- Known limit: the icons are served with `Cache-Control: no-store`, like every panel response; phones keep their own copy once added, so this costs nothing in practice.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a7d8b931c4bf814ac817417a148c04f1b7422592",
    "thread_id": "01a136fe-de8f-7a81-a5d6-11243f21457d",
    "seconds": 30,
    "usage": {
      "input_tokens": 107661,
      "cached_input_tokens": 66432,
      "cache_write_input_tokens": 0,
      "output_tokens": 810,
      "reasoning_output_tokens": 21
    },
    "saved_at": "2026-10-13T20:41:04.910Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/icons/manifest.webmanifest supplies all required fields and panel colours. scripts/panel.mjs panelServer serves the correct content type. Three passing AC1 tests verify the served manifest, PNG dimensions and opaque logo artwork."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html includes the credentialed manifest link, Apple metadata, theme colours and favicon links. Both AC2 tests passed, checking the tags and served icons, including the 180 × 180 PNG."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelServer checks Host before routing any assets and serves only explicitly listed filenames. Passing AC3 tests exercise permitted and forbidden Hosts, absence of the panel token, GET restrictions and missing-file handling."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 browser test passed without being skipped. It uses Chrome's Page.getAppManifest to check for errors, loads the manifest and page icons as images, and compares the PNG artwork with Chrome's SVG rendering."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0149-tests.txt: 1,310 tests, 1,307 passed, zero failed and three unrelated skips. Existing tests and shared panel helpers were not changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now has the name, logo and browser metadata needed for home-screen installation as speck. Server and browser tests pass, and the new assets retain the existing address restrictions without exposing the panel token. No blocking issues found."
  }
}
```

</details>
