---
id: "0548"
title: "View a ticket's build log in a full-screen pop-up"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0538","0545"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0548 · View a ticket's build log in a full-screen pop-up

**Status:** 📋 ready

## Problem
A ticket's build log only shows in a small box with its own scrollbar inside its open card in Build, which is hard to read on a phone or when following a long build. The Pipeline log already has a full-screen pop-up that's easy to read, but it shows only `speck run`'s own log, never a ticket's build.

## Outcome
You can open any Build ticket's build log in a full-screen pop-up that looks and works exactly like the Pipeline log, showing only that ticket's build log.

## Acceptance criteria
1. Every open ticket card in Build that shows a build log box has a button next to the box that opens that ticket's build log in a pop-up. The pop-up is titled "<id> build log" (such as "0540 build log").
2. The pop-up uses the Pipeline log pop-up's template and layout: the same frame over the whole panel, the title in the same dot-matrix lettering, the same Close button, line layout, times, colours and scrolling, in the light and dark looks and at phone width. It shows only that ticket's build log, never `speck run`'s log or another ticket's (checked by review).
3. It shows the same log lines as the card's log box, newest at the bottom. While it's open, new lines are added as the build writes them, without reloading. It stays at the bottom while you're there, and keeps your place when you've scrolled up. A new build of the ticket replaces the log, as in the card. Before the log has loaded, or if it can't be loaded, it says so as the card's box does.
4. Close, Escape or a click outside it closes the pop-up, and the focus goes back to the button that opened it. While it's open the page behind can't be clicked, scrolled or reached with Tab, as with the Pipeline log, and opening it doesn't open, close or change the ticket's card.
5. No test that passed before this change fails.

## Out of scope
- Logs of shipped tickets, and opening a log from anywhere but its open card in Build.
- Searching, copying or downloading a log.
- Any change to the Pipeline log pop-up itself.

## Notes
- Asked for by the user 2026-10-27: "Exactly the same template and layout as the pipeline log but a tickets builder log only." They asked for it to be set ready and included in the 0.21.0 release (0539).
- Today: the Pipeline log pop-up is `renderForeman`, `drawRunLog` and `runLogRow` in `templates/panel-popups.js`, in `#foreman` in `templates/panel.html`, styled in `templates/panel-popups.css` (0415, 0459, 0470, 0479). A ticket's log is `logBox`, `loadLog`, `logUpdate` and `showLog` in `templates/panel.js`, read from `/api/tickets/<id>/log` and streamed on the board's event stream (0189). The open card's buttons are added in `queueItem`.
- After 0545, which changes the open Build card's facts grid, and 0538; all three may edit the brief's sentence on the panel.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
