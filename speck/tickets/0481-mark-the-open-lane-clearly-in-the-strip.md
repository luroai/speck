---
id: "0481"
title: "Mark the open lane clearly in the strip"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:03:22.021Z"

---
# 0481 · Mark the open lane clearly in the strip

**Status:** 🔨 building

## Problem
In the strip under speck's screen (0477), the open lane's name differs from the others only by a slightly darker grey, so on a phone the user can't tell whether Plan, Build or Shipped is open.

## Outcome
The open lane in the strip is plain to see at a glance, in both looks.

## Acceptance criteria
1. The open lane's name in the strip is in the text colour, with a bar under it at least 2 px tall, as wide as the name, in the text colour. The other lanes' names have no bar and stay in the muted colour. Every name keeps its weight and size, so none changes width.
2. The difference doesn't rely on colour alone (0161): with the colours removed, the bar still shows which lane is open. Checked in a real browser in the light and dark looks at 390 px.
3. The bar moves to the new lane when a swipe, a press on the strip or the ← and → keys change lane, and after the 2-second refresh it's still under the open lane. Build's needs-you number keeps its place and colour (0477).
4. The strip stays 32 px tall, each lane's button stays at least 44 px each way, and nothing in the strip shifts sideways when the open lane changes. No test that passed before this change fails.

## Out of scope
- The lanes' cards under the strip (0480).
- Adding lanes, or dots in the strip.

## Notes
- Asked for by the user on 2026-10-24: "I need the Plan / Build / Shipped tabs at the top to be more highlighted. I can't tell which is selected."
- Today: `.tab` and `.tab[aria-selected="true"]` in `templates/panel-header.css` (0477): the open lane's name is in `--text` and the others in `--muted`, both at weight 600. 0457's folder-tab look for the open tab went with 0477's strip.
- Failing before this build: none
- Self-check: no changes (the bar is drawn only from aria-selected, which every way of changing lane already sets; in forced colours the bar keeps the system text colour and the other names have no border to show)

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
