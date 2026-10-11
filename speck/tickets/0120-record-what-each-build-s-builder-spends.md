---
id: "0120"
title: "Record what each build's builder spends"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-spend-fewer-tokens-per-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T11:12:25.911Z"

---
# 0120 · Record what each build's builder spends

**Status:** 🔨 building

## Problem
speck records only the reviewer's tokens, so the panel's "median tokens" leaves out the builder, which is probably the larger spend: 0.5–2.8M tokens read and $0.50–2.18 per build, as Claude Code reports it, for five builds on 11 October. Without that, you can't see what a build costs or judge changes meant to cut it, such as choosing the builder's model per ticket.

## Outcome
The panel shows what each build's builder spent, beside what its reviewer spent.

## Acceptance criteria
1. When a build that `speck run` launched ends and its log has a final `result` line reporting usage, as Claude Code's `--output-format stream-json` writes it, speck records the builder's tokens and cost for that ticket. Tokens count input (including cache reads and cache writes) plus output. Cost is the result's `total_cost_usd`.
2. `speck status --json` gives each ticket's recorded builder tokens and cost.
3. The panel's Shipped rows label the existing figure as the reviewer's tokens, and show the builder's tokens and cost when they're recorded.
4. The stats above Shipped add the median builder tokens and median builder cost, each covering only the done tickets with that data and saying how many.
5. A ticket with no recorded builder spend (built before this change, built without `speck run`, or by a builder whose log has no such line) shows none, and the rest of Shipped is unchanged.

## Out of scope
- Writing builder spend into the ticket's Delivery log: `speck close` runs inside the build, before its final usage is known.
- Choosing the builder's model per ticket (`speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`).

## Notes
- Measured 2026-10-11: Claude Code's final `result` line in `speck/.cache/runs/<id>.log` has `usage` (`input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens`) and `total_cost_usd`.
- On a subscription, the cost is a guide rather than a bill.
- Checked 2026-10-11: a build resumed after being killed (0110) appends to the same `speck/.cache/runs/<id>.log` (opened with `a`). A log can hold several `result` lines: one per resumed process and one per turn a background task's notification starts. In the 0099 log, `total_cost_usd` and `modelUsage` on each `result` line are cumulative for the whole session, including the run before the kill, while `usage` covers only that one turn. So the builder's tokens are taken from the last `result` line's `modelUsage` (summed over models), falling back to its `usage` when there's no `modelUsage`.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
