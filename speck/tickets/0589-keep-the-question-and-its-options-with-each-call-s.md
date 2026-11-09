---
id: "0589"
title: Keep the whole question with each call speck makes                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0576"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0589 · Keep the whole question with each call speck makes

**Status:** 📝 draft

## Problem
Decided for you lists only the option speck took. To judge a call, and to change it, you need the question it answered and the options it didn't choose, which today live only in free text in the build's question, if at all.

## Outcome
Each call speck makes keeps its question and its other options, and Decided for you can show them.

## Acceptance criteria
1. The build skill's blocked question has an `Other options:` line beside `Recommended:`, and speck reads it as it reads `Recommended:`.
2. When speck takes a recommendation (watch fix or decide, the watch agent's decide, or a size-guard split), it keeps the question, the option it went with, the other options and the time with the ticket's run record.
3. `speck status --json`'s list of calls gives each one's ticket, question, chosen option, other options, time and whether the ticket's criteria changed.
4. Calls made before this still show, with the question and other options blank.
5. No test that passed before this change fails.

## Out of scope
- How Decided for you shows them (0590).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `questionFacts` in `scripts/question-facts.mjs` reads `Recommended:`, `Changes what you'd notice:` and `Clear winner:`; `goWith` in `scripts/go-with.mjs` keeps `go_with`; the list is built in `scripts/foreman-took.mjs` (0568). Waits for 0576, which changes the same lines.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
