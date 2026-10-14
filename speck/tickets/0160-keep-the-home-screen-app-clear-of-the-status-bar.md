---
id: "0160"
title: "Keep the home-screen app clear of the status bar"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14

---
# 0160 · Keep the home-screen app clear of the status bar

**Status:** 📝 draft

## Problem
Opened from the iPhone home screen, the panel runs full screen, but as the page scrolls its content slides under the status bar: on 2026-10-14 the Build section's text sat behind the clock and battery. The page leaves no room for the status bar and the bar has no background of its own.

## Outcome
In the home-screen app the iPhone's status bar always has the panel's background behind it, and nothing scrolls underneath it.

## Acceptance criteria
1. The page's viewport tag includes `viewport-fit=cover`, and the page has an `apple-mobile-web-app-status-bar-style` meta tag whose value keeps the status bar's text readable on the panel's background in light and dark mode.
2. The top of the page is padded by `env(safe-area-inset-top)`, and that strip keeps the panel's background colour while the page scrolls, so no text, card or border shows behind the status bar.
3. The bottom of the page is padded by `env(safe-area-inset-bottom)`, so the last card and the full ticket pane's content clear the home indicator.
4. The full ticket pane, which covers the screen on a phone, also keeps its close button and first line below the status bar.
5. In a normal browser tab, where the insets are 0, the page looks as it does today, and no test that passed before this change fails.

## Out of scope
- Other home-screen app details from 0149.

## Notes
- Today the viewport tag is `width=device-width, initial-scale=1` and the page has no safe-area padding (`templates/panel.html`).
- Reported 2026-10-14 from a phone screenshot of the home-screen app.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
