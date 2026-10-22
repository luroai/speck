---
id: "0364"
title: "Keep the panel's header on one row with the project always shown"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-22-keep-the-panel-s-header-compact-all-the-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0363"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:26:17.888Z"

---
# 0364 · Keep the panel's header on one row with the project always shown

**Status:** 🔨 building

## Problem
In a narrow window, such as the browser pane in Cursor or the Claude desktop app, the header takes two rows and drops to one as you scroll, hiding the project and base branch. It looks unsettled, and you can lose track of which repo the panel is for. It also shows speck twice: the logo mark, and the builder on the Foreman's button.

## Outcome
The header is always one compact row that shows the project and base branch, with speck's mark once.

## Acceptance criteria
1. Under 700 px wide, the header is always one row, whether or not the page is scrolled: speck's mark, the project and base branch, the Foreman's button, Settings and light/dark, in that order. Scrolling never changes its height or what it shows, and it's at most 60 px tall plus the top safe-area inset.
2. The project and base branch show at every width, as today's "<project> · base <branch>". When the row is too narrow, they're cut short at the end with an ellipsis, never hidden, and their full text shows in a tooltip. At 500 px wide, with project `speck`, base `main` and the Foreman reading "Building 1", nothing in the header is cut short.
3. Under 700 px wide, the "speck" word next to the mark is hidden, and the mark stays. At 700 px and wider, the header looks as it does today, apart from AC4.
4. At every width, the Foreman's button shows its word without the builder character, with its colours, its tooltip and what pressing it does unchanged.
5. At 320 px wide, nothing scrolls sideways or overlaps, and every header button is at least 44 px tall. Jumping to a ticket and opening the full ticket still show their target below the header. No test that passed before this change fails, except checks of the header slimming as you scroll, the builder on the Foreman's button and the "speck" word under 700 px, which are changed to check these criteria.

## Out of scope
- The scrolling notice board in place of the Foreman's button (`speck/ideas/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md`).
- The builder badges on tickets in the queue, the app icon and the "control panel" label at 700 px and wider.

## Notes
- Today: the header markup and the 0160 slim-on-scroll script in `templates/panel.html`, with its layout under `@media (max-width: 699.98px)` (0150, 0160, 0163, 0309).
- The project and base branch stay fixed text in the header, not words on a future notice board: you should read where you are at a glance, without waiting for the words to scroll round.
- One logo: speck's mark stays. The builder character on the Foreman's button goes, and the "speck" word goes under 700 px, to leave room for the project.
- The Foreman's words today: "Off", "Idle", "Building <n>", "Shipping <id>", "Needs you <n>" and "Waiting: <why>" (`scripts/foreman.mjs`). A long one is cut short with an ellipsis, as now.
- Failing before this build: none
- Self-check: on a phone, "Fixing on" beside a long Foreman word could spill out of the button onto Settings at 320 px, so it now gives way inside the button too, with a test. The brief's line about the header slimming on a phone now says it's one row.
- Changed older tests, as AC5 allows: the header slimming as you scroll (0160, 0163, 0170, 0309), the builder on the Foreman's button (0127, 0140, 0144, 0150, 0163, 0199, 0203, 0303, logo-0320) and the "speck" word under 700 px (0170, 0304, 0309). Also 0140 AC3 and 0309's check that the project shows in full at 375 px: on the one row, those tests' `speck-xxxxxx` project is cut short with an ellipsis at 375 px, as AC2 allows (it's in full at 500 px with `speck`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
