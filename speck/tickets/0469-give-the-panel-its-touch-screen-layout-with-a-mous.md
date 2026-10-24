---
id: "0469"
title: "Give the panel its touch-screen layout with a mouse too"                # one outcome, no "and"
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
after: ["0468", "0474"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:36:38.942Z"

---
# 0469 · Give the panel its touch-screen layout with a mouse too

**Status:** 🔍 reviewing

## Problem
In Cursor's browser pane with a mouse, the panel's cards are squashed: the title and details rows sit tight together and the text looks big for the card. In Cursor's mobile view, and on a phone, the same cards are taller and better spaced, because the panel only gives a touch screen its roomier layout. The user prefers that layout everywhere.

## Outcome
The panel looks the same with a mouse as it does on a touch screen at the same width.

## Acceptance criteria
1. At the same window width, the header, the tabs and every card in Plan, Build and Shipped, closed and open, have the same heights, padding, line heights and gaps with a mouse as with a touch screen today, including the 44 px Settings button, tabs, title rows and details lines, and the wide gaps either side of each ` · `. Checked in a real browser at 390 px and 600 px, comparing each element's size and place with `pointer: fine` and `pointer: coarse`.
2. Font sizes don't change, with either kind of pointer.
3. With a mouse, hovering still highlights a card as it does today, and a tap area that doesn't change the layout may stay touch-only.
4. No test that passed before this change fails.

## Out of scope
- Text sizes: the smaller text in Cursor's mobile view comes from Cursor scaling the page to fit its pane, not from the panel.
- The full ticket, Settings and the Pipeline pop-up, beyond the header and tabs behind them.

## Notes
- Asked for by the user on 2026-10-24, from two photos of the panel in Cursor's browser pane: with a mouse "the tickets look really small and like squished, and the text is almost bigger", and in Cursor's mobile view "the tickets are a bit taller, there's a bit more spacing … I prefer the mobile view. Can you make the Cursor desktop view look like the mobile view?"
- Today: `@media (pointer: coarse)` in `templates/panel.css` (0151, 0162, 0164, 0165, 0419, 0441, 0443, 0454) holds the touch layout's sizes.
- Waits for 0474, the last of the file splits the user asked on 2026-10-24 to be built first, so this changes the split stylesheets. And for 0468, the last queued ticket that changes the cards' layout in `templates/panel.css`, so this applies to the step track, facts table, dependency box and chip they add, and its check covers them.

- Failing before this build: none
- Tests changed for the new behaviour: 0417 (AC1 and the mouse test: a mouse now gets the touch screen's 44 px minimums, the same as on a touch screen), 0419, 0420 and 0421 (their mouse height limits raised to the touch layout's: 80, 76 and 57 px, and 44 px buttons), and 0454 AC2 (the Settings button is 44 × 44 px with a mouse too). Each pinned the compact mouse layout this ticket replaces; the rest of each test is unchanged.
- Self-check: no changes

## In plain words
With a mouse or trackpad, the panel now has the same roomier layout it already had on a phone or touch screen: taller cards with more space between the title and details, the bigger Settings button and tabs, and wider gaps between the parts of each details line. Text sizes are the same as before. To see it, open the panel in Cursor's browser pane, or any desktop browser, and compare it with a phone: the cards look alike. Hovering over a card still highlights it. Worth knowing: fewer cards fit on screen at once with a mouse now, as on a phone. Settings, the full ticket and the Pipeline pop-up are unchanged.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none. Known limit: with a mouse, the tags' invisible 44 px tap areas stay touch-only, as AC3 allows, so a click lands only on a tag's own box.

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
    "reviewed_sha": "f23d77091d84bf4934f8e0838a916f3f1a461409",
    "session": "fresh",
    "thread_id": "01a16e65-280f-7aa0-a3a9-c3f97422a460",
    "builder_response": "- Tests run: test/panel-0469.test.mjs test/panel-0417.test.mjs test/panel-0419.test.mjs test/panel-0420.test.mjs test/panel-0421.test.mjs test/panel-0454.test.mjs (with `speck test --related`, which added the files naming a changed file, and the commands.checks files)\n- The change: in panel-header.css and panel-cards.css, the rules that were under `@media (pointer: coarse)` and set sizes, padding, margins, line heights or gaps are now plain rules in the same place, so the cascade is unchanged on a touch screen and a mouse gets the same values. Only rules that add a tap area without changing the layout stay touch-only (AC3 allows this): `.tag.pick::after`, `.item.ticket .facts .set-prio::after` and `.q .top .tag:not(.pick) { z-index: 1 }`; panel-base.css's `.tag:not(.pick)::after` is untouched. Settings, the full ticket and the Pipeline pop-up keep their own touch-only blocks (out of scope).\n- AC4 and existing tests: five existing test files pinned the compact mouse layout that this ticket replaces at the user's request, so their mouse assertions were moved to the new layout and nothing else in them changed: 0417 (the static check now also allows the header's and cards' always-on rules; the 375 px mouse test now asserts each control has the same minimums with a mouse as on a touch screen, and a 44 × 44 Settings button), 0419 (closed card height limit 64 → 80 px), 0420 (shipped card 56 → 76 px, stats line 40 → 57 px), 0421 (open card buttons ≤ 28 → ≤ 44 px) and 0454 AC2 (Settings button ≥ 44 × 44 px with a mouse too). The numbers are the touch layout's heights measured in the same tests. I also ran every test file that uses a real browser or the stylesheets (117 files): all passed after these updates.\n- Pictures: Plan, Build and Shipped at 420 px with a mouse, light and dark.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 116539,
      "cached_input_tokens": 70272,
      "cache_write_input_tokens": 0,
      "output_tokens": 532,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T14:51:47.938Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-header.css and panel-cards.css promote the existing touch layout rules without changing their cascade order. The passing real-browser tests in panel-0469.test.mjs compare element positions, dimensions, padding, margins, line heights and gaps at 390 px and 600 px across Plan, Build and Shipped, closed and open."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The stylesheet change preserves existing font declarations. The passing 0469 browser comparisons include computed font sizes and families for visible elements with both pointers."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css retains the unchanged @media (hover: hover) card highlight. The passing 0469 AC3 test checks that rule; remaining touch-only rules provide invisible tap areas and stacking without changing layout."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test output reports 149 passed, zero failed and three skipped. Changes to existing assertions replace compact mouse dimensions with the requested touch dimensions; their other behavioural checks remain intact."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now uses the roomier touch layout with a mouse, while preserving text sizes and mouse hover highlighting. Browser comparisons pass at both requested widths, and the recorded checks report no failures. No blocking issues found."
  }
}
```

</details>
