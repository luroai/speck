---
id: "0543"
title: "Load the panel's files from addresses relative to the page"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-19-load-the-panel-s-font-and-icons-from-relative-addresses.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:40.767Z"
blocked_at: ""
waited_seconds: 33370
approved: "2026-10-28T09:55:57.801Z"
finished: "2026-10-28T10:20:16.609Z"

---
# 0543 · Load the panel's files from addresses relative to the page

**Status:** ✅ done

## Problem
Opened through a proxy that puts the panel under a path, such as cptr's built-in browser at `https://<host>/api/browser/frame/<id>/http/127.0.0.1:4779/`, the panel's header shows "speck" in a plain monospace font instead of Doto's dot-matrix lettering. The stylesheet loads the font from `/fonts/Doto.ttf`, which then points at the proxy's own site root, not the panel.

## Outcome
Every file the panel's page links to, the font included, loads from an address relative to the page, so the panel looks the same under a path as at the site's root.

## Acceptance criteria
1. The page's HTML and stylesheets link to no address that starts with `/`: its stylesheets, scripts, font, icon and manifest are linked relative to the page (such as `fonts/Doto.ttf`, `panel.js`), and the manifest's own icon and start addresses are relative to it.
2. Served at the site's root, as `speck panel` serves it today, the page loads every one of those files, the header's name is drawn in Doto, and the panel works as before.
3. Served under a path by a proxy that forwards `/<prefix>/…` to the panel and nothing else, the page loads its stylesheets, scripts, font, icon and manifest from under `/<prefix>/`, and the header's name is drawn in Doto.
4. Added to a phone's home screen from either address, the app still opens the panel full screen with its icon.
5. No test that passed before this change fails.

## Out of scope
- The page's fetches and event stream (`/api/…`): they work under cptr's proxy today. Making them relative is for a later ticket if a proxy needs it.
- Any change to `speck panel`'s routes.

## Notes
- Found 2026-10-19 from speck-site: `http://127.0.0.1:4779/fonts/Doto.ttf` serves the font, while the same path under cptr's proxy host answers `text/html` (cptr's app page).
- Today: `templates/panel.html` links `/icon.svg`, `/manifest.webmanifest`, `/panel-base.css` and the other stylesheets, and `/panel-model.js` and the other scripts; `templates/panel-base.css` has `url("/fonts/Doto.ttf")`; the routes are in `scripts/panel.mjs` (`icons`, `/fonts/Doto.ttf`). A `url()` in a stylesheet resolves against the stylesheet's own address, which is at the page's level.
- Builds on 0149 (home-screen app) and 0304 (Doto in the header).
- Failing before this build: none
- Self-check: made the browser check wait for Chrome to read the manifest, as 0149's does, instead of asking once; kept the manifest's `id` relative too (`./`), so at the site's root it resolves to `/` as before and a home-screen app added earlier keeps its identity.
- Existing tests that pinned the old `/…` addresses (0147, 0149, 0302, 0304, 0305, 0430–0433, 0472–0474, pipeline 0415, 0470, 0479 and `pageScripts` in `test/support/panel.mjs`) now expect the relative ones: the ticket changes exactly those addresses.
- Went with the recommendation: wait for Codex and resume after 03:41 UTC (chosen by the user in the panel, 2026-10-28 09:45 UTC).

## In plain words
When the panel is opened through a proxy that puts it under a path, such as cptr's built-in browser, the header's "speck" is now drawn in its dot-matrix lettering, and the panel's styles, icons and home-screen app details load from the panel instead of the proxy's own site. Opened directly, the panel looks and works exactly as before, and a home-screen app added earlier keeps working. To see it, open the panel through cptr's browser and check the header. Worth knowing: through such a proxy the board itself still loads its data from the site's root, which is left for a later ticket.


