---
id: "0473"
title: "Move the panel's pop-ups' script into a file of its own"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0472"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:13:03.735Z"

---
# 0473 · Move the panel's pop-ups' script into a file of its own

**Status:** 🔍 reviewing

## Problem
Most of the panel's script is in one file, `templates/panel.js`, so almost every ticket that changes how part of the panel behaves changes that file, and speck builds such tickets one after another even when they change unrelated parts.

## Outcome
The script for the panel's pop-ups is in a file of its own, so a ticket that changes a pop-up doesn't change `panel.js`.

## Acceptance criteria
1. The script that opens, draws, updates and closes the full ticket, a document's pop-up and the Pipeline log is in `templates/panel-popups.js`, and `panel.js` no longer contains it.
2. `panel.html` loads `panel-popups.js` in its place among the page's scripts, and the panel's server answers `GET /<file>` for each with the file, as `text/css` or `text/javascript`, read afresh on each request as the page is, and a page loaded before one of them changed says it's out of date and offers to reload, as it does today for `panel.css` (0430).
3. `fakePage` in `test/support/panel.mjs` loads every script the page loads, in the page's order, so a quick test still runs the page without a browser.
4. No test that passed before this change fails, except tests that read the moved code from `panel.js`, which read it from the new file instead.

## Out of scope
- The header's script (0474), and the cards' script, which stays in `panel.js`.
- Any change to what the pop-ups do.

## Notes
- Asked for by the user on 2026-10-24, for release 0.15.0 and to be built next, so that tickets changing different parts of the panel can build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots, because every ticket changed `templates/panel.js` (2,378 lines) or `templates/panel.css` (841 lines). A move with no visible change, as 0430 to 0433 were.
- Same pattern as 0432 (Settings) and 0433 (the rest of the script).
- Today: `fullTicket`, `openFull`, `renderFull`, the document pop-up and `renderForeman` with `drawRunLog` are in `templates/panel.js`.
- Waits for 0472: both change `panel.html` and the server's list of files.
- Failing before this build: none
- Self-check: no changes. The moved lines are unchanged apart from comments (the old and new files' lines, sorted, differ only in the new file's header comment, one comment on `foremanOpen` and one on the page's start). Nothing in `panel.js` that runs as it loads uses what moved, which the fake page would show, as it runs each file as a separate script, as a browser does.
- AC3: `fakePage` now reads the script tags from `panel.html` and runs each file in that order, `lcd.js` included (it puts `SpeckLCD` on the page, unless a test gives its own, which the page then uses as before).
- AC4: tests that read the moved code from `panel.js` now read it from `panel-popups.js`: 0031 AC4 (the one page reload), 0426 AC3, 0427 AC4, 0433 AC1 (`openFull`, `renderForeman`) and 0459 AC4. The script-tag lists in 0432 AC1 and 0433 AC1 include the new tag, and 0415 AC5's page opened from its file puts the pop-ups' script in its tag's place.
- Pictures: none, because nothing anyone sees changes.

## In plain words
Nothing looks or works differently: the panel is exactly as it was. Behind the scenes, the part of the panel's code that runs its pop-ups (the full ticket, the review pack, a document opened from a pack, and the Pipeline log) now lives in a file of its own. A change to a pop-up no longer touches the main panel code, so it can be built at the same time as a change to the cards. To see it, open the panel and use the pop-ups as usual: open a full ticket, a review pack, a document in it, and the Pipeline log by pressing speck's screen. If any of them behaves even slightly differently, that's a fault in this change. An open panel page still offers to reload when this new file changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, none for the inbox):
- For 0474 (the header): pressing speck's screen to open the Pipeline log is now wired up in `panel-popups.js`, with the pop-up, so the header's file needn't take it. `foremanOf` and `pageStale` stay in `panel.js`.
- The fake page now runs `lcd.js` as the page does. When a test gives its own `SpeckLCD`, `lcd.js` still runs, against a throwaway window, so the test's stand-in is the one the page uses.
- A repo that upgrades speck gets the new `panel-popups.js` with the rest of the templates. Nothing else loads it.

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
    "reviewed_sha": "ba23d051717d99bd3eb9b90cf732839890df0611",
    "session": "fresh",
    "thread_id": "01a16e4c-1fc2-7270-ad40-d44864959ca6",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0473.test.mjs test/panel.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0432.test.mjs test/panel-0433.test.mjs test/pipeline-0415.test.mjs test/pipeline-0459.test.mjs, plus every existing test file that names a changed file (302 files, 2685 tests, 0 failing, 3 skipped as always).\n- The move: the pop-ups' state (fullId, packOf, docOpen's neighbours, foremanOpen, runLog…, shippingId, shipped, the changes maps), fullButton and packButton (their openers), openFull through mdPart, paneReadiness through holdPane, the backdrop's click, the Pipeline pop-up's listeners with the screen's press and closeForeman, and renderForeman through runLogDropped are in templates/panel-popups.js. The Markdown helpers (mdBlocks, mdInline, plainText), holdPage/pageHeld, foremanOf, pageStale and the document-wide key and click listeners stay in panel.js: the cards and Settings use them too, and the fake page keeps one document listener per type.\n- The moved lines are unchanged apart from comments: `diff <(git show main:templates/panel.js | sort) <(cat templates/panel.js templates/panel-popups.js | sort)` shows only the new header comment, a comment on foremanOpen and one on the page's start.\n- AC2: panel-popups.js loads after panel.js (which it uses) and before panel-settings.js; the server serves it and puts it in the page's stamp. 0473's server test loops over every style and script the page loads (type, no-store, content, read afresh, stamp change; lcd.js isn't in the stamp, as before).\n- AC3: fakePage reads the script tags from panel.html and runs each file in that order, lcd.js included; when a test gives its own SpeckLCD, lcd.js runs against a throwaway window so the test's stand-in is kept. It returns `scripts`, the files it ran.\n- AC4: tests that read moved code from panel.js now read it from panel-popups.js (0031 AC4, 0426 AC3, 0427 AC4, 0433 AC1, 0459 AC4); the script-tag lists in 0432 AC1 and 0433 AC1 include the new tag; 0415 AC5's file-opened page inlines the new script too.\n- No pictures: nothing anyone sees changes.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 249338,
      "cached_input_tokens": 178816,
      "cache_write_input_tokens": 0,
      "output_tokens": 648,
      "reasoning_output_tokens": 20
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T14:24:32.712Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js contains the pop-up state, rendering, requests and listeners removed from panel.js. Comparing the combined files against main confirms only comments and the added strict directive differ. Both 0473 AC1 tests passed, including opening and closing the ticket, review pack, document and Pipeline pop-ups."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html loads panel-popups.js between panel.js and Settings. scripts/panel.mjs serves it afresh as text/javascript and includes it in stampOf. All three 0473 AC2 tests passed, covering file serving, changed-file stamps and the reload offer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/panel.mjs pageScripts reads the page's external script tags; fakePage executes their files sequentially with each tag's dataset. The 0473 AC3 test passed for the complete script order, including lcd.js."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0473-tests.txt reports 2685 tests, 2682 passed, 0 failed and 3 skipped. Existing test changes preserve their assertions while updating moved-code locations and script lists."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The pop-up code now lives in its own file without changing its behaviour. The panel loads and serves it correctly, detects updates and offers to reload. The quick test page loads all external scripts in order. The reported tests passed, and I found no blocking issues."
  }
}
```

</details>
