---
id: "0538"
title: "Star a note in Capture"                # one outcome, no "and"
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
after: ["0537"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0538 · Star a note in Capture

**Status:** 📋 ready

## Problem
Scrolling through Capture, you can't tell which notes you liked before, so the ideas you care about get lost among dozens of inbox notes and older ideas.

## Outcome
You can star a note in Capture, and a starred note shows a filled star on its card so you can spot it while scrolling.

## Acceptance criteria
1. Every card in Capture has a star button on its closed row. Tapping it stars the note: the star fills, and the note's file gains a `Starred: yes` line on its own line straight after its `Captured:` line. Tapping a starred note's star unstars it: the star empties and that line is removed. Tapping the star doesn't open or close the card.
2. Whether a note is starred is read from its `Starred: yes` line, so a note starred on one device shows as starred after a reload and on any other device that opens the panel. A note without the line, or with any other value, shows as not starred.
3. Starring or unstarring changes nothing else: every other line of the note stays as it was, its status is unchanged, Capture's order is unchanged (a star is only a mark), and no commit is made.
4. If the note is gone, or its status is no longer `idea` or `inbox`, when the star is tapped, the panel changes no file and shows the server's reason on the card. The star button can be reached and pressed with the keyboard, says whether the note is starred to a screen reader, and its filled and empty looks are clear in the light and dark looks (checked by review).
5. No test that passed before this change fails, apart from tests that Capture has no buttons and writes nothing (0520's criterion 3), which change to allow only the star.

## Out of scope
- Sorting or filtering by star: the user wants only a mark (2026-10-27).
- Starring from chat or the command line, and stars on tickets.
- Any other way to change a note from the panel: ticketing, dropping and editing stay in chat.

## Notes
- Asked for by the user 2026-10-27: "I just wanted to visually just put a star on an idea so that when I'm scrolling through I can just visually see which ones I really like." "It's literally just a mark."
- Decided 2026-10-27: this is a narrow exception to 0520's rule that Capture is managed only in chat. The star is the only thing Capture may write, and only the `Starred:` line. The brief says so where it describes Capture.
- Today: Capture's cards are `captureItem` and `noteItem` in `templates/panel.js`; the panel's routes are in `scripts/panel.mjs`; the board feed keeps ideas by path (`KEYED` in `scripts/board-feed.mjs`), so the star shows on the next board update.
- After 0537, which changes Capture's sort and the note formats, and 0536, which changes Capture's lane in `templates/panel.html` and `templates/panel.js`; all three edit the brief's sentence on Capture.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
