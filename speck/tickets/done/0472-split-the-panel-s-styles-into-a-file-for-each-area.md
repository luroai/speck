---
id: "0472"
title: "Split the panel's styles into a file for each area"                # one outcome, no "and"
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
after: ["0468"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T13:39:17.266Z"
approved: "2026-10-24T14:09:40.758Z"
finished: "2026-10-24T14:12:50.330Z"

---
# 0472 · Split the panel's styles into a file for each area

**Status:** ✅ done

## Problem
All of the panel's styles are in one file, `templates/panel.css`, so almost every ticket that changes how any part of the panel looks changes that file. speck chains tickets that change the same files, so they build one after another even when they change unrelated parts.

## Outcome
The panel's styles are in one file for each area of the panel, so a ticket that changes one area's look changes only that area's file.

## Acceptance criteria
1. The styles in `templates/panel.css` are split into these files in `templates/`, and `panel.css` is gone: `panel-base.css` (colours, fonts, the page's layout, and buttons and tags used everywhere), `panel-header.css` (the dark frame, speck's screen and the tabs), `panel-cards.css` (the cards in Plan, Build and Shipped and everything in them, the build log included), `panel-popups.css` (the full ticket, a document's pop-up and the Pipeline log) and `panel-settings.css` (Settings). Each rule is in the file for the area it styles, and in no other (checked by review).
2. `panel.html` loads all five, `panel-base.css` first, and the panel's server answers `GET /<file>` for each with the file, as `text/css` or `text/javascript`, read afresh on each request as the page is, and a page loaded before one of them changed says it's out of date and offers to reload, as it does today for `panel.css` (0430).
3. The panel looks exactly as before: in a real browser at 390 px and 1200 px wide, in both looks, with a mouse and with a touch screen, every element's computed style is the same as before the change.
4. No test that passed before this change fails, except tests that read the moved rules from `panel.css`, which read them from the new files instead.

## Out of scope
- Splitting the page's script (0473, 0474).
- Any change to how the panel looks.

## Notes
- Asked for by the user on 2026-10-24, for release 0.15.0 and to be built next, so that tickets changing different parts of the panel can build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots, because every ticket changed `templates/panel.js` (2,378 lines) or `templates/panel.css` (841 lines). A move with no visible change, as 0430 to 0433 were.
- Same pattern as 0430, which moved the styles out of `panel.html`.
- Waits for 0468, the ticket being built when this was set; the rest of 0.15.0's panel tickets (0469 onwards) wait for 0474, so they build on the split files.
- Failing before this build: none
- Self-check: scripts/panel.mjs went over the 600-line limit for scripts (0078), so the list of style files is kept on the line that names the page's files, and the server's route uses it; no other changes.
- AC4 is checked by the tests that read the styles (0430's, 0281's and every test using `styles()` from test/support/panel.mjs, which now reads the five files in order) and by the whole suite at ship. Tests that read the moved rules as one file had them grouped (one touch-screen block, the cards' and the full ticket's selectors in one list) read them from the five files instead: 0160, 0281, 0417, 0427, 0430, 0455 and 0465.
- Pictures: none, because nothing anyone sees changes (AC3's test compares every element's computed style).

## In plain words
Nothing looks different: the panel is exactly as it was. Behind the scenes, its look is now kept in five parts, one for each area of the panel: the basics shared by everything, the header and tabs, the cards in the lanes, the pop-ups, and Settings. A change to how one area looks now touches only that area's part, so tickets changing different areas can be built side by side instead of waiting for each other. To see it, open the panel and use it as usual. If anything looks even slightly different from before, that's a fault in this change. An open panel page also still offers to reload when any of the five parts changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 423,337
- Elapsed since build started: 30 min
- Changed lines: 1814 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, none for the inbox):
- A few test comments still say the page "can't load /panel.css" (0379, pipeline 0415, 0416). They're only comments, and the tests read the five files through `styles()`.
- AC3's real-browser check adds about 20 seconds to the suite. It reads only the properties the styles set, and runs on one page load for every width, look and pointer.
- A repo that upgrades speck may keep an old `.speck/templates/panel.css` if the installer doesn't remove files that are gone. Nothing loads it, so it's harmless.

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
    "reviewed_sha": "f807b519fbfc65b1e8ee27ea469bfde5e8f3e3ac",
    "session": "fresh",
    "thread_id": "01a16e3e-3d45-7502-96cf-7e1f94402996",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0472.test.mjs test/panel-0430.test.mjs test/panel-0281.test.mjs test/panel-0160.test.mjs test/panel-0417.test.mjs test/panel-0427.test.mjs test/panel-0455.test.mjs test/panel-0465.test.mjs, plus every existing test file that names a changed file (2671 tests, 0 failing, 3 skipped by 0078 as always).\n- The split was made rule by rule, keeping each file's rules in their original order. A rule whose selector list spanned areas (for example `.q .track, …, #full-ticket .track`, Close in each pop-up and Settings, the 0428 corners, and the phone, touch screen and 0453 border media blocks) is split into one rule per area with the same declarations.\n- AC3 has two checks. The quick one: the five files hold exactly the rules (one per selector, with its media context) that panel.css had, read from git: panel.css from just before the commit that removed it, and the five files from that commit. The slow one: a real Chromium on a real panel, at 390 px (DPR 3) and 1200 px (DPR 1), mouse and touch, light and dark, across Plan, Build, Shipped, the full ticket, a review pack, a document, Settings (with an explanation and the unsaved question) and the Pipeline log. It compares every element's computed style, including ::before and ::after, under the old sheet and under the five split sheets. It reads every property either set declares, as longhands plus custom properties. Headless Chromium never matches `(hover: hover)`, so the test rewrites that query the same way in both sets: true for the mouse runs and false for the touch runs. I checked that it fails when one rule is moved out of order (`.item.ticket, .q { padding }` moved to the top of panel-cards.css: it names the card and its padding).\n- AC4: tests that read the moved rules now read them from the five files. `styles()` in test/support/panel.mjs joins them in load order. 0430's and 0281's file reads, plus 0160, 0417, 0427, 0455 and 0465, assumed the old grouping (one touch-screen block, the cards' and the full ticket's selectors in one list). Each still checks the same thing against the split rules.\n- scripts/panel.mjs was already at 0078's 600-line limit, so the list of style files sits on the line that names the page's files.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 422543,
      "cached_input_tokens": 310656,
      "cache_write_input_tokens": 0,
      "output_tokens": 794,
      "reasoning_output_tokens": 47
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T14:09:29.637Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Reviewed all five templates/panel-*.css files: rules are assigned to the specified areas, with shared selectors separated by area. panel.css is deleted. The passing 0472 rule-inventory test confirms every original selector and declaration remains exactly once."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html loads all five files with base first. scripts/panel.mjs panelServer serves each afresh and includes all five in stampOf. Passing 0472 tests exercise each route and changed stamp; passing foreman-0285 tests cover the stale-page message and reload offer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing real-browser test in test/panel-0472.test.mjs compares original and split styles across 390 px and 1200 px widths, both looks, mouse and touch, and the panel's principal views, including pseudo-elements. Its baseline comes from the commit before panel.css was removed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0472-tests.txt: 2668 passed, zero failed and three skipped. Changes to existing tests preserve their checks while accommodating separate files and selector groups. The whole-suite check remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s styles are now separated into five files by area. The server loads and tracks changes to each file, and browser comparisons confirm the appearance is unchanged across the required screen sizes, looks and input types. The relevant tests pass, with no blocking concerns found."
  }
}
```

</details>
