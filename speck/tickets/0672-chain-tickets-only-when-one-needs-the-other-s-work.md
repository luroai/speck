---
id: "0672"
title: "Chain tickets only when one needs the other's work"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:04.847Z"

---
# 0672 · Chain tickets only when one needs the other's work

**Status:** 🔨 building

## Problem
The ticket skill chains a new ticket after every open ticket likely to change the same part of a file, and counts any doubt as an overlap. A chained ticket can't start until the other has shipped, so ready tickets wait while build slots stand free: in this repo's history, 587 of the 714 hours tickets spent between ready and starting were spent waiting on `after:`. What the waiting avoids is small: 11 of 268 ship attempts (4%) met a conflict, and a conflict costs one merge round, about 9 minutes.

## Outcome
Tickets wait for each other only when one can't be built without the other's work, or both would rewrite the same lines, so more ready tickets build side by side.

## Acceptance criteria
1. The chaining step of `skills/speck-ticket/SKILL.md` says to add an `after:` link in two cases only: the new ticket can't be built or tested until something the other ticket makes exists (such as a command, a setting, a function or a part of a document it adds to), or both tickets are likely to rewrite the same lines. It says that two tickets changing the same function, the same style rules or the same section of a document in different lines, or adding lines in the same place, build side by side. (checked by review)
2. The step says what to do in doubt: leave the two tickets unchained, and name the shared file and part when presenting the tickets, so the user can chain them. (checked by review)
3. The words "count it as an overlap" appear nowhere in `skills/speck-ticket/SKILL.md`.
4. The step still says to change only the new ticket and never to make a loop, the triage step that makes tickets still points to it, and the copies `speck init` installs match `skills/speck-ticket/SKILL.md`.
5. No test that passed before this change fails.

## Out of scope
- How `after:` works once it's set: a chained ticket still waits until the other has shipped (0674 changes when it can start).
- Removing `after:` links from tickets already written.
- Finding overlaps by machine while tickets build.

## Notes
- Measured 2026-11-15 from this repo's tickets and git history. Of the 279 `after:` links whose two tickets' changes could be compared line by line, 69 (25%) changed lines next to each other's. 284 of all 778 links joined tickets that changed no file in common outside `test/`. Since 29 Oct, ready tickets were held only by a chain during 24 of the 30 hours builds ran.
- The line comparison can't see a ticket that needs another's work without touching its lines, which is why the first case stays.
- The step's wording today is what 0205 and 0475 wrote. `test/ticket-0475.test.mjs` pins the loop rule, the triage pointer and the installed copies, not the overlap wording.
- A conflict costs more while a merge round re-reviews the whole change: 0673 shortens that, and matters more once fewer tickets are chained.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