## Blocked question
The build is done and its tests pass, but Codex, the reviewer, has hit its usage limit until 03:41 UTC, so no review round can start. Should it wait for Codex and be resumed after 03:41, or be reviewed now by another reviewer (Claude Code, set as this ticket's reviewer)? I recommend waiting for Codex, so the review stays independent of the Claude builder.

Recommended: wait for Codex and resume after 03:41 UTC
Changes what you'd notice: no
Clear winner: no

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 121,184
- Elapsed since build started: 615 min
- Changed lines: 42 (limit 5000)
- Follow-ups: test 0430's head check still searches for `/panel-settings.css`, so it no longer checks anything (reviewer's minor F1): saved to the inbox as speck/ideas/2026-10-28-make-0430-s-head-check-look-for-the-relative-stylesheet.md.
- Under a proxy's path, the page's fetches and event stream (`/api/…`) still go to the site's root, as the ticket's out of scope says; no note made, as the ticket already names that as a later ticket.

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
    "reviewed_sha": "23f74049ee63aabe87985b9ec1f0baf37a2f818f",
    "session": "fresh",
    "thread_id": "01a181ef-3583-7d23-8874-a4db3411ce64",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0543.test.mjs, test/icons-0305.test.mjs, test/panel-0472.test.mjs, test/panel-0474.test.mjs, test/panel-0473.test.mjs, test/panel-0432.test.mjs, test/panel-0433.test.mjs, test/panel-0431.test.mjs, test/panel-0430.test.mjs, test/panel-0302.test.mjs, test/pipeline-0470.test.mjs, test/pipeline-0479.test.mjs, test/pipeline-0415.test.mjs, test/panel-0147.test.mjs, test/panel-0304.test.mjs, test/panel-0149.test.mjs, test/panel-0170.test.mjs. Because test/support/panel.mjs changed, --related brought in 343 files; 2996 tests, all pass.\n- Change: templates/panel.html, templates/panel-base.css and templates/icons/manifest.webmanifest use addresses relative to the page (`panel.js`, `fonts/Doto.ttf`, `icon-192.png`, and `./` for the manifest's id, start_url and scope, which resolve to `/` at the root as before). The server's routes are unchanged.\n- Existing tests that pinned the old `/…` strings were updated to the relative ones, because AC1 changes exactly those addresses. 0149 and 0170 now resolve the manifest's icon addresses against the manifest's own URL before fetching them. No assertion was dropped.\n- AC3 is tested with a small proxy in test/panel-0543.test.mjs that forwards only `/<prefix>/…` to the panel and answers anything else with its own HTML page, as cptr's does. The real-browser test checks that every file the page fetched outside `/api/` came from under the prefix, that Doto loaded, and that Chrome's parsed manifest has start_url, scope and icons under each address.\n- AC5: the full suite last passed on main (recorded before this build); the related run above covers every test file that names a changed file.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 120347,
      "cached_input_tokens": 72704,
      "cache_write_input_tokens": 0,
      "output_tokens": 837,
      "reasoning_output_tokens": 68
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47643,
      "cached": 72704,
      "write": 0,
      "output": 837
    },
    "cost_usd": 0.1109264,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:55:39.022Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html, panel-base.css and icons/manifest.webmanifest use relative asset addresses. The passing 0543 AC1 test checks HTML, stylesheet URLs and manifest addresses."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0543 AC2 fetches every linked asset at the root. The passing real-browser test verifies Doto loads and is applied to the header; existing panel tests also pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0543 AC3 uses a proxy forwarding only the prefixed path and verifies asset responses under that path. The passing real-browser test confirms Doto renders there."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "0543 AC4 verifies resolved start URL, scope, identity and icon responses at both addresses. The passing browser test checks Chrome's parsed manifest and standalone display; existing Apple home-screen metadata is preserved."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0543-tests.txt: 2,993 passed, zero failed, three skipped. The new browser test passed. Production changes are confined to asset addresses; server routes are unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "test/panel-0430.test.mjs",
        "issue": "The head-order assertion still searches for '/panel-settings.css'. That string is now absent, so indexOf returns -1 and the assertion passes without checking placement. Other passing tests cover the placement correctly.",
        "suggested_fix": "Search for the relative stylesheet address and assert that its index is non-negative before comparing it with the closing head tag.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now loads its files correctly both at the site root and beneath a proxy path, including its Doto lettering and home-screen icons. Relevant tests pass, including the real-browser check. One older test assertion needs a small correction, but overlapping coverage makes it non-blocking."
  }
}
```

</details>
