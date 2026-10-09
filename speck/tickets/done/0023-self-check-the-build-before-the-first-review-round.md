---
id: "0023"
title: "Self-check the build before the first review round"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T09:37:30.052Z"
finished: "2026-10-09T09:40:57.403Z"

---
# 0023 · Self-check the build before the first review round

**Status:** ✅ done

## Problem
In 0012, 0013 and 0014, the first review round always came back with one blocking finding, and each was an edge case the builder could have found: input that's built in rather than missing (`constructor`), state carried between rounds, an error that dropped part of the output, a docs claim wider than the code. Each round costs 200k–500k reviewer tokens and several minutes.

## Outcome
Before the first review round, the builder checks its own work against a short adversarial checklist and fixes what it finds, so fewer tickets need a second round.

## Acceptance criteria
1. The build skill has a self-check step after implementation and before the review loop. It covers at least: unusual inputs (empty, missing, malformed, built-in names), state carried across rounds or re-runs, error paths and their messages, every claim in docs or `product.md` matched to code and a test, and changes outside the ticket's scope.
2. The step tells the builder to add a test for each problem it finds, fix it, and then write one line in the ticket's Notes saying the self-check ran and what it changed (or "no changes").
3. The step says plainly that the self-check isn't a review or an approval, and the reviewer still decides.

## Out of scope
- Changing the reviewer prompt or the review loop.

## Notes
- The checklist comes from the round-1 findings in 0003, 0012, 0013 and 0014. Keep it short enough to run in a few minutes.
- Self-check: the AC1 test matched loose keywords (for example `/rounds?|re-runs?/`) that almost any text would pass. It now requires each checklist item by its bold label, with the substance the ticket asks for.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approved, with no findings.

## Delivery log
- Review rounds: 1 (codex, `gpt-6.1-sol`), with 218,097 reviewer tokens.
- Elapsed: about 3 minutes from start to approval (from `speck pack`).
- Changed lines: 11 (excluding tests and `speck/`), against a limit of 5,000.
- The self-check was run on this ticket itself and tightened a loose test before review. Round 1 then approved.
- Follow-up ideas: none.

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
    "reviewed_sha": "5114e3dfca6865d00ac917e7193ad0672ed006d9",
    "thread_id": "01a12008-5632-7f01-8300-9857eea93687",
    "seconds": 41,
    "usage": {
      "input_tokens": 217251,
      "cached_input_tokens": 168576,
      "cache_write_input_tokens": 0,
      "output_tokens": 846,
      "reasoning_output_tokens": 105
    },
    "saved_at": "2026-10-09T09:40:20.327Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, section 3 step 5, places all five required checklist areas after implementation and before review. The 0023 AC1 test checks placement and checklist content; its assertions passed independently."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 3 step 5 requires a failing test for each problem, a fix, rerunning tests and one Self-check line in the ticket's Notes, including the no-changes alternative. The 0023 AC2 assertions passed independently."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 3 step 5 explicitly says this is not a review or an approval and the reviewer still decides. The 0023 AC3 assertions passed independently."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The new capability accurately describes the checklist and identifies it as skill instructions rather than CLI enforcement."
    },
    "escalation_question": "",
    "summary": "The build instructions now require a short adversarial self-check before the first review, with tests and fixes for problems found and a note recording the result. Independent review remains the approval gate. All three acceptance tests passed independently; the changes stay within scope."
  }
}
```

</details>
