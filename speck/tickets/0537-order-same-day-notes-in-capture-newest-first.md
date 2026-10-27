---
id: "0537"
title: "Order same-day notes in Capture newest first"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0536"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0537 · Order same-day notes in Capture newest first

**Status:** 📋 ready

## Problem
Capture sorts notes newest first by their `Captured:` date, but that line holds only a day, so notes captured on the same day fall back to the order of their file names, which is alphabetical. On a busy day the note you captured a minute ago can sit below older ones, so the list doesn't look newest first.

## Outcome
Notes say what time they were captured, and Capture lists notes from the same day newest first by that time.

## Acceptance criteria
1. A note's `Captured:` line may give a 24-hour time after the date, as `Captured: 2026-10-27 14:32 · Status: idea`. Its status is read as today (`idea` here), and its card still says "Captured 27 Oct", as it would without the time.
2. Capture still lists notes by date, newest first. Of notes with the same date, those with a time come first, latest time first: a note captured at `2026-10-27 14:32` is above one at `2026-10-27 09:05`, whatever their file names. Notes with the same date and no time follow those, in the order they're listed in today. Notes with no date, or an impossible one, are still last.
3. A `Captured:` line whose time isn't a real time (such as `25:00` or `9:5`) sorts as if it had no time, and its card shows the date as for a note with no time.
4. The note formats in the `speck-capture` skill and in the `speck-build` skill's follow-up notes write the line as `Captured: <YYYY-MM-DD HH:MM> · Status: …`, the time in 24-hour local time when the note is written, and the brief says Capture orders notes from the same day by that time.
5. No test that passed before this change fails.

## Out of scope
- Adding times to notes already written.
- Showing the time on a card.
- The count of notes (0536) and starring notes (a later ticket).

## Notes
- Asked for by the user 2026-10-27: the Capture list doesn't look ordered newest first. Checked 2026-10-27 against the repo's own notes: the list is sorted by day, newest first, and five notes captured on 2026-10-27 are in alphabetical order of their file names (`panelModel`'s `capture` sort in `templates/panel-model.js`, which falls back to JSON order, which is `speck status --json`'s file-name order).
- 0520's decision stands: order by the `Captured:` line, never the note's body or the file's dates (file dates change on checkout and on every edit, such as triage's `Triaged:` line).
- `ideaStatus` (`STATUS_LINE` in `scripts/core.mjs`) and `capturedOn` in `templates/panel.js` already match a line with text between the date and `· Status:`; the tests should prove it stays so.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
