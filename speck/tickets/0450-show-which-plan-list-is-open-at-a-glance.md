---
id: "0450"
title: "Show which Plan list is open at a glance"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0444"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:18:18.708Z"
approved: "2026-10-24T08:25:45.529Z"

---
# 0450 · Show which Plan list is open at a glance

**Status:** 👍 approved

## Problem
In Plan, the selected one of Tickets, Ideas and Inbox differs from the others only by a slightly darker border, so you can't tell which list is open.

## Outcome
The open Plan list's button is clearly selected.

## Acceptance criteria
1. The selected one of Tickets, Ideas and Inbox is filled: its background is the text colour and its text the background colour, in both looks. The other two stay outlined, as today.
2. A screen reader hears which of the three is selected.
3. The selected button's fill meets 3:1 against the background beside it, and its text 4.5:1 against its fill, in both looks.

## Out of scope
- The Plan, Build and Shipped tabs (0425).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the user's phone screenshot on 2026-10-24: "I don't know which item I've selected out of tickets/idea/inbox."
- Today: `.toggle` and `.toggle.on` in `templates/panel.css`.
- Waits for 0444: both change `templates/panel.css`. 0442 waits for this one.
- Failing before this build: none
- Self-check: no changes

## In plain words
In Plan, the button for the list you have open (Tickets, Ideas or Inbox) is now filled in solid, dark in the light look and light in the dark look, while the other two stay as outlines, so you can tell at a glance which list you're looking at. Screen readers now also say which of the three is selected. To see it, open Plan and tap between the three buttons, in either look.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 89,032
- Elapsed since build started: 7 min
- Changed lines: 3 (limit 5000)
Follow-ups (tidy-ups, no inbox note):
- 0426's test keeps its own copy of the contrast helpers now in test/support/contrast.mjs; it could import them.
- The comment on `.tab[aria-selected="true"]` in templates/panel.css says the chosen tab is set apart "as the chosen toggle is", which is no longer true now the toggle is filled (the tabs are 0425's).

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
    "reviewed_sha": "5afeda4b76d5d96b921f7ef38dbe86f058fee748",
    "session": "fresh",
    "thread_id": "01a16d03-9353-74f2-be6a-f3f61553ce3e",
    "builder_response": "- Tests run: --related test/panel-0450.test.mjs (brought in test/panel-0281, 0416, 0430, 0433, 0444 and the checks), then test/panel-0161.test.mjs with test/panel-0450.test.mjs, as 0161 checks every text's and edge's contrast in a real browser in both looks. Both runs are in the test output, one after the other.\n- AC1: `.toggle.on` is filled with var(--text) and its text is var(--panel), the background of the section the toggles sit in (`.sh` sets none). `.toggle` is unchanged.\n- AC2: each toggle has aria-pressed, \"true\" only on the open list's.\n- AC3: checked from the stylesheet's tokens in both looks; --text has an alpha, so the fill is --text laid over --panel. The contrast helpers moved to test/support/contrast.mjs (copied from 0426's test, which is left as it is).\n- Pictures: Plan with Ideas open, light and dark look.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 88550,
      "cached_input_tokens": 52992,
      "cache_write_input_tokens": 0,
      "output_tokens": 482,
      "reasoning_output_tokens": 16
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:25:37.805Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css .toggle.on uses --text for its fill and --panel for its text; .toggle remains outlined. Passing 0450 AC1 tests check the styling and selected class after clicking each list."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js shapingToggle sets aria-pressed on each native button. The passing 0450 AC2 test clicks all three lists and verifies only the open list is pressed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0450 AC3 tests calculate fill/background and text/fill contrast in both looks, including the text colour's alpha, and check the required 3:1 and 4.5:1 thresholds."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The open Plan list now has a clear filled button in both looks, and screen readers can identify the selection. Tests cover switching lists and the required contrast. The change stays within scope; no blocking concerns found."
  }
}
```

</details>
