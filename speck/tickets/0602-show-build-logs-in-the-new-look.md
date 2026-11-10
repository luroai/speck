---
id: "0602"
title: "Show build logs in the new look"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0601"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T08:46:04.716Z"

---
# 0602 · Show build logs in the new look

**Status:** 🔍 reviewing

## Problem
A ticket's build log still opens in the LCD-era frame: a dark bezel box with a red-dot title, a small bordered Close button, and a black terminal with a white border, with every wrapped line indented under a time column. A building ticket's full view shows its live log in the same black terminal. Everywhere else the redesign has moved to light, flat views.

## Outcome
A ticket's build log and its live log read like the Pipeline log: flat, in the panel's own colours and type.

## Acceptance criteria
1. A ticket's Build log opens as a full view like the Pipeline log, with a back link to the ticket, a heading such as "0597 build log", and no dark frame, red dot or bordered Close button.
2. Its lines are rows in the Pipeline log's style: the time in the mono font and muted, the text in the panel's font, a tool call's line in the muted colour, a failure in the bad colour, a wrapped line continuing under its own text rather than under a wide indent, in both looks.
3. A building ticket's full view shows its live log in the same style, inside the view rather than in a black box, its newest line last and kept in view as lines arrive, as today.
4. The Full log and Stop build buttons look like the panel's other secondary buttons (0603).
5. Tests that checked the build log's old frame or terminal look are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Formatting the Markdown in a builder's own messages.
- What the build log contains.

## Notes
- Asked for 2026-11-10, with a phone screenshot of a shipped ticket's build log: "It's the old branding", and "I think it will happen elsewhere too."
- Checked on 2026-11-10 in a real browser at 390 px, after 0577 to 0597 shipped: the Pipeline log, Decided for you, the Settings view and the top of a ticket's full view are in the new look; the places below aren't.
- Today: the build log reuses `#foreman` (`renderBuildLog`, `drawBuildLog` in `templates/panel-popups.js`) without the `.log-view` class 0592 gave the Pipeline log, so it keeps `#foreman .top` and `.fm-body` on `var(--bezel)` and `.run-log` on `var(--log-bg)` in `templates/panel-popups.css`. The live log is `.q .log` on `var(--log-bg)` in `templates/panel-cards.css` (`logBox` in `templates/panel.js`).
- Waits for 0601, which changes the borders in the same files.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: kept the log's markup as it was and pulled each time into its column rather than laying rows out in a grid, so a copied line keeps its time and text together (0422's real-browser test); Full log's hover now darkens its border rather than filling it, which 0161 counts as a too-faint edge.

## In plain words
A ticket's build log no longer opens in the old dark box with a red dot and a Close button. It now opens as a page like the Pipeline log: a link back to the ticket at the top, a heading such as "0597 build log", and one row per line, with the time in small grey type and the text in the panel's own font. Tool calls are grey and failures are in the panel's warning colour, in both the light and dark looks. A building ticket's own page shows its live log the same way, straight on the page instead of in a black box, and still keeps the newest line in view. Its Full log and Stop build buttons are now the larger, rounded kind.

