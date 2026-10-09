---
id: "0056"
title: "Hide ticketed ideas from the panel's Ideas list"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-09
started: "2026-10-09T19:06:38.670Z"

---
# 0056 · Hide ticketed ideas from the panel's Ideas list

**Status:** 👍 approved

## Problem
The panel's Ideas list shows ideas that have already become tickets, after the ones still waiting. Once ticketed, the work lives in the tickets, so these rows are clutter that hides the ideas still to shape.

## Outcome
The panel's Ideas list shows only ideas that haven't become tickets yet.

## Acceptance criteria
1. The Ideas list leaves out every idea whose status starts with `ticketed`, as well as `inbox` and `dropped` ones as today, and shows the rest in the JSON's order.
2. The Ideas toggle's count is the number of ideas in that list, for example `Ideas · 3` with three unticketed ideas, whatever number are ticketed.
3. With no ideas left to show, the list says "No ideas waiting."
4. An idea open in the list that becomes ticketed leaves the list on the next refresh, and the other open ideas stay open.

## Out of scope
- Moving ticketed notes out of `speck/ideas/` (0057).
- `speck status` and `speck status --json`: both still list ticketed ideas.
- The Inbox list.

## Notes
- The filter is in `templates/panel.html` (the `ideas:` line that orders unticketed ideas first). Nothing in the JSON changes.
- product.md's Ideas description ("those whose status doesn't start with `ticketed` first") needs updating.
- Five older tests asserted the old order (ticketed ideas listed last) and now expect them left out, as AC1 requires: 0031 AC3 and 0033 AC5 in `test/panel.test.mjs`, 0038 AC1 and AC3 in `test/panel-0038.test.mjs`, and 0040 AC3 in `test/panel-0040.test.mjs`, where the other idea's changed status is now `parked` so it stays in the list and the test still checks that the change shows.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 287,312
- Elapsed since build started: 8 min
- Changed lines: 6 (limit 5000)
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
    "reviewed_sha": "392ca14569d12838b4c1668085916ab9bc8399aa",
    "thread_id": "01a12216-02f3-7d93-a6ad-877e8a56f4d7",
    "seconds": 31,
    "usage": {
      "input_tokens": 286453,
      "cached_input_tokens": 219520,
      "cache_write_input_tokens": 0,
      "output_tokens": 859,
      "reasoning_output_tokens": 65
    },
    "saved_at": "2026-10-09T19:14:21.207Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel filters ticketed prefixes, inbox and dropped while preserving JSON order. The 0056 AC1 model tests and page test exercise these behaviours and passed independently."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html shapingToggle uses m.ideas.length. The 0056 AC1, AC2 page test verifies Ideas · 3 alongside three ticketed ideas; it passed independently."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html render displays 'No ideas waiting.' Both 0056 AC3 tests verify the empty message, including an empty source list and all ideas excluded; both passed independently."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html render, keptItems and openIdeas preserve remaining open rows. The 0056 AC4 test opens three ideas, tickets one, refreshes twice and verifies its removal and the others remaining open; it passed independently."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated Ideas description accurately covers filtering, order, refresh behaviour and the empty message. Changes remain within scope; CLI output and Inbox behaviour are unchanged."
    },
    "escalation_question": "",
    "summary": "Ticketed ideas now disappear from the panel’s Ideas list, its count matches the remaining ideas, and other open notes stay open after refresh. All six new tests passed independently. The existing test updates reflect the intended behaviour without weakening their remaining checks. No blocking concerns found."
  }
}
```

</details>
