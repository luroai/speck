---
id: "0214"
title: "Give Plan's note cards a ticket card's larger title"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-give-idea-and-inbox-cards-the-larger-title.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0213"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:27:49.181Z"
approved: "2026-10-15T23:32:55.887Z"

---
# 0214 · Give Plan's note cards a ticket card's larger title

**Status:** 👍 approved

## Problem
Since 0151, ticket cards in Plan have a larger id and title, but idea and inbox cards still use the old small sizes. Switching between Plan's three lists looks uneven, and idea and inbox titles are harder to read on a phone.

## Outcome
Idea and inbox cards in Plan show their label and title at the same sizes as a ticket card's id and title.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. In Plan's Ideas and Inbox lists, each card's label ("idea" or "inbox") is 14 px and its title 17 px, the same as a ticket's id and title in the Tickets list.
2. The label stays on the same line as the title, before it, as a ticket's id does.
3. A title is never cut off. When a title wraps, its next lines start under the title's first letter, not under the label, at viewports 375, 700 and 1,280 px wide.
4. Opening and closing a card, and the row under the title (the status or `from` ticket, and the note's path), work and look as before, and no test that passed before this change fails, except checks of the old idea and inbox title sizes, which are changed to check AC1 to AC3.

## Out of scope
- Moving the label to a row of its own under the title, as a ticket's tags did in 0151.
- The cards in the Build queue and Shipped, which 0155 and 0157 already changed.

## Notes
- The cards are drawn by `ideaItem()` and `inboxItem()` in `templates/panel.html`; ticket cards get their sizes from `.item.ticket .line .id` and `.item.ticket .line .title`.
- The note left open whether the label stays beside the title or moves under it. This ticket keeps it beside the title (AC2), as it is today.
- Failing before this build: none
- Self-check: no changes

## In plain words
In Plan, the idea and inbox cards now have the same larger title as the ticket cards, so switching between the Tickets, Ideas and Inbox lists looks even, and titles are easier to read on a phone. The small "idea" or "inbox" label stays just before the title, and a long title that wraps lines up under its own first letter. To see it, open the panel and switch Plan to Ideas or Inbox. Nothing else about the cards changed: they open and close as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 269,249
- Elapsed since build started: 5 min
- Changed lines: 13 (limit 5000)
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
    "reviewed_sha": "4be1f557437c4e793ff1fb34b805fa51f861f2a2",
    "thread_id": "01a141e6-5aa5-7de1-a4cc-8f9fa6e0bb9e",
    "seconds": 23,
    "usage": {
      "input_tokens": 92155,
      "cached_input_tokens": 34176,
      "cache_write_input_tokens": 0,
      "output_tokens": 646,
      "reasoning_output_tokens": 19
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:30:00.991Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html sets .item .line labels to 14px and titles to 17px. The passing browser test in test/panel-0214.test.mjs verifies computed sizes against ticket cards at all three widths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ideaItem() and inboxItem() place the label before the title in the shared flex line. Passing AC2 tests check element order; the browser test verifies their positions share the first line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC1/AC3 browser test checks actual text rectangles, overflow and aligned wrapped lines at 375, 700 and 1,280px. Existing overflow-wrap: anywhere remains applied to titles."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise opening and closing both card types and verify status/from-ticket and path contents. Their markup, handlers and supporting styles remain unchanged. All five ticket tests passed without skips; whole-suite regression checking remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Idea and inbox cards now use the same larger label and title sizes as ticket cards. Labels stay beside titles, wrapped text aligns correctly at all requested widths, and opening, closing and supporting details remain intact. The five relevant tests passed, and no blocking concerns were found."
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
    "reviewed_sha": "98d3f7c1bad8effc8ef625689c2dfcf2c7ed6578",
    "thread_id": "01a141e6-5aa5-7de1-a4cc-8f9fa6e0bb9e",
    "seconds": 14,
    "usage": {
      "input_tokens": 175344,
      "cached_input_tokens": 107136,
      "cache_write_input_tokens": 0,
      "output_tokens": 1104,
      "reasoning_output_tokens": 19
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:32:53.817Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains 14px labels and 17px titles through .item .line rules. The passing browser test in test/panel-0214.test.mjs checks computed sizes against ticket cards at all requested widths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ideaItem() and inboxItem() retain label-before-title order in a flex line. Passing AC2 tests check structure, and the browser test checks that both appear on the same first line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC1/AC3 browser test measures text rectangles and overflow at 375, 700 and 1,280px, checking that long titles wrap without clipping and subsequent lines align under the title."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise opening and closing both card types and verify status/from-ticket and path contents. Their supporting markup and styles remain unchanged. test/support/heavy.mjs now registers the new browser test; the previously failing 0233 list-completeness test passes. All 12 tests in the round passed without skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The larger idea and inbox headings still meet all four requirements. The new browser test is now correctly registered with the test runner, resolving the failure found during shipping. All 12 relevant tests passed, with no blocking concerns."
  }
}
```

</details>
