---
id: "0143"
title: "Show a ticket's tags in the full ticket pane"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T08:09:40.180Z"
approved: "2026-10-13T08:16:46.493Z"
finished: "2026-10-13T08:17:53.449Z"

---
# 0143 · Show a ticket's tags in the full ticket pane

**Status:** ✅ done

## Problem
When a shipped ticket, or one in the Build queue, is opened in the full ticket pane, the pane shows only its id and title above the text. Its priority, size and risk, which the lists show as tags, aren't there, so the user can't see how big or risky the change was.

## Outcome
The full ticket pane shows a ticket's priority, size, risk and any bug or fix tag under its title, whichever list it was opened from.

## Acceptance criteria
1. When a ticket is opened in the full ticket pane from Plan, Build or Shipped, the pane shows its priority (as `P<n>`), size and risk as tags under the title, styled as they are in the lists: a high risk in the warning colour and P1 as it is marked there.
2. A bug or fix ticket also shows its bug or fix tag there, as it does in the lists.
3. A field the ticket doesn't have (for example no priority) shows no tag, and nothing else in the pane changes.
4. The tags in the pane only show the values: clicking the priority tag there doesn't open the priority menu.
5. No test that passed before this change fails.

## Out of scope
- Showing other fields in the pane, such as dates, builder, reviewer or build time.
- Changing the tags in the lists.

## Notes
- The pane's top row is built in `fullTicket()` in `templates/panel.html`; the lists' tags come from `tags()` and `typeTag()`.
- Checked 2026-10-13: `/api/state` already has `priority`, `size`, `risk` and `type` for done tickets (live panel, ticket 0079).
- Failing before this build: none
- Self-check: a change to only the tags now replaces just the tags, keeping the rest of the pane (and any selected text) in place, as the readiness list does; added a test for tags appearing and disappearing on a refresh.

## In plain words
When you open a ticket in full, from Plan, Build or Shipped, you now see its priority, size and risk as small tags just under its title, plus a bug or fix tag when it has one. They look the same as in the lists: a high risk is in the warning colour and P1 is highlighted. To see it, open any shipped ticket by clicking its title and look under the heading. The tags there only show the values: to change a draft's priority you still click its tag in the Plan list. If a ticket's priority, size or risk changes while it's open, the tags update without disturbing any text you've selected.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 143,694
- Elapsed since build started: 7 min
- Changed lines: 50 (limit 5000)
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
    "reviewed_sha": "99ba221f71ab5a7a11aed39a73a533f7fbce164b",
    "thread_id": "01a13455-2e9b-78f0-aa69-d19f6328e994",
    "seconds": 38,
    "usage": {
      "input_tokens": 143001,
      "cached_input_tokens": 97280,
      "cache_write_input_tokens": 0,
      "output_tokens": 693,
      "reasoning_output_tokens": 32
    },
    "saved_at": "2026-10-13T08:16:38.508Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: fullTicket() and paneTags() render shared fieldTags() beneath the title, using existing p1/high classes. Passing AC1 tests in test/panel-0143.test.mjs exercise opening from Plan, Build and Shipped, styling and refresh updates."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "paneTags() reuses typeTag() for bug/fix styling. The passing AC2 test exercises fix and bug tickets, including priority P0."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fieldTags() omits absent fields; paneTags() omits an empty container. renderFull() replaces only tags when their values change. Passing AC3 tests cover missing fields, unchanged body structure and tags appearing/disappearing while existing header nodes remain."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "paneTags() calls fieldTags(t, false), bypassing priorityPicker(). The passing AC4 test clicks the priority tag through the page harness and checks that no priority menu opens."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0143-tests.txt: 1275 tests, 1272 passed, 3 skipped and 0 failed. All eight ticket tests passed. Existing tests and the shared harness were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The full ticket pane now shows priority, size, risk and bug or fix tags from every list, with the existing colours. Missing values are omitted, priority tags are display-only, and refreshes preserve the rest of the pane. The tests exercise the actual page script and the recorded full suite has no failures. No blocking concerns found."
  }
}
```

</details>
