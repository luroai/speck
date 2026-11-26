---
id: "0765"
title: "Open a factory floor page at speck serve's address"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T19:39:37.424Z"

---
# 0765 · Open a factory floor page at speck serve's address

**Status:** 🔍 reviewing

## Problem
On a laptop the panel is one narrow column showing one lane of one project at a time. The user wants a page for a wide window that shows every project as a station and a project's whole board side by side.

## Outcome
speck serve's address has a factory floor page: a row of project stations over the chosen project's four lanes side by side, in the instrument-panel look.

## Acceptance criteria
1. `/floor` at `speck serve`'s address opens the factory floor, and All projects has a link to it; the panel and All projects are otherwise unchanged.
2. It shows a station for each project on the list that isn't off, numbered, with its name, its state, how many tickets are building, queued, need you and shipped in the last 7 days, and a line of tickets shipped per day over 14 days.
3. Choosing a station shows that project's Capture, Plan, Build and Shipped side by side below the stations, each with its count and its cards (id, title, status colour and one line of detail), and the choice is kept when the page reloads.
4. The page updates by itself within 5 seconds of a change in any project, and at window widths under 1024 px it lays the four lanes out two by two and the stations in two rows, with no sideways scroll.
5. The brief's `speck serve` row describes the factory floor and its address. No test that passed before this change fails.

## Out of scope
- The line, Virgil's dial and the subscriptions' power: tickets of their own.
- Acting on tickets from the floor.

## Notes
- A new page at `speck serve`'s address, for a laptop or desktop window. It doesn't replace or change the panel, which stays the phone and side-panel view (decided 2026-11-26).
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- The front is `scripts/serve-front.mjs`; each project's board comes from its own panel, as All projects already gathers summaries.
- Failing before this build: none
- Self-check: added tests for a panel's summary that names the station's own fields (the floor's own win) and for built-in names such as `__proto__` asked for as the station; the code already handled both. Moved the brief's floor sentences after its project menu's, and reworded them.

## In plain words
speck serve's address now has a factory floor: a page for a laptop or desktop window, in a dark look like an instrument panel. Along the top is a station for each of your projects that isn't turned off, numbered in the order speck projects lists them, with its state, how many tickets are building, queued, need you and shipped this week, and a small line of how many shipped each day over the last two weeks. Pick a station and that project's Capture, Plan, Build and Shipped appear side by side underneath, as its panel's tabs show them; the page remembers your pick when you reload. It keeps itself up to date every couple of seconds, and in a narrower window it shows the lanes two by two and the stations in two rows. The panel itself is unchanged, apart from a Factory floor link on All projects.

To see it, open All projects at speck serve's address and follow the Factory floor link, or add /floor to the address.

Worth keeping an eye on: with a lot of projects, the one row of stations gets narrow and their labels are cut short. The cards can't be pressed yet: a later ticket opens a ticket from the floor.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
### Follow-ups
- None saved to the inbox: round 1 approved with no findings, and none of these is a bug or a test failing on main.
- Known limit: a project's panel reads its board again only when one of its files changes, unless that panel's own page is open. So a change no file records, such as a build's process ending without anything written, reaches the floor late, as it reaches All projects.
- Known limit: from 1024 px up the stations stay in one row, so with many projects (8 or more in a 1280 px window) each station is narrow and its labels are cut short.
- Pictures: the review pack's pictures show demo projects on stand-in panels, from this branch's code for the address started on its own, as the user's speck serve holds the one-per-machine lock.

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
    "reviewed_sha": "5c63a74c088713fc5f2d7753f3c148bf8fdd0baa",
    "session": "fresh",
    "thread_id": "01a2197d-507d-7c11-a347-af4d869c4815",
    "builder_response": "Round 1.\n\n- Tests run: `speck test --related test/floor-0765.test.mjs test/floor-browser-0765.test.mjs`, which ran those two files and, in the same run, every existing test file that names a file this branch changed (listed at the top of the output), plus `commands.checks`: 4971 tests, 4968 passed, 0 failed, 3 skipped (the same 3 skipped before this build).\n- test/floor-browser-0765.test.mjs uses a real headless Chromium for AC4's layout at 1280, 1024, 1023, 800 and 600 px and for a change reaching the page within 5 s; everything else is checked on fakePage's DOM or against speck serve's address started in-process with stand-in panels (test/support/floor.mjs).\n- Design notes: the floor's server side is scripts/serve-floor.mjs, wired into serve-front.mjs at GET /floor (+ floor.css, floor.js) and POST /api/floor. Station figures come from each panel's own summary (summaryOf, as All projects); the 14-day line is counted from each panel's /api/state board, not added to projectSummary, because ticket 0764 (not chained with this one) changes scripts/panel-summary.mjs. The page builds the chosen project's lanes with the panel's own model (panel-model.js), so counts and Build's grouping match the panel's tabs. Pictures in the review pack use demo stand-in panels, as the user's own speck serve holds the one-per-machine lock.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 263297,
      "cached_input_tokens": 190848,
      "cache_write_input_tokens": 0,
      "output_tokens": 879,
      "reasoning_output_tokens": 237
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 72449,
      "cached": 190848,
      "write": 0,
      "output": 879
    },
    "cost_usd": 0.1727728,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T20:13:20.508Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "serve-front.mjs serves /floor independently of the chosen project; panel-header.js adds the All projects link. Passing AC1 tests cover routing, assets and link visibility."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "serve.mjs filters out projects marked off. serve-floor.mjs floorAnswer gathers numbered stations and panel summaries; shippedDays supplies the 14-day series. Passing AC2 tests exercise the API and rendered stations."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "floor.js uses panelModel to render four lanes and localStorage to preserve selection. Passing AC3 tests exercise cards, counts, station switching and reload persistence."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "floor.js polls every two seconds; floor.css changes the grid below 1024 px. Passing real-browser tests verify updates within five seconds and layouts without sideways scrolling at the tested widths."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's speck serve row describes the factory floor at /floor, with an address test. The recorded test output confirms 4,968 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The factory floor shows project stations above the selected project's board, remembers the selection and refreshes automatically. The tests cover the requested behaviour, including browser layout and live updates. No blocking issues found."
  }
}
```

</details>
