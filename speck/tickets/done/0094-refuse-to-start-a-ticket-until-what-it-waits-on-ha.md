---
id: "0094"
title: "Refuse to start a ticket until what it waits on has shipped"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T22:40:08.807Z"
finished: "2026-10-10T22:58:10.744Z"

---
# 0094 · Refuse to start a ticket until what it waits on has shipped

**Status:** ✅ done

## Problem
A ticket can wait on others with `after:`. `speck run` holds it until they've shipped, but `speck start`, which `/speck-build` uses, only checks that the ticket is ready. So building a ticket by hand can start it before the work it depends on is in `main`, on a branch that doesn't have that work.

## Outcome
`speck start` refuses a ticket until every ticket in its `after:` has shipped, and says which ones it's still waiting for.

## Acceptance criteria
1. `speck start <id>` refuses when any ticket in its `after:` isn't `done`. The message names each one with its status (for example `0086 (approved)`) and says the ticket can start once they've shipped. Nothing changes: no branch, no worktree, no status change and no commit.
2. A ticket in `after:` that was cancelled, or an id that matches no ticket, also refuses, naming it and saying it must come out of `after:` before the ticket can start.
3. A ticket whose `after:` tickets are all `done`, or that has none, starts exactly as before.
4. `speck run` keeps waiting for the same thing: it launches a ticket only once its `after:` tickets are `done`.

## Out of scope
- Changing what `speck run` or the panel show for waiting tickets.

## Notes
- `speck run` already waits on `done` (`waiting_on` in `statusData`); this brings `speck start` in line.
- Failing before this build: none
- Self-check: no changes. Checked ids written as numbers, repeated ids, `constructor` as an id, and that resuming a started ticket still reports its worktree (the branch check runs before the after: check). AC3 and AC4 tests passed before the change: they guard existing behaviour.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 282,938
- Elapsed since build started: 11 min
- Changed lines: 22 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "1ceb08b0457f0ccd7d100b9138af01857ab3e6f7",
    "thread_id": "01a12803-4279-7e63-8511-6fe993e7892b",
    "seconds": 20,
    "usage": {
      "input_tokens": 282232,
      "cached_input_tokens": 181632,
      "cache_write_input_tokens": 0,
      "output_tokens": 706,
      "reasoning_output_tokens": 32
    },
    "saved_at": "2026-10-10T22:51:24.955Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdStart calls startWaits before any mutation. startWaits names unfinished dependencies and their statuses and explains the shipping requirement. The three AC1 tests in test/start-0094.test.mjs exercise real CLI refusals and compare commits, branches, worktrees, working-tree status and ticket contents; all passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs: startWaits handles missing and cancelled dependencies separately and explicitly instructs removal from after:. The AC2 tests exercise both cases, including constructor as a missing id, and verify no changes; all passed in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs: startWaits returns null for absent or empty dependencies and when every dependency is done, preserving the existing start path. Both AC3 tests exercise successful CLI starts; the all-done test verifies building status and the start commit. Both passed in the supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/run.mjs retains its waiting_on launch guard, and statusData still treats only done dependencies as satisfied. The AC4 test runs the real scheduler with a fake builder and verifies that only the ticket with a done dependency launches; it passed in the supplied output."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Manual starts now refuse tickets with unfinished dependencies, explain what must ship, and identify cancelled or missing dependencies to remove. Refusals leave the repository unchanged. Eligible starts and automatic scheduling retain their existing behaviour. The tests exercise the actual commands, and the change stays within scope. I inspected the code and tests; I did not rerun tests in the read-only environment."
  }
}
```

</details>
