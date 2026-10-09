---
id: "0039"
title: "Close an open item only from its top row"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T14:54:14.683Z"

---
# 0039 · Close an open item only from its top row

**Status:** 👍 approved

## Problem
In the panel's Shaping area, clicking anywhere inside an open ticket or idea closes it, including clicks in its details. So reading a ticket at Gate 1 or selecting a criterion to copy keeps collapsing it.

## Outcome
An open ticket or idea closes only when you click its top row, so you can click in its details and select text there without it closing.

## Acceptance criteria
1. A closed draft ticket opens when you click its top row (id, title, tags and the criteria count and lint line under them). An open ticket closes when you click that same top row.
2. Clicking anywhere in an open ticket's details (its sections and its readiness list) leaves it open.
3. A closed idea opens when you click its top row (title, status and path), and an open idea closes when you click that row. Clicking its note text leaves it open.
4. Selecting text by dragging within an open ticket's details or an open idea's note text leaves it open.
5. Everything else about opening stays the same: more than one item can be open at once, and what's open survives the 2-second refresh.

## Out of scope
- Keeping a text selection through the 2-second refresh (0040).
- Keyboard access to the top row, such as making it a button with `aria-expanded`.
- Capping the height of long details.

## Notes
- Reported as a follow-up in 0033's delivery log.
- The page is `templates/panel.html`. No CLI or JSON change.
- No external facts: everything is in this repo.
- Self-check: moving the click off the whole item left its padding dead, so a click just above or beside a closed item's title did nothing. The top row now reaches into the item's padding (`.item .head` negative margins), checked in a browser. Existing 0033 and 0042 tests now click the top row instead of the item, with the same assertions.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The AC4 test claims to test text selection but only repeats click coverage.
Round 2 (codex): approve.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,422,169
- Elapsed since build started: 36 min
- Changed lines: 29 (limit 5000)
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 674,315
- Elapsed since build started: 12 min
- Changed lines: 29 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: a drag that selects text inside the top row itself (for example the title) still opens or closes the item, because the browser ends the drag with a click there. Could ignore clicks that end a non-empty selection.
- Follow-up idea: hovering an open item's details still lightens the whole item (`.item.ticket:hover`), although only the top row is clickable now.
- Follow-up idea: the real-browser test helper (`browserPage` in test/panel.test.mjs) could be shared by other panel tests that need real input.

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
    "reviewed_sha": "37dd055b254353be32a51c55eb558485d72770a5",
    "thread_id": "01a1212f-d19a-7ba1-b052-1a8bf49d44c8",
    "seconds": 43,
    "usage": {
      "input_tokens": 247511,
      "cached_input_tokens": 180608,
      "cache_write_input_tokens": 0,
      "output_tokens": 826,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-09T15:03:07.033Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketItem attaches the toggle to .head, containing tags and checks. The 0039 AC1 test exercises bubbling clicks from every header descendant; builder reports it passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketItem places ticketDetail beside .head, outside its click handler. The 0039 AC2 test clicks detail descendants, readiness content and the surrounding item; builder reports it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ideaItem attaches toggling only to .head and renders the note as a sibling. The 0039 AC3 test covers header descendants and note clicks; builder reports it passed."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "The 0039 AC4 test only invokes press(), which dispatches simulated clicks. It never drags, creates a selection or verifies selected text. The implementation appears correct, but this criterion lacks a test exercising selection."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The open and openIdeas sets remain independent and survive render(). The 0039 AC5 test opens multiple tickets and ideas and invokes refresh callbacks, checking both open and closed state; builder reports it passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel.test.mjs",
        "issue": "The AC4 test claims to test text selection but only repeats click coverage. Its assumed drag outcome is supplied by the test itself, so it does not establish that dragging to select text leaves the item open.",
        "suggested_fix": "Add a browser test that actually drags across ticket detail text and idea note text, verifies a non-empty selection and confirms each item remains open. Rename or clarify the existing click simulation so it does not claim to exercise dragging.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated panel description accurately reflects the handler placement and retained open-state behaviour."
    },
    "escalation_question": "",
    "summary": "The change correctly limits opening and closing to each item's top row, while preserving multiple open items across refreshes. Click coverage is good and the change stays within scope. Before approval, the text-selection requirement needs a test that actually selects text by dragging."
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
    "reviewed_sha": "e5896d52bbc61242c60fa95935e842ab864bca28",
    "thread_id": "01a1212f-d19a-7ba1-b052-1a8bf49d44c8",
    "seconds": 31,
    "usage": {
      "input_tokens": 424594,
      "cached_input_tokens": 333824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1384,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-09T15:06:27.826Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketItem binds toggling to .head, containing id, title, tags and checks. test/panel.test.mjs 0039 AC1 exercises clicks from every header descendant; supplied results show it passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketDetail is a sibling of the clickable header. The 0039 AC2 test exercises detail sections, readiness content and surrounding-item clicks without closing; it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ideaItem binds toggling only to its header, with the note outside it. The 0039 AC3 test covers header clicks and note clicks; it passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The new 0039 AC4 real-browser test uses Chromium Input.dispatchMouseEvent to drag within and across ticket sections and within an idea note, then checks selected text and the open class. Supplied results show it ran and passed without skipping."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The independent open and openIdeas sets remain intact across rendering. The 0039 AC5 test verifies multiple open items and retained open/closed state through refresh callbacks; it passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel.test.mjs",
        "issue": "The original AC4 test simulated clicks without exercising text selection. The added browser test now performs real drags and verifies selection and retained open state.",
        "suggested_fix": "Completed: genuine browser selection coverage added, and the original test renamed to describe its click simulation.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The panel description accurately documents top-row toggling, detail text selection and retained open state."
    },
    "escalation_question": "",
    "summary": "Tickets and ideas now close only from their top row. Clicking or selecting detail text leaves them open, and multiple open items survive refreshes. The missing selection coverage is fixed with a passing browser test. All five criteria pass; no blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1232650d69151ec21328a6e2ec90bf3fc6feaba1",
    "thread_id": "01a1212f-d19a-7ba1-b052-1a8bf49d44c8",
    "seconds": 27,
    "usage": {
      "input_tokens": 745930,
      "cached_input_tokens": 493184,
      "cache_write_input_tokens": 0,
      "output_tokens": 1924,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-09T15:30:22.595Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketItem retains the click handler solely on .head, containing tags and checks. The relocated 0039 AC1 test in test/panel-0039.test.mjs exercises header descendants and passed in the supplied results."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketDetail remains outside the clickable header. The relocated 0039 AC2 test covers sections, readiness content and surrounding-item clicks; supplied results show it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ideaItem retains header-only toggling with the note as a sibling. The relocated 0039 AC3 test covers opening, closing and note clicks; it passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "test/panel-0039.test.mjs retains the real Chromium drag test, checking selected text and retained open state for ticket details and idea notes. It ran and passed without skipping."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The independent open and openIdeas sets remain outside render(). The relocated 0039 AC5 test verifies multiple open items and retained open/closed state through refreshes; it passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0039.test.mjs",
        "issue": "The original selection-coverage gap remains fixed: the genuine browser drag test survived relocation and the merge.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The resolution preserves main's current capabilities and reapplies only this ticket's accurate top-row and detail-selection wording."
    },
    "escalation_question": "",
    "summary": "The merge preserves the approved behaviour and all five criteria still pass. The tests moved intact into their own file, including the passing browser selection test. No new blocking concerns were found."
  }
}
```

</details>
