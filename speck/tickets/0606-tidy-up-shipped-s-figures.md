---
id: "0606"
title: "Tidy up Shipped's figures"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:51:33.342Z"

---
# 0606 · Tidy up Shipped's figures

**Status:** 🔍 reviewing

## Problem
Shipped's figures look messy on a phone: the first three tiles have square corners at the top and rounded ones at the bottom, a large bordered More stats or Fewer stats button sits between them and the other figures, the other figures fill three columns with a gap left in the last row, labels wrap onto two lines so tiles differ in height, every tile repeats "588 tickets", and a "588 in total" line above them repeats the tab's own count.

## Outcome
Shipped's figures are one tidy grid of even tiles, with a quiet link to show the rest.

## Acceptance criteria
1. Every figure is a tile of one style: the surface colour, no border, all four corners rounded alike, the same gap between tiles; its number in the panel's font and its label in the muted colour on one line, so tiles in a row are the same height.
2. The figures are a grid of two columns below 480 px wide and four from 480 px: shipped today, median build time, median review rounds and approved first round always show; median builder cost, total cost, median reviewer tokens and median builder tokens show when the rest are open, so every row is full.
3. A tile says how many tickets its figure comes from only when that's fewer than all those shipped, for example "from 476 tickets"; the others say nothing, and the "588 in total" line is gone, as the tab gives the count.
4. Showing and hiding the other figures is a text link in the accent colour under the grid, "All figures" or "Fewer figures", with a 44 px tall tap area, instead of the bordered button, and the other tiles join the same grid.
5. Tests that checked the old tiles, the toggle or the totals line are changed to check the new ones, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- How the figures are worked out.
- The shipped tickets' rows under the figures.

## Notes
- Asked for 2026-11-10, with a phone screenshot: "Some of the corners on the bottom are rounded, the corners at the top are not. There's a button in the middle of them. Just looks really messy. Can we clean this up, please?"
- Decided: shipped today moves up from the other figures so the four that always show fill two rows of two on a phone, and the four others fill two more; at 480 px and wider, each group is one row of four.
- Today: the figures are built in `templates/panel.js` (`tiles('shipped-stats', …)` and `tiles('shipped-more', …)`, with `#more-stats`, from about line 1297), styled in `templates/panel-cards.css` (from about line 181, 0157's tiles and 0587's toggle).
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: total cost with no known total said "over 0 tickets" in its tooltip, now "No shipped ticket has a known total cost"; the link fits its text rather than the row's width. Also: the brief's Shipped sentence matched to the new figures, "median reviewer tokens" shown as "median review tokens" so every label is whole at 375 px (tooltip keeps "reviewer"), and labels kept at 14 px as 0427 forbids 13 px.

