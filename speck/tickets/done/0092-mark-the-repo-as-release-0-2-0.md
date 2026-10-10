---
id: "0092"
title: "Mark the repo as release 0.2.0"                # one outcome, no "and"
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
after: ["0086", "0087", "0088", "0089", "0090", "0091"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T15:41:46.479Z"
finished: "2026-10-10T15:46:35.132Z"

---
# 0092 · Mark the repo as release 0.2.0

**Status:** ✅ done

## Problem
The repo still calls itself the private 0.1 build: `package.json` says 0.1.0, the README says "v0.1, early", and there's no record of what's changed. A first public release needs a version number people can install and a plain list of what's in it.

## Outcome
The repo describes itself as release 0.2.0, ready for the maintainer to tag `v0.2.0`.

## Acceptance criteria
1. `package.json` has version `0.2.0` and `"repository": "github:luroai/speck"`, and `speck init` prints `speck 0.2.0`.
2. A `CHANGELOG.md` has a 0.2.0 section listing, in plain English, what someone installing speck can now do that the private 0.1.0 couldn't, grouped under a few headings.
3. The README's status line and the brief's status line both say 0.2.0, a public preview, instead of v0.1.
4. The README's setup prompt names `v0.2.0` (the test from 0089 passes).

## Out of scope
- Creating the `v0.2.0` tag or a GitHub release, which the maintainer does after this ships.
- Publishing to npm.

## Notes
- Decided 2026-10-10: version 0.2.0, distributed as a GitHub tag only.
- The tests check the changelog's shape (a 0.2.0 section, a few headings, items under them). Whether each line is true and plain English is for the reviewer to check by reading it against the done tickets and the code.
- Self-check: no changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 358,329
- Elapsed since build started: 3 min
- Changed lines: 55 (limit 5000)
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
    "reviewed_sha": "3d3b1ef98eca556efc0d45b553e9f75f9627be52",
    "thread_id": "01a1267c-ad75-79e3-9aca-0502cf1c1d4a",
    "seconds": 27,
    "usage": {
      "input_tokens": 357618,
      "cached_input_tokens": 261120,
      "cache_write_input_tokens": 0,
      "output_tokens": 711,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-10T15:44:54.767Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json sets version 0.2.0 and repository github:luroai/speck. scripts/install.mjs reads that version and cmdInit prints it. Both AC1 tests in test/release-0092.test.mjs pass in the supplied output; the init test invokes the real CLI and checks its output and installed VERSION."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md contains a 0.2.0 section with six headings and concrete, plain-English changes. Claims agree with the implemented features and done tickets, including 0005–0014, 0021–0028, 0030–0048 and 0086–0091. The changelog shape test passes in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines both say '0.2.0, a public preview'. The AC3 test checks both actual lines and passes in the supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md's setup prompt uses github:luroai/speck#v0.2.0. The new AC4 test and unchanged test/readme-0089.test.mjs checks pass in the supplied output."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The repository now identifies itself as the 0.2.0 public preview, with a matching setup prompt and a readable changelog supported by the completed work. Tests cover all four criteria, including the real init command. The committed changes stay within scope; no tag, GitHub release or npm publication was created. Ready for the product owner's merge decision."
  }
}
```

</details>
