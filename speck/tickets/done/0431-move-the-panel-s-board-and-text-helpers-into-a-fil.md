---
id: "0431"
title: "Move the panel's model into a file of its own"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0430"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T22:39:34.526Z"
approved: "2026-10-23T22:47:45.910Z"
finished: "2026-10-23T22:50:36.399Z"

---
# 0431 · Move the panel's model into a file of its own

**Status:** ✅ done

## Problem
The page's model, the code that turns the board into what the page shows without touching the page, sits inside `templates/panel.html` between `---- model` and `---- end model`. Tests that run it on its own have to cut it out of the page first.

## Outcome
The page's model is in a file of its own, which tests load directly.

## Acceptance criteria
1. Everything between `---- model` and `---- end model` in `panel.html` today is in `templates/panel-model.js`, which the page loads from `/panel-model.js` before the rest of its script. `panel.html` no longer contains it.
2. the panel's server answers `GET /panel-model.js` with the file as `text/javascript`, read afresh on each request as the page is. A page loaded before the file changed says it's out of date and offers to reload, as one does today when `panel.html` changes. A request for any other path, such as `/panel.html` or `/panel-model.js/../x`, gets the answer an unknown path gets today.
3. `test/panel.test.mjs`, and every other test that runs the model on its own, loads it from `panel-model.js`, without a browser and without reading `panel.html`.
4. No test that passed before this change fails, except tests that read the moved code from `panel.html`, which read it from the new file instead.

## Out of scope
- Changing what the model does.
- The styles (0430), Settings (0432) and the rest of the script (0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min).
- Part of splitting `templates/panel.html` (4,414 lines, 315 KB on 2026-10-23) into files by area, so panel tickets in different areas can build side by side and agents work with smaller files: 0430 styles, 0431 the model, 0432 Settings, 0433 the rest. No change to what the panel does or how it looks.
- Install and update copy the whole `templates/` folder (`place` in `scripts/`), so a new file there reaches projects with no change.
- The page's stamp (`stampOf` in `scripts/panel.mjs`) is worked out from `panel.html` alone today. `/lcd.js` and `/fonts/Doto.ttf` show how the server names each file it serves.
- Failing before this build: none
- Self-check: no changes. The model file is checked for having no DOM use, a missing file gets a plain message, and the fake page runs the model and the page script in one context, as a browser shares them across scripts.
- Waits for 0430: both change `templates/panel.html`, `scripts/panel.mjs` and `test/support/panel.mjs`.

## In plain words
Nothing looks or works differently in the panel. The part of the panel's page that turns the board into what you see now has a file of its own, so the page file is about 500 lines shorter. That helps builds that change the panel work in smaller files and get in each other's way less. To check it, open the panel and use it as usual. If the new file is edited while the panel is open, the page offers to reload, as it does when the page itself changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 229,846
- Elapsed since build started: 8 min
- Changed lines: 1004 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. A timing flake in test/run-switch-0301.test.mjs ("0301 AC3 self-check: a build that ends while the new code fails to start…") failed once in a related run and passed alone twice. It isn't changed by this ticket.

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
    "reviewed_sha": "01cb892f7400122c23fcc1c493999b0198b30901",
    "session": "fresh",
    "thread_id": "01a16af2-34fd-7a42-b192-03308b3eec77",
    "builder_response": "- Tests run: `speck test --related test/panel-0431.test.mjs test/panel-0051.test.mjs test/pipeline-0415.test.mjs` (the ticket's own file, the existing test files it changed and the file of a test that failed in the last run, plus every test file naming a changed file: 279 files, 2571 tests).\n- One failure in that run, `0301 AC3 self-check: a build that ends while the new code fails to start…` in test/run-switch-0301.test.mjs, is a timing flake not touched by this change: it passed in the previous related run and passes run on its own twice (`node --test --test-name-pattern=… test/run-switch-0301.test.mjs`).\n- No pictures: nothing on the page looks different. The model is moved as it was, with only a short header comment and `'use strict'` added to the new file.\n- Notes on the change:\n  - The page loads `/panel-model.js` before `/lcd.js`, so 0302's check that `lcd.js` comes straight before the page's own script still holds.\n  - The page's stamp now covers the model file too, so a change to it makes an open page out of date.\n  - `fakePage` runs the model and then the page's script in one vm context, as a browser shares top-level declarations across classic scripts.\n  - test/pipeline-0415's browser test opens panel.html from its file, so it can't load `/panel-model.js`. It now puts the model in before the page's script, as 0430 made it do for the styles (AC4's exception for tests that read the moved code from panel.html).\n  - scripts/panel.mjs stays at 600 lines, the limit in 0078's check.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 228842,
      "cached_input_tokens": 165120,
      "cache_write_input_tokens": 0,
      "output_tokens": 1004,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:47:36.720Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Verified the body of templates/panel-model.js exactly matches the former model section on main. templates/panel.html loads it before the other scripts. The 0431 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs serves the exact /panel-model.js path afresh as text/javascript and includes its contents in stampOf. Both 0431 AC2 tests passed, covering fresh reads, changed stamps, unknown paths and missing files. Existing reload-offer coverage includes test/panel-0413.test.mjs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/panel.mjs model() reads panel-model.js directly; panelModel() evaluates it without a browser. test/panel.test.mjs uses that helper, and panel-0051.test.mjs now loads model() directly. Both 0431 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The related run passed 2567 tests, including all six ticket tests. Its sole failure concerns run-switch timing in unchanged code; the builder reports two successful isolated reruns. The model body is unchanged, and affected page-test helpers preserve the shared script context."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s model has moved into its own file without changing its behaviour. The server reloads the file on each request and detects changes so open pages can offer a reload. Tests now load the model directly. No blocking issues found; the reported unrelated timing flake does not indicate a regression from this change."
  }
}
```

</details>
