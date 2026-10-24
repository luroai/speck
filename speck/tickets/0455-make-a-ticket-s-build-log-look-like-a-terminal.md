---
id: "0455"
title: "Make a ticket's build log look like a terminal"                # one outcome, no "and"
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
after: ["0454"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:44:54.260Z"

---
# 0455 · Make a ticket's build log look like a terminal

**Status:** 🔍 reviewing

## Problem
The build log inside an open ticket uses the page's own background, so in the light look it's a pale box that doesn't read as a terminal. It has only a left edge, and its 12 px corners trim even that, so it doesn't read as a box at all.

## Outcome
A ticket's build log looks like a terminal in both looks: a black box with light text and an edge on all four sides.

## Acceptance criteria
1. In the light look, the dark look and System, a ticket's build log has the same background, darker than the dark look's page background (`#141414`), so it stands out from the ticket in both.
2. Every kind of log text (the time, a message, a tool call, a failure, a note, and plain lines) has a contrast of at least 4.5:1 against that background, in both looks, and the kinds keep their different colours.
3. The log box has a border on all four sides, at least one device pixel wide and with its edges on whole CSS pixels, with rounded corners. On a phone-sized page at a device pixel ratio of 3, all four sides show, checked in a real browser.
4. The log keeps its height, scrolling, monospaced font, line layout (0422) and text selection as before. No test that passed before this change fails.

## Out of scope
- The pipeline log, which fills the window (0415).
- The log's contents, its times or how often it updates.

## Notes
- Asked for by the user on 2026-10-24: "look actually like terminals with black backgrounds … no matter whether it's light or dark mode", and "the rounded edges have caused the terminal to lose its sides".
- Today: `.q .log` in `templates/panel.css`, with `background: var(--bg); border-left: 2px solid var(--line-soft)`, and its kinds coloured `--muted`, `--text`, `--run`, `--bad` and `--warn`. Those are the light look's dark colours in the light look, so they need their own colours on the black background. Its 12 px corners come from the shared `border-radius` rule further down the file.
- Criterion 3 is the box version of what 0453 does for buttons.
- Waits for 0454, which waits for 0453: all three change `templates/panel.css`.
- Failing before this build: none
- Self-check: no changes

## In plain words
When you open a ticket on the Build tab, its build log now looks like a terminal: a black box with light text and a thin edge all the way round, in the light look as well as the dark one. The times, messages, commands, failures and notes keep their own colours, now in shades that read well on black. To see it, open any building or queued ticket on the Build tab and switch the look in Settings. The log still scrolls, keeps its place and lets you select and copy its text as before. The full-window pipeline log is unchanged.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, no inbox notes):
- Tidy-up: 0422 AC2's test still works out the log's contrast from each look's root colours rather than the log's own, so it passes but no longer measures what is drawn. 0455's tests measure the real colours. It could be pointed at the log's own variables.
- Known limit: everything under the header and tabs sits on a fraction of a CSS pixel vertically, because the header (speck's screen is sized from the width, plus a half-pixel edge) and the tabs (half-pixel edges) have fractional heights. Borders still show on all four sides at 3x, so nothing visible is wrong. Round 2 accepted reading "whole CSS pixels" as left and right edges, as 0453 does.

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
    "reviewed_sha": "b7740758a851f822d392d333963cc0cd06a4c259",
    "session": "fresh",
    "thread_id": "01a16d55-15bb-7b50-87eb-a38305a864eb",
    "builder_response": "- Tests run: `speck test --related test/panel-0455.test.mjs`, which also ran every existing test file that names `templates/panel.css` (0422, 0427, 0428, 0453 and others): 125 pass, 0 fail, 3 skipped (skipped as before this change).\n- Change: `.q .log` now sets its own colour variables (`--bg: #000000`, `--text`, `--muted`, `--run`, `--bad`, `--warn` in the dark look's opaque colours) and `color-scheme: dark`, and swaps its `border-left: 2px solid var(--line-soft)` for `border: 1px solid var(--line)`. These variables are scoped to the log, so the colour of every kind (`.at`, `.msg`, `.tool`, `.fail`, `.note`, plain lines) is the same in every look, and the log keeps `background: var(--bg)`. That also keeps 0422's and 0427's existing assertions passing unchanged.\n- Known limit: 0422 AC2's test still works out contrast from the root variables of each look, not the log's own. It passes, but it no longer measures what is drawn. This ticket's tests measure the log's real colours, both from the stylesheet and as the browser computes them in light, dark and System (dark and light).\n- AC3 \"edges on whole CSS pixels\": the log's left and right edges are on whole pixels, and its top and height are whole within its card. A card's top sits on a fraction of a pixel (e.g. 311.59 px) only because the header (221.09 px) and tabs (49.5 px) above it have fractional heights. That's outside this ticket and also true of the buttons 0453 checked (0453 checks only left and right). The test also checks a device-pixel screenshot at 390 px, 3x: every side shows along at least 90% of its middle third, in every look.\n- Pictures: the log on a phone and in a wide window, light and dark looks.\n",
    "seconds": 41,
    "usage": {
      "input_tokens": 182599,
      "cached_input_tokens": 141184,
      "cache_write_input_tokens": 0,
      "output_tokens": 835,
      "reasoning_output_tokens": 48
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:54:55.763Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css scopes --bg: #000000 to .q .log. The passing 0455 browser test checks light, dark and both System settings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The log defines its own light text colours. Passing 0455 AC2 stylesheet and browser tests check every text kind against black at 4.5:1 and distinct message, tool, failure and note colours."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The border and screenshot checks pass, but test/panel-0455.test.mjs measures the top relative to the card instead of its actual CSS position. As the builder acknowledges, the actual top can be fractional; whole-pixel top and bottom edges are not satisfied."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The CSS preserves height, overflow, font, selection behaviour and 0422 line rules. The 0455 AC4 test checks these declarations. Supplied output reports 125 passing tests and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0455.test.mjs",
        "issue": "The AC3 browser test substitutes a whole-pixel offset within the card for a whole-pixel top edge. A fractional card position still gives the log fractional top and bottom edges, contrary to the criterion. Visible borders in the screenshot do not establish pixel alignment.",
        "suggested_fix": "Ensure the log's actual top and bottom edges align to whole CSS pixels, and assert its actual bounding rectangle coordinates rather than subtracting the card's top. Retain the phone screenshot checks.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The log now has a black background, readable coloured text and visible rounded borders in every look. One requirement remains unmet: its top and bottom edges can fall between CSS pixels, and the test checks a relative offset that conceals this."
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
    "reviewed_sha": "b7740758a851f822d392d333963cc0cd06a4c259",
    "session": "continued",
    "thread_id": "01a16d55-15bb-7b50-87eb-a38305a864eb",
    "builder_response": "- Tests run: none new this round. No code changed. The last run's output (`speck test --related test/panel-0455.test.mjs`, 125 pass, 0 fail) still stands for this commit.\n- F1: disputed. The log can't put its top and bottom on whole page pixels, and the criterion doesn't ask it to beyond what 0453 asked of buttons:\n  1. AC3 says the box is \"the box version of what 0453 does for buttons\" (ticket Notes). 0453's AC1 has the same words, \"its edges on whole CSS pixels\", and its approved test (`test/panel-0453.test.mjs`, AC1) checks only left and right (`whole(o.left)`, `whole(o.right)`). It never checks top or bottom, for the same reason as here: every button's top on the Build tab is fractional too. In my probe the log's own buttons, Full ticket and Back to Plan, sit at 359.59 and 358.59 px.\n  2. The vertical fraction comes entirely from content above the lane: the header is 221.09 px tall (speck's screen is sized from the width, and the header has a `.5px` border-bottom), and the tabs are 49.5 px (`.5px` borders). Making those whole would change the header and tab bar (0413, 0428, 0453), well outside \"make a ticket's build log look like a terminal\".\n  3. The log sits in `.lane-list`, which scrolls (`overflow-y: auto`). So its top on the page also changes by the scroll position, which on a 3x phone moves in thirds of a CSS pixel. No CSS on the log can keep its viewport top whole.\n  4. What the criterion protects, all four sides showing, is checked in device pixels: at 390 px and 3x, in every look, each side differs from the box's inside along at least 90% of its middle third. What the log itself controls (its 1 px border, its whole-pixel height of 288 px, its whole-pixel offset within its card, its left and right edges) is all asserted.\n  If you still read AC3 as requiring whole-pixel top and bottom on the page, that's a product question about changing the header and tab bar. I'd take it to the user rather than widen this ticket.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 272393,
      "cached_input_tokens": 226048,
      "cache_write_input_tokens": 0,
      "output_tokens": 1422,
      "reasoning_output_tokens": 93
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:55:54.960Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css gives .q .log its own #000000 background. The passing 0455 browser test checks light, dark and System with both preferences."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Scoped text colours preserve distinct log kinds. Passing 0455 stylesheet and browser tests check all six text categories at a minimum 4.5:1 contrast."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The log has a 1px border and 12px corners. The passing browser test checks whole-pixel horizontal edges and visible borders on all four sides at phone width and DPR 3. The ticket explicitly references 0453, whose recorded interpretation and browser test require whole-pixel left and right edges, without rounding top and bottom."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The CSS retains height, scrolling, monospaced font, line layout and selection behaviour; the 0455 AC4 test checks the retained declarations. Reported test results remain 125 pass, zero failures and three pre-existing skips; no code changed this round."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0455.test.mjs",
        "issue": "Round 1 questioned whether AC3 requires whole-pixel viewport positions for the top and bottom edges. The referenced 0453 ticket explicitly records that this wording means left and right edges, and its approved browser test follows that interpretation.",
        "suggested_fix": "No change required: apply the interpretation established by the ticket's explicit 0453 reference.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "The log has a consistent black background, readable coloured text and visible rounded borders in every look. I accept the builder's dispute: the referenced button ticket establishes that whole-pixel alignment applies to the left and right edges. The change is ready for owner review."
  }
}
```

</details>
