---
id: "0432"
title: "Move the Settings view's script into a file of its own"                # one outcome, no "and"
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
after: ["0431"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T22:50:48.520Z"
approved: "2026-10-23T22:58:58.339Z"
finished: "2026-10-23T23:01:52.038Z"

---
# 0432 · Move the Settings view's script into a file of its own

**Status:** ✅ done

## Problem
About 1,100 lines of `templates/panel.html` are the Settings view's script, and Settings tickets have been frequent (0396 to 0409). Each one has to work inside the whole page's script, and clashes with any other panel ticket.

## Outcome
The Settings view's script is in a file of its own.

## Acceptance criteria
1. The script that opens, draws, changes and saves Settings, with its switches and the questions it asks, is in `templates/panel-settings.js`, which the page loads from `/panel-settings.js`. `panel.html` no longer contains it.
2. the panel's server answers `GET /panel-settings.js` with the file as `text/javascript`, read afresh on each request as the page is. A page loaded before the file changed says it's out of date and offers to reload, as one does today when `panel.html` changes. A request for any other path, such as `/panel.html` or `/panel-settings.js/../x`, gets the answer an unknown path gets today.
3. No test that passed before this change fails, except tests that read the moved code from `panel.html`, which read it from the new file instead.

## Out of scope
- Changing what Settings does or how it looks.
- The model (0431) and the rest of the script (0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min).
- Part of splitting `templates/panel.html` (4,414 lines, 315 KB on 2026-10-23) into files by area, so panel tickets in different areas can build side by side and agents work with smaller files: 0430 styles, 0431 the model, 0432 Settings, 0433 the rest. No change to what the panel does or how it looks.
- Install and update copy the whole `templates/` folder (`place` in `scripts/`), so a new file there reaches projects with no change.
- The page's stamp (`stampOf` in `scripts/panel.mjs`) is worked out from `panel.html` alone today. `/lcd.js` and `/fonts/Doto.ttf` show how the server names each file it serves.
- Today Settings runs from `openSettings` (about line 2061) to `saveSettings` and its helpers (about line 3200).
- Failing before this build: none
- Self-check: no changes. Settings registers only one document pointerdown listener, so loading it after the page's script changes no listener order. The page starts only once Settings has run, so nothing the board stream hears first can reach Settings before it exists. A real-browser test through the real panel (0372 AC2) opens Settings from the new file.
- Pictures: none, because nothing on the page looks different.
- Waits for 0431: both change `templates/panel.html`, `scripts/panel.mjs` and `test/support/panel.mjs`.

## In plain words
Nothing looks or works differently in the panel. The Settings view's part of the panel's page now has a file of its own, so the page file is about 1,200 lines shorter. That helps builds that change Settings work in a smaller file and get in the way of other panel work less. To check it, open the panel, open Settings and use it as usual. If the new file is edited while the panel is open, the page offers to reload, as it does when the page itself changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 325,052
- Elapsed since build started: 8 min
- Changed lines: 2460 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. Known limit, as with the model's file (0431): if the server can't send the Settings file, the page can't start, where before it was part of the page itself.

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
    "reviewed_sha": "01c6d5bb0277e98f0897f6803c57842ede8ba8b5",
    "session": "fresh",
    "thread_id": "01a16afc-a8f3-7c42-a632-5195af5f350c",
    "builder_response": "- Tests run: `speck test --related test/panel-0432.test.mjs test/pipeline-0415.test.mjs` (the ticket's own file and the existing test file it changed, plus every test file naming a changed file: 2574 tests, 0 failing).\n- No pictures: nothing on the page looks different. The Settings code is moved as it was, with only a short header comment and `'use strict'` added to the new file.\n- Notes on the change:\n  - What moved: the Appearance code (LOOKS through chooseLook, 0136/0372/0412) and everything from the 0257 Settings comment to the end of sendSettings. `toggleSwitch` and `drawToggle` stay in panel.html, because the page's own script builds the Auto-build switch with them at load (`runSwitchButton`). The Escape `keydown` handler stays too: it is the whole page's, closing tips, documents, the Foreman, priority menus and the side pane as well as Settings.\n  - Load order: the Settings script uses the page's helpers (`el`, `$`, `within`, `render`…) at load, so it can't come before the page's script as the model does. It comes after it, and the page's start (`connect()` and the visibilitychange listener, unchanged) moved into a small inline script after `/panel-settings.js`, so the board stream can't answer and call `render()` (which reads `settingsView`) before Settings is declared. The page's script registers no handler that reaches Settings code before then other than Escape, which reaches Settings only through `settingsView`/`settingTip` checks once the page has started.\n  - The only document `pointerdown` listener is Settings', so registering it after the page's listeners changes no order.\n  - The page's stamp now covers panel-settings.js, so a change to it makes an open page out of date (AC2 test), and the existing reload offer (0285/0413) follows from that stamp.\n  - `fakePage` runs the model, the page's script, Settings, then the page's start, in one vm context, as a browser shares top-level declarations across classic scripts.\n  - test/pipeline-0415's browser test opens the page from its file, so it can't load `/panel-settings.js`. It now opens a copy of panel.html with the Settings script inlined in its place (AC3's exception for tests that read the moved code from panel.html); its now-unused `PAGE` import is dropped.\n  - Real-browser coverage through the real panel server loading `/panel-settings.js`: 0372 AC2 (\"in a real browser, choosing dark in Settings…\") and 0268's browser test passed in the related run.\n  - scripts/panel.mjs stays at 600 lines, the limit in 0078's check.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 324251,
      "cached_input_tokens": 248960,
      "cache_write_input_tokens": 0,
      "output_tokens": 801,
      "reasoning_output_tokens": 50
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:58:51.102Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-settings.js contains the exact extracted Settings code, apart from its new header and strict directive. panel.html loads it before connect(). Both 0432 AC1 tests and the real-browser 0372 AC2 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs serves the exact /panel-settings.js path afresh as text/javascript and includes its contents in stampOf. The passing 0432 AC2 test checks fresh reads, stamp changes and unknown-path responses. The existing page-stamp reload offer remains intact."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded related test run reports 2,571 passed, zero failed and three skipped. Changes to test/support/panel.mjs and pipeline-0415.test.mjs preserve coverage by loading the extracted script. No tests were weakened or unrelated behaviour changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now lives in its own script file without changing its behaviour or appearance. The server loads fresh copies and detects updates so open pages can offer a reload. The relevant tests passed, including real-browser coverage. No blocking concerns found."
  }
}
```

</details>
