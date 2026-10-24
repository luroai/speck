---
id: "0458"
title: "Shorten the Pipeline pop-up's Right now"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0458 · Shorten the Pipeline pop-up's Right now

**Status:** 📝 draft

## Problem
Pressing speck's screen opens the Pipeline pop-up, whose Right now section says what's building, waiting, shipping and blocked in full sentences, with a sentence for every empty section too. On a phone that's a lot of reading to find out what's going on.

## Outcome
Right now says what's happening in a few short lines.

## Acceptance criteria
1. Each line in Right now about a ticket starts with its id and is at most 48 characters, such as `0454 waiting on 0453` or `0442 can't ship: main's tests fail`. No line shows a session id, a process id, a file path or a command.
2. A section with nothing in it isn't shown. When every section is empty, Right now shows the one line `Nothing happening.`
3. A blocked ticket's or the Foreman's question is still shown in full, with its Answer and Dismiss buttons. A stale page still shows its Reload page button.
4. Opening, closing and focus work as before (0415). No test that passed before this change fails.

## Out of scope
- The Log section under it (0459).
- The words on speck's screen itself (0413, 0414).

## Notes
- Asked for by the user on 2026-10-24: "a version where it has that update, but maybe like just shorter words … let's just go from there." A first try, to be tuned once it's been used.
- Today: `renderForeman` in `templates/panel.js` draws Right now from the board's `foreman` object (0285, 0287, 0299, 0317, 0318, 0328, 0366), with `Nothing is building.`-style lines for empty sections and the server's full `why` sentences.
- Exactly what each short line says is the builder's call, within criterion 1.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
