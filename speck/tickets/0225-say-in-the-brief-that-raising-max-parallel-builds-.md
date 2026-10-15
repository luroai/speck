---
id: "0225"
title: "Say in the brief that raising max_parallel_builds is supported"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-how-many-builds-run-at-once-the-same-way-everywhere.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:14:11.526Z"
approved: "2026-10-15T23:16:54.624Z"

---
# 0225 · Say in the brief that raising max_parallel_builds is supported

**Status:** 👍 approved

## Problem
The brief's principle 7 says `max_parallel_builds` sets how many builds `speck run` keeps going at once, but its reasons still say tickets are built one after another and that parallel builds would come back only as a deliberately designed feature. Someone reading it can't tell whether raising the setting is supported.

## Outcome
The brief says plainly that one build at a time is the default and raising `max_parallel_builds` is supported.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. The reasons under the brief's principle 7 say that one build at a time is the default and that raising `max_parallel_builds` in `speck/config.yml` is supported, and no longer say that tickets are always built one after another or that parallel builds would come back only as a deliberately designed feature.
2. The brief, the README and `templates/config.yml` agree: one build at a time unless you raise `max_parallel_builds`.
3. No test that passed before this change fails, except 0111's checks of the wording AC1 removes, which are changed to check the new wording.

## Out of scope
- The README, which `9a61857` already brought in line.
- Changing how `speck run` runs builds.

## Notes
- The reasons are in `docs/brief.md` under principle 7; `test/brief-0111.test.mjs` pins their wording and bans some phrases about parallel builds in the brief, README and skills.
- The note's open question (supported, or only allowed) is settled as supported: `speck run` honours the setting and the README and principle 7 already say to raise it.
- Failing before this build: none
- Self-check: dropped "each in its own worktree" from the new reason (true only when `worktrees` is on) and narrowed the ship claim to `speck run`'s ship queue.

## In plain words
speck's design guide now says plainly that building one ticket at a time is only the default, and that setting speck to build more tickets at once is supported, not just tolerated. Approved tickets are still shipped one at a time. To see it, read the "One build at a time" principle in the design guide. Nothing about how speck behaves has changed. One place in the README's command list still says "one at a time" without the "unless you raise it" part; that has gone to the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,679
- Elapsed since build started: 3 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The README's `run` row in the command table still says "one at a time" without mentioning `max_parallel_builds` (out of scope here): `speck/ideas/2026-10-15-say-in-the-readme-s-run-row-that-more-builds-can-run.md`.

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
    "reviewed_sha": "b2e3e26fb01a9d9672221c0c7decb8ec17b34125",
    "thread_id": "01a141da-3550-7df2-b6a9-a9a41077ccf6",
    "seconds": 16,
    "usage": {
      "input_tokens": 83190,
      "cached_input_tokens": 62080,
      "cache_write_input_tokens": 0,
      "output_tokens": 489,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:16:37.575Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "docs/brief.md principle 7 now explicitly says one build is the default and raising max_parallel_builds is supported. Both 0225 AC1 wording tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The brief, README.md:17 and templates/config.yml:23 agree on the default of one build and the configurable limit. The 0225 AC2 test checks all three and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All 11 tests in test/brief-0111.test.mjs and test/brief-0225.test.mjs passed. The existing assertion was updated to require the new supported-setting wording. The committed change contains only documentation, relevant tests and ticket bookkeeping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The brief now clearly explains that one build at a time is the default and that increasing the setting is supported. It agrees with the README and configuration template. All 11 relevant tests passed, and build behaviour is unchanged."
  }
}
```

</details>
