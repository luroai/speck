---
id: "0224"
title: "Keep a queued ticket's tags tappable above a linked id"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-keep-a-queued-ticket-s-tags-tappable-above-a-linked-id.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0223"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T02:50:06.323Z"

---
# 0224 · Keep a queued ticket's tags tappable above a linked id

**Status:** 🔍 reviewing

## Problem
On a phone, when a queued ticket's line reads "Queued · unlocks 0205" or "Queued · waiting on 0204", the linked id's tap area reaches about 14 px up into the tap areas of the tags above it. A tap on the bottom edge of a tag such as "low" goes to the other ticket instead of showing what the tag means.

## Outcome
On a phone, every part of a queued ticket's tag tap areas works for the tag, even with a linked id just below.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. At viewports under 700 px, on a queued ticket whose line under its tags has a linked id, a tap anywhere in a tag's 44 × 44 px tap area shows that tag's tip rather than going to the linked ticket.
2. A tap on the linked id's own text still goes to the linked ticket, and the space between the tags and that line is the same as today.
3. No test that passed before this change fails.

## Out of scope
- Tap areas at 700 px and wider.

## Notes
- The tags' tap areas come from 0165 and the linked id's from 0164, in the under-700 px rules in `templates/panel.html`. The id is later in the page, so today it wins where they overlap.
- The note's open question is settled as the tag winning where they overlap, without moving the layout (AC2), as 0190 did.
- Failing before this build: none
- AC3 is checked by the whole suite, which `speck ship` runs. 0190's phone set-up moved into `test/support/queue-phone.mjs` so 0224's tests share it; its tests are unchanged.
- Chrome taps at whole pixels, so 0224's tap test taps the last whole pixel inside each tag's tap area: a tap at y + 21.5 px from a tag's centre lands on the pixel just past it.
- Self-check: no changes

## In plain words
On a phone, a queued ticket's tags now answer a tap anywhere around them, even when the line just below names another ticket. Before, a tap on the bottom edge of a tag such as "low" could jump to that other ticket instead of explaining the tag. To see it, open the panel on a phone with two chained tickets in the queue and tap just under a tag: its explanation shows. Tapping the other ticket's number itself still jumps to it, and nothing on the screen has moved.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Note for later tap tests: Chrome taps at whole pixels, so a tap meant for a tap area's edge should use a whole pixel inside it.

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
    "reviewed_sha": "325ec9f742a9deade7547b9eb424052b4d68e2a2",
    "thread_id": "01a142a8-d32b-70e1-ae2e-1caee4d6e4e3",
    "seconds": 28,
    "usage": {
      "input_tokens": 133166,
      "cached_input_tokens": 91264,
      "cache_write_input_tokens": 0,
      "output_tokens": 742,
      "reasoning_output_tokens": 38
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T03:02:30.926Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html:449 raises queue tags above the linked id's overlapping tap area within the phone media query. Both AC1 tests in test/panel-0224.test.mjs passed: a hit-test grid across all tag areas and real touch taps along their bottom edges show the correct tips without navigating."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Both AC2 browser tests in test/panel-0224.test.mjs passed: tapping each linked id highlights its destination ticket, and the measured gap remains 8 px. The CSS change affects stacking only."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded run passed all six tests with no skips or failures, including both existing 0190 tests. Their assertions remain unchanged; only their setup moved into test/support/queue-phone.mjs. The whole-suite check remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change keeps phone taps on queued-ticket tags working where their tap areas overlap a linked ticket id. Linked ids still work, spacing stays unchanged, and all six relevant browser tests passed. No blocking concerns found."
  }
}
```

</details>
