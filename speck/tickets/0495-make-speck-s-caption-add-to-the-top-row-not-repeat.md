---
id: "0495"
title: "Make speck's caption add to the top row, not repeat it"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T21:11:26.775Z"
approved: "2026-10-24T21:21:30.426Z"

---
# 0495 · Make speck's caption add to the top row, not repeat it

**Status:** 👍 approved

## Problem
Between events, the caption under speck often repeats the screen's top row: `NEEDS YOU 1` over `1 NEEDS YOU`, `WAITING` over `WAITING`, `BUILDING 1` over `WATCHING 1 BUILD`. Two of the screen's three lines say the same thing.

## Outcome
The caption under speck always says something the top row doesn't: which tickets, or why.

## Acceptance criteria
1. While the top row reads `Needs you <n>`, the caption names the tickets that need you: `<id> HAS A QUESTION` for one, `<id> AND <id> ASK YOU` for two, and `<id> AND <n> MORE ASK YOU` for more, taking the ids from the Foreman's blocked tickets and its questions, lowest id first.
2. While it reads `Building <n>`, the watching caption names the tickets: `WATCHING <id>`, `WATCHING <id> AND <id>`, or `WATCHING <id> AND <n> MORE`, lowest id first. While it reads `Shipping <id>`, the caption is `ON ITS WAY TO <BASE>`, with the base branch's name.
3. While it reads `Waiting`, the caption is the reason the Foreman gives for waiting, in capitals, cut with `…` where it doesn't fit. While it reads `Off`, the caption is `TURN ON AUTO-BUILD`.
4. No caption between events repeats the top row's words, and every caption fits on the screen without scrolling, as 0414 set. Events, pastimes and the nap keep their captions.

## Out of scope
- When speck changes animation (0436, 0446).

## Notes
- From the user's phone screenshot on 2026-10-24: "Says needs you twice on screen. It's a waste."
- Today: `speckRests` in `templates/panel-header.js` (0414, 0436).
- Waits for nothing: no open ticket changes that file. 0452 waits for this one.
- Failing before this build: none
- Self-check: a waiting reason over several lines now shows on one line with single spaces (it left gaps before); a test covers it.
- Updated the 0414, 0436 and 0446 screen tests to the new captions this ticket sets, and their test boards now give the Foreman's builds, blocked tickets and base branch from the board's tickets.

## In plain words
The line under speck on the panel's screen no longer repeats the line at the top. While something needs you, it names the tickets with questions. While tickets build, it names them. While one ships, it says which branch it's going to. While speck waits, it says why, and while Auto-build is off, it says to turn it on. Events, pastimes and the nap still show their own captions.

To see it, open the panel while a ticket builds: the top reads "Building 1" and the line under speck reads "Watching" and the ticket's number. One thing to keep an eye on: a long waiting reason is cut short with "…", and a branch name with characters the screen's font doesn't have shows a gap where they'd be.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 173,501
- Elapsed since build started: 10 min
- Changed lines: 57 (limit 5000)
Follow-ups:
- Skipped, already captured: `speck test --related` didn't bring in the 0414, 0436 and 0446 screen tests, which load the header script through a test helper rather than naming it (matches speck/ideas/2026-10-24-bring-in-page-tests-for-a-panel-script-change.md).
- Known limit: characters the 5 × 7 font lacks, such as `_` in a branch name, show as a gap in the caption.
- Known limit: if the Foreman's lists are ever empty while its word says Needs you or Waiting, the caption is blank (Building falls back to WATCHING THE BUILDS).

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
    "reviewed_sha": "e8eefe3486326adeeb1e774efa985a08afc7b53f",
    "session": "fresh",
    "thread_id": "01a16fc9-7b06-7003-a535-2359a3782ea3",
    "builder_response": "- Tests run: test/panel-0495.test.mjs test/panel-0414.test.mjs test/panel-0436.test.mjs test/panel-0446.test.mjs test/panel-0438.test.mjs test/panel-0451.test.mjs, plus every related test file `speck test --related` chose for the changed files, and the commands.checks files.\n- The Foreman's view now gives `why` (the full reason while the word is `Waiting: …`, '' otherwise) and `base` (the base branch's name, which the panel passes from speck/config.yml). The panel's caption takes the ids and reasons from them.\n- A reason's leading \"waiting \" is dropped, so \"waiting for 0009\" shows `FOR 0009` rather than repeating WAITING from the top row. The design's 5 × 7 font has no …, so the caption draws with a copy of it that adds one; lcd.js is unchanged (0320 pins its hash).\n- The 0414, 0436 and 0446 screen tests asserted the captions this ticket replaces (`1 NEEDS YOU`, `WATCHING 2 BUILDS`, `WATCHING THE SHIP`, `WAITING`, `SPECK RUN IS OFF`). They now assert the new ones, and their test boards give the Foreman's builds, blocked tickets and base branch from the board's tickets, as the real Foreman does. No test was dropped.\n- Pictures: the real panel, light and dark, while this ticket builds: `BUILDING 1` over `WATCHING 0495`.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 172753,
      "cached_input_tokens": 123776,
      "cache_write_input_tokens": 0,
      "output_tokens": 748,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T21:21:16.262Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js: speckRests, capIds and idsCap select, deduplicate and sort blocked-ticket and question ids. Passing panel-0495 AC1 tests cover one, two, several and Foreman-managed tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "speckRests names sorted building ids and the shipping base. foremanView, panelServer and foremanOf carry the base through to the page. Passing panel-0495 AC2 tests cover all caption formats and the API's base field."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanView supplies the waiting reason; speckRests normalises whitespace, capitalises and truncates it, and supplies TURN ON AUTO-BUILD while off. Passing AC3 tests cover waiting sources, multiline text and the rendered ellipsis."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0495 AC4 tests inspect rendered caption dots for repetition, margins and movement, and check preserved event, pastime and nap captions. Updated 0414, 0436 and 0446 tests retain animation coverage. Verified saved output: 521 passed, zero failed, three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The captions now identify tickets, explain waiting, or name the shipping destination instead of repeating the status. Tests exercise the rendered captions and preserve the existing animation behaviour. No blocking concerns found."
  }
}
```

</details>
