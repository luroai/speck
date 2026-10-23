---
id: "0419"
title: "Fit a closed Plan or Build ticket on two lines"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0418"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T16:20:29.027Z"

---
# 0419 · Fit a closed Plan or Build ticket on two lines

**Status:** 🔨 building

## Problem
A closed ticket in Plan or Build takes three or four rows: its title, a row of boxed tags, then its criteria and lint result, then what it waits on. In a narrow side pane that's 110–175 px per ticket, so only a few fit on screen.

## Outcome
A closed Plan or Build ticket is a title line and one line of details.

## Acceptance criteria
1. A closed Plan ticket shows its id and title, then one line in smaller type: its priority, size and risk, its criteria count, its lint result, and `after <ids>` when it waits on other tickets, separated by ` · `. The title wraps when it's too long for one line, and the details line wraps only when it doesn't fit.
2. A closed Build ticket shows its id and title, then one line in smaller type: its stage sentence, its stage name and its timer, followed by its priority, size and risk, separated by ` · `, for example `Writing tests and code · Build · 19:18 · P3 · M · low`. A queued ticket's line starts `Queued · waiting on <ids>`.
3. The priority still opens its menu, size and risk still show their explanations, and each id after `after` or `waiting on` is still a "Go to ticket" link, all as today.
4. A question, a recommendation, a Ship button or a message that a ticket's card shows today still shows, under the two lines.
5. At 420 px wide, with a mouse as the main pointer, a closed ticket whose title fits on one line is no more than 64 px tall.

## Out of scope
- Shipped tickets (0420), and an open ticket's card (0421).
- New wording for stages or details.

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there.
- 64 px needs 0417's compact controls.
- Waits for 0418: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: a ticket missing its priority, size or risk, or its timer, leaves them out of its line with no empty part (new test); a wrapped line ends with its dot rather than starting with one, and breaks only between parts, a list of linked ids wrapping between its ids; removed two rules for the old tag row.
- Built: the bug, fix and document tags and the chain icon stay. The tags follow the risk in the details line, as words; the icon follows the id. Tags in the line are inline text with a mouse, and keep their 44 px boxes on a touch screen (0417).
- Known limit: at 420 px a details line longer than about 50 characters of 12 px text, such as a reviewing ticket's "Codex is reviewing · round 2 · Review 2 · 01:07 · P2 · S · low", wraps onto a second line, as AC1 and AC2 allow, and that card is then about 76 px tall. Shorter text (0161) or new wording (out of scope) would be needed to fit it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
