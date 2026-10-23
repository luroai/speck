---
id: "0433"
title: "Move the rest of the panel's script into a file of its own"                # one outcome, no "and"
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
after: ["0432"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T23:02:08.128Z"
approved: "2026-10-23T23:13:50.785Z"
finished: "2026-10-23T23:16:44.803Z"

---
# 0433 · Move the rest of the panel's script into a file of its own

**Status:** ✅ done

## Problem
After 0430 to 0432, `templates/panel.html` still holds about 2,000 lines of the page's script: drawing the lanes, the cards, the full ticket, the logs and speck's screen.

## Outcome
`panel.html` is just the page's markup, and its script is in files of its own.

## Acceptance criteria
1. The rest of the page's script is in `templates/panel.js`, which the page loads from `/panel.js`. `panel.html` holds only the page's markup, the short script that sets the light or dark look before the page is drawn, and the tags that load its styles and scripts, and it's under 150 lines.
2. the panel's server answers `GET /panel.js` with the file as `text/javascript`, read afresh on each request as the page is. A page loaded before the file changed says it's out of date and offers to reload, as one does today when `panel.html` changes. A request for any other path, such as `/panel.html` or `/panel.js/../x`, gets the answer an unknown path gets today.
3. `fakePage` in `test/support/panel.mjs` loads the page's scripts from their files, so a quick test still runs the page without a browser.
4. No test that passed before this change fails, except tests that read the moved code from `panel.html`, which read it from the new file instead.

## Out of scope
- Changing what the panel does or how it looks.
- Splitting `panel.js` further.

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min).
- Part of splitting `templates/panel.html` (4,414 lines, 315 KB on 2026-10-23) into files by area, so panel tickets in different areas can build side by side and agents work with smaller files: 0430 styles, 0431 the model, 0432 Settings, 0433 the rest. No change to what the panel does or how it looks.
- Install and update copy the whole `templates/` folder (`place` in `scripts/`), so a new file there reaches projects with no change.
- The page's stamp (`stampOf` in `scripts/panel.mjs`) is worked out from `panel.html` alone today. `/lcd.js` and `/fonts/Doto.ttf` show how the server names each file it serves.
- Waits for 0432: both change `templates/panel.html`, `scripts/panel.mjs` and `test/support/panel.mjs`.
- Failing before this build: none
- Self-check: tests that checked the page has no innerHTML, poll, heading strings, old buttons or pinch blockers read only `panel.html`, so they would have passed without looking at the moved script; they now read `panel.js` too (0145, 0161, 0362, 0034 in `panel.test.mjs`).
- The page's stamp and token, which the server fills in, are on the tag that loads `/panel.js` (`data-page`, `data-token`), as the file is served as it is. The page starts on `DOMContentLoaded`, so it starts after `/panel-settings.js` has run, as 0432 needs.

## In plain words
Nothing changes in how the panel looks or works. Behind the scenes, the panel's page is now a short file with only its layout, and the code that draws the board lives in a file of its own, finishing the split started in the last few changes. Panel changes in different areas should now build side by side more easily and faster. To see it, open the panel as usual: it should look and behave exactly as before, and if you leave a page open while speck's code changes, the screen still offers to reload.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 488,516
- Elapsed since build started: 12 min
- Changed lines: 4207 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "734ff768ceab4f50e8967726ebf4ca1cc6655ffb",
    "session": "fresh",
    "thread_id": "01a16b0a-480e-7552-8b29-2332c45936a9",
    "builder_response": "- Tests run: `speck test --related test/panel-0433.test.mjs`: the ticket's own test file, every test file it changed and every existing test file that names a file this branch changed (2583 tests, all passing, 3 skipped).\n- Round 1. The script from `<script>` to `</script>` in `panel.html`, and the short start script after `/panel-settings.js`, are moved unchanged into `templates/panel.js`, apart from two things:\n  - `PAGE` and `TOKEN` were filled in by the server in the page. The file is served as it is, so the server now fills them in on the tag that loads it (`<script src=\"/panel.js\" data-page=\"{{page}}\" data-token=\"{{token}}\">`) and the script reads them from `document.currentScript.dataset` as it runs.\n  - The start (the `visibilitychange` listener and `connect()`) now runs on `DOMContentLoaded`, so it still runs after `/panel-settings.js`, as 0432 needed. The tag order is model, lcd, panel.js, panel-settings.js.\n- Tests changed under AC4: tests that read the moved script from `panel.html`, or the stamp or token from `const PAGE = '…'` / `const TOKEN = '…'`, now read them from `panel.js` / the `data-page` and `data-token` attributes. Some negative checks (no innerHTML, no poll, no heading strings, no old button, no pinch blockers) read only `page()` and would have passed without looking at the script at all. They now read `page() + pageScript()`: 0145, 0161, 0362, and 0034 and 0031 in `panel.test.mjs`.\n- The real-browser tests that load the served page (0039, 0040, 0041 and others) pass, which covers `currentScript` and `DOMContentLoaded` in Chrome.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 487808,
      "cached_input_tokens": 360320,
      "cache_write_input_tokens": 0,
      "output_tokens": 708,
      "reasoning_output_tokens": 16
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T23:13:41.223Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html is 96 lines, containing markup, the theme script and asset tags. Comparing the original inline scripts with templates/panel.js confirms only stamp/token retrieval and startup timing changed. The 0433 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelServer serves the exact /panel.js path afresh as text/javascript and includes its contents in stampOf. The passing 0433 AC2 server test checks fresh reads, changed stamps and unknown paths. foreman-0285.test.mjs also tests clicking the reload offer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/panel.mjs fakePage executes model(), pageScript() and settingsScript() from their files, supplies currentScript.dataset and dispatches DOMContentLoaded afterwards. The 0433 AC3 test passed and draws the expected ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded related-test run has 2,580 passes, zero failures and three skips, including real-browser coverage. Existing test changes redirect checks to the moved script or its new stamp/token attributes without weakening behavioural assertions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s remaining script now lives in its own file, leaving a short HTML page. Reload detection and existing panel behaviour are preserved. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>
