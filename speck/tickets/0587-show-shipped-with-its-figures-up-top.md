---
id: "0587"
title: "Show Shipped with its figures up top"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0586"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:53:18.728Z"
waited_seconds: 4005

---
# 0587 · Show Shipped with its figures up top

**Status:** 🔍 reviewing

## Problem
The Shipped lane opens with a line of figures and long cards. The redesign puts its three key figures up top as tiles and lists shipped tickets as compact rows.

## Outcome
Shipped opens with three figure tiles and lists its tickets as compact rows.

## Acceptance criteria
1. Shipped opens with three tiles: the median build time, the median number of review rounds and the share approved in the first round, worked out as today's figures are.
2. Each shipped ticket is one row: its id, title and a line with when it shipped, its review rounds and how long it took, such as "28 Oct, 13:58 · 1 round · 4 min"; pressing it opens its full view.
3. The other figures, costs included, are still there behind the more-figures toggle.
4. Each row is at least 44 px tall, and long titles wrap at 320 px wide.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- How the figures are worked out.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: the Shipped part of `render()` in `templates/panel.js` (`#shipped-stats`, `#more-stats`, `#shipped-more`), figures from `panelModel()` in `templates/panel-model.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a press on a row's bug or fix tag explains the tag and opens nothing (test added); removed the leftover 44 px title rule and rounded corners from the old card; a ticket's own costs and tokens moved into its full view so they aren't lost with the open card.

## In plain words
The Shipped lane now opens with three tiles: the median build time, the median number of review rounds and the share of tickets approved in their first round. Below them, each shipped ticket is a compact row with when it shipped, its review rounds and how long it took, and long titles wrap.

To see it, open Shipped in the panel. Press a row to open that ticket's full view, which now also shows what it cost and how many tokens it used, and has its Review pack. More stats shows the other figures, costs included.

Worth keeping an eye on: a ticket that had no review rounds has no Review pack link in its full view, where the old card showed a button saying there was no pack.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

### Tests updated to the new look (AC5)
`test/build-log-0291`, `panel` (the main file), `panel-0050`, `0058`, `0063`, `0132`, `0133`, `0137`, `0141`, `0157`, `0162`, `0167`, `0411`, `0417`, `0418`, `0420`, `0427`, `0428`, `0434`, `0442`, `0453`, `0461`, `0464`, `0465`, `0466`, `0469`, `0472`, `0473`, `0494`, `0519`, `0577`, `panel-focus-0326`, `spend-0120` and `total-cost-0526`, plus the `shippedFull` helper in `test/support/panel.mjs` (`shippedPack` added, `openDetails` removed). The 0519 test that every Shipped card is the same height went with its helpers in `test/support/cards-0519.mjs`, as no lane keeps titles on one line now.

Each test still checks its behaviour where that exists on the new look. Checks of what's gone were removed: opening and closing a card in place, the step track and facts table inside a card, the bordered card, the one-line stats, a closed title cut with an ellipsis, and the card's Full ticket and Review pack buttons.

### Known limits
- A shipped ticket with no review rounds has no Review pack row in its full view. The old open card showed a button that said there was no pack.

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
    "reviewed_sha": "3a1efd8afaa64b4caee8401998789b1ad27a22d4",
    "session": "fresh",
    "thread_id": "01a1c29d-8cc0-7460-9295-61254b7f02be",
    "builder_response": "- Tests run: test/build-log-0291.test.mjs test/panel-0050.test.mjs test/panel-0058.test.mjs test/panel-0063.test.mjs test/panel-0132.test.mjs test/panel-0133.test.mjs test/panel-0137.test.mjs test/panel-0141.test.mjs test/panel-0157.test.mjs test/panel-0162.test.mjs test/panel-0167.test.mjs test/panel-0411.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0420.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0434.test.mjs test/panel-0442.test.mjs test/panel-0453.test.mjs test/panel-0461.test.mjs test/panel-0464.test.mjs test/panel-0465.test.mjs test/panel-0466.test.mjs test/panel-0469.test.mjs test/panel-0472.test.mjs test/panel-0473.test.mjs test/panel-0494.test.mjs test/panel-0519.test.mjs test/panel-0577.test.mjs test/panel-0587.test.mjs test/panel-focus-0326.test.mjs test/panel.test.mjs test/spend-0120.test.mjs test/total-cost-0526.test.mjs \n- One failure in this run, `0517 AC3` (a timing check: 105 ms against a 50 ms limit on the first frame), with the machine's load average at 43 from other builds. The same test passed in the run before this one and passed 3 times out of 3 run alone (`node --test test/panel-0517.test.mjs`), so it isn't from this change. The test is unchanged.\n- AC5: no test checks it directly. The ticket's Delivery log lists the tests updated, and this run covers them with every test file that names a changed file.\n- A shipped ticket's own costs and tokens moved from the old open card into its full view, so they aren't lost now that a row opens the full view.\n",
    "seconds": 64,
    "usage": {
      "input_tokens": 488702,
      "cached_input_tokens": 397952,
      "cache_write_input_tokens": 0,
      "output_tokens": 1139,
      "reasoning_output_tokens": 83
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 90750,
      "cached": 397952,
      "write": 0,
      "output": 1139
    },
    "cost_usd": 0.2326852,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:22:11.022Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The three tiles are rendered and tested in panel-0587.test.mjs, but panelModel() in templates/panel-model.js:383 measures exactly one round rather than approval in the first round."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() creates compact rows with id, title, date, rounds and duration. Passing tests in panel-0587, panel-0141 and panel-0466 cover opening the full view, keyboard controls and focus return."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() retains the other figures in shipped-more. Passing 0587 AC3 tests exercise the toggle, costs, token figures and missing data."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css sets a 44 px minimum row height and wrapping titles. The passing 0587 AC4 browser test measures both at 320 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated tests, whose changes follow the replaced card behaviour. Reported coverage passes apart from an unchanged timing test that the builder reports passed on repeated isolated runs; no regression is established."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js:383",
        "issue": "The 'approved first round' percentage counts tickets with exactly one round. Merge reviews happen after approval, so a ticket approved immediately can incorrectly count as unsuccessful. A direct model check with two approving rounds returns 0%. The ticket's Known limits acknowledges this, but it contradicts AC1. Current tests only check round counts and miss the distinction.",
        "suggested_fix": "Determine first-round approval from the first review's verdict, preserve that information in board-feed.mjs when older tickets are condensed, and test a ticket approved in round one followed by merge reviews alongside a ticket initially sent back for changes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The compact rows, mobile layout and extra figures work and have meaningful test coverage. The approval percentage needs correction: later merge reviews currently make a ticket approved on its first review count as though it was not."
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
    "reviewed_sha": "6f835fefce7f2e8390f09778227c135dd674e54a",
    "session": "continued",
    "thread_id": "01a1c29d-8cc0-7460-9295-61254b7f02be",
    "builder_response": "- Tests run: test/build-log-0291.test.mjs test/panel-0050.test.mjs test/panel-0058.test.mjs test/panel-0063.test.mjs test/panel-0132.test.mjs test/panel-0133.test.mjs test/panel-0137.test.mjs test/panel-0141.test.mjs test/panel-0157.test.mjs test/panel-0162.test.mjs test/panel-0167.test.mjs test/panel-0178.test.mjs test/panel-0187.test.mjs test/panel-0188.test.mjs test/panel-0208.test.mjs test/panel-0246.test.mjs test/panel-0411.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0420.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0434.test.mjs test/panel-0442.test.mjs test/panel-0453.test.mjs test/panel-0461.test.mjs test/panel-0464.test.mjs test/panel-0465.test.mjs test/panel-0466.test.mjs test/panel-0467.test.mjs test/panel-0469.test.mjs test/panel-0472.test.mjs test/panel-0473.test.mjs test/panel-0494.test.mjs test/panel-0517.test.mjs test/panel-0519.test.mjs test/panel-0577.test.mjs test/panel-0587.test.mjs test/panel-focus-0326.test.mjs test/panel.test.mjs test/ship-0204.test.mjs test/spend-0120.test.mjs test/total-cost-0526.test.mjs \n- F1: fixed. The share now comes from the first review round's verdict (`firstApproved` in `panelModel()`, templates/panel-model.js), not the round count. `panelBoard()` in scripts/board-feed.mjs keeps `first_approved` in `review_total` when it cuts an older ticket down. Tests in test/panel-0587.test.mjs cover a ticket approved in round one with merge rounds after it beside one sent back, the cut-down shape from `panelBoard()`, and the model reading it. The Known limit about this is gone from the Delivery log.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 718528,
      "cached_input_tokens": 613632,
      "cache_write_input_tokens": 0,
      "output_tokens": 1847,
      "reasoning_output_tokens": 83
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 14146,
      "cached": 215680,
      "write": 0,
      "output": 708
    },
    "cost_usd": 0.05694,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:25:19.137Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelModel() now uses the first review verdict, and panelBoard() preserves first_approved for condensed tickets. Passing panel-0587 tests cover merge reviews after first-round approval, initial changes requested, condensed tickets and missing data."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() displays each ticket's id, title, ship time, rounds and duration as a compact row opening its full view. Passing panel-0587, panel-0141 and panel-0466 tests cover mouse, touch, keyboard and focus return."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() retains the remaining figures, including costs, in shipped-more. Passing 0587 AC3 tests exercise showing and hiding them and handling unknown costs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css gives shipped rows min-height: 44px and wrapping titles. The passing 0587 AC4 browser test measures row heights and long-title wrapping at 320 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the tests updated for the new appearance. The latest run covers the changed tests and previously failing timing test: 537 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "The first-round approval percentage previously counted tickets with exactly one review round, incorrectly excluding tickets with subsequent merge reviews.",
        "suggested_fix": "Implemented: use the first review's verdict, preserve it when older tickets are condensed, and cover both paths with regression tests.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Shipped now shows three headline tiles and compact ticket rows that open the full view. Extra figures remain available, mobile rows wrap correctly, and the approval percentage now handles later merge reviews correctly. All criteria pass; no blocking concerns remain."
  }
}
```

</details>