To see it, open a building ticket and press Full log, then switch the look in Settings. Worth a look: a blank line between two of the builder's messages still shows as a small gap before the next row's line.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Tests changed from the build log's old frame and terminal look to the new one:
- `test/build-log-0548.test.mjs`: the build log is a full view with a back link and heading, not the frame with Close; its kinds' colours are the panel's; a blank line is 20 px; the back link closes it. Its page helpers moved to `test/support/build-log.mjs`, which this ticket's tests share.
- `test/panel-0051.test.mjs`: the log box is in the interface font, not the mono one.
- `test/panel-0161.test.mjs`: the log's text sits on the panel's surfaces, not the log's black; the full view's live section is no longer a card with an edge.
- `test/panel-0366.test.mjs`: the build log has no Close sharing the document's rules.
- `test/panel-0417.test.mjs`: `#foreman .close` is gone from the controls sized for touch.
- `test/panel-0422.test.mjs`: the time and each kind's colour are the panel's, at 4.5:1 on `--panel` in both looks.
- `test/panel-0427.test.mjs`: the log's 13 px times are allowed, as the Pipeline log's are; the times are mono; Full log and Stop build are in the interface font; no `#foreman .close`.
- `test/panel-0428.test.mjs`: the build log has no corners.
- `test/panel-0455.test.mjs`: rewritten for the flat look: no background of its own, readable text on the panel in every look, a line above and below rather than a four-sided box.
- `test/panel-0577.test.mjs`: the heading's rule is `#foreman.log-view .top .title`.
- `test/panel-0581.test.mjs`: the build log's red dot is gone.
- `test/panel-0584.test.mjs`: the back link closes the build log.
- `test/pipeline-0459.test.mjs`: neither log is a terminal; a line's time is pulled into its own column.
- `test/pipeline-0479.test.mjs`: no dark frame or red dot.

