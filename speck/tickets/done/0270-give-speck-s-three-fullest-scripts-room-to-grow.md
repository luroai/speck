---
id: "0270"
title: "Give speck's three fullest scripts room to grow"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T10:57:46.651Z"
approved: "2026-10-17T11:03:26.761Z"
finished: "2026-10-17T11:05:29.534Z"

---
# 0270 · Give speck's three fullest scripts room to grow

**Status:** ✅ done

## Problem
No file under `scripts/` may be over 600 lines (0078 AC2). `scripts/panel.mjs` and `scripts/run.mjs` are at exactly 600 lines and `scripts/core.mjs` is at 599, so the next ticket that adds a line to any of them fails at ship time and is handed back to its build. 0258, 0260 and 0261 were each handed back for this on 2026-10-17.

## Outcome
`scripts/panel.mjs`, `scripts/run.mjs` and `scripts/core.mjs` each have room for the next few tickets, and speck does exactly what it did before.

## Acceptance criteria
1. `scripts/panel.mjs`, `scripts/run.mjs` and `scripts/core.mjs` are each at most 500 lines.
2. No file under `scripts/` is over 600 lines.
3. Every function and constant another file imports from one of those three files can still be imported from where it is imported today, so no file outside `scripts/` has to change its imports.
4. No test that passed before this change fails.

## Out of scope
- Changing what any code does. Code is moved, not rewritten.
- Lowering the 600-line limit.

## Notes
- Move whole parts that belong together into new modules under `scripts/`, named for what they do, as 0078 did for `speck.mjs`.
- Failing before this build: none
- Moved: ticket lint to `scripts/lint.mjs` and builder spend to `scripts/spend.mjs` (from core.mjs); finding and signalling a build's processes to `scripts/build-procs.mjs` and its run records to `scripts/build-records.mjs` (from run.mjs); the Ship button and speck run switch to `scripts/panel-run.mjs` and the board reader to `scripts/panel-board.mjs` (from panel.mjs). Each old file re-exports what it exported before. Code tests read or patch by its text (0018, 0079, 0148, 0207, 0232, 0245, 0247, slow-panel) stayed where it was.
- Self-check: no changes. Every moved line is identical apart from `export` added where another module now imports it; core.mjs now also exports `validPriority`, `splitHeader` and `fmEnd` for lint.mjs.

## In plain words
Nothing changes for someone using speck: every command, the panel and `speck run` work exactly as before. Behind the scenes, three of speck's fullest code files were each nearly at the size limit, so any ticket that added to one of them was sent back at ship time. Some of their code now lives in six smaller files, which leaves each of the three with about 100 lines of room. You'll notice it as fewer tickets handed back for being too big. If one does get handed back for size again, the cause is a different file.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 192,221
- Elapsed since build started: 6 min
- Changed lines: 833 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "c11b8d8d5bf267156a4e8ec479db1a49df3c95ff",
    "thread_id": "01a14987-6a10-7ab0-8da1-b9991607c11c",
    "seconds": 24,
    "usage": {
      "input_tokens": 191249,
      "cached_input_tokens": 138368,
      "cache_write_input_tokens": 0,
      "output_tokens": 972,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T11:03:17.977Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Verified panel.mjs has 498 lines, run.mjs 464 and core.mjs 459. Passing test '0270 AC1' checks the 500-line limit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Verified every file under scripts/ is within 600 lines; the largest is speck.mjs at 583. Passing test '0270 AC2' checks recursively."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The original modules re-export the moved public names. Passing test '0270 AC3' checks existing imports and the previous export lists. Independent imports of the affected modules also succeeded."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded targeted run reports 346 passed, zero failed and three skipped. No existing tests changed. Inspection confirmed moved code retains its original lines apart from added exports, with dependencies supplied by imports."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The three scripts now fit below 500 lines, with related code moved into six smaller modules. Existing imports remain compatible, and the targeted tests pass. I found no behaviour changes or blocking concerns."
  }
}
```

</details>
