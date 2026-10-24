---
id: "0468"
title: "Mark a closed ticket's dependencies with a chip"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0467"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T13:07:10.567Z"

---
# 0468 · Mark a closed ticket's dependencies with a chip

**Status:** 🔍 reviewing

## Problem
A closed ticket in Plan or Build names the tickets it waits on, or unlocks, as text in its second line, which runs long and wraps on a phone when there are many.

## Outcome
A closed ticket shows its dependencies as one small chip at the end of its title row.

## Acceptance criteria
1. A closed ticket in Plan or Build that waits on tickets that haven't shipped shows, at the end of its title row, a chip with a link icon and how many, such as `11`. One that waits on none, but that tickets which haven't shipped wait on, shows a chip with an arrow icon and how many wait on it directly. A ticket with neither shows no chip.
2. The chip's accessible name and tooltip say what it counts, such as `Waits on 11 tickets` or `4 tickets wait on this`. Pressing it opens the card, as pressing its top row does.
3. The `after`, `unlocks` and `waiting on` ids are gone from closed cards' second lines. The title stays on one line with `…`, and the chip never wraps under it, at every width from 320 px, checked in a real browser.
4. No test that passed before this change fails.

## Out of scope
- Open cards and the full ticket (0467).
- Shipped tickets.

## Notes
- Asked for by the user on 2026-10-24, choosing option E in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "on the collapsed ticket, there's just a link or just a little icon which kind of shows you where it's the top of the dependency or it is linked to something else."
- Today: `ticketHead` and `queuedLine` in `templates/panel.js` put `after`, `unlocks` or `waiting on` and the ids in the second line.
- Waits for 0467: both change those functions.
- Failing before this build: none
- Self-check: no changes. Before it, the run of every page test found the chip below 12 px and its tap area under 44 px on a touch screen; both fixed, with the existing checks (0161, 0140) now covering the chip.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "6eb7166797be8601b3a523580252003042a6c5f5",
    "session": "fresh",
    "thread_id": "01a16e18-6f78-7232-ae4a-0a10e4c088a9",
    "builder_response": "- Tests run: test/panel-0468.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs test/panel-0069.test.mjs test/panel-0151.test.mjs test/panel-0154.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0164.test.mjs test/panel-0167.test.mjs test/panel-0190.test.mjs test/panel-0224.test.mjs test/panel-0410.test.mjs test/panel-0417.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0443.test.mjs test/panel-0463.test.mjs test/panel.test.mjs (with --related, which added the existing test files naming the changed files). Separately, before the round, every test/panel*.test.mjs file and every other test file using the page (fakePage, boardPage, browserPage or test/support/panel.mjs) was run once: all passed.\n- The chip: `depChip` in templates/panel.js, put at the end of a closed Plan card's or a closed queued Build card's title line by `titleLine`. In-flight Build cards never had the old ids in their second line and get no chip. A button, so it has a name and tooltip and is reached by Tab; it doesn't stop its click, so pressing it reaches the top row's own listener, which opens the card. `queueUpdate` puts a kept queue row's chip right when only other tickets change (the AC2 \"follows the board\" test).\n- AC4 and existing tests: the ticket removes the ids from closed cards' second lines (AC3), so every existing test that checked that text or its Go to ticket buttons in that line would fail. Each one was changed to check the new behaviour instead:\n  - The \"after/unlocks/waiting on\" text checks (0034, 0041, 0050, 0053, 0069, 0151, 0419, 0434, 0443, 0463, 0224 AC1) now check the second line without the ids and the chip's tooltip.\n  - 0154's and 0410's Go to ticket tests now use the open card's dependency box (0467), which still goes to tickets through the same goTo, so its timing, highlight, refresh and plain-text-when-off-page checks stay. 0160 AC5 likewise.\n  - Tests whose only subject was the old note's layout or its id tap areas were removed, with a comment saying why: 0164 AC1, AC2, AC4; 0190 AC2; 0224 AC2 (both). 0419 AC3 lost its id-link part only.\n  - 0161 AC4 now expects Tab to reach a dep-chip instead of a goto; its edge check counts the chip's pill. 0167 checks the chip is in the muted id colour, not that a linked id is underlined. 0417's list of 44 px selectors drops .goto.\n- Dead code removed with the ids: `idLinks`, `gotoButton`, `noteIds`, `shownLinks` in panel.js and the .goto/.ids rules in panel.css (their only users were the closed cards' notes).\n- The chip keeps 12 px text (0161) and has a 44 × 44 px tap area on a touch screen, with negative margins so the title line isn't taller (0140 checks it).\n",
    "seconds": 43,
    "usage": {
      "input_tokens": 236573,
      "cached_input_tokens": 182528,
      "cache_write_input_tokens": 0,
      "output_tokens": 961,
      "reasoning_output_tokens": 100
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T13:28:20.632Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.js queueItem passes !t.inFlight && !isOpen to titleLine, excluding closed in-flight Build cards. templates/panel-model.js chains and panelModel still calculate unlocks for those tickets. The AC1 tests cover Plan and ready tickets only."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "depChip sets aria-label and title; its button click bubbles to the card's top-row handler. The 0468 AC2 tests exercise names, tooltips and opening both Plan and Build cards; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketHead and queuedLine remove dependency ids from second lines. The real-browser 0468 AC3 tests passed at 320, 390, 600 and 1000 px, checking single-line titles and chips remaining beside them. Existing CSS supplies text-overflow: ellipsis."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test output reports 402 passes, zero failures and three skips. Changes to existing tests follow the replacement of closed-card dependency links with chips; no unrelated fixes were found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "Closed in-flight Build tickets never show a dependency chip. For example, a building ticket with four queued tickets directly waiting on it should show the arrow chip with 4 under AC1, but queueItem explicitly suppresses it. queueUpdate also returns before updating chips for in-flight tickets.",
        "suggested_fix": "Show dependency chips on every closed, unshipped Build card, including in-flight cards, and update their counts when dependencies change. Add tests for initial rendering and dependency updates on a kept in-flight card.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The chips work on Plan cards and queued Build cards, with clear labels and tested phone layouts. However, they disappear once a Build ticket starts, even when other tickets still wait on it. That gap needs fixing before approval."
  }
}
```

</details>
