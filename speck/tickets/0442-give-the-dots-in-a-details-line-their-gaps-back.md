---
id: "0442"
title: "Give the dots in a details line their gaps back"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-give-the-dots-in-a-details-line-their-gaps-back.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0441", "0450"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:37:18.185Z"

---
# 0442 · Give the dots in a details line their gaps back

**Status:** 🔨 building

## Problem
In the interface font, the " · " between the parts of a details line nearly touches the words either side, as in "18:56·20 min", because its spaces were narrowed to suit the old monospace font.

## Outcome
Every " · " in a details line has a clear gap on each side.

## Acceptance criteria
1. Each " · " between the parts of a ticket's status line, a shipped ticket's second line and the shipped stats has a gap of at least 4 px between the dot and the text on each side, in the interface font, in both looks.
2. Collapsed tickets still fit on two rows at 390 px, as 0434 and 0420 set, and no test that passed before this change fails.

## Out of scope
- What the lines say (0443).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0427: the narrowing couldn't come out while the tests measured a monospace font, which 0441 fixes.
- Waits for 0441 (the font the tests measure) and 0450, which comes after 0440 and 0444: all change `templates/panel.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
