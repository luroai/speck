---
id: "0766"
title: "Show the line on the factory floor"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0764","0765"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0765"
started: "2026-11-26T20:14:29.144Z"
approved: "2026-11-26T20:32:11.449Z"

---
# 0766 · Show the line on the factory floor

**Status:** 👍 approved

## Problem
The user wants to see, across every project at once, who is working on what and on which model. The factory floor shows projects and boards, but not the work at each station.

## Outcome
Above the stations, the factory floor shows the line: a row per project through Queue, Builder, Reviewer, QA and Ship, each lit station naming its ticket, agent, model and effort.

## Acceptance criteria
1. The line has a row for each project on the list that isn't off, and columns Queue, Builder, Reviewer, QA and Ship; the Builder, Reviewer and QA headings show that member's character as the panel draws it (`SpeckFace` roles).
2. A station with a ticket on it is lit and shows the ticket's id, title and time there, its agent (as a stripe in that agent's colour), model and effort, and why it's on them, as the project's summary gives them.
3. An idle station shows, dimmed, the agent and model it would use; a QA station in a project with no QA set up says so; Queue shows the ready count and next ids, and Ship the tickets waiting there, marking those that wait for you.
4. A project that is idle has a faint line and one whose `speck run` is off is dimmed; at window widths under 1024 px the line scrolls sideways inside its own box, and the page doesn't.
5. No test that passed before this change fails.

## Out of scope
- Changing a station's model from the floor.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Agent colours on the mockup: Claude Code sand, Codex blue, Cursor silver; keep them apart from the status colours.
- Failing before this build: not checked
- Self-check: a station whose agent its panel couldn't read (the line's idle stations with no settings) showed an empty slot; it now says Not known, with a test. Added the line to the brief's `speck serve` row, beside the factory floor's stations.

## In plain words
The factory floor now opens with the line: one row per project, running through Queue, Builder, Reviewer and QA to Ship, with the builder's, reviewer's and QA's faces on their headings. Wherever a ticket is being worked on, its box lights up with the ticket, how long it's been there, which agent (as a coloured stripe: sand for Claude Code, blue for Codex, silver for Cursor), which model and effort, and why it's on them. An empty station shows faintly what it would use next, and QA says so when a project hasn't got it set up. Queue shows how many tickets are ready and which come next; Ship lists what's waiting, marking what waits for you. A quiet project's row is faint, and one whose speck run is off is dimmer still.

To see it, open speck serve's address at /floor. In a narrow window the line scrolls sideways in its own box. Worth keeping an eye on: a project on an older speck, whose summary has no line, shows "No line from this project" in its row.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 204,506
- Elapsed since build started: 18 min
- Changed lines: 392 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. Tidy-up: when a slot's agent, model and effort wrap onto two lines in a narrow column, the next line starts with its "·" separator.

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
    "reviewed_sha": "e526e1d9a8975ae3c494b9bcd3e949175af5a7b7",
    "session": "fresh",
    "thread_id": "01a2198e-8125-7451-a899-7fdbcc69533c",
    "builder_response": "- Tests run: test/floor-line-0766.test.mjs test/floor-line-browser-0766.test.mjs test/floor-0765.test.mjs test/floor-browser-0765.test.mjs (plus commands.checks). Before that, `speck test --related` with the ticket's two test files ran 625 related files (5781 tests, 0 failing); after it I only changed floor.css (text sizes 13/11 px to the floor's 14/12 px, and the queue's next ids wrap rather than cut off), so this round's output is the floor files re-run.\n- Round 1. The line is drawn in templates/floor.js (drawLine and helpers, section \"0766: the line\"), from each station's `line` in the summary 0764 added; no server change was needed, as floorAnswer passes the summary through whole.\n- \"Off\" (dimmed) is a panel not answering or a summary whose mood is `asleep`, which projectSummary gives exactly when speck run is off. \"Idle\" (faint) is a line with nothing at any station, none ready and nothing at Ship.\n- Pictures of the floor at 1440 px and 800 px are with the review pack (dark only: the floor has no light look).\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 203806,
      "cached_input_tokens": 144512,
      "cache_write_input_tokens": 0,
      "output_tokens": 700,
      "reasoning_output_tokens": 34
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 59294,
      "cached": 144512,
      "write": 0,
      "output": 700
    },
    "cost_usd": 0.1400392,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T20:32:00.953Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/floor.js drawLine and lineRow render each supplied project with all five columns and SpeckFace member roles. Passing AC1 tests verify rows, headings and faces; existing floor tests cover the filtered project list."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/floor.js slotOf, timeThere and whyOf render the summary's ticket details and agent stripe. Passing AC2 tests exercise multiple tickets, colours, reasons, times and safe text rendering."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "memberCell, queueCell and shipCell render idle settings, absent QA, queue counts and ids, and Ship ownership marks. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "lineRow applies idle/off classes; floor.css dims rows and confines horizontal overflow to line-box. Passing DOM tests cover states and updates; the real-browser test passed at 800 and 600 px without page overflow."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded round output confirms 174 passed, zero failed and three skipped, including the existing floor tests. No existing tests were weakened or unrelated runtime changes introduced."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The factory floor now shows each project's queue and working stations, including tickets, agents, models and shipping waits. Tests cover the requested behaviour and narrow-window scrolling. No blocking issues found."
  }
}
```

</details>
