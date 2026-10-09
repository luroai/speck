---
id: "0033"
title: Show everything needed for Gate 1 in Shaping                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T12:47:52.575Z"

---
# 0033 · Show everything needed for Gate 1 in Shaping

**Status:** 👍 approved

## Problem
At Gate 1 you need the whole ticket in front of you, but the panel's Shaping area shows only a criteria count, a lint result and the criteria. Ideas and tickets are also mixed in one list, so it isn't obvious which kind you're looking at.

## Outcome
Shaping shows tickets and ideas separately, with a clear colour for each, and opening a draft ticket shows everything needed to judge it.

## Acceptance criteria
1. `speck status --json` adds, for each ticket: `problem`, `outcome`, `out_of_scope` and `notes` (each section's text without template comments, or `null` when it has no other content), `self_check` (the text after `Self-check:` on the first line of Notes that starts with it, or `null`) and `lint_messages` (`{"errors": [...], "warnings": [...]}` with the same text `speck lint` prints). Each idea gets `body`: the note's full text. Every existing field is unchanged.
2. The page header shows the repo, the base branch and the connection status only. The ticket and idea counts are gone.
3. Shaping has a Tickets / Ideas toggle, with Tickets selected when the page loads, and shows one list at a time. Tickets use one accent colour and ideas a different one, on the toggle, the section's top edge and each item's left edge, so you can tell which list is showing at a glance. The choice survives the 2-second refresh.
4. The Tickets list shows draft tickets in the JSON's order, each with id, title, priority, size, risk, criteria count and lint result. Clicking one opens it, showing its problem, outcome, numbered acceptance criteria, out of scope and notes, and a readiness list: size and risk, criteria count, each lint error and warning in full (or "lint passes"), and each `after:` id marked done or not done. An open ticket stays open through refreshes, and clicking it again closes it.
5. The Ideas list shows every idea, those whose status doesn't start with `ticketed` first, then the rest, each with its title and status. Clicking one shows its note text, as text, under it.

## Out of scope
- The queue (0034) and Shipped (0035).
- Any write action, including setting a ticket to ready. Toggles and opening items are view state only, and nothing is sent to the server.
- Judgement hints from the mockup that speck can't compute, such as overlaps with other tickets or clashes with config.

## Notes
- Builds on the field contract from 0030: add fields, don't rename or remove any.
- Design reference: the expanded ticket and readiness list in `docs/panel-mockup.html`.
- Builds before 0034 and 0035, which change the same page.
- No external facts: everything comes from files speck already reads.
- Self-check: no changes. Checked empty and comment-only sections, a `Self-check:` line with nothing after it (gives `null`), a frontmatter field sharing a new field's name, non-array `after:`/`lint_messages`, and that every new text (sections, lint messages, idea notes) renders as text. The 0031 tests that expected ideas mixed in with drafts, ticketed ideas left out and ideas without `body` now expect this ticket's behaviour. Also dropped the header's "read-only" label so it shows only repo, base branch and connection status.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 325,371
- Elapsed since build started: 8 min
- Changed lines: 133 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: clicking anywhere in an open ticket closes it, including when selecting its text to copy. Only toggling on the ticket's top row would avoid that.
- Follow-up idea: open tickets and ideas are remembered by id and path for the page's life, so one that leaves Shaping and later returns comes back open.

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
    "reviewed_sha": "1eeb6c9fdf0113d911a49ba3011e1b391c286a0a",
    "thread_id": "01a120ba-f18d-7823-bc75-941166552ef4",
    "seconds": 48,
    "usage": {
      "input_tokens": 324183,
      "cached_input_tokens": 253440,
      "cache_write_input_tokens": 0,
      "output_tokens": 1188,
      "reasoning_output_tokens": 154
    },
    "saved_at": "2026-10-09T12:55:32.886Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: statusData, sectionText and selfCheck add the requested fields while retaining existing fields. The two 0033 AC1 tests exercise section extraction, empty sections, self-check selection, exact lint output and full idea bodies; both passed in the supplied test run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: header and render remove the counts and retain repo, base branch and connection status. Independently reran the 0033 AC2 test successfully."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: shapingView, shapingToggle and accent CSS implement separate lists and preserve the selected view across polling. Independently reran both 0033 AC3 tests successfully."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel, ticketItem and ticketDetail preserve draft order, show all requested details and readiness information, and retain open state by ticket id. Independently reran the 0033 AC4 test successfully."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel groups all ideas with unticketed ones first; ideaItem renders the body using textContent. Independently reran the 0033 AC5 test successfully."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated JSON contract and Shaping description match the implementation. Queue and Shipped behaviour remain within the existing specification."
    },
    "escalation_question": "",
    "summary": "Shaping now separates tickets from ideas and exposes the ticket details needed for Gate 1. Selection and expanded items survive refreshes, and note content is safely displayed as text. All criteria have meaningful test coverage; the five panel tests independently rerun passed. No blocking issues found."
  }
}
```

</details>
