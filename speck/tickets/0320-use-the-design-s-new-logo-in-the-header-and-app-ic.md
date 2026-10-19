---
id: "0320"
title: "Use the design's new logo in the header and app icons"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18

---
# 0320 · Use the design's new logo in the header and app icons

**Status:** 📋 ready

## Problem
The user has updated the LCD design since it was copied into `docs/design/lcd/`. It now has its own logo: a hand-drawn 16 × 16 mark (the ring open at the top left, two ears and the speck), with a header version, a browser-tab icon that follows light and dark by itself, and an app icon showing the handheld with the mark on its screen. The panel's header mark (0303, 0309) and app icons (0305, 0308) were made from the first version and don't match it.

## Outcome
The panel's header mark, browser-tab icon and app icons are the design's new logo, exactly as the design draws them.

## Acceptance criteria
1. `docs/design/lcd/lcd.js` and `templates/lcd.js` are the design's new renderer, byte for byte the file in `docs/design/lcd/next/lcd.js` (SHA-256 `3b0b714a151bb0bcbf6b453a135e02c5474878960142baec2472648c4f7049fb`), and `docs/design/lcd/panel-mock.html` and `concept.html` are the new versions from `next/`, which is then removed. The tests that check the renderer's SHA-256 check the new one.
2. The header's mark is the renderer's `logo.markSVG()`, in the header's text colour with the speck in the panel's `--dot`, at 32 px with crisp edges, two screen pixels to each pixel of the mark, as 0309 sized it.
3. `templates/icons/icon.svg` is the renderer's `logo.faviconSVG()`, so the browser tab shows the mark in the browser's light or dark look by itself.
4. `apple-touch-icon.png` (180 px), `icon-192.png` and `icon-512.png` are the renderer's `logo.appIconSVG('light')` drawn at those sizes, with the design's own colours, so the screen inside the icon's bezel is the design's, not the panel's lighter shade from 0308.
5. The builder badges and the Foreman's builder look and move exactly as before: the new renderer's drawing code is the same up to its new logo section. No test that passed before this change fails, apart from the SHA-256 checks in criterion 1.

## Out of scope
- The GitHub avatar (`logo.avatarSVG`), which is set on GitHub, not in the repo.
- The panel's title (0304, 0309).

## Notes
- The design is the user's artifact, "speck LCD" (claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z), version of 2026-10-19. Its new files are copied into `docs/design/lcd/next/` so the build doesn't need the artifact. Don't edit `lcd.js`.
- The new renderer adds `SpeckLCD.logo`: `MARK` (the bitmap), `LOOKS`, `markSVG(o)`, `faviconSVG()`, `appIconSVG(look, size)` and `avatarSVG(look, size)`. The concept page's "Logos" band (`concept.html`, search for `id="logos"`) shows each in use.
- Checked 2026-10-19: lines 1–706 of the new `lcd.js` are identical to the old one; only the logo section and its export are new.
- The pinned SHA-256 of the old renderer is in `test/panel-0308.test.mjs` and possibly 0302's tests.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
