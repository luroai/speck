---
id: "0466"
title: Open a shipped ticket the way a Build ticket opens                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0465"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T12:18:39.128Z"
approved: "2026-10-24T12:36:27.105Z"
finished: "2026-10-24T12:39:28.570Z"

---
# 0466 · Open a shipped ticket the way a Build ticket opens

**Status:** ✅ done

## Problem
In Plan and Build, pressing a ticket's top row opens the card, and the open card has a Full ticket button. In Shipped, pressing the title jumps straight to the full ticket, and a separate Details button opens the card. The same press does different things in different tabs.

## Outcome
A shipped ticket opens and closes like a Plan or Build ticket, and its full ticket is reached from a Full ticket button in the open card.

## Acceptance criteria
1. Pressing anywhere on a shipped ticket's top row, its title included, opens the card in place, and pressing it again closes it, as a Build ticket's top row does, with the mouse and with the keyboard (Tab to it, then Enter or Space). Pressing the title no longer opens the full ticket.
2. A shipped ticket has no Details button.
3. The open card has a Full ticket button, the same as an open Build ticket's, which opens the full ticket, and Close brings the focus back to that button. Review pack stays beside it.
4. A shipped ticket's open or closed state is kept as the list refreshes, as before. No test that passed before this change fails.

## Out of scope
- What the open card shows (0464), and the full ticket itself (0465).

## Notes
- Asked for by the user on 2026-10-24: "on the plan and the build tickets, you expand the ticket and then there's a button to see the full ticket … in the shipped tickets, if you click the title, it just expands into the full ticket … make the ship tickets follow that same pattern."
- Failing before this build: none
- Self-check: the click moved from the title's cells to the whole card row, so the card's padding opens it too and a phone's tap area is the whole row, as Build's is; a click on the push warning or the button row under it leaves it as it is.
- Build's own top row can't be reached with Tab today, so AC1's keyboard part is met on the Shipped title, which is a button reached with Tab. The title is no longer underlined, as it no longer opens the full ticket: it looks like a Build title.
- Today, in `templates/panel.js`: the Shipped list's title is `fullLink(t)`, which opens the full ticket, and its `Details` button flips `openShipped` (0157, 0420). Build's card toggles from its top row (`toggleLog`), and its open card has `fullButton(t, 'queue')` (0326).
- Waits for 0465, which waits for 0464: 0464 changes what a shipped ticket's open card shows, and all three change `templates/panel.js`.

## In plain words
In Shipped, a ticket now opens and closes the same way it does in Plan and Build. Press its title, or anywhere on its card, and it opens in place to show its steps and figures. Press again and it closes. The Details button is gone. An open card has a Full ticket button, which shows the whole ticket, beside Review pack. Closing the full ticket puts you back on that button.

To see it, open the Shipped tab and press a ticket's title. You can also Tab to the title and press Enter or Space. The title is no longer underlined, because it no longer opens the full ticket: it looks like a Build ticket's title now.

Worth a look: anyone used to pressing a shipped title to jump straight to the full ticket now has one more press, Full ticket in the open card.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 320,576
- Elapsed since build started: 18 min
- Changed lines: 85 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Build's and Plan's top rows still can't be reached with Tab, so only Shipped cards open from the keyboard. Skipped, as it's already in the inbox: speck/ideas/2026-10-14-reach-the-priority-tag-and-a-ticket-s-top-row-with-the-keyboard.md.
- speck/ideas/2026-10-19-return-focus-to-a-shipped-title-or-review-pack.md is now partly done: closing a full ticket opened from Shipped returns focus to its Full ticket button. Review pack is still open.
- 21 existing test files that checked the old Shipped behaviour (title opens the full ticket, Details, underlined title) were changed to check the new one.

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
    "reviewed_sha": "cac75984777615e13c78e169d05c76619f9db275",
    "session": "fresh",
    "thread_id": "01a16de8-d72d-7461-b186-a79694af3172",
    "builder_response": "- Tests run: `speck test --related test/panel-0466.test.mjs` (the ticket's own file plus every existing test file naming a changed file: 295 files, 2656 tests, 0 failing, 3 skipped by 0078 as before). That includes each existing test file this ticket changed: panel-0050, 0063, 0132, 0137, 0140, 0141, 0143, 0157, 0161, 0162, 0167, 0411, 0417, 0420, 0427, 0434, 0453, 0457, 0464, 0465, focus-0326 and support/panel.mjs.\n- Round 1. Notes for the reviewer:\n  - Existing tests that checked the behaviour this ticket replaces (the Shipped title opening the full ticket, the Details button, the title's link underline) were changed to check the new behaviour, each marked 0466. AC4's \"no test that passed before fails\" is read as: nothing else broke, which the related run shows.\n  - Build's own top row isn't reached with Tab today (it has no tabindex), so the keyboard part of AC1 is met on the Shipped title, a role=button span with tabindex 0, aria-expanded, and Enter/Space; the focus stays on the title drawn in its place.\n  - The title is no longer underlined (it was underlined as a link by 0167); it now looks like a Build title, since it opens the card rather than the full ticket.\n  - The whole shipped row (tr) toggles, except clicks inside the push warning or the button row under it; tags and buttons stop their own clicks.\n  - Close returns focus to the shipped card's Full ticket button through returnFocus, with the Shipped lane as fallback.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 319747,
      "cached_input_tokens": 262144,
      "cache_write_input_tokens": 0,
      "output_tokens": 829,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T12:36:09.571Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js: shippedTitle, toggleShipped and the shipped row click handler toggle the card without opening the full ticket. Passing panel-0466 tests cover title, id, row padding and keyboard operation; passing real-browser tests in panel-0137 and panel-0141 verify mouse, Tab, Enter, Space and touch."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The shipped renderer no longer creates Details. panel-0466 AC2 passes for both open and closed cards."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The shipped renderer uses fullButton(t, 'shipped') beside packButton(t). returnFocus restores focus to that button. Both panel-0466 AC3 tests and the updated panel-focus-0326 shipped focus test pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "openShipped and keptItems preserve expansion across refreshes; panel-0466 AC4 exercises open and closed states through refreshes and passes. Verified /tmp/speck-0466-tests.txt reports 2653 passes, zero failures and three skips, including the changed existing tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped tickets now open and close in place by mouse, touch or keyboard. Their open cards offer Full ticket beside Review pack, and closing the full ticket returns focus correctly. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>
