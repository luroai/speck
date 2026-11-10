---
id: "0597"
title: Bring the docs up to date with the new panel                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0581","0582","0587","0588","0590","0592","0593","0594","0596"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T23:57:45.071Z"
approved: "2026-11-10T00:02:37.494Z"

---
# 0597 · Bring the docs up to date with the new panel

**Status:** 👍 approved

## Problem
After the redesign, the brief's long `speck panel` row and the README's demo pictures still describe and show the LCD panel.

## Outcome
The docs and the README's pictures describe and show the redesigned panel.

## Acceptance criteria
1. `docs/brief.md`'s `speck panel` row describes the redesigned panel: the black bar with speck, the tabs, the compact rows, the full view, Decided for you, the Pipeline log view, the Settings view and the bridge, and no longer describes the LCD screen.
2. The README's demo pictures, `docs/images/demo-light.png` and `docs/images/demo-dark.png`, are taken again from the redesigned panel, in each look.
3. The README describes the panel as it now is (checked by review).
4. `docs/brief.md` names no file, function or setting the redesign removed, such as `lcd.js` or Doto.
5. No test that passed before this change fails.

## Out of scope
- The landing page, which lives in its own repo.
- The changelog and release notes (0598).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- The `speck panel` row is one table row of several thousand characters at about line 203 of `docs/brief.md`; it may be split into a section of its own if that reads better.
- Relies on nothing outside this repo.
- Failing before this build: none
- Pictures taken from a copy of the demo outside the repo (as 0456's), its server updated to serve the panel's Inter and JetBrains Mono fonts and the new page's fields, with a made-up board: a 430 px pane at 2×, 1440 × 900.
- Self-check: named `speck_name` in the Settings sentence instead of "its name setting"; checked each claim in the row against the page's scripts.

## In plain words
The README and the full design document now describe the redesigned panel: the black bar with speck, the tabs, the short rows, a ticket's full view, Decided for you, the Pipeline log, Settings and the bridge. The old screen is no longer mentioned in them. The README's two demo pictures, light and dark, are new and show the current panel beside an agent chat, with made-up tickets.

To see it, open the README on GitHub and switch your computer between light and dark, or look at the pictures in this review pack.

Worth keeping an eye on: the pictures are a moment in time, so a later change to the panel's look would need them taken again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 174,995
- Elapsed since build started: 5 min
- Changed lines: 15 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none for the inbox. Known limit: the demo that makes the README's pictures lives outside this repo and wasn't changed; the copy updated for the new panel was used in a temporary folder only, so the next retake needs the same small changes (serve the panel's woff2 fonts, fill in the page's `{{panel}}`).

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
    "reviewed_sha": "0d4a0a90376f5bf769e2fac1b5691909dce39f2f",
    "session": "fresh",
    "thread_id": "01a1c2c2-da78-7c53-a78e-641d822d7242",
    "builder_response": "- Tests run: `speck test --related test/docs-0597.test.mjs test/readme-0456.test.mjs test/readme-0306.test.mjs test/readme-0249.test.mjs` (the ticket's tests, the picture tests, and every test naming a changed file: 1172 passed, 0 failed, 3 skipped).\n- Pictures: `docs/images/demo-light.png` and `demo-dark.png` are 2880 × 1800 (1440 × 900 at 2×), the panel in a 430 CSS px pane beside a generic mock agent app, the real panel page with a made-up board, served by a copy of 0456's demo outside the repo. Please open both for AC2.\n- AC1: the row stays one table row, as existing tests find `| \\`speck panel` and read Capture, the star and the settings from it. AC3 is README wording, including the alt text.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 174144,
      "cached_input_tokens": 119168,
      "cache_write_input_tokens": 0,
      "output_tokens": 851,
      "reasoning_output_tokens": 58
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54976,
      "cached": 119168,
      "write": 0,
      "output": 851
    },
    "cost_usd": 0.1303788,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T00:02:27.479Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "docs/brief.md's speck panel row covers every requested redesigned view and removes the LCD description. The two AC1 tests passed; descriptions agree with templates/panel-header.js and templates/panel-popups.js."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Opened both demo PNGs: each shows the redesigned black bar, decision strip, tabs and compact Build rows, in the appropriate light or dark look. The AC2 image checks passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md's The panel section accurately describes the bar, tabs, full ticket view, Decided for you, bridge and Settings. Its updated alt text matches the pictures."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test passed, checking removed names and referenced template files. A separate search found no LCD, Doto, lcd.js or dot-matrix references in docs/brief.md."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded related-test run reports 1172 passed, zero failed and three skipped. Changes are confined to the requested docs, pictures, ticket record and new documentation tests; existing tests were not weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The docs and both demo pictures now reflect the redesigned panel. The descriptions match the implementation, the relevant tests passed, and no blocking issues were found."
  }
}
```

</details>
