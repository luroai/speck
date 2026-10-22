---
id: "0373"
title: "Restore speck's dot-matrix name beside the base branch"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-give-the-header-s-notice-board-more-room.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0372"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:15:26.690Z"

---
# 0373 · Restore speck's dot-matrix name beside the base branch

**Status:** 🔨 building

## Problem
Under 700 px the header hides the dot-matrix "speck" word so the project line can stay. That line is 12 px text, so on a narrow pane the title reads as a small "speck · base main" beside the mark.

## Outcome
The header shows "speck" in its dot-matrix lettering at every width, with the base branch written beside it.

## Acceptance criteria
1. At every width, including under 700 px, the header shows the mark and then the word "speck" in the Doto dot-matrix lettering at 26 px, as that word shows at 700 px and wider today. The word is not hidden.
2. Immediately after that word, the header says "base <branch>", for example "base main". The separate "<project> · base <branch>" line is gone at every width.
3. The header stays one row. The word "speck" is never cut short. When "base <branch>" doesn't fit, it is cut short at the end with an ellipsis and its full text shows in a tooltip. At 500 px wide, with base `main`, nothing in the header is cut short.
4. At 700 px and wider, the "control panel" label still shows, as today. Under 700 px it stays hidden.
5. No test that passed before this change fails, except checks that the "speck" word is hidden under 700 px or that the header shows "<project> · base <branch>", which are changed to check criteria 1 and 2.

## Out of scope
- The project name in the header. This ticket leaves it out: the title is the speck word, and the base branch sits beside it.
- Light/dark in the header: 0372, which has removed that button.
- How fast the notice board scrolls: 0374.

## Notes
- Checked 2026-10-22: under 700 px, `templates/panel.html` sets `.logo .name` to `display: none` (0364). The word's rule at every other width is Doto at 26 px. The project line is `.repo`, 12 px, "<project> · base <branch>".
- Failing before this build: none
- Tests changed for AC5: the checks that "speck" is hidden under 700 px (0170, 0309, 0364) and that the header shows "<project> · base <branch>" (0031, 0033, 0059, 0134, 0140, 0364). Also changed, because "base <branch>" now sits inside the title between "speck" and "control panel": the title's exact HTML (0303, 0304, 0320), and the order and overlap checks that measured the old project line against the whole title box (0150, 0163, 0309), which now measure it against the "speck" word. 0372 AC4 at 320 px: with the word back, putting the old light/dark button back would squeeze the Foreman's button to its 44 px least, so there it checks the board gained room rather than the button's full 50 px.
- Self-check: no changes. The base branch's text is escaped by the server as before, and its tooltip is set from the text once the page loads.
- Seen in the panel at 127.0.0.1:4777 in a narrow pane: the mark, then "speck · base main" in the small text, then the notice board, Settings and light/dark.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