## In plain words
Shipped's figures are now one tidy grid of matching rounded tiles: two to a row on a phone and four on a wider screen, with every row full. Four figures always show (shipped today, median build time, median review rounds and approved first round), and a quiet blue "All figures" link under them adds the other four to the same grid. "Fewer figures" hides them again. A tile only says how many tickets it comes from when that's fewer than all those shipped, and the "588 in total" line is gone, as the Shipped tab shows the count. To see it, open Shipped on your phone. Keep an eye on mid-sized windows (roughly 480 to 760 px wide), where the longer labels are cut short with "…".

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed to check the new tiles, link and missing total line (AC5): test/panel-0058 (median tile now second), panel-0134 (no shipped-n id), panel-0157 (one grid of 2/4 columns, one-line labels, "from N tickets"), panel-0162 (All figures toggle; its browser test now checks 0606 AC1, AC2 and AC4 at 375 and 1280 px), panel-0188 (dead ids dropped), panel-0410 and panel-0425 (no "in total" line), panel-0420 (two to a row at 420 px, the link under the grid), panel-0427 (All figures wording), panel-0428 (corners on each tile, not the grid; the link no longer a bordered button), panel-0453 (the link has no border, so it's out of the bordered-button checks), panel-0476 (no Shipped lane line), panel-0478 (the long-line check uses Build's line), panel-0577 (number in the panel's font), panel-0587 (four tiles, total cost a dash when unknown), panel-0603 (the link isn't .full-open), panel.test (0035's stats), spend-0120 and total-cost-0526 (the others in the one grid). No other test that passed before fails: the round's related run had 1,573 passing, 0 failing, 3 skipped.
- Follow-ups:
  - Between 480 and about 760 px wide, four columns cut the longer labels with an ellipsis: saved to the inbox as speck/ideas/2026-11-10-keep-shipped-s-figure-labels-whole-at-middle-widths.md.
  - Known limit: below 375 px (for example 320 px), some labels end in an ellipsis at 14 px; the tooltip gives the figure in full.

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
    "reviewed_sha": "f06eb1faf277acbdc2f1621fee36bcc63e8ada90",
    "session": "fresh",
    "thread_id": "01a1c4f0-63cf-7792-9adb-2f7cefa4e74d",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0606.test.mjs and every existing test file this ticket changed (panel-0058, 0134, 0157, 0162, 0188, 0410, 0420, 0425, 0427, 0428, 0453, 0476, 0478, 0577, 0587, 0603, panel, spend-0120, total-cost-0526), plus every file --related brought in: 1,576 tests, 0 failing, 3 skipped.\n- AC1/AC2's real-browser checks (even tiles, full rows of 2 below 480 px and 4 from it, one-line labels, surface colour, alike corners, no border) are in the rewritten browser tests in test/panel-0162.test.mjs (named \"0606 AC1 AC2 AC4 (was 0162 AC3)\") and test/panel-0157.test.mjs, rather than a new browser test, to avoid an extra slow panel start.\n- Choices for the reviewer to weigh: the tile label \"median reviewer tokens\" now reads \"median review tokens\" (tooltip keeps \"Median reviewer tokens\"), so every label fits whole at 375 px at 14 px; 13 px is not allowed by 0427's type scale. Total cost now always has a tile (a dash when unknown) so the open grid's last row is always full, as AC2 asks. Between 480 and about 760 px wide, the four-column grid is too narrow for the longest labels, which end in an ellipsis on one line; AC2 fixes that breakpoint.\n- The brief's sentence on Shipped is updated to match.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 178896,
      "cached_input_tokens": 114688,
      "cache_write_input_tokens": 0,
      "output_tokens": 882,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 64208,
      "cached": 114688,
      "write": 0,
      "output": 882
    },
    "cost_usd": 0.1487048,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:11:17.525Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css gives .stat the surface colour, no border, equal rounded corners, UI-font numbers and muted single-line labels. Passing 0606 AC1 tests and panel-0162 browser tests exercise these properties."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js renders four permanent figures and four optional figures in shipped-stats. CSS switches from two columns to four at 480 px. Passing 0606 AC2 tests cover the breakpoint, contents and unknown-total placeholder; browser tests check full rows."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() adds a count only when s.count < m.shippedTotal. panel.html removes shipped-n. Passing 0606 AC3 tests check partial counts, omitted full counts and the retained tab count."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel.html places more-stats below the single grid; render() switches All figures/Fewer figures. CSS supplies accent text, no border and a global 44 px minimum height. Passing 0606 AC4 and panel-0162 browser tests exercise this."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "Existing affected tests were updated, and /tmp/speck-0606-tests.txt confirms 1,573 passes, zero failures and three skips. However, the ticket's Delivery log remains an empty placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0606-tidy-up-shipped-s-figures.md",
        "issue": "The Delivery log does not list the updated tests, as acceptance criterion 5 explicitly requires.",
        "suggested_fix": "Record the changed test files and their validation result in the Delivery log using the supported ticket workflow.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The figures now form one consistent grid with a quiet expand link, and the supplied test results support the behaviour. The change needs one completion step: list the updated tests in the ticket's Delivery log."
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
    "reviewed_sha": "0ba1fe20a55e9d23f7563af8a8eeb006f2fa0558",
    "session": "continued",
    "thread_id": "01a1c4f0-63cf-7792-9adb-2f7cefa4e74d",
    "builder_response": "- Tests run: test/panel-0606.test.mjs and every existing test file this ticket changed (panel-0058, 0134, 0157, 0162, 0188, 0410, 0420, 0425, 0427, 0428, 0453, 0476, 0478, 0577, 0587, 0603, panel, spend-0120, total-cost-0526), with the commands.checks files.\n- F1: fixed. The ticket's Delivery log now lists each changed test file and what it checks now, and the result of the related run (1,573 passing, 0 failing, 3 skipped). Only the ticket changed this round.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 314096,
      "cached_input_tokens": 245376,
      "cache_write_input_tokens": 0,
      "output_tokens": 1550,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4512,
      "cached": 130688,
      "write": 0,
      "output": 668
    },
    "cost_usd": 0.0287728,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:12:58.261Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css gives tiles a uniform surface, no border, equal rounded corners, consistent gaps, UI-font numbers and muted single-line labels. Passing panel-0606 tests and panel-0162 browser tests cover these properties."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() in templates/panel.js supplies four permanent and four optional figures in one grid. CSS sets two columns below 480 px and four from 480 px. Passing AC2 tests cover the figures, breakpoint and unknown-total placeholder; browser tests verify full rows."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() displays ticket counts only when s.count < m.shippedTotal; panel.html removes shipped-n. Passing panel-0606 AC3 tests verify partial counts, omitted full counts and the tab count."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The toggle follows the single grid, uses accent text without a border and has a 44 px minimum height. Passing panel-0606 AC4 and panel-0162 browser tests verify its appearance, position and All figures/Fewer figures behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log now lists the updated existing tests and their changed checks. The fresh test output confirms 351 passes, zero failures and three skips. Only the ticket changed since round 1."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0606-tidy-up-shipped-s-figures.md",
        "issue": "The Delivery log previously omitted the updated tests required by criterion 5.",
        "suggested_fix": "Completed: the Delivery log lists the changed tests, their coverage and the earlier related-run result.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The figures form one consistent grid with a quiet expand link and fewer repeated counts. All five criteria pass, the missing test record is complete, and no blocking concerns remain."
  }
}
```

</details>
