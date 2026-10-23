---
id: "0430"
title: "Serve the panel's styles from a file of their own"                # one outcome, no "and"
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
after: ["0428", "0429", "0434", "0435", "0436", "0438"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T22:25:05.525Z"

---
# 0430 · Serve the panel's styles from a file of their own

**Status:** 🔍 reviewing

## Problem
`templates/panel.html` holds the panel's markup, about 630 lines of styles and 3,700 lines of script in one 4,400-line file. Every panel ticket changes it, so they can't build side by side without clashing, and agents work through the whole file for every change.

## Outcome
The panel's styles are in a file of their own.

## Acceptance criteria
1. The panel's styles are in `templates/panel.css`, and `panel.html` has no `<style>` element: it loads the styles from `/panel.css`.
2. the panel's server answers `GET /panel.css` with the file as `text/css`, read afresh on each request as the page is. A page loaded before the file changed says it's out of date and offers to reload, as one does today when `panel.html` changes. A request for any other path, such as `/panel.html` or `/panel.css/../x`, gets the answer an unknown path gets today.
3. No test that passed before this change fails, except tests that read the moved code from `panel.html`, which read it from the new file instead.

## Out of scope
- Changing any style.
- The script (0431 to 0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min).
- Part of splitting `templates/panel.html` (4,414 lines, 315 KB on 2026-10-23) into files by area, so panel tickets in different areas can build side by side and agents work with smaller files: 0430 styles, 0431 the model, 0432 Settings, 0433 the rest. No change to what the panel does or how it looks.
- Install and update copy the whole `templates/` folder (`place` in `scripts/`), so a new file there reaches projects with no change.
- The page's stamp (`stampOf` in `scripts/panel.mjs`) is worked out from `panel.html` alone today. `/lcd.js` and `/fonts/Doto.ttf` show how the server names each file it serves.
- Failing before this build: none
- Self-check: six tests that checked a style was gone by looking for it in panel.html now look in panel.css too, so they can't pass just because the styles moved; and two browser tests that open panel.html from its file, where /panel.css can't load, put the styles in from panel.css.
- Waits for 0428, as 0426 to 0428 restyle the whole page and this moves every style, and for 0429, as both may change the same test files. Also waits for 0434 and 0435, which change the cards' styles, and 0436 and 0438, which change speck's screen.

## In plain words
Nothing looks or works differently: the panel's look now lives in a file of its own instead of inside the page, so changes to the look and changes to the page no longer clash when built side by side. To see it, open the panel as usual: it should look exactly as before. If you edit the look while a panel is open, it offers to reload, as it does when the page changes. Worth a look: if the panel ever shows up unstyled, the new file is missing from that copy of speck.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "5ef8ec4f2e3090732b05be6704d28c910f5efc3d",
    "session": "fresh",
    "thread_id": "01a16ae8-0dac-7b12-9932-3a71c51af75a",
    "builder_response": "- Tests run (with --related, which also brought in every existing test file naming a changed file): test/fix-0100.test.mjs test/mockup-0126.test.mjs test/pack-0362.test.mjs test/pack-0363.test.mjs test/panel-0038.test.mjs test/panel-0039.test.mjs test/panel-0041.test.mjs test/panel-0051.test.mjs test/panel-0052.test.mjs test/panel-0055.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0136.test.mjs test/panel-0137.test.mjs test/panel-0138.test.mjs test/panel-0140.test.mjs test/panel-0141.test.mjs test/panel-0142.test.mjs test/panel-0143.test.mjs test/panel-0147.test.mjs test/panel-0154.test.mjs test/panel-0156.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0163.test.mjs test/panel-0164.test.mjs test/panel-0168.test.mjs test/panel-0185.test.mjs test/panel-0199.test.mjs test/panel-0213.test.mjs test/panel-0281.test.mjs test/panel-0302.test.mjs test/panel-0304.test.mjs test/panel-0308.test.mjs test/panel-0364.test.mjs test/panel-0366.test.mjs test/panel-0368.test.mjs test/panel-0371.test.mjs test/panel-0372.test.mjs test/panel-0379.test.mjs test/panel-0385.test.mjs test/panel-0413.test.mjs test/panel-0416.test.mjs test/panel-0417.test.mjs test/panel-0422.test.mjs test/panel-0423.test.mjs test/panel-0424.test.mjs test/panel-0425.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0430.test.mjs test/panel-0434.test.mjs test/panel-0435.test.mjs test/panel.test.mjs test/pipeline-0415.test.mjs test/settings-info-0405.test.mjs test/type-0049.test.mjs \n- The styles moved verbatim: templates/panel.css is exactly the old <style> element's contents, so its indentation is unchanged.\n- scripts/panel.mjs stays at its 600-line limit (test/split-0078), so /panel.css shares the /lcd.js route rather than getting its own block.\n- Tests changed under AC3 read the styles from panel.css (the styles() helper in test/support/panel.mjs). Two browser tests (0379, 0415) open panel.html from its file, where /panel.css can't load, so they put the styles in from panel.css. Six tests that checked a style is gone (0156, 0163, 0168, 0199, 0304, 0427) now also look in panel.css, so moving the styles can't make them pass vacuously.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 313778,
      "cached_input_tokens": 206592,
      "cache_write_input_tokens": 0,
      "output_tokens": 753,
      "reasoning_output_tokens": 23
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:36:16.618Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css exactly matches the former style element's contents. templates/panel.html otherwise remains identical and links to /panel.css. The passing '0430 AC1' test checks the file, link and absence of a style element."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelServer serves the exact /panel.css path as text/css, reads it on each request and includes its contents in stampOf. The passing '0430 AC2' tests exercise fresh reads, changed page stamps, unknown paths and missing-file handling. The existing pageStale and Reload page control consume that stamp; test/foreman-0285.test.mjs covers the reload prompt."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded run in /tmp/speck-0430-tests.txt reports 2,567 passes, zero failures and three skips. Changed tests retain their assertions while reading panel.css; absence checks include the moved styles, and file-based browser tests explicitly load them. No styles or page scripts changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel's styles now load from their own file without changing its appearance. Changes to that file trigger the existing reload prompt, and unknown paths remain rejected. The relevant tests pass, with no blocking concerns found."
  }
}
```

</details>
