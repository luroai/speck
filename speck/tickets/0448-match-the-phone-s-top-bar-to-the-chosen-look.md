---
id: "0448"
title: "Match the phone's top bar to the chosen look"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-13-match-the-phone-s-top-bar-to-the-panel-s-chosen-look.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:46:02.107Z"

---
# 0448 · Match the phone's top bar to the chosen look

**Status:** 🔍 reviewing

## Problem
When the panel runs as a home-screen app, the phone's top bar takes its colour from the page's `theme-color`, which follows only the phone's own light or dark setting. Choosing Light or Dark in Settings (0412) changes the panel but leaves the top bar in the other look.

## Outcome
The phone's top bar follows the look chosen in Settings.

## Acceptance criteria
1. With Light chosen in Settings, the page's `theme-color` is the light look's page colour (`#f3f3f3`), and with Dark the dark look's (`#141414`), whatever the phone's own setting. With System, it follows the phone's setting, as today.
2. Choosing another look in Settings changes the `theme-color` at once, without a reload, and a reload keeps it.
3. The home-screen app's status-bar style still follows the same look, as 0160 set.

## Out of scope
- The look itself (0412).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0149. The `theme-color` tags and the script that sets the look before the page is drawn are in `templates/panel.html`.
- Waits for nothing.
- Failing before this build: none
- Self-check: no changes
- Pictures: none, because the change is to the phone's own top bar when the panel runs as a home-screen app, which a desktop or headless browser doesn't draw; the panel itself looks the same.

## In plain words
When the panel runs as an app on your phone's home screen, the bar at the top of the phone now matches the look you chose in Settings. Pick Light or Dark and the bar changes straight away, and stays that way when you reopen the panel; leave it on System and it follows the phone, as before. To see it, open the panel from your home screen, switch the look in Settings and watch the top bar. Worth knowing: the two page colours are written in two places now, so if the light or dark background ever changes, the top bar's colour needs changing too.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-up, no idea note): the top bar's two colours are written in the <head> script as well as in the stylesheet's --bg, so a change to either background needs both. 0149's test checks the light one against --bg.

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
    "reviewed_sha": "38e38d9b48873fb68c04055166819af9587c20ff",
    "session": "fresh",
    "thread_id": "01a16ce3-f45a-7782-a461-1a4a16fe5c90",
    "builder_response": "- Tests run: `speck test --related test/panel-0448.test.mjs` (the ticket's own test file plus every existing test file naming templates/panel.html): 2492 tests, 0 failing.\n- The <head> script's `bar(look)` now also sets both theme-color tags to the look's page colour, so whichever tag's media matches the phone's setting shows the chosen look. The tags themselves stay in the HTML as they were (0149 and 0426 check them), so before the script runs, and without it, the phone still follows its own setting.\n- Pictures: none, because the phone's own top bar isn't drawn by a desktop or headless browser.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 157774,
      "cached_input_tokens": 118400,
      "cache_write_input_tokens": 0,
      "output_tokens": 609,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T07:51:14.111Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: bar() sets both theme-color tags from the resolved look; set() also runs on system preference changes. Passing test '0448 AC1' exercises Light, Dark and System against both phone settings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-settings.js: chooseLook() persists the choice and calls pickLook(); templates/panel.html applies it immediately through set()/bar(). Passing test '0448 AC2' checks immediate changes and reloads; existing settings-0412 tests exercise Settings selection and persistence."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: bar() retains the existing status-bar style assignment. Passing test '0448 AC3' verifies light, dark and system styles alongside theme-color."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The phone’s top-bar colour now follows the chosen look immediately and after reload, while preserving the existing status-bar style. The tests exercise the changed script, and the reported run has no failures. Actual phone chrome cannot be verified in these tests. No blocking concerns found."
  }
}
```

</details>
