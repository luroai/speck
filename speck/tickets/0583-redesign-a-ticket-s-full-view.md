---
id: "0583"
title: "Redesign a ticket's full view"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0577"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:34:51.709Z"

---
# 0583 · Redesign a ticket's full view

**Status:** 🔨 building

## Problem
A ticket's full view (the "side pane", `#full-ticket`) still has the LCD-era look, with tags and bordered boxes. In the redesign it's the one place a ticket's detail lives, so it needs to read clearly on a phone and end in the action that's needed.

## Outcome
A ticket's full view reads top to bottom as in the mock and ends in the action it's waiting for.

## Acceptance criteria
1. The full view starts with a back link to the lane it came from, the ticket's id at the right, a status pill (orange when it waits for you, blue while it's being worked on, grey otherwise) and its title.
2. Below the title, a step track shows four bars, Ready, Built, Reviewed and Ship, filled up to where the ticket is, with a step that waits for you in orange.
3. Its facts are a two-column grid: priority, size, risk, whether it ships by itself (and why not, when it won't), the builder and its model, and the reviewer and its model.
4. Then its outcome, its acceptance criteria as a list with a tick on each one the reviewer passed, and rows that open its review pack and its build log. An approved ticket has a bar fixed to the bottom with Ask for changes and, in the accent colour, Ship.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A build's live log and Stop button in the full view (0584).
- What changed in its criteria (0588).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `fullTicket`, `paneSteps`, `renderFull` in `templates/panel-popups.js`, the track (`trackOf`) and facts (`factsOf`, `factCell`) in `templates/panel.js`, styles in `templates/panel-popups.css` and `templates/panel-cards.css`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: hid the folded note box, which the box's own `display: block` kept on show; drew the tick in CSS, as the checkmark glyph isn't in the panel's fonts; the back link is a link with no border, so the edge checks no longer list it.
- The Build log row also shows a log for a ticket whose card is closed. `--related` doesn't pick the panel test files, as they reach the page through a support module, so this build ran every test file that uses the panel page as well.
- speck (2026-11-09 19:02 UTC) told you: Nothing is stuck and main isn't broken: 0583 is slow because the redesign broke about 37 older tests of the old look, which it has been updating one batch at a time (4 left, all pointing at the old Close button), with about 10 of its 27 minutes in four long runs on a busy machine, one of them a screenshot script that hung until its 3-minute limit. Separately, while clearing up after that hang at 18:56 the build ran a command to kill every speck panel on the machine, and your real panel showed as only seconds old just afterwards, so it was probably restarted by this; 0589's ship still went through. Why: The build's log shows failures falling from 37 to 4 with every one tied to the full view it is changing, four runs of two to three minutes at a load of 20 to 28 on 16 cores, and the kill command followed by a process list showing the panel freshly started.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Old-look tests updated to the new one (AC5):
- `test/panel-0054`, `0061`, `0063`: Outcome and Acceptance criteria now come before Problem, and the pane closes from its back link. `0063`'s section comparison leaves out the rows.
- `test/panel-0133`: an approved ticket's full view now has Ship, in its bar.
- `test/panel-0143`, `0165`, `0213`, `0424`: priority, size and risk are separate cells in the new grid, for shipped tickets too; type isn't one of its facts.
- `test/panel-0161`, `0453`: the back link is a link with no border, so it's no longer one of the bordered controls they check.
- `test/panel-0423`, `0466`, `panel-focus-0326`: the pane closes from its back link.
- `test/panel-0465`: the full view has its own four bars and six facts rather than its card's track and table, values wrap, and there is no counter in it.

Follow-ups:
- A draft's Set ready is still at the top of its body, in its readiness list, rather than at the end of the view: only an approved ticket has the bar (AC4).
