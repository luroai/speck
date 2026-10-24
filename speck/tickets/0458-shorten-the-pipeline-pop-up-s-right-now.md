---
id: "0458"
title: Show only the pipeline log when the screen is pressed                # one outcome, no "and"
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
started: "2026-10-24T09:21:17.863Z"

---
# 0458 · Show only the pipeline log when the screen is pressed

**Status:** 🔨 building

## Problem
Pressing speck's screen opens the Pipeline pop-up, whose Right now section lists what's building, waiting, shipping and blocked, recommendations taken and what the Foreman looked into, some of it from 100 tickets ago. The user doesn't use it, and it pushes the log they do want further down.

## Outcome
Pressing speck's screen shows the pipeline log and nothing else.

## Acceptance criteria
1. Pressing the screen opens the Pipeline pop-up with only its title, Close and the log in it: no Right now section, and none of its headings (Building, Ready, not building, Shipping, Blocked, Recommendations taken, Looked into) or their lines.
2. While the page is running older code than the panel, a Reload page button still shows above the log, and pressing it reloads the page.
3. A Foreman's question keeps its Answer and Dismiss buttons on its ticket's card (0318), and a blocked ticket's question stays on its card.
4. The pop-up opens, closes and gives focus back as before (0415). No test that passed before this change fails.

## Out of scope
- How the log looks and what its lines say (0459, 0460).
- The words on speck's screen itself (0413, 0414).

## Notes
- Asked for by the user on 2026-10-24: "when you click the LCD screen, you just see the pipeline log", because Right now showed information from 0344, "over 100 tickets … ago", that they've not used.
- Failing before this build: none
- The server still sends the board's `foreman` object unchanged: `speck status` and the screen's word use it. Only the panel stops drawing Right now.
- Tests changed because this ticket removes what they checked (AC4 read as: every test still passes, with assertions on the pop-up's Right now replaced by the new behaviour, or by the same facts from the board or `speck status`): 0285 AC2 (two tests) and AC1/AC2 shipping, 0317 AC1, AC2 and AC3 detail tests, 0287 AC4, 0318 AC1 detail, 0366 AC1 and AC4 (refresh now checks the log; the typed answer is now checked on the card, where a refresh doesn't redraw the box), 0413 AC4, 0451 AC3, 0415 AC1 (four tests become two) and its AC3 drag target.
- Docs: the brief and README no longer say the Foreman's detail lists what `speck status` now alone shows.
- Self-check: added a test that the Reload page button goes once the page is no longer stale, with the focus it had going back to the pop-up, which needed the focus check to change.
- Today: `renderForeman` in `templates/panel.js` draws Right now from the board's `foreman` object (0285, 0287, 0299, 0317, 0318, 0328, 0366). Whether the server keeps sending what only Right now used is the builder's call.
- The screen's tooltip says "what speck run is doing, what is waiting, and its log": it should no longer promise what's gone.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
