---
id: "0641"
title: "Change lane on a second trackpad swipe the same way while the first still glides"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11

---
# 0641 · Change lane on a second trackpad swipe the same way while the first still glides

**Status:** 📋 ready

## Problem
In the panel in Cursor, a sideways trackpad swipe changes lane once, and a second swipe the same way does nothing until you wait. The panel takes every sideways scroll the same way as the first swipe's glide until scrolling has paused for 50 ms (0514), and Cursor's pane sends the next swipe straight on from the glide with no pause, so swiping from Capture to Build or Plan to Shipped takes two swipes with a wait between.

## Outcome
Two trackpad swipes the same way, one straight after the other, change lane twice, and one swipe with its glide still changes lane only once.

## Acceptance criteria
1. A sideways scroll whose steps shrink as a glide does, followed with no pause (steps 16 ms apart) by a second swipe the same way whose steps grow again past 20 px, changes lane twice: once for each swipe.
2. A single swipe whose steps speed up, slow down and speed up again before its glide, as fingers do, changes lane only once, and a glide on its own, however long, never changes lane a second time.
3. A pause of 50 ms or more between two sideways scrolls still lets the second change lane, and a scroll the other way still changes lane after any pause or none, as 0514 made them.
4. No test that passed before this change fails.

## Out of scope
- Touch swipes on a phone and the arrow keys, which already change lane straight away.

## Notes
- Reported 2026-11-11 in Cursor's browser pane: "it's moving once and then it seems like it needs to have a delay before I can scroll again."
- The handler is the `wheel` listener at the end of the lanes code in `templates/panel-header.js`: a step the same way as the last change (`wheel.way`) resets `sum` and is ignored until a 50 ms pause. It hasn't changed since 0517 (2026-10-26), so a change in how Cursor sends the glide is the likely reason it shows now.
- Checked 2026-11-11 against the running panel in headless Chromium: a lane change takes 1–12 ms of script and frames stay at 17 ms, so drawing isn't the delay. A real trackpad glide can't be replayed there, so the criteria give the scroll steps to test with the fake page.
- Web pages get no flag that marks a glide, so a new swipe has to be told from the glide by its steps.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
