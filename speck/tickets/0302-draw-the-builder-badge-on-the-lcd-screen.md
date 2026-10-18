---
id: "0302"
title: "Draw the builder badge on the LCD screen"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0299"]  # ticket ids that must be done first
created: 2026-10-18

---
# 0302 · Draw the builder badge on the LCD screen

**Status:** 📋 ready

## Problem
The panel's builder badge is drawn on a canvas in the panel's own style. The user has designed a new look for speck, shared by the Luro landing page and the panel: speck drawn on a dot-matrix LCD screen, with each change of pose blending over 0.7 seconds with a hop and a blink. The panel needs to match that design exactly.

## Outcome
Every ticket's builder badge is drawn on the LCD screen by the design's own renderer, exactly as the design shows it, and blends into its new pose when the ticket moves on.

## Acceptance criteria
1. The panel draws every builder badge with the renderer in `docs/design/lcd/lcd.js`, served to the page unchanged: the copy the page loads has the same SHA-256 as that file (`39c97086e87535110d8a5fc9e057aa275438a60ffaabb72e2175aa109dbfcf49`). Each badge is made with its `badge(canvas, pose)`, in today's 56 px tile, with the pose the badge shows today (`type`, `check`, `review`, `ship`, `wait`, `bad` or `still`).
2. When a ticket's badge changes pose, the panel calls the same badge's `set(pose)`, so it blends into the new pose, instead of drawing a new badge. A board refresh that doesn't change a ticket's pose leaves its badge running as it was.
3. The page has the design's screen colours as tokens, with the design's values in the light and dark looks: `--lcd-bg`, `--lcd-off`, `--lcd-ink`, `--lcd-red` and `--lcd-shadow` (light `#c3c9b1`, `#b8bea6`, `#20241d`, `#d63f28`, `rgba(30, 40, 15, .22)`; dark `#0d130f`, `#151d17`, `#cfe6c6`, `#ff5a3f`, `transparent`). The panel's light and dark switch changes the badges with the rest of the page.
4. A badge waiting for you has a purple frame (the panel's `--idea`) and a blocked one a crimson frame (`--bad`), as in `docs/design/lcd/panel-mock.html`. Other badges have the panel's line colour.
5. Side by side with `docs/design/lcd/panel-mock.html` in the same browser, each of the seven poses looks and moves the same. (checked by review)

## Out of scope
- The header's mark and the Foreman's builder: 0303.
- Changing the design: the renderer is used as the user made it.

## Notes
- The design is the user's artifact, "speck LCD" (claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z). Its renderer and panel mock are copied into `docs/design/lcd/` (`lcd.js`, `panel-mock.html`), so the build doesn't need the artifact. Don't edit `lcd.js`: it's the design. It exposes `window.SpeckLCD`.
- The renderer draws one still frame per pose when reduced motion is on (`RM`), so the panel doesn't need its own check.
- Today's badge is drawn in `templates/panel.html` (search for "0168" and "badgeColours"). The page is served by `scripts/panel.mjs`, which will need to serve `lcd.js` too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
