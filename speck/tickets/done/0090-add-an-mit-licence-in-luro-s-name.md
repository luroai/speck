---
id: "0090"
title: "Add an MIT licence in Luro's name"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:57:13.594Z"
finished: "2026-10-10T14:04:55.464Z"

---
# 0090 · Add an MIT licence in Luro's name

**Status:** ✅ done

## Problem
`package.json` says the licence is MIT, but the repo has no licence file, so anyone finding speck on GitHub has no licence text and no copyright holder to go by.

## Outcome
The repo has a standard MIT licence file in Luro's name, and the README points to it.

## Acceptance criteria
1. A `LICENSE` file at the repo root has the standard MIT licence text with the line `Copyright (c) 2026 Luro`.
2. The README's Licence section links to `LICENSE`, and `package.json` still says `MIT`.
3. The full test suite passes.

## Out of scope
- Licence headers in source files.

## Notes
- Decided 2026-10-10: MIT, copyright Luro.
- AC3: on main, `test/luro-0082.test.mjs` AC4 (and the two 0084 tests that run it) failed because b455507 moved the setup idea note to `speck/ideas/done/`. The build points that one read at the new path, with the assertion unchanged, so the full suite can pass.
- Self-check: no changes (LICENSE matches the standard MIT text byte for byte in the test; npm packs LICENSE whatever `files` says, so `package.json` needs no change).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 231,811
- Elapsed since build started: 6 min
- Changed lines: 23 (limit 5000)
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
    "reviewed_sha": "955bb10b74a7b7257622237fa20594dc9f0f6c5f",
    "thread_id": "01a1261f-3c51-7992-a7c2-40e672702215",
    "seconds": 27,
    "usage": {
      "input_tokens": 231238,
      "cached_input_tokens": 150144,
      "cache_write_input_tokens": 0,
      "output_tokens": 573,
      "reasoning_output_tokens": 9
    },
    "saved_at": "2026-10-10T14:02:50.406Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Root LICENSE contains the standard MIT text and Copyright (c) 2026 Luro. test/licence-0090.test.mjs AC1 reads the actual root file and compares its entire contents; the supplied run passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md's Licence section links to LICENSE; package.json retains license: MIT. Both AC2 tests in test/licence-0090.test.mjs read these actual files and pass in the supplied run."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The supplied npm test run reports 693 tests, 690 passing, three skipped and zero failures. package.json runs test/*.test.mjs. The correction in test/luro-0082.test.mjs points to the existing archived idea and preserves every assertion. I did not rerun the suite because its temporary-file writes conflict with this review's read-only permissions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The repository now has an MIT licence naming Luro, and the README links to it. The tests check the real files, and the supplied full suite passes. The existing test path correction preserves its checks. No blocking concerns found."
  }
}
```

</details>
