---
id: "0304"
title: "Set the panel's title in the LCD design's lettering"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0303"]  # ticket ids that must be done first
created: 2026-10-18

---
# 0304 · Set the panel's title in the LCD design's lettering

**Status:** 📋 ready

## Problem
The LCD design (`docs/design/lcd/`) sets speck's name in Doto, a dot-matrix typeface, on the concept and landing pages. The panel's header still sets "speck" in the serif it uses for headings, so the panel and the landing page don't look like one product.

## Outcome
The panel's header shows "speck" in the design's dot-matrix lettering.

## Acceptance criteria
1. The header's "speck" is set in Doto at weight 900, as the design's pages set their names. Its size and position keep the header's height as it is today.
2. The panel serves the Doto font itself, from a file in the repo, so the title looks the same with no internet connection. When the font can't load, the title falls back to a monospace font.
3. The "control panel" label beside it, the page's own title and every other heading keep their fonts. (checked by review)
4. It looks right in the light and dark looks, and at the panel's narrowest width.

## Out of scope
- The mark beside the title: 0303.

## Notes
- The design's pages load Doto from Google Fonts (`family=Doto:wght@500;700;900`) and set names with `font: 900 … "Doto", "Silkscreen", ui-monospace, monospace`.
- Unverified: Doto's licence (expected to be the SIL Open Font License, as Google Fonts' fonts are, which allows bundling it). Check before adding the file.
- The header is `.logo` in `templates/panel.html`; fonts are served by `scripts/panel.mjs` like the icons in `templates/icons/`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
