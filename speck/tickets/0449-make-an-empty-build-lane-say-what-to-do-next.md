---
id: "0449"
title: "Make an empty Build lane say what to do next"                # one outcome, no "and"
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
after: ["0445", "0451"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:54:16.316Z"

---
# 0449 · Make an empty Build lane say what to do next

**Status:** 🔨 building

## Problem
With nothing building or ready, the Build lane says "Nothing in flight or ready" twice, once as its counts line and once as its message, and nothing else. It looks empty and gives no next step.

## Outcome
An empty Build lane says it's clear once, shows what was shipped lately, and points to the next step.

## Acceptance criteria
1. With nothing in flight or ready, the Build lane says `Nothing building` once, without the counts line repeating it.
2. Under it, it says when the last ticket shipped and which, as `Last shipped 0433 · 12 min ago` (or `· today 08:10`, or a date when it wasn't today), and how many shipped today, as `24 shipped today`. With nothing shipped yet, it leaves those lines out.
3. With draft tickets in Plan, it offers a `Go to Plan · <n> drafts` button that opens the Plan tab. With none, it says to talk to your agent to capture an idea or make a ticket.
4. At 375 px and 1280 px wide, in both looks, the message is centred in the lane and meets 0161's contrast.

## Out of scope
- A lane with tickets in it.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the user's phone screenshot on 2026-10-24: "an empty build queue looks a bit boring."
- Today: `fill('queue', …, 'Nothing in flight or ready.')` and `#queue-n` in `templates/panel.js`.
- Waits for 0445 (`templates/panel.css`) and 0451 (`templates/panel.js`).
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
