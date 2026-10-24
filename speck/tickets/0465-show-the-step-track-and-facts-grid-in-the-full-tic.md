---
id: "0465"
title: "Lay out the full ticket's top like its open card"                # one outcome, no "and"
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
after: ["0464"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T11:54:24.290Z"
approved: "2026-10-24T12:15:28.032Z"

---
# 0465 · Lay out the full ticket's top like its open card

**Status:** 👍 approved

## Problem
The full ticket, opened over the whole panel, shows a ticket's tags under its title, while its card (after 0461 to 0464) shows a step track and an even table of facts. The two views of one ticket don't match.

## Outcome
The full ticket shows the same step track and table as the ticket's open card.

## Acceptance criteria
1. Opening a ticket's full view shows, under its title and above its Problem, the step track and table its card shows when open: a ticket in flight as 0461 and 0462 set out, one not started as 0463 does, and a shipped one as 0464 does. They match the open card's exactly, cell for cell.
2. The tags under the title are gone, as the table holds them. The id, status and Close stay where they are.
3. While the full view is open, the track and table change as the ticket moves on, as the card's do, within the panel's 2-second refresh.
4. At 320 px and 390 px, and in the full view's centred column on a wide window, the track and table keep to their rows and every value stays on one line, checked in a real browser. No test that passed before this change fails.

## Out of scope
- The rest of the full ticket, set out as a document (0423, 0424, 0445).
- A review pack.

## Notes
- Asked for by the user on 2026-10-24, after choosing the step track and facts grid for open build tickets (0461, 0462; mock-ups at https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "that layout should just be the template for all tickets in plan and ship. And also when you open a ticket in the full screen mode, like that table should be there as well."
- Today: `fullTicket` in `templates/panel.js` draws the top as id, status, Close, title and `paneTags` (0424).
- Waits for 0464, which waits for 0463, 0462 and 0461: it reuses all three tables and changes the same files.
- Failing before this build: none
- Self-check: no changes. Found while testing: the review pack's Ship button rules (`#full-ticket .ship`) also styled the track's Ship step in the full view, so a rule now resets it and the browser test checks every step's look.

## In plain words
A ticket opened full screen now shows the same coloured step track and table of facts as its card when it's open. They sit under its title, and the small tags that used to be there are gone. A draft or queued ticket shows grey steps with its status, lint, priority, size and risk. A ticket in progress shows where it is, who's working on it and a running clock. A shipped one shows every step done, with its time, rounds, cost and tokens. While it's open, the track and table keep up as the ticket moves on. To see it, open any ticket's Full ticket view, or click a shipped ticket's title. Worth watching: a shipped ticket's full view no longer says whether it was a bug fix, as its table holds figures instead (a follow-up is in the inbox).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 211,011
- Elapsed since build started: 21 min
- Changed lines: 132 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: a shipped ticket's full view no longer shows its kind (bug, fix or document), priority, size or risk, since its table matches the shipped card's. Sent to the inbox: speck/ideas/2026-10-24-show-a-shipped-ticket-s-kind-in-its-full-view.md
- Known limit: the full view's priority, size and risk are plain values, with none of the tag tips 0165 gave them, the same as on an open card.

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
    "reviewed_sha": "d2f3157567f5b96fca7139af06e6b64b9caf38d9",
    "session": "fresh",
    "thread_id": "01a16dd5-936e-79a0-a216-e92e8cab46d0",
    "builder_response": "- Tests run: test/panel-0465.test.mjs test/panel-0061.test.mjs test/panel-0062.test.mjs test/panel-0063.test.mjs test/panel-0142.test.mjs test/panel-0143.test.mjs test/panel-0151.test.mjs test/panel-0161.test.mjs test/panel-0165.test.mjs test/panel-0213.test.mjs test/panel-0417.test.mjs test/panel-0424.test.mjs, with `--related` (adds test/panel-0281, 0416, 0430, 0433). I also ran every test file that touches the full view, 79 files and 968 tests, and all passed.\n- Layout: the track and table are a `.steps` block between the pane's top row and its body, not inside the sticky top row, so the sticky header stays as small on a phone as it was under 0424. That moves the body from the pane's second child to its third. 0061, 0062, 0063, 0142 and 0424 found the body by its position, so they now take it as the pane's last child or index 2. Their assertions are unchanged.\n- Old tests changed because AC2 removes the full view's tags: 0143 (every test was about the pane's tags; now they check the pane's Priority, Size · risk and Type cells, with the same cases), 0151, 0161, 0165, 0213 and 0417 (the pane parts now check that the pane has no tag, and that its table holds the value). A shipped ticket's open card has no priority, size, risk or type in its table (0464), so its full view has none either, as AC1 asks for a match cell for cell.\n- A draft's priority in the full view is the value alone, with no priority menu (as 0143 AC4 had it). Its cell matches the card's in label, value and tooltip. The card's version is a menu control and the pane's isn't. The AC1 test compares every other cell node for node.\n- CSS: every `.q .track…` and `.q .facts…` rule also covers `#full-ticket` (a test checks this). The review pack's `#full-ticket .ship` button rules also matched the track's Ship step, so `#full-ticket .track .step.ship` resets them. The real-browser test checks each step's look at 320 px, 390 px and 1280 px.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 210073,
      "cached_input_tokens": 150272,
      "cache_write_input_tokens": 0,
      "output_tokens": 938,
      "reasoning_output_tokens": 214
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T12:15:12.189Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js paneSteps reuses the card renderers for drafts, queued, in-flight and shipped tickets. Passing 0465 AC1 tests compare tracks and all six cells with open cards."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fullTicket removes paneTags and preserves the id, status, Close and title. Passing 0465 AC2 verifies their order and the absence of tags."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "renderFull updates changed tracks and tables; paneCounter and startCounters maintain the timer. Passing 0465 AC3 tests exercise refreshes, review and shipped transitions, and timer updates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing 0465 AC4 real-browser test checks 320, 390 and 1280 px layouts, row alignment, single-line values and step styling. /tmp/speck-0465-tests.txt confirms 283 passed, zero failed and three skipped; the browser test was not skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The full ticket now shows the same progress track and facts table as its open card, replacing the tags. It updates as work progresses and passes the required narrow and wide browser checks. No blocking issues found."
  }
}
```

</details>
