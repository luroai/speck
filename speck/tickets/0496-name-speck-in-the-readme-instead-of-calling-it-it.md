---
id: "0496"
title: "Name speck in the README instead of calling it It"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T10:19:06.105Z"

---
# 0496 · Name speck in the README instead of calling it It

**Status:** 🔨 building

## Problem
The README keeps calling speck "It": "It isn't only code", "It raises its own fix tickets", "It asks, then moves on" and so on. A first-time reader loses track of who is doing the work, and the pitch reads flatter than it should.

## Outcome
Wherever the README says what speck does, it names speck, and where an agent does the work it says speck has your agent do it.

## Acceptance criteria
1. No sentence and no bold label in `README.md` starts with "It" or "It's" standing for speck. Each names speck instead, for example "speck raises its own fix tickets" in The clever bits. (checked by review)
2. Where the README says an agent or a build does something on speck's behalf, the sentence makes speck the one behind it, for example "If `main` breaks, speck has the build that finds it write a priority-0 fix ticket". (checked by review)
3. A sentence that starts with "It" standing for something else, such as the panel or the `init` command, names that thing instead. (checked by review)
4. Each changed sentence keeps its meaning and facts, and no section is added or removed. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- The "It fits the way you really work, in bursts" paragraph and the "speck was built by a product manager" line: 0497 rewrites them.
- The status line and the "Built with speck" figures: 0452.
- `docs/brief.md` and the other docs.

## Notes
- Write speck in lower case, as the rest of the README does, even at the start of a sentence or bold label.
- Present tense, as the README uses elsewhere ("speck raises", not "speck will raise").
- Repeating "speck" down The clever bits is fine: the user asked for speck to be named each time.
- Sentences it covers today: "It isn't only code." (opening), every bullet of The clever bits except "Ideas only become tickets in conversation" (including "It fits in your pocket"), "It runs on your machine" (The panel) and "It sets up `speck/`" (Without an agent).
- Asked for by the user on 2026-10-25.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
