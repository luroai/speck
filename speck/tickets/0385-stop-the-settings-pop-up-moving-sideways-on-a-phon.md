---
id: "0385"
title: "Stop the Settings pop-up moving sideways on a phone"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0382"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0385 · Stop the Settings pop-up moving sideways on a phone

**Status:** 📋 ready

## Problem
Since 0368 opened Settings in a full-window pop-up, the pop-up can be dragged left and right on a phone. A sideways swipe while scrolling the settings shifts the whole view, which feels broken and makes the column wobble under your thumb.

## Outcome
On a phone, the Settings pop-up only scrolls up and down.

## Acceptance criteria
1. On a window 320 to 430 px wide, the Settings pop-up never scrolls or moves sideways. Its sideways scroll position stays at 0 whatever is done to it, including a sideways swipe or drag anywhere in it and an attempt to scroll it sideways from script. Scrolling up and down, and pinch-zoom, work as today.
2. At 320, 360, 390 and 430 px wide, in both looks, nothing in the Settings pop-up is wider than the window or cut off at its right edge. This holds with Settings at rest and with any one setting's explanation open: long text wraps inside the column.
3. At 900 px wide and over, the Settings pop-up looks and behaves as today.
4. No test that passed before this change fails.

## Out of scope
- The document and Foreman pop-ups, unless they turn out to move sideways the same way. If they do, that's a ticket of its own.
- Keeping Close in view while the settings scroll: 0379.

## Notes
- Checked 2026-10-22: `#settings` in `templates/panel.html` sets `overflow-y: auto` and no `overflow-x`, so the browser treats its `overflow-x` as `auto` too. That lets a phone pan the pop-up sideways when its contents are even a fraction of a pixel wider than it.
- Checked 2026-10-22: in desktop Chromium at 320, 360 and 390 px wide, the live panel's Settings had nothing wider than the window (its `scrollWidth` equalled its `clientWidth`), at rest and with each of the 18 explanations opened in turn. So the movement shows on a phone's touch scrolling, not as a visibly too-wide element in a desktop browser.
- Unverified: which phone and browser the user saw it on. Not checked on a real device.
- A bug in 0368, which shipped in the run-up to 0.13.0. Waits for 0382 (which waits for 0381): all three change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
