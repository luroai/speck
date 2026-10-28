---
id: "0548"
title: "View a ticket's build log in a full-screen pop-up"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0538","0545"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T13:31:38.597Z"
approved: "2026-10-28T13:46:18.558Z"

---
# 0548 · View a ticket's build log in a full-screen pop-up

**Status:** 👍 approved

## Problem
A ticket's build log only shows in a small box with its own scrollbar inside its open card in Build, which is hard to read on a phone or when following a long build. The Pipeline log already has a full-screen pop-up that's easy to read, but it shows only `speck run`'s own log, never a ticket's build.

## Outcome
You can open any Build ticket's build log in a full-screen pop-up that looks and works exactly like the Pipeline log, showing only that ticket's build log.

## Acceptance criteria
1. Every open ticket card in Build that shows a build log box has a button next to the box that opens that ticket's build log in a pop-up. The pop-up is titled "<id> build log" (such as "0540 build log").
2. The pop-up uses the Pipeline log pop-up's template and layout: the same frame over the whole panel, the title in the same dot-matrix lettering, the same Close button, line layout, times, colours and scrolling, in the light and dark looks and at phone width. It shows only that ticket's build log, never `speck run`'s log or another ticket's (checked by review).
3. It shows the same log lines as the card's log box, newest at the bottom. While it's open, new lines are added as the build writes them, without reloading. It stays at the bottom while you're there, and keeps your place when you've scrolled up. A new build of the ticket replaces the log, as in the card. Before the log has loaded, or if it can't be loaded, it says so as the card's box does.
4. Close, Escape or a click outside it closes the pop-up, and the focus goes back to the button that opened it. While it's open the page behind can't be clicked, scrolled or reached with Tab, as with the Pipeline log, and opening it doesn't open, close or change the ticket's card.
5. No test that passed before this change fails.

## Out of scope
- Logs of shipped tickets, and opening a log from anywhere but its open card in Build.
- Searching, copying or downloading a log.
- Any change to the Pipeline log pop-up itself.

## Notes
- Asked for by the user 2026-10-27: "Exactly the same template and layout as the pipeline log but a tickets builder log only." They asked for it to be set ready and included in the 0.21.0 release (0539).
- Today: the Pipeline log pop-up is `renderForeman`, `drawRunLog` and `runLogRow` in `templates/panel-popups.js`, in `#foreman` in `templates/panel.html`, styled in `templates/panel-popups.css` (0415, 0459, 0470, 0479). A ticket's log is `logBox`, `loadLog`, `logUpdate` and `showLog` in `templates/panel.js`, read from `/api/tickets/<id>/log` and streamed on the board's event stream (0189). The open card's buttons are added in `queueItem`.
- After 0545, which changes the open Build card's facts grid, and 0538; all three may edit the brief's sentence on the panel.
- Failing before this build: none
- Self-check: a scrolled-up reader lost their place once the log was cut short (its note at the top) or its last line was written further; the pop-up now matches lines as the card does. Full log sits before Stop build so Stop build stays last (0421), and the tests that list an open card's parts (0053, 0069, 0421) now include it.

## In plain words
An open ticket in Build now has a Full log button beside its other buttons, just above its log. Pressing it opens that ticket's build log over the whole panel, in the same frame, lettering and colours as the Pipeline log, titled with the ticket's number, such as "0548 build log". New lines appear as the build writes them; it stays at the newest line unless you've scrolled up to read, and then keeps your place. Close, Escape or a click beside it closes it and takes you back to the button. To see it, open a ticket that's building in Build and press Full log. Worth knowing: when the panel is running newer code than the page, the Reload page notice shows only in the Pipeline log, not in a ticket's.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 194,233
- Elapsed since build started: 15 min
- Changed lines: 132 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. Known limit: the build log pop-up doesn't show the stale page's Reload page line that the Pipeline log shows.

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
    "reviewed_sha": "05e0644245769753a982f893b264a0a6bdc54860",
    "session": "fresh",
    "thread_id": "01a182c2-4eb9-7b50-b2f0-a6a7f03aae6b",
    "builder_response": "- Tests run: speck test --related test/build-log-0548.test.mjs test/panel-0053.test.mjs test/panel-0069.test.mjs test/panel-0421.test.mjs (the ticket's own file, the three existing files it changed, and every test file naming a file the branch changed)\n- Design: the pop-up reuses the Pipeline log's own `#foreman` element and frame (popFrame), so every style rule, phone and touch rule applies unchanged. renderForeman shows the Pipeline log while foremanOpen, else the ticket's build log while buildLogOf is set (renderBuildLog / drawBuildLog), with its aria-label set to match. Lines come from the same data the card's box shows (logs + logShown) and are redrawn from showLog, so stream updates reach it with no extra request. The Pipeline log's list-filling and scroll-keeping code was moved into fillLog unchanged, with drawRunLog calling it; buildLogDropped also allows the card's truncation note and a last line written further.\n- Full log sits with the card's other buttons in the row right above the log box, before Stop build so Stop build stays last (0421). Tests 0053, 0069 and 0421 that list an open card's parts were updated to include it.\n- Pictures (light/dark, phone/wide) are in the review pack.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 193416,
      "cached_input_tokens": 136960,
      "cache_write_input_tokens": 0,
      "output_tokens": 817,
      "reasoning_output_tokens": 73
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56456,
      "cached": 136960,
      "write": 0,
      "output": 817
    },
    "cost_usd": 0.134778,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T13:46:09.554Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js queueItem adds buildLogButton beside each open Build card's log. Passing AC1 tests verify placement, closed cards and the '<id> build log' title."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Reviewed renderForeman, popFrame, renderBuildLog and buildLogRow in templates/panel-popups.js: both logs use the same #foreman frame and responsive styles, including dot-matrix titles. drawBuildLog reads only logs.get(buildLogOf)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "showLog updates drawBuildLog from the card's shared log data. Passing AC3 tests cover live lines, bottom following, preserving scroll position through truncation and line extension, build replacement, loading and errors."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "closeBuildLog restores focus; pageHeld and holdPage make the background inert and prevent scrolling. Passing AC4 tests exercise Close, Escape, outside clicks, focus return and preserving the open card and stream."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified saved test output: 1,208 passed, zero failed, three skipped. Updated existing tests retain their assertions while accounting for the additional button. No regression identified in the reviewed change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open Build cards now offer Full log, showing that ticket's live build output in the Pipeline log's full-screen layout. Loading messages, scrolling, closing and focus return are covered by passing tests. No blocking concerns found."
  }
}
```

</details>
