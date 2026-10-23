---
id: "0427"
title: "Use Cursor's fonts in the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0426"] # ticket ids that must be done first
created: 2026-10-23

---
# 0427 · Use Cursor's fonts in the panel

**Status:** 📋 ready

## Problem
The panel names Zen Kaku Gothic New, Shippori Mincho and IBM Plex Mono, but doesn't load them, so each machine shows whatever it falls back to. Its serif headings and spaced capital labels don't look like Cursor beside it.

## Outcome
The panel's text uses the fonts Cursor's own interface uses, and its labels read like Cursor's.

## Acceptance criteria
1. All the panel's text, except the `speck` dot-matrix title and speck's screen, uses `-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif`. Body text, such as a ticket's stage sentence, a question, a message and Settings' explanations, is 14 px rather than today's 13 px.
2. Text set in monospace today (ids, the build log, code and figures) uses `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`.
3. Headings, tab names and ticket titles, in a serif today, use the interface font at weight 600. The page no longer names Zen Kaku Gothic New, Shippori Mincho or IBM Plex Mono.
4. Buttons and labels in spaced capitals today are in sentence case in the interface font, with no extra letter spacing, for example `Full ticket`, `More stats` and `Tickets · 4`.
5. 0161's rules on size and weight still hold: no text smaller than 12 px, and no running text or label lighter than 400.

## Out of scope
- Colours (0426) and corners (0428).
- speck's screen and the Doto title.

## Notes
- The user asked for this on 2026-10-23: the panel is used mostly beside Cursor, at work and at home, and should look like part of it.
- Checked 2026-10-23: VS Code's interface font, which Cursor is built on, is `-apple-system, BlinkMacSystemFont` on macOS, `"Segoe WPC", "Segoe UI"` on Windows and `system-ui, "Ubuntu", "Droid Sans"` on Linux. Its interface monospace is `"SF Mono", Monaco, Menlo, Courier` on macOS, `Consolas, "Courier New"` on Windows and `"Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New"` on Linux (microsoft/vscode `src/vs/workbench/browser/media/style.css`).
- 14 px: Cursor's text is about 14–15 px beside the panel's 13 px in the user's screenshot of 2026-10-23.
- Unverified: that Cursor hasn't replaced VS Code's interface fonts in its own panels (no Cursor source or docs to check).
- Waits for 0426: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
