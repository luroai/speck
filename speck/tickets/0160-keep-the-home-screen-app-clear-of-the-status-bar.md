---
id: "0160"
title: Keep the panel header on screen                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T12:31:12.452Z"

---
# 0160 · Keep the panel header on screen

**Status:** 🔨 building

## Problem
The panel header, with the Auto-build button, scrolls away with the page, so on a phone the one control and status the user checks most is only at the top. In the home-screen app the iPhone's status bar has no background of its own, so once the page scrolls, cards and text slide underneath the clock and battery (seen 2026-10-14).

## Outcome
The header stays at the top of the screen as the page scrolls, with the panel's background behind the status bar, so nothing ever shows under it; on a phone the header slims to one row once scrolled.

## Acceptance criteria
1. The header stays fixed at the top of the screen while the page scrolls, on phone and desktop, with the panel's solid background and a line along its bottom edge, so content scrolls underneath it, never through it.
2. In the home-screen app the header extends up behind the status bar: the page uses `viewport-fit=cover`, the header's top padding includes `env(safe-area-inset-top)`, and an `apple-mobile-web-app-status-bar-style` meta tag keeps the status bar's text readable in light and dark mode. No text, card or border is ever visible behind the status bar.
3. At viewports under 700 px, once the page is scrolled down, the header slims to one row of at most 60 px plus the safe-area inset: "speck", the Auto-build button and the light/dark button, with the project name and base branch hidden. Back at the top of the page it shows both rows again. The change is a quick fade or slide, and instant with `prefers-reduced-motion: reduce`.
4. The page's last card clears the home indicator (`env(safe-area-inset-bottom)`), and the full ticket pane's close button and first line sit below the status bar.
5. Jumping to a ticket (0154) and opening the full ticket still show their target below the header, not hidden behind it. In a normal browser tab, where the insets are 0, nothing shows behind the header either. No test that passed before this change fails.

## Out of scope
- What the header shows (0163 adds the running build to the Auto-build button).
- Colours and contrast (0161).

## Notes
- Today the viewport tag is `width=device-width, initial-scale=1` and the header isn't sticky (`templates/panel.html`).
- Jumping to a ticket scrolls it into view; with a fixed header that needs `scroll-margin-top` (or equal) so the target isn't covered.
- Reported 2026-10-14 from phone screenshots of the home-screen app.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
