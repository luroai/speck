---
id: "0441"
title: "Measure the panel's layout in a proportional font"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-measure-the-panel-s-layout-in-a-proportional-font.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:32:36.679Z"
blocked_at: ""
waited_seconds: 12

---
# 0441 · Measure the panel's layout in a proportional font

**Status:** 🔨 building

## Problem
On the build machine, Chrome draws the panel's interface font (`system-ui` and the rest of 0427's stack) as Liberation Mono, a monospace font. So the browser tests that measure how text wraps and how tall cards are see a panel nobody uses, and 0427 had to ease some of their checks for a monospaced panel.

## Outcome
The tests' browser draws the panel in a proportional font, as people see it.

## Acceptance criteria
1. In the browser the tests start, the panel's interface font draws proportionally: the letters `i` and `m` are different widths, on this machine, with nothing installed beyond what's here today.
2. The checks 0427 eased for a monospaced panel ask what they asked before: 0419's and 0420's long titles wrap on at most the lines they allowed before 0427, and a building ticket's details line has no exception for a monospace font.
3. No test that passed before this change fails.

## Out of scope
- The panel's own fonts (0427).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0427. Liberation Sans is installed here and is proportional; it's fontconfig's choice for `system-ui` that gives Liberation Mono.
- Changes the test support and the eased tests only, so it waits for nothing.
- Failing before this build: none
- Found while building: 0434 had already replaced the checks 0427 eased in 0419's and 0420's tests (a closed ticket's title is now one cut-off line, and the building ticket's details exception is gone), so the eased checks left are 0151's and 0155's longest-title line limits (`most + 1` when the interface font measured as a monospace).
- Found while building: 0427's monospace check measured a span added to the panel's body, which is a flex item as wide as the page whatever its text, so on the panel page it always said monospace. It now measures on a canvas.
- Found while building: with the test browser's fontconfig file preferring Liberation Sans (Arial's widths), 0151's and 0155's longest title (68 characters, bold 17 px) takes 3 lines at 375 px: about 563 px of text in a 260 px column. Every other width passes the limit it had before 0427.
- Went with the recommendation: allow 3 lines at 375 px for everyone (chosen by the Foreman, as foreman_fixing is fix, 2026-10-24 07:41 UTC).
- Found while building: in the proportional font, four other panel tests failed on real layout problems the monospace had hidden, so criterion 3 needed small panel fixes: on a phone, a linked id's tap area was 43 px wide (now at least 44, its text centred), and a comma and a space between ids were narrower than the two ids' reaches, so a tap just right of an id went to the next one (the ids in a note now have 4 px wider spaces, and each id's text reaches 5 px either side, not 6); Escape closing the full ticket moved the list 10 px to bring its button into view (focus goes back without scrolling, as 0060 asks); and 0419's list of waited-on tickets was too short to need three lines (now 20 ids, not 14).
- 0140 AC2 (at 700 px the phone rules change nothing) failed once in the related run and passes on its own, with and without this change: it measures a ticking clock's text under load.
- Self-check: no changes. Checked that 0441 AC1 fails without the font settings file, that a FONTCONFIG_FILE already set is kept (fontconfig resolves the include as it would the variable) and that an & or < in its path is escaped.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
In a proportional font, the longest test title ("Read the owner's private words from outside the repo in 0082's check") takes 3 lines on a 375 px phone screen, not the 2 that 0151's and 0155's tests allowed before 0427, so restoring that limit (criterion 2) makes those two tests fail (criterion 3). Should the 375 px limit become 3 lines for everyone, with no monospace exception (every other width keeps its old limit), or should the tests keep asking for 2 lines and fail until a separate ticket makes titles fit on a phone?

Recommended: allow 3 lines at 375 px for everyone
Changes what you'd notice: no
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