Follow-ups (tidy-ups and known limits, no inbox notes):
- `--speck-red` in `templates/panel-base.css` is no longer used now that the build log's red dot is gone; 0603, which removes the other old colours, could take it out too (`test/panel-0426.test.mjs` still names it).
- Some rules only the old frame needed are now always overridden by `.log-view`: `.foreman ol.run-log` and `.foreman div.run-log`'s mono font, and 0161's `onFrame` (`--bezel`) in its test. Tidy-up only.
- A blank line between two messages (a gap row) shows as 20 px of space above the next row's line, as it did in the terminal. Kept as is, as 0422 checks a blank line is one line high.

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
    "reviewed_sha": "482a72d93b96a9204f8260a3c5bc7aa672ae2e79",
    "session": "fresh",
    "thread_id": "01a1c4b8-7344-7680-9faf-b2db29bf94c5",
    "builder_response": "- Tests run: test/build-log-0602.test.mjs test/build-log-0548.test.mjs test/panel-0051.test.mjs test/panel-0161.test.mjs test/panel-0366.test.mjs test/panel-0417.test.mjs test/panel-0422.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0455.test.mjs test/panel-0577.test.mjs test/panel-0581.test.mjs test/panel-0584.test.mjs test/pipeline-0459.test.mjs test/pipeline-0479.test.mjs, with `--related` (all pass, including the real-browser tests in 0051, 0422 and 0455).\n- Also run once, not in this output: every test/panel-*, pipeline-*, build-log-*, foreman-*, settings-*, speck-face-* and icons-* file (2152 pass, 0 fail).\n- Design notes:\n  - The build log now opens in #foreman with class log-view, as the Pipeline log does (buildLogFrame replaces popFrame): back link \"‹ <id>\" (role link, \"Back to <id>\"), heading \"<id> build log\", no Close. The old dark-frame rules (#foreman .top/.fm-body bezel, red dot, #foreman .close) and the terminal rules for .foreman .run-log rows are gone.\n  - Rows keep their markup (span.at, then the text node, then the newline) so selection and copying behave as before. The time is an inline-block pulled into a 74 px column with a negative margin rather than a grid: a grid split each copied line's time and text onto separate lines.\n  - The live log (.q .log) and the full view's live section (.q.live) have no box: a scrolling area between two hairlines, rows styled as the build log's.\n  - Full log and Stop build in the live section follow 0603's secondary style (1 px --line border, 10 px corners, --text, min-height 44 px). The rule is in panel-cards.css, as 0417/0469 only allow a 44 px size for every pointer in the header's and cards' files.\n- AC5: changed tests, for the Delivery log: build-log-0548 (frame, kind colours, gap height, closing by back link; helpers moved to test/support/build-log.mjs), panel-0051 (log font), panel-0161 (log text sits on the surfaces; the live section is no card), panel-0366 (no #foreman .close), panel-0417 (#foreman .close dropped from the sized list), panel-0422 (time and kind colours on --panel), panel-0427 (13 px time allowed, as the Pipeline log's; times mono; no #foreman .close), panel-0428 (log has no corners), panel-0455 (rewritten for the flat look), panel-0577 (title selector), panel-0581 (no red dot), panel-0584 (back link closes), pipeline-0459 (no terminal; new row layout), pipeline-0479 (no dark frame or red dot).\n- Pictures: four, the build log and the live log in light and dark, at 390 px.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 216829,
      "cached_input_tokens": 156032,
      "cache_write_input_tokens": 0,
      "output_tokens": 887,
      "reasoning_output_tokens": 70
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 60797,
      "cached": 156032,
      "write": 0,
      "output": 887
    },
    "cost_usd": 0.1460672,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:10:18.527Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-popups.js buildLogFrame and renderForeman provide the full view, ticket back link and heading. Passing 0602 AC1 tests cover navigation and removal of the old frame."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-popups.css shares row typography, time alignment and kind colours between both logs. Passing 0602 AC2 tests cover these rules; the passing 0422 browser test checks wrapped-line alignment and copying, and 0455 checks colours in both looks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css removes the terminal background; panel-popups.css removes the live section's box. Passing 0602 AC3 tests exercise line order, incoming updates and scrolling to the newest line."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css styles both live-buttons controls with the secondary button dimensions and colours specified by 0603. The passing 0602 AC4 test checks both controls."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The old-look tests have been updated and the supplied run reports 330 passes, zero failures and three skips. However, the ticket's Delivery log still contains only its placeholder; the changed tests are listed solely in the builder response."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0602-show-build-logs-in-the-new-look.md",
        "issue": "Criterion 5 explicitly requires the Delivery log to list the updated tests, but that section is empty.",
        "suggested_fix": "Add the updated test files and what their checks now cover to the Delivery log, using the list already provided in the builder response.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The build and live logs now use the panel's flat styling, with working back navigation, readable colours and preserved live updates. The tests support the implementation. Before approval, record the updated tests in the ticket's Delivery log as required."
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
    "reviewed_sha": "125c63fd0403e9141d733a67f2ca3916429f812d",
    "session": "continued",
    "thread_id": "01a1c4b8-7344-7680-9faf-b2db29bf94c5",
    "builder_response": "- Tests run: none new: only the ticket file changed since round 1, so the round 1 output stands (same files, all passing).\n- F1: fixed. The ticket's Delivery log now lists each changed test file and what its checks now cover.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 344799,
      "cached_input_tokens": 279552,
      "cache_write_input_tokens": 0,
      "output_tokens": 1502,
      "reasoning_output_tokens": 70
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4450,
      "cached": 123520,
      "write": 0,
      "output": 615
    },
    "cost_usd": 0.027402,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:10:58.129Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-popups.js buildLogFrame and renderForeman provide the full view, ticket back link and heading without Close. Passing 0602 AC1 tests cover the frame and back navigation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-popups.css shares row typography, time alignment and kind colours between both logs. Passing 0602 AC2 tests cover these rules; 0422's browser test checks wrapping and copying, and 0455 checks readability in both looks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css and panel-popups.css remove the terminal background and live section's box. Passing 0602 AC3 tests exercise line order, incoming updates and keeping the newest line visible."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css gives both live-buttons controls the secondary style specified by 0603. The passing 0602 AC4 test checks both controls."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The ticket's Delivery log now lists all changed test files and their updated checks. The supplied test run reports 330 passes, zero failures and three skips. Git confirms that implementation and tests are unchanged since round 1."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0602-show-build-logs-in-the-new-look.md",
        "issue": "The Delivery log previously omitted the updated tests required by criterion 5.",
        "suggested_fix": "Completed: the Delivery log now lists the changed test files and what they check.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The build and live logs use the panel's flat styling while preserving navigation, readable colours and live updates. All criteria pass, and the missing test record is now complete. Ready for the product owner's merge decision."
  }
}
```

</details>
