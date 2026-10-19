---
id: "0320"
title: "Use the design's new logo in the header and app icons"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-18T22:51:57.759Z"
approved: "2026-10-18T23:02:43.148Z"
finished: "2026-10-19T05:40:47.337Z"

---
# 0320 · Use the design's new logo in the header and app icons

**Status:** ✅ done

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
- Failing before this build: not checked
- AC5 and older tests: criteria 2 to 4 replace the header's canvas mark (0303, 0309) and the icons (0305, 0308), so the older tests that pinned those exact things can't pass unchanged. They're updated to the new logo in place, as 0309 did with 0303's, rather than deleted: 0303 AC1 and AC3, 0304 AC1, 0305 AC1 to AC3 (now a pointer to this ticket's tests), 0308 AC3 (likewise), 0309's browser test, 0149 AC4 and 0159 AC2 (the PNG is compared with the browser's drawing of the design's app icon, not icon.svg), and 0167 AC2 (`--speck` in place of `--lcd-red`). The badges' and the Foreman's builder's tests are unchanged and pass on the new renderer.
- The header's mark is written into the page as `markSVG()` returns it, with `--speck: var(--dot)` on `.logo .mark` as the design's own panel mock sets it, so it needs no script. The PNGs are drawn from `appIconSVG('light')` by `draw()` in `test/support/icons.mjs`, which paints each of its shapes by how much of each pixel it covers; they're within half a level a channel, on average, of Chrome's own drawing.
- Self-check: the icon drawing now refuses any shape, path or colour it can't read, with a test, so a change to the design can't be drawn wrong silently.

## In plain words
The panel now uses the design's new logo everywhere it shows one. The header's mark is the hand-drawn ring with two ears and the red speck, in the text colour, in both the light and the dark look. The browser tab shows the same mark, and it switches between light and dark by itself to match your browser. The home-screen icons on a phone or computer are now the little handheld with the mark on its screen, in the design's own colours.

To see it, open the panel and look at the header and the browser tab, then add the panel to a phone's home screen. The builder badges and the Foreman's builder look and move exactly as before. A browser may keep showing the old tab or home-screen icon for a while until it clears its stored copy.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 573,646
- Elapsed since build started: 11 min
- Changed lines: 1163 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Tidy-up only: the stand-in renderer in `test/panel-0303.test.mjs` still has a `tile()` that nothing calls now except the check that the page draws no tile.

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
    "reviewed_sha": "8174a587f734387185101cb96ff9188c3e748aed",
    "thread_id": "01a1513f-faa3-7032-b14f-273657510ccd",
    "seconds": 44,
    "usage": {
      "input_tokens": 572264,
      "cached_input_tokens": 451840,
      "cache_write_input_tokens": 0,
      "output_tokens": 1382,
      "reasoning_output_tokens": 47
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T23:02:33.957Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both lcd.js files have the required SHA-256. Git blob identities confirm concept.html and panel-mock.html exactly match the original next/ files. Passing 0320 AC1 tests check removal of next/ and updated hash checks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html embeds logo.markSVG() output with currentColor, --speck: var(--dot), crispEdges and 32 px dimensions. Passing 0320 browser tests verify colours and size in both looks; 0309 verifies header layout."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Independently confirmed templates/icons/icon.svg equals logo.faviconSVG(). Its media query supplies light and dark colours. The 0320 equality and browser loading tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Independently regenerated all three PNGs in memory and confirmed exact matches. Passing 0320 tests verify dimensions and design colours; 0149 AC4 compares the PNG with Chrome's rendering of appIconSVG('light')."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The renderer diff preserves drawing code before the logo section, also checked by passing 0320 AC5. Badge and Foreman regression tests passed. Full recorded output reports 198 passes, zero failures and three unrelated skips. Older logo assertions were replaced with coverage of the requested behaviour."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header, browser tab and app icons now use the supplied design's new logo. The design files match exactly, the icons use the correct colours, and the builder animations remain unchanged. Relevant tests passed, with no blocking concerns found."
  }
}
```

</details>
