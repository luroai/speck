---
id: "0479"
title: "Frame the Pipeline log like a lane card that fills the screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0470", "0478"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T16:16:16.318Z"

---
# 0479 · Frame the Pipeline log like a lane card that fills the screen

**Status:** 🔨 building

## Problem
Pressing speck's screen opens the Pipeline log as a page that scrolls as a whole, with its title, Close and the log scrolling together. It doesn't look like the rest of the panel after 0478, where each lane is a framed card, and on a phone the whole page moving when you only want to read the log feels loose.

## Outcome
The Pipeline log is one framed card that fills the screen and stays still, and only the log inside it scrolls.

## Acceptance criteria
1. The Pipeline log fills the window's full height, and its full width up to the panel's column width (720 px, centred), inside a frame like a lane card's after 0478: the same `--bezel` colour, thickness and corners, clear of a phone's status bar and home indicator. Its title row shows speck's red dot and `Pipeline log` in the dot-matrix letters, with Close at the row's right-hand end.
2. Nothing but the log scrolls: the page and the frame never move, at every width from 320 px and every height from 480 px, and the log box takes all the room left inside the frame and scrolls on its own. Checked in a real browser at 390 × 844 and 1200 × 800 with 200 lines in the log.
3. While the page is running older code than the panel, a line saying so with its Reload page button sits inside the frame between the title row and the log, and the log box shrinks to make room, so the frame still fits the window and nothing else scrolls. When it goes, the log box grows back.
4. Close, Escape, a click outside and the focus work as before (0415), and the log keeps its lines, times, newest at the bottom and its reader's place (0459, 0460). No test that passed before this change fails.

## Out of scope
- What the log's lines say (0459, 0460).
- The other pop-ups.

## Notes
- Asked for by the user on 2026-10-24: "the same look as a card, so like that same border around it with the dot and the dot matrix text … I want it to be static … the border to go all the way around the full screen … only the log to be the thing that scrolls … when there's a reload … the border to kind of like reduce itself to accommodate it. I don't want any full page scrolling, only the actual console logs."
- The red dot is speck's own, as in the header's "speck", since the log is the whole pipeline's rather than one lane's.
- Mock-up of the lane cards' frame the user approved: https://claude.ai/artifact/3sE9DU2PdnsvR6p1tLNw8j
- The panel stays thin (decided 2026-10-24), so on a wide window the frame is as wide as the panel's column, not the whole window.
- Waits for 0470 (its `Pipeline log` title, in the pop-ups' files) and 0478 (the lane card's frame, which this reuses).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
