---
id: "0474"
title: "Move the panel's header script into a file of its own"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0473"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:28:14.801Z"
approved: "2026-10-24T14:33:17.139Z"
finished: "2026-10-24T14:36:31.123Z"

---
# 0474 · Move the panel's header script into a file of its own

**Status:** ✅ done

## Problem
After 0473, the panel's header script, speck's screen, its words and the tabs, is still in `templates/panel.js` with the cards' script, so a ticket that changes the header and one that changes the cards build one after the other.

## Outcome
The script for the panel's header is in a file of its own, so a ticket that changes the header doesn't change `panel.js`.

## Acceptance criteria
1. The script that draws and updates speck's screen (its poses, words and time), the dark frame's title row and the Plan, Build and Shipped tabs is in `templates/panel-header.js`, and `panel.js` no longer contains it. `templates/lcd.js`, the screen's renderer, stays as it is.
2. `panel.html` loads `panel-header.js` in its place among the page's scripts, and the panel's server answers `GET /<file>` for each with the file, as `text/css` or `text/javascript`, read afresh on each request as the page is, and a page loaded before one of them changed says it's out of date and offers to reload, as it does today for `panel.css` (0430).
3. A quick test with `fakePage` still runs the page without a browser.
4. No test that passed before this change fails, except tests that read the moved code from `panel.js`, which read it from the new file instead.

## Out of scope
- The pop-ups' script (0473), and the cards' script, which stays in `panel.js`.
- Any change to what the header does.

## Notes
- Asked for by the user on 2026-10-24, for release 0.15.0 and to be built next, so that tickets changing different parts of the panel can build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots, because every ticket changed `templates/panel.js` (2,378 lines) or `templates/panel.css` (841 lines). A move with no visible change, as 0430 to 0433 were.
- Waits for 0473: both change `panel.html`, `panel.js` and the server's list of files.
- Failing before this build: none
- Self-check: no changes. The moved lines are unchanged apart from comments and one new function: the old and new files' lines, sorted, differ only in the new file's header comment, a shorter comment in render() and `drawHeader`, which holds render()'s lines for the screen's word, the frame's edge and the screen button's label, title and aria-expanded, in the same order. panel-header.js loads after panel.js, as it uses its helpers (`$`, `el`, `setText`, `within`, `foremanOf`) as it loads, and before the pop-ups. Nothing in panel.js, the pop-ups or Settings uses what moved as it loads.
- AC1: moved: the title row (the header's height and the project's tooltip), the screen's renderer hookup (`LCD`, `reducedMotion` and its listeners), speck's screen and poses (`SCREEN` to `speckRests`) and the tabs (`LANES` to their listeners, and the first `drawTabs()`). `foremanOf` and `pageStale` stay in panel.js: the pop-ups use them too. Pressing the screen stays in the pop-ups' file (0473).
- AC4: tests that read the moved code or list the page's scripts now include the new file: 0432 AC1, 0433 AC1 (`drawScreen`), 0473 AC2 and AC3, and 0415 AC5's page opened from its file.
- Pictures: none, because nothing anyone sees changes.

## In plain words
Nothing looks or works differently: the panel is exactly as it was. Behind the scenes, the part of the panel's code that runs its header (speck's screen with its poses, words and clock, the dark frame's title row, and the Plan, Build and Shipped tabs) now lives in a file of its own. A change to the header no longer touches the main panel code, so it can be built at the same time as a change to the cards or the pop-ups. To see it, open the panel and watch speck's screen, switch between the tabs (by pressing them or with the arrow keys), and check that Build's tab shows how many things need you while another tab is open. If any of them behaves even slightly differently, that's a fault in this change. An open panel page still offers to reload when this new file changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 146,109
- Elapsed since build started: 5 min
- Changed lines: 597 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, none for the inbox):
- `foremanOf` and `pageStale` stay in panel.js, as the pop-ups use them too. Pressing speck's screen stays in panel-popups.js (0473).
- The header's file loads after panel.js because it uses its helpers (`$`, `el`, `setText`, `within`) as it loads. Moving those helpers into a shared file of their own would let each area's file load in any order.

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
    "reviewed_sha": "7814d7307b983709a3061b9b15fd16c452141446",
    "session": "fresh",
    "thread_id": "01a16e53-fc41-7603-99e0-574e149fc39c",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0474.test.mjs test/panel-0432.test.mjs test/panel-0433.test.mjs test/panel-0473.test.mjs test/pipeline-0415.test.mjs, plus every existing test file that names a changed file (302 files, 2685 tests, 0 failing, 3 skipped as always).\n- The move: the title row (the header's --head height and the project's tooltip), the renderer hookup (LCD, reducedMotion, the reduced-motion and zoom listeners), speck's screen and poses (SCREEN through speckRests) and the tabs (LANES through their listeners, plus the first drawTabs()) are in templates/panel-header.js. render()'s lines for the screen's word, the frame's edge and the screen button's label, aria-expanded and title are now drawHeader(f, stale) in the header's file, called from render() in the same place and order (before renderForeman and drawTabs). foremanOf and pageStale stay in panel.js (the pop-ups use them); pressing the screen stays in panel-popups.js (0473). lcd.js is untouched.\n- The moved lines are unchanged apart from comments and drawHeader: `diff <(git show main:templates/panel.js | sort) <(cat templates/panel.js templates/panel-header.js | sort)` shows only the new header comment, render()'s shorter comment and drawHeader's wrapper lines.\n- AC2: panel-header.js loads after panel.js (whose helpers it uses as it loads) and before panel-popups.js; the server serves it read afresh as text/javascript with no-store, and puts it in the page's stamp. 0473's server test loops over every script the page loads, now including this one, and 0474's own test checks it directly, plus a missing file's plain message.\n- AC3: fakePage already runs each script tag's file in order (0473); 0474 AC3 checks panel-header.js is among them and the page runs.\n- AC4: tests that list the page's scripts or read moved code include the new file: 0432 AC1, 0433 AC1 (drawScreen), 0473 AC2/AC3, and 0415 AC5's file-opened page inlines the new script.\n- No pictures: nothing anyone sees changes.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 145441,
      "cached_input_tokens": 90752,
      "cache_write_input_tokens": 0,
      "output_tokens": 668,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T14:33:08.777Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js contains the title-row setup, renderer hookup, screen and pose functions, and tab handling. panel.js delegates to drawHeader(). Comparison against main confirms the extraction preserves the moved logic; templates/lcd.js is unchanged. Both 0474 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.html loads panel-header.js after panel.js and before the pop-ups. scripts/panel.mjs includes it in fresh file serving and the page stamp. Passing 0474 AC2 tests check loading, content type, fresh reads and stamp changes; existing 0473 AC2 tests cover all page assets and the reload offer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/panel.mjs executes each script file in page order before DOMContentLoaded. The passing 0474 AC3 test exercises fakePage with panel-header.js and verifies the rendered stale-page status without a browser."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded related-test run passed 2682 tests, with zero failures and three skips. Changes to existing tests update script lists and moved-code locations without weakening behaviour checks. The production diff stays within the extraction's scope."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s header script now lives in its own file, with its behaviour preserved. The server loads changes correctly and existing pages still offer to reload when outdated. The relevant tests passed, and I found no blocking issues."
  }
}
```

</details>
