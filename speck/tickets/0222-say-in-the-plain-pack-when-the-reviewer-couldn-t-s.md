---
id: "0222"
title: "Say in the plain pack when the reviewer couldn't see the code"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-12-say-in-the-plain-pack-when-the-reviewer-couldn-t-see-the-code.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0215"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:20:05.089Z"
approved: "2026-10-15T23:24:21.685Z"

---
# 0222 · Say in the plain pack when the reviewer couldn't see the code

**Status:** 👍 approved

## Problem
When a reviewer couldn't look round the project in a review round and judged the change from the diff alone, the full review pack warns about it but `speck pack <id> --plain` doesn't. The readers of the plain pack are the ones who can't check the code themselves, so they most need to know the review was done half-blind.

## Outcome
The plain pack says when the reviewer couldn't see the rest of the code.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When any review round of a ticket was done without the reviewer being able to look round the project (a round the full pack marks "Reviewer could not inspect the repo"), `speck pack <id> --plain` includes the sentence "In at least one review round, the reviewer could only see the change itself, not the rest of the code."
2. The sentence appears once, however many rounds it applies to, and doesn't appear when the reviewer could look round the project in every round.
3. No test that passed before this change fails.

## Out of scope
- Changing the full pack's warning.
- Detecting this for reviewers other than Codex, which is the only one that records it today.

## Notes
- `plainPack()` in `scripts/pack.mjs` reads only the latest round today; the full pack checks every round's `sandbox_ok`.
- 0131's tests limit the plain pack: no paths, models or tokens, and exactly one sentence matching `risk`, `sensitive` or `closer look`. The sentence in AC1 uses none of those words.
- The note's open question is settled as any round, as the full pack does.
- Failing before this build: none
- Self-check: no changes. Also updated the `speck pack` row in `docs/brief.md` to list the new note.

## In plain words
The short, plain review pack now tells you when the reviewer could only see the change itself in a review round, not the rest of the project. That matters because such a review can miss how the change fits with everything else. To see it, open the plain review pack for a ticket whose reviewer couldn't look round the project: it carries one sentence saying so, however many rounds it happened in. Tickets reviewed with full access look the same as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 139,695
- Elapsed since build started: 4 min
- Changed lines: 7 (limit 5000)
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
    "reviewed_sha": "39b7a0403381ec5c08127277ac1050c4dcf0a4d9",
    "thread_id": "01a141e1-1106-71c0-9a66-30dd29688440",
    "seconds": 25,
    "usage": {
      "input_tokens": 139010,
      "cached_input_tokens": 92800,
      "cache_write_input_tokens": 0,
      "output_tokens": 685,
      "reasoning_output_tokens": 12
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:24:15.996Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pack.mjs plainPack() checks every round for sandbox_ok === false, matching reviewPack(), and adds the exact required sentence. Passing test '0222 AC1' covers both latest and earlier restricted rounds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "plainPack() uses some() to insert the sentence once. Passing '0222 AC2' tests cover multiple restricted rounds, unrestricted rounds and missing historical metadata."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0222-tests.txt: all 18 tests passed across pack-0222 and the existing pack-0131 regression tests. Existing tests were unchanged; the full suite remains the shipping check."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The plain pack now warns once when any review round could only see the change itself. It matches the full pack’s existing warning condition, and all 18 relevant tests passed. No blocking concerns found."
  }
}
```

</details>
