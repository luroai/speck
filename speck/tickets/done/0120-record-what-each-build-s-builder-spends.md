---
id: "0120"
title: "Record what each build's builder spends"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
finished: "2026-10-11T11:19:23.427Z"

---
# 0120 · Record what each build's builder spends

**Status:** ✅ done

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
- The panel's existing "median tokens" stat is relabelled "median reviewer tokens" to match the Shipped rows (AC3), so the 0035 and 0050 tests that quote those labels were updated to the new wording.
- Self-check: moved the new helpers from speck.mjs into core.mjs so speck.mjs stays under 0078's 600-line limit; recordExit drops any stale `builder` entry before adding the new one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 107,804
- Elapsed since build started: 6 min
- Changed lines: 72 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: builder spend lives only in the main checkout's `speck/.cache/runs/<id>.json`, so it's per machine and is replaced if the ticket is ever launched again.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "27e118ef5db0c74fa200a35abb5e3f05f2d1a281",
    "thread_id": "01a12aae-e965-7db1-985e-a3c871101a16",
    "seconds": 25,
    "usage": {
      "input_tokens": 107162,
      "cached_input_tokens": 63488,
      "cache_write_input_tokens": 0,
      "output_tokens": 642,
      "reasoning_output_tokens": 16
    },
    "saved_at": "2026-10-11T11:18:13.548Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs recordExit records builderSpend from the completed log. scripts/core.mjs builderSpend uses the last result, sums cumulative modelUsage across models, and falls back to usage. Four passing AC1 tests cover recording, cumulative totals, missing usage and missing cost."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs statusData exposes builder_tokens and builder_cost_usd through core.mjs builderSpent. Passing AC2 test exercises status --json with recorded, absent and invalid data."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html render labels reviewer tokens and adds recorded builder tokens and dollar cost. Passing AC3 test checks the rendered Shipped rows, including tokens without cost."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html panelModel calculates each median from done tickets with that specific data; render includes ticket counts. Passing AC4 test checks different token and cost populations and excludes a building ticket."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 test verifies absent builder spend adds no row figures and preserves duration, review rounds and reviewer totals. AC1 and AC2 tests also cover logs without usage and tickets without run records."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Builder tokens and estimated dollar cost are recorded when a build ends, exposed in status, and displayed beside reviewer tokens in Shipped. The new medians count only completed tickets with the relevant data. Tests exercise the actual recording and rendering paths; the full test log confirms 1,052 passes, three skips and no failures. No blocking issues found."
  }
}
```

</details>
