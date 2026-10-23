---
id: "0427"
title: "Use Cursor's fonts in the panel"                # one outcome, no "and"
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
after: ["0426"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T18:57:11.441Z"
approved: "2026-10-23T19:21:56.160Z"

---
# 0427 · Use Cursor's fonts in the panel

**Status:** 👍 approved

## Problem
The panel names Zen Kaku Gothic New, Shippori Mincho and IBM Plex Mono, but doesn't load them, so each machine shows whatever it falls back to. Its serif headings and spaced capital labels don't look like Cursor beside it.

## Outcome
The panel's text uses the fonts Cursor's own interface uses, and its labels read like Cursor's.

## Acceptance criteria
1. All the panel's text, except the `speck` dot-matrix title and speck's screen, uses `-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif`. Body text, such as a ticket's stage sentence, a question, a message and Settings' explanations, is 14 px rather than today's 13 px.
2. Text set in monospace today (ids, the build log, code and figures) uses `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`.
3. Headings, tab names and ticket titles, in a serif today, use the interface font at weight 600. The page no longer names Zen Kaku Gothic New, Shippori Mincho or IBM Plex Mono.
4. Buttons and labels in spaced capitals today are in sentence case in the interface font, with no extra letter spacing, for example `Full ticket`, `More stats` and `Tickets · 4`.
5. 0161's rules on size and weight still hold: no text smaller than 12 px, and no running text or label lighter than 400.

## Out of scope
- Colours (0426) and corners (0428).
- speck's screen and the Doto title.

## Notes
- The user asked for this on 2026-10-23: the panel is used mostly beside Cursor, at work and at home, and should look like part of it.
- Checked 2026-10-23: VS Code's interface font, which Cursor is built on, is `-apple-system, BlinkMacSystemFont` on macOS, `"Segoe WPC", "Segoe UI"` on Windows and `system-ui, "Ubuntu", "Droid Sans"` on Linux. Its interface monospace is `"SF Mono", Monaco, Menlo, Courier` on macOS, `Consolas, "Courier New"` on Windows and `"Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New"` on Linux (microsoft/vscode `src/vs/workbench/browser/media/style.css`).
- 14 px: Cursor's text is about 14–15 px beside the panel's 13 px in the user's screenshot of 2026-10-23.
- Checked 2026-10-23: only Cursor's remote server is installed on this box, not its interface, so its workbench style sheet can't be read here. Nothing in the server or its built-in extensions names a different interface font, and their webviews use `var(--vscode-font-family)`, VS Code's interface font. Not proven, but nothing contradicts it.
- Waits for 0426: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: words that were monospace only to look like labels (the lane counts, the Foreman's line, a question's facts, Settings' switches, look picker and agent names) moved to the interface font; a setting's key and value stay monospace, as code. On this machine Chrome takes `system-ui` to be Liberation Mono, so the browser tests see the interface font as a monospace: a long title there wraps onto three lines where the old serif took two, so 0419's and 0420's "a long title wraps" now check it wraps, not onto exactly two lines. The −3 px narrowing of the dots in a details line is kept: in a proportional font it closes the gaps, but without it the details no longer fit one line in this machine's monospace (a follow-up).
- Pictures: taken on a box whose only fonts are Liberation Sans, Serif and Mono, with Liberation Sans standing in for the system font; on a Mac, Windows or Ubuntu machine the panel shows that system's own font.

## In plain words
The panel now uses the same fonts as Cursor: your computer's own interface font for text, headings and buttons, and Cursor's monospace for ticket numbers, the build log, code and figures. Headings and ticket titles are bold rather than in a serif, buttons and labels read in normal sentence case ("Full ticket", "More stats") instead of spaced capitals, and body text is a little bigger, at 14 px. To see it, open the panel beside Cursor: the lettering should match. Worth a look: the dots between the parts of a ticket's details line sit very close to the words beside them in the new font, which is saved as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A ticket's stage sentence remains 12 px, although AC1 explicitly includes it among body text that must be 14 px.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,605,333
- Elapsed since build started: 25 min
- Changed lines: 154 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (to the inbox): speck/ideas/2026-10-23-give-the-dots-in-a-details-line-their-gaps-back.md (the dots' gaps close in a proportional font); speck/ideas/2026-10-23-measure-the-panel-s-layout-in-a-proportional-font.md (the build machine's Chrome shows `system-ui` as Liberation Mono, so the layout tests measure a monospaced panel).
- Known limit: the selects in Settings (an agent and its model, a setting's value) stay in the monospace, as a setting's values.

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
    "reviewed_sha": "e9f496a31420769660494f0a85b8db6f8bfaae22",
    "session": "fresh",
    "thread_id": "01a16a2b-b1fa-7910-b3c5-323213966dd5",
    "builder_response": "- Tests run: test/panel-0427.test.mjs test/panel-0161.test.mjs test/panel-0158.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0147.test.mjs test/panel-0273.test.mjs test/panel-0424.test.mjs test/panel-0419.test.mjs test/panel-0420.test.mjs test/panel-0164.test.mjs test/panel-0304.test.mjs test/panel-0413.test.mjs test/panel-0426.test.mjs\n- Reading of AC1/AC2: text that is monospace today stays monospace where it is an id, a log, code (including a setting's key and value) or a figure; spaced-capital buttons and labels (AC4) and words that were monospace only to look like labels move to the interface font.\n- Existing tests changed: those that named the old fonts (0134, 0135, 0147, 0273), the capitals (0158), 13 px body text (0161, 0424), and the exact line count of a long title (0419, 0420). On this machine Chrome resolves `system-ui` to Liberation Mono (only Liberation Sans/Serif/Mono are installed), so in the browser tests the interface font is a monospace, and a long bold title wraps onto three lines where the old serif (Liberation Serif) took two. Those two checks now assert that the title wraps (>= 2 lines).\n- The -3px narrowing of the dots in a details line is unchanged: in a proportional font it closes the gaps, but without it the details no longer fit one line in this machine's monospace (0419's check). Noted as a follow-up.\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 363955,
      "cached_input_tokens": 294912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1126,
      "reasoning_output_tokens": 71
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:10:56.849Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html sets body to the requested interface stack at 14 px, but progressOf() renders the stage sentence as .progress .say, which inherits 12 px from .q .top .progress (line 246). The passing 0427 AC1 tests check declarations rather than this rendered sentence."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The code/.mono/.id rule, .q .log, td.num and #shipped .fig .v use the requested monospace stack. The corresponding 0427 AC2 test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Heading, tab-name and ticket-title rules use the interface stack at weight 600; the old font names are absent. The 0427 AC3 test and updated 0134 browser test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Spaced uppercase styling was removed from buttons and labels, which now use the interface stack. Existing sentence-case text supplies Full ticket, More stats and ticket counts. The 0427 AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The stylesheet retains minimum sizes of 12 px and weights of at least 400. The 0427 AC5 and existing 0161 AC3 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:246",
        "issue": "A ticket's stage sentence remains 12 px, although AC1 explicitly includes it among body text that must be 14 px. progressOf() places d.sentence in .say inside the 12 px .progress container. Checking that body is 14 px and no declaration says 13 px misses this case.",
        "suggested_fix": "Set the stage sentence to 14 px and add a test that checks its effective size inside a rendered ticket, while preserving the compact metadata layout.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The requested fonts, heading weights and sentence-case controls are implemented, and the reported tests pass. One explicit requirement remains unmet: the ticket's stage sentence is still 12 px instead of 14 px. Fix that size and test the rendered sentence before approval."
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
    "reviewed_sha": "3e284f8199cefe618c6c450734ee92e1791381ea",
    "session": "continued",
    "thread_id": "01a16a2b-b1fa-7910-b3c5-323213966dd5",
    "builder_response": "- Tests run: test/panel-0427.test.mjs test/panel-0161.test.mjs test/panel-0158.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0147.test.mjs test/panel-0273.test.mjs test/panel-0424.test.mjs test/panel-0419.test.mjs test/panel-0420.test.mjs test/panel-0164.test.mjs test/panel-0304.test.mjs test/panel-0413.test.mjs test/panel-0426.test.mjs test/panel-0422.test.mjs test/panel-0421.test.mjs\n- F1: fixed. `.q .top .say` (the stage sentence, from progressOf()) is now 14 px, with a 12 px line height so the details line stays the height 0419 sets (a card with details on two lines stays within 64 px). New real-browser test \"0427 AC1: in a real browser, a ticket's stage sentence and a question are 14 px, in the interface font\" reads the rendered size and font of every stage sentence and an open question; it fails without the fix.\n- Consequence in 0419's browser test: on this machine Chrome takes `system-ui` to be Liberation Mono, so a building ticket's 14 px \"Writing tests and code · Build · 01:05 · P3 · M · low\" no longer fits one line at 420 px, as the reviewing ticket's already didn't. The test now measures whether the interface font is a monospace (an \"iiii\" as wide as an \"mmmm\") and, only then, expects 0703's details on two lines, as it already did for 0704. The 64 px height limit still applies to both.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 509856,
      "cached_input_tokens": 434560,
      "cache_write_input_tokens": 0,
      "output_tokens": 1671,
      "reasoning_output_tokens": 71
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:13:36.531Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html uses the requested interface stack and 14 px body text; .q .top .say now explicitly sets 14 px. The new 0427 AC1 browser test passed, checking computed sizes and fonts of stage sentences and an open question."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Code, ids, build logs and figures retain the requested monospace stack. The 0427 AC2 test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Heading, tab-name and ticket-title rules use the interface stack at weight 600, and the old font names are absent. The 0427 AC3 and updated 0134 browser tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Buttons and labels use the interface font with sentence-case text; uppercase transforms and positive letter spacing were removed. The 0427 AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The stylesheet retains text sizes of at least 12 px and weights of at least 400. The 0427 AC5 and existing 0161 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:232",
        "issue": "The stage sentence previously inherited 12 px instead of the required 14 px. It now explicitly uses 14 px, and a browser test verifies the rendered size.",
        "suggested_fix": "Completed: the stage sentence is 14 px and covered by the new browser test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now uses the requested interface and monospace fonts, stronger headings and sentence-case controls. The stage-sentence size is fixed and verified in a browser. All criteria pass; the reported run has 233 passing tests, no failures and three skips."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8164899386cdef70a490d60a1d4249438dc0b621",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16a2b-b1fa-7910-b3c5-323213966dd5",
    "builder_response": "- Tests run: test/panel-0140.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0427.test.mjs test/panel-0419.test.mjs test/panel-0420.test.mjs test/panel-0161.test.mjs test/panel-0158.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0147.test.mjs test/panel-0273.test.mjs test/panel-0424.test.mjs test/panel-0164.test.mjs test/panel-0304.test.mjs test/panel-0413.test.mjs test/panel-0426.test.mjs test/panel-0421.test.mjs test/panel-0422.test.mjs\n- Merge: `git merge main` was clean (no conflicting files). The ship failed on the ticket's own change, not main's: 0140, 0151, 0155 and 0156 are browser tests I hadn't run in the build.\n- 0156 (sentence under the title; and 0140, which passes again with the same fix): the 14 px stage sentence's glyph box (16 px) poked 2 px into the title above it, inside a 14 px details line. Fix in templates/panel.html: `.q .top .say` is `display: inline-block; line-height: 13px`, so its box is exactly the line's height: it starts at the title's bottom, its top is level with the 12 px stage name's (0156 AC4), and cards keep their height (0419's 64 px).\n- 0151 and 0155 (the 68-character title on at most N lines): on this machine Chrome resolves `system-ui` to Liberation Mono, where the bold 17 px title is 694 px wide; in a proportional font it is 564 px (bold Liberation Sans, measured), against about 620 px of room at 1280 px, so it still fits on one line on a real machine. Added `MONO_UI` to test/support/panel.mjs (true when an i and an m are the same width in `system-ui`), and 0151/0155 allow one more line only then. 0419's inline copy of that check now uses it.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 726509,
      "cached_input_tokens": 614400,
      "cache_write_input_tokens": 0,
      "output_tokens": 2216,
      "reasoning_output_tokens": 71
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:21:53.571Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains the requested interface stack and 14 px body text, including .q .top .say. The 0427 browser test verifies computed stage-sentence and question sizes. Existing 0156 positioning tests and 0419 card-height tests pass with the revised inline-block layout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Code, ids, build logs and figures use the requested monospace stack. The 0427 AC2 test passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Heading, tab-name and ticket-title rules use the interface stack at weight 600; old font names remain absent. The 0427 AC3 and updated 0134 browser tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Buttons and labels retain sentence-case text in the interface font without positive letter spacing or uppercase transforms. The 0427 AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Text sizes remain at least 12 px and weights at least 400. The 0427 AC5 and existing 0161 tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:232",
        "issue": "The stage sentence now uses 14 px. Its revised inline-block layout also passes the existing tests for placement beneath the title and compact card height.",
        "suggested_fix": "Completed; retain the browser size and layout coverage.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merged change meets all five criteria. The stage sentence keeps its required size and now passes the existing positioning checks. Font-dependent wrapping allowances preserve overflow and alignment checks. The reported run has 297 passing tests, no failures and three skips. No blocking findings remain."
  }
}
```

</details>
