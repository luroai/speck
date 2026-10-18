---
id: "0308"
title: "Lighten the LCD screen in the panel's light look"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0305"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:24:45.348Z"

---
# 0308 · Lighten the LCD screen in the panel's light look

**Status:** 🔨 building

## Problem
In the panel's light look, the LCD screen behind the builder badges and the Foreman's builder uses the design's `#c3c9b1`, which reads as too dark on the panel's near-white cards, especially on a phone. The app icon (0305) uses the same colour.

## Outcome
The LCD screen in the panel's light look is a lighter tint the user chose (shade C), in the badges, the Foreman's builder and the app icon.

## Acceptance criteria
1. In the panel's light look, `--lcd-bg` is `#e6e9db`, `--lcd-off` is `#dde1cf` and `--lcd-shadow` is `rgba(30, 40, 15, .14)`. `--lcd-ink` and `--lcd-red` are unchanged (`#20241d`, `#d63f28`).
2. The badges and the Foreman's builder are drawn with those colours, including after switching between the light and dark looks.
3. The app icon's background (`templates/icons/icon.svg` and the three PNGs) is `#e6e9db`, with its dots unchanged.
4. The dark look's colours, and `docs/design/lcd/lcd.js`, are unchanged.

## Out of scope
- The landing page, which lives in its own repo, and the design files in `docs/design/lcd/`.

## Notes
- The user picked shade C from four drawn with the design's renderer on 2026-10-18 (A `#c3c9b1` today, B `#d9ddca`, C `#e6e9db`, D `#f0f1e8`).
- The renderer reads its colours from the page's tokens when it starts drawing, so a change of token needs the screens to pick it up (as switching looks already does).
- Failing before this build: none
- Self-check: the 512 px icon's new bytes held "O3", which the model-name scan of templates/ flags (test/review.test.mjs); the PNG writer now takes the first zlib level, from the default, whose bytes hold no such text.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
