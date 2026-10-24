---
id: "0455"
title: "Make a ticket's build log look like a terminal"                # one outcome, no "and"
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
after: ["0454"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:44:54.260Z"

---
# 0455 · Make a ticket's build log look like a terminal

**Status:** 🔨 building

## Problem
The build log inside an open ticket uses the page's own background, so in the light look it's a pale box that doesn't read as a terminal. It has only a left edge, and its 12 px corners trim even that, so it doesn't read as a box at all.

## Outcome
A ticket's build log looks like a terminal in both looks: a black box with light text and an edge on all four sides.

## Acceptance criteria
1. In the light look, the dark look and System, a ticket's build log has the same background, darker than the dark look's page background (`#141414`), so it stands out from the ticket in both.
2. Every kind of log text (the time, a message, a tool call, a failure, a note, and plain lines) has a contrast of at least 4.5:1 against that background, in both looks, and the kinds keep their different colours.
3. The log box has a border on all four sides, at least one device pixel wide and with its edges on whole CSS pixels, with rounded corners. On a phone-sized page at a device pixel ratio of 3, all four sides show, checked in a real browser.
4. The log keeps its height, scrolling, monospaced font, line layout (0422) and text selection as before. No test that passed before this change fails.

## Out of scope
- The pipeline log, which fills the window (0415).
- The log's contents, its times or how often it updates.

## Notes
- Asked for by the user on 2026-10-24: "look actually like terminals with black backgrounds … no matter whether it's light or dark mode", and "the rounded edges have caused the terminal to lose its sides".
- Today: `.q .log` in `templates/panel.css`, with `background: var(--bg); border-left: 2px solid var(--line-soft)`, and its kinds coloured `--muted`, `--text`, `--run`, `--bad` and `--warn`. Those are the light look's dark colours in the light look, so they need their own colours on the black background. Its 12 px corners come from the shared `border-radius` rule further down the file.
- Criterion 3 is the box version of what 0453 does for buttons.
- Waits for 0454, which waits for 0453: all three change `templates/panel.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
