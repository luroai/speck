---
id: "0527"
title: "Add up AI spend across tickets with speck spend"                # one outcome, no "and"
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
after: ["0526"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:57:10.753Z"

---
# 0527 · Add up AI spend across tickets with speck spend

**Status:** 🔨 building

## Problem
There's no way to see what AI work has cost, per ticket or per week or month, without adding up each ticket's figures by hand.

## Outcome
`speck spend` prints what the project's tickets spent on AI, by ticket, model, week or month.

## Acceptance criteria
1. `speck spend` prints one line per ticket with recorded spend, giving its id, title, builder, reviewer and watch agent cost, its total cost and its total tokens, then a line of totals. An unknown cost prints as "unknown", never $0, and the totals line says how many tickets have a part with an unknown cost. With no recorded spend it prints one line saying so.
2. `--by=model` prints one line per model instead, across every build, review round and watch agent run counted: the model, its tokens split into uncached input, cached input, cache writes and output, and its cost, then the totals line. Spend whose model isn't known is grouped under "unknown model".
3. `--by=week` and `--by=month` print one line per week (Monday to Sunday, named by its Monday) or calendar month instead, with its cost and tokens, then the totals line. Each build, review round and watch agent run counts in the week or month it ended, in local time, so a ticket's spend can fall in two.
4. `--since=<YYYY-MM-DD>` and `--until=<YYYY-MM-DD>` count only spend that ended on or after, and on or before, those days, with any view. A date that isn't a real `YYYY-MM-DD` date, or a `--since` after the `--until`, is refused with a message saying why.
5. `--json` prints what the chosen view shows as JSON, every unknown cost as null, with a `totals` object. `docs/brief.md`'s command table lists `speck spend` with `--by`, `--since`, `--until` and `--json`.

## Out of scope
- Recovering spend from before this work: `speck spend --backfill` (0528).
- Spend from sessions speck didn't start, such as capturing ideas or drafting tickets.

## Notes
- Use the same per-ticket figures as `speck status --json` (0526's `total_cost_usd` and `total_tokens`), so the two never disagree.
- `--by=week`, `--by=month`, `--since` and `--until` need the time each part of the spend ended: a build's `exited` in its run record, a round's `saved_at`, and the times 0523, 0525 and 0528 keep.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
