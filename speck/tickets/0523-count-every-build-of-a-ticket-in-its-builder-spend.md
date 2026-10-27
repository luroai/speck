---
id: "0523"
title: "Count every build of a ticket in its builder spend"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-27

---
# 0523 · Count every build of a ticket in its builder spend

**Status:** 📋 ready

## Problem
A ticket that `speck run` builds more than once, such as one set ready again after a build that stopped, shows only its latest build's spend: each new build's run record and log replace the last one's. Seven tickets in this repo have lost an earlier build's spend this way, so their builder cost is too low.

## Outcome
A ticket's builder tokens and cost cover every build `speck run` started for it.

## Acceptance criteria
1. When `speck run` starts a new build for a ticket whose earlier build recorded builder spend, and the new build ends with spend of its own, `speck status --json` gives that ticket's `builder_tokens` and `builder_cost_usd` as the sum of the two builds' figures. A third build adds its figures the same way.
2. A build that `speck run` resumed in the same session counts once, at its session's total, as today: it isn't added to the spend of the part before it stopped.
3. When some of a ticket's builds have a known cost and others don't (a Codex or Cursor build, or one whose log has no result line), `builder_cost_usd` is the sum of the known costs and `builder_tokens` the sum of the builds that report tokens. When no build has a known cost, `builder_cost_usd` is null, as today.
4. A ticket built once shows the same `builder_tokens` and `builder_cost_usd` as before this change, and a run record written before this change still reads as it does today.
5. No test that passed before this change fails.

## Out of scope
- Recovering earlier builds' spend that was already overwritten before this change: 0528.
- Pricing Codex and Cursor builds, whose logs report no cost: 0530.
- Builds started by hand with `/speck-build`, which have no run record.

## Notes
- The overwrite: `launch` in `scripts/run.mjs` starts each new build with `startBuild(..., 'w', ...)`, which rewrites `<id>.json` and `<id>.log`; `recordExit` then saves only that log's spend. `builderSpent` in `scripts/spend.mjs` reads `rec.builder`.
- A resumed build appends to its log (`'a'`), and its last result line already covers the whole session (`builderSpend`'s comment), so resumes are already right.
- Keep each build's figures with the time it ended, so 0527 can count them by week or month.
- 0525, 0528 and 0530 add to the same per-ticket spend, so keep the earlier builds' figures somewhere they can add to as well.
- Checked 2026-10-27: 477 run records in `speck/.cache/runs/`; 7 ticket ids have more than one `claude -p "/speck-build <id>"` session in this project's Claude Code transcripts (counted from `~/.claude/projects/<project folder>/*.jsonl`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
