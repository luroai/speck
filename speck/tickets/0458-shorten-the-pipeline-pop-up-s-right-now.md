---
id: "0458"
title: Show only the pipeline log when the screen is pressed                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:21:17.863Z"
approved: "2026-10-24T09:29:45.492Z"

---
# 0458 · Show only the pipeline log when the screen is pressed

**Status:** 👍 approved

## Problem
Pressing speck's screen opens the Pipeline pop-up, whose Right now section lists what's building, waiting, shipping and blocked, recommendations taken and what the Foreman looked into, some of it from 100 tickets ago. The user doesn't use it, and it pushes the log they do want further down.

## Outcome
Pressing speck's screen shows the pipeline log and nothing else.

## Acceptance criteria
1. Pressing the screen opens the Pipeline pop-up with only its title, Close and the log in it: no Right now section, and none of its headings (Building, Ready, not building, Shipping, Blocked, Recommendations taken, Looked into) or their lines.
2. While the page is running older code than the panel, a Reload page button still shows above the log, and pressing it reloads the page.
3. A Foreman's question keeps its Answer and Dismiss buttons on its ticket's card (0318), and a blocked ticket's question stays on its card.
4. The pop-up opens, closes and gives focus back as before (0415). No test that passed before this change fails.

## Out of scope
- How the log looks and what its lines say (0459, 0460).
- The words on speck's screen itself (0413, 0414).

## Notes
- Asked for by the user on 2026-10-24: "when you click the LCD screen, you just see the pipeline log", because Right now showed information from 0344, "over 100 tickets … ago", that they've not used.
- Failing before this build: none
- The server still sends the board's `foreman` object unchanged: `speck status` and the screen's word use it. Only the panel stops drawing Right now.
- Tests changed because this ticket removes what they checked (AC4 read as: every test still passes, with assertions on the pop-up's Right now replaced by the new behaviour, or by the same facts from the board or `speck status`): 0285 AC2 (two tests) and AC1/AC2 shipping, 0317 AC1, AC2 and AC3 detail tests, 0287 AC4, 0318 AC1 detail, 0366 AC1 and AC4 (refresh now checks the log; the typed answer is now checked on the card, where a refresh doesn't redraw the box), 0413 AC4, 0451 AC3, 0415 AC1 (four tests become two) and its AC3 drag target.
- Docs: the brief and README no longer say the Foreman's detail lists what `speck status` now alone shows.
- Self-check: added a test that the Reload page button goes once the page is no longer stale, with the focus it had going back to the pop-up, which needed the focus check to change.
- Today: `renderForeman` in `templates/panel.js` draws Right now from the board's `foreman` object (0285, 0287, 0299, 0317, 0318, 0328, 0366). Whether the server keeps sending what only Right now used is the builder's call.
- The screen's tooltip says "what speck run is doing, what is waiting, and its log": it should no longer promise what's gone.

## In plain words
Pressing speck's screen now opens a Pipeline pop-up with just the log of what speck run has been doing, newest first. The Right now list above it is gone: what's building, waiting, shipping and blocked, the recommendations the Foreman took and what it looked into.

To see it, press the screen at the top of the panel. If the page is out of date, a Reload page button still shows above the log. The Foreman's questions, with their Answer and Dismiss buttons, and blocked tickets' questions are still on their tickets' cards, and `speck status` still lists everything Right now did.

Worth a look: anyone who used Right now to see why a ready ticket isn't building now has to run `speck status` for that.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 148,173
- Elapsed since build started: 8 min
- Changed lines: 67 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups, no inbox note): the board's `foreman` object still carries what only Right now drew in the panel (`fixing_says`, `took`, `held`, the agent's `did`), as `speck status` uses most of it. A later ticket could trim what the panel is sent. The `where` argument of the panel's Foreman answer box now only ever gets `card`.

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
    "reviewed_sha": "def24e0f87e4ca8c912a063e1da8d8a989fdfac9",
    "session": "fresh",
    "thread_id": "01a16d3e-2758-7150-b09a-185f0793e149",
    "builder_response": "- Tests run: `speck test --related` on test/pipeline-0458.test.mjs test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/foreman-agent-0287.test.mjs test/foreman-answer-0318.test.mjs test/panel-0366.test.mjs test/panel-0413.test.mjs test/panel-0451.test.mjs test/pipeline-0415.test.mjs, plus every existing test file naming a changed file (1091 tests, 0 failing, 3 skipped).\n- AC4 (\"No test that passed before this change fails\"): 17 existing tests asserted the Right now section this ticket removes. Each is changed to check the new behaviour, or the same facts from the board or `speck status`, which still show them; none is skipped. The ticket's Notes list them.\n- Docs: the brief and README sentences saying the Foreman's detail shows things now shown only by `speck status` are narrowed to match.\n- Pictures of the pop-up in light and dark looks are in the review pack.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 147479,
      "cached_input_tokens": 90496,
      "cache_write_input_tokens": 0,
      "output_tokens": 694,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:29:35.007Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js renderForeman now draws only the Pipeline title, Close and Log, plus the conditional reload notice. Passing tests in test/pipeline-0458.test.mjs check the contents and absence of all former Right now headings and lines."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderForeman places the stale-page notice above the log and connects Reload page to location.reload(). Passing 0458 AC2 tests cover visibility, activation, removal and focus preservation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Ticket cards still call foremanAskBox in templates/panel.js. The passing 0458 AC3 test checks Answer and Dismiss on the card and preservation of the blocked question; test/foreman-answer-0318.test.mjs retains card behaviour coverage."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0458 AC4 and existing 0415/0366 tests cover opening, closing, focus return, modal behaviour and log refresh. Verified /tmp/speck-0458-tests.txt reports 1091 tests, 1088 passed, 3 skipped and no failures. Revised assertions reflect the intentionally removed section."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Pipeline pop-up now shows only the log, with Reload page available when needed. Ticket questions and their controls remain on the cards, and opening, closing and focus handling retain test coverage. No blocking issues found."
  }
}
```

</details>
