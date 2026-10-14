---
id: "0161"
title: "Make the panel readable for low vision"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T14:11:58.303Z"

---
# 0161 · Make the panel readable for low vision

**Status:** 🔨 building

## Problem
The panel is hard to read for its own user, and harder for anyone with low vision. The colours pass the basic text contrast ratio, but only just (`--faint` is 4.6:1 on the light background), much of the text is small (labels at 9 to 11 px) and light (the body weight is 300), and the borders around cards, tags, tabs and buttons are 1.1 to 1.6:1 against the background, so the edges of things are hard to see.

## Outcome
Every word and every control edge in the panel is comfortably readable in light and dark mode, meeting WCAG 2.2 AA with margin, and AAA for small text.

## Acceptance criteria
1. All text meets at least 4.5:1 against the background it sits on, and text smaller than 14 px (labels, counts, hints, tags) meets at least 7:1, in light and dark mode. A test works the ratios out from the panel's colour tokens and the backgrounds they're used on, and fails if any pair falls short.
2. The visible edge of every control and card (buttons, tags, tabs, cards, the Auto-build and light/dark buttons, the priority menu) meets at least 3:1 against the background next to it, in light and dark mode, checked by the same test.
3. No text is smaller than 12 px, and running text and labels use a weight of at least 400. The priority, size, risk, bug and fix tags are at least 14 px text in boxes at least 28 px tall, the same size wherever they appear (Plan, the Build queue and the full ticket pane).
4. Every button, link and tab shows a clearly visible focus ring when reached with the keyboard (at least 2 px, at least 3:1 against the background around it), and the page can be zoomed by the user.
5. No test that passed before this change fails, except checks of the old colour values, sizes and weights, which are changed to match.

## Out of scope
- Screen reader labels beyond what the panel already has.
- Changing the layout or what the panel shows.

## Notes
- Measured 2026-10-14 from the tokens in `templates/panel.html`. Light: `--faint` 4.82:1 on the panel and 4.58:1 on the page background, `--warn` 4.68:1, `--line` 1.62:1, `--line-soft` 1.24:1. Dark: `--accent` 4.56:1, `--faint` 4.77:1, `--line` 1.52:1, `--line-soft` 1.09:1. Font sizes in use go down to 9 px; the body is `font: 300 13px`; tags are `.tag { font-size: 10px; line-height: 17px }`.
- The larger tags were asked for on 2026-10-14: they're hard to read on a phone.
- WCAG 2.2: 1.4.3 (4.5:1 text), 1.4.6 (7:1, AAA), 1.4.11 (3:1 for control edges), 2.4.7 and 2.4.13 (focus visible and its appearance).
- Keep the panel's look: darken or lighten the existing tokens rather than replacing the palette.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
