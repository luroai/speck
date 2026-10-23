---
id: "0413"
title: "Make speck's LCD screen the panel's header"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0410", "0411", "0412"] # ticket ids that must be done first
created: 2026-10-23

---
# 0413 · Make speck's LCD screen the panel's header

**Status:** 📋 ready

## Problem
The panel's header is a row of speck's name, the base branch and the Foreman's scrolling notice board. The board is hard to read as it scrolls, and speck, the one thing watching the whole pipeline, has no place of its own on the page.

## Outcome
The top of the panel is speck's LCD screen in its frame, with speck on it, in place of the header row and the notice board.

## Acceptance criteria
1. The top of the panel is speck's screen in its dark frame. The frame's title row shows `speck` in the dot-matrix font on the left, and the project and base branch in small plain text on the right, cut short with an ellipsis when there isn't room. The old header row and the notice board are gone, and the screen stays at the top while a lane's list scrolls.
2. The screen's top row shows the Foreman's status word, the one the notice board starts with today (such as `Off`, `Idle`, `Building 2` or `Needs you 1`), in the screen's dot font, and speck is on the screen below it. While the word is `Needs you <n>`, the frame's edge is in the panel's needs-you colour. There's no text under the screen and no A, B or C button.
3. A Settings button at the right end of the frame's title row opens Settings, as the header's Settings button does today.
4. Pressing the screen, or Enter or Space while it has the focus, opens the Foreman's detail, as pressing the notice board does today. While the panel is running newer code than the page shows, the screen's top row reads `Reload page`, and the Foreman's detail offers its Reload page button as today.
5. At 320 px wide, the screen and its title row fit without the page scrolling sideways. The screen has an accessible name that includes the Foreman's status word.

## Out of scope
- What speck does on the screen as the pipeline changes (0414). Here it stays in its idle animation, with nothing under it.
- Replacing the Foreman's detail with the pipeline log (0415).
- The A, B and C buttons, and the lines of text under the screen in the mock.

## Notes
- Design: console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z, without its keys and the text under the screen. The user asked for this on 2026-10-23.
- The screen is drawn with `templates/lcd.js` (`SpeckLCD.Screen` and `render`), which the panel already loads.
- Removes the notice board (`boardText`, `drawBoard`: 0365, 0374) and the header row (0364, 0373). The Settings button moves from the header (0372, 0396).
- Waits for 0410, 0411 and 0412: all change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
