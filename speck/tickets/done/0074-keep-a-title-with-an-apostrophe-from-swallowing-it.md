---
id: "0074"
title: "Keep a title with an apostrophe from swallowing its comment"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:57:51.730Z"
finished: "2026-10-09T21:05:43.043Z"

---
# 0074 · Keep a title with an apostrophe from swallowing its comment

**Status:** ✅ done

## Problem
`speck set <id> title "…"` writes the title without quotes when it has no `:` or `#`. A title with an odd number of apostrophes, such as "Pause a running build until it's played", then reads back with the template's trailing comment (`# one outcome, no "and"`) on the end, in the ticket's heading, `speck status`, the panel and everywhere else the title shows. It happened on 0070 and had to be fixed by hand.

## Outcome
Every value `speck set` writes reads back exactly as given, whatever quotes it contains.

## Acceptance criteria
1. After `speck set <id> title "<t>"` on a ticket made from the template (with its trailing comment kept), the title in `speck status --json`, `speck status` and the ticket's `# <id> · <title>` heading is exactly `<t>`, for each of: `It's fine`, `A 'quoted' word`, `Say "hi" now`, `Ends with a quote'`, `Tom's and Ann's` and `plain title`.
2. The same holds for any other text field `speck set` writes, such as `source`, with the same values.
3. The trailing comment stays on the frontmatter line after the value, as today.
4. `speck lint` passes for each ticket in criterion 1 (apart from any warning about the title's wording).

## Out of scope
- Hand-edited frontmatter values with unbalanced quotes: this is only about what `speck set` writes.

## Notes
- Reproduced 2026-10-09 in a fresh `speck init` repo: `It's fine` read back as `It's fine                # one outcome, no "and"`; `A 'quoted' word`, `Say "hi" now` and `plain title` read back correctly.
- Cause: `setField` in `scripts/speck.mjs` quotes a value only when it contains `:` or `#` or is blank, and `stripComment` treats a lone `'` as opening a quoted string, so the `#` of the comment after it is never found.
- 0008 fixed the same kind of problem for `cancel_reason` by always writing it with `JSON.stringify`.
- Self-check: added a lone `"` and a lone `'` to the exact-read-back tests (both pass); only `after` is written as a list, so bracketed text in any other field is quoted (review round 1).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 writeField exempts every bracket-shaped value from quoting, including text fields.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 933,989
- Elapsed since build started: 6 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "48833ff9975854247bccb3a241c4829091dcac67",
    "thread_id": "01a12278-9c6c-7a23-9070-9c3b338ab3e7",
    "seconds": 38,
    "usage": {
      "input_tokens": 347512,
      "cached_input_tokens": 271744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1076,
      "reasoning_output_tokens": 77
    },
    "saved_at": "2026-10-09T21:02:10.000Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/set-0074.test.mjs exercises all six specified titles through the real CLI, checking JSON status, plain status and the heading. Supplied test output reports all passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/set-0074.test.mjs exercises all six values for source and reviewer_model through the real CLI; supplied output reports all passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The title and source tests assert preservation of template trailing comments. setField in scripts/speck.mjs retains the original comment suffix."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Each of the six title tests runs lint and asserts exit status zero; supplied output reports all passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "writeField exempts every bracket-shaped value from quoting, including text fields. Independently executing the actual function in memory confirms that setting title to [It's fine] still reads back with the template comment appended; [Say \"hi\" now] reads back as an array. This leaves the reported defect present for quoted text inside brackets and contradicts the outcome's exact-read-back guarantee. The self-check note acknowledges the gap but does not put it out of scope.",
        "suggested_fix": "Restrict list preservation to list fields such as after, and serialise bracket-shaped text-field values as strings. Add real CLI regressions for bracket-shaped titles and sources containing apostrophes and double quotes, while retaining the after-list test.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The six requested examples work, and the tests genuinely exercise the CLI. However, a title containing an apostrophe inside square brackets still absorbs its trailing comment. Fix that remaining case before merging. Tests were inspected; independent verification used the actual writer in memory because this review is read-only."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "aab877ad3fe241f2a70fc226d426cf088dbfd501",
    "thread_id": "01a12278-9c6c-7a23-9070-9c3b338ab3e7",
    "seconds": 24,
    "usage": {
      "input_tokens": 583463,
      "cached_input_tokens": 463360,
      "cache_write_input_tokens": 0,
      "output_tokens": 1938,
      "reasoning_output_tokens": 77
    },
    "saved_at": "2026-10-09T21:04:14.820Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/set-0074.test.mjs runs the real CLI for all six specified titles and checks status --json, plain status and the exact heading. All six tests pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests exercise all six values for source and reviewer_model, plus lone quotes, padding, backslashes and bracketed text. All pass in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The title and source tests assert that template comments remain after the value. scripts/speck.mjs setField preserves the comment suffix; independent in-memory checks also confirmed preservation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Each of the six AC1 title tests runs speck lint and asserts exit status zero. All pass in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Bracket-shaped text previously bypassed quoting, causing comment absorption or conversion into an array. Resolved: writeField now reserves list handling for after and quotes bracketed text in other fields.",
        "suggested_fix": "Implemented and covered by the new real CLI bracketed-title/source regression test. Independent execution of the current writer confirmed exact text round-trips and preservation of after lists.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Titles and other tested text fields retain their quotes and trailing comments, including the bracketed cases that failed the first review. All acceptance criteria pass, and the supplied suite reports 517 passing tests. No blocking concerns remain."
  }
}
```

</details>
