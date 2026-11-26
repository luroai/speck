---
id: "0761"
title: "Keep the lane lists from scrolling sideways"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T09:32:41.906Z"

---
# 0761 · Keep the lane lists from scrolling sideways

**Status:** 🔨 building

## Problem
On an iPhone in Safari, the Plan list can scroll sideways: its rows slide left under the finger with a horizontal scrollbar, and the swipe no longer changes lane. The lists scroll up and down (`overflow-y: auto`), which lets them scroll sideways too once anything in them is wider, and the panel hands a swipe to the lanes only when it doesn't start in something that scrolls sideways (`scrollsSideways`).

## Outcome
No lane's list ever scrolls sideways, so a sideways swipe on any list always changes lane.

## Acceptance criteria
1. No lane's list (Capture, Plan, Build or Shipped) can be scrolled sideways, by touch, trackpad or script, even when something in it is wider than the list: what sticks out is cut off at the list's edges rather than scrolled to.
2. With an element in the Plan list wider than the list, a sideways swipe that starts on the list changes lane, as it does on a list with nothing wider.
3. Everything that scrolls sideways on purpose inside a list, such as a code block or a table cell in an open ticket, still scrolls sideways, and a swipe that starts on it still scrolls it rather than changing lane.
4. At 375 and 390 px wide, no row in Plan, open or closed, is wider than its list: in an open row's facts, a long value such as the Builder fact's "Claude Code · Opus · medium" wraps inside its cell rather than running past it.
5. No test that passed before this change fails.

## Out of scope
- How a swipe is measured (0517).

## Notes
- Raised by the user on 2026-11-25 with a screenshot of a project's Plan list in Safari on an iPhone: rows scrolled left, a horizontal scrollbar, and swipes not changing lane. In Chromium with touch at 390 px the same list doesn't overflow and a swipe changes lane, and a second screenshot showed the cause: an open Plan row's Builder fact ("Claude Code · Opus · medium", 0662's picker) runs past its cell and the row, as it doesn't wrap.
- `.lane-list` in `templates/panel-cards.css` has `overflow-y: auto`, so its `overflow-x` computes to `auto`; `scrollsSideways` in `templates/panel-header.js` then keeps the touch for the list.
- Checked 2026-11-26: Safari's behaviour can't be checked here: Playwright's WebKit is downloaded but won't start, as the system libraries it needs (GTK 4, GStreamer and others) are missing, so no WebKit browser is available on this machine; check in Chromium with touch, and by forcing an over-wide element in a test.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
