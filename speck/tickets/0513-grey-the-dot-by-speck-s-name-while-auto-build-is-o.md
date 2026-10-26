---
id: "0513"
title: "Grey the dot by speck's name while Auto-build is off"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:30:39.377Z"
approved: "2026-10-26T10:39:25.022Z"

---
# 0513 · Grey the dot by speck's name while Auto-build is off

**Status:** 👍 approved

## Problem
The dot before "speck" in the header is speck's red whether or not `speck run` is on, so it looks live even when Auto-build is off and nothing will build. A red light that's always on says nothing.

## Outcome
The dot by speck's name is red while Auto-build is on and grey while it's off, like a power light.

## Acceptance criteria
1. While `speck run` is off (the screen's word is `Off`), the dot before "speck" in the header is grey, in the frame's muted colour (`--bezel-muted`), in the light and dark looks. While it's on, whatever the screen's word, the dot is red as today.
2. The dot changes within one refresh of the panel when Auto-build is turned on or off, from the Settings switch or from a terminal, without a reload. Checked in a real browser.
3. The dot's size and place, the needs-you edge on the frame (0413) and speck's red eye on the screen don't change. No test that passed before this change fails.

## Out of scope
- The browser tab's icon and the app icon.
- What the screen shows while Auto-build is off.

## Notes
- Asked for by the user on 2026-10-26: "When auto build is off, the red dot next to the speck title should be off too, maybe grey instead of red."
- Today: `.bezel .name::before` in `templates/panel-header.css` is `var(--lcd-red)` (0438). `drawHeader` in `templates/panel-header.js` sets the frame's class from the Foreman's word (`bezel needs`), which an off state can follow.
- Unchained from 0512, which changes the watching beats in `templates/panel-header.js`, not `drawHeader`.
- Failing before this build: none
- Self-check: added the grey dot's rule to 0161's list of backgrounds that hold no text, as 0438 did for the red one, after 0161 failed on it. A stale page whose run is off still greys the dot, as speck run is off; a server with no Foreman gives the word Off when run is off, so that greys it too.

## In plain words
The little dot before "speck" at the top of the panel now works like a power light: it's red while Auto-build is on and grey while it's off. To see it, turn Auto-build off in Settings (or stop `speck run` in a terminal) and the dot goes grey at the next refresh, with no reload; turn it back on and it's red again. Nothing else in the header moves or changes colour.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 185,225
- Elapsed since build started: 9 min
- Changed lines: 2 (limit 5000)
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
    "reviewed_sha": "646d6cc0e1d093d5045d4bbda0ca768e9f3a37e9",
    "session": "fresh",
    "thread_id": "01a177ca-79a7-7150-9f1a-4e945c70af3a",
    "builder_response": "- Tests run: test/panel-0513.test.mjs test/panel-0413.test.mjs test/panel-0438.test.mjs test/panel-0471.test.mjs test/panel-0161.test.mjs, plus the related files speck test --related chose (0417, 0433, 0469, 0472, 0473, 0474, 0477, 0481) and the commands.checks files.\n- The frame gets data-run=\"off\" when the Foreman's word is Off (on otherwise), so the frame's class stays exactly as 0413's tests expect; one CSS rule turns the dot to --bezel-muted under it.\n- 0161's list of backgrounds that hold no text gains the grey dot's selector, as 0438 added the red one.\n- AC2's browser test stubs the panel's event stream so each state change is exactly one refresh, and checks the page was not reloaded.\n- Pictures of the header, off and on, in both looks, are in the review pack.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 184409,
      "cached_input_tokens": 137472,
      "cache_write_input_tokens": 0,
      "output_tokens": 816,
      "reasoning_output_tokens": 137
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T10:39:18.240Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js drawHeader sets data-run from the Foreman's Off word; panel-header.css applies --bezel-muted only when off. Passing 0513 AC1 tests cover multiple on words; the passing browser test verifies computed colours in both themes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0513 AC2 real-browser test drives one simulated panel refresh per transition and checks grey/red colours without reloading in both themes. Settings and terminal changes feed the same refreshed state through panel.js render and drawHeader."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The new CSS rule changes background only. Passing 0513 AC3 and existing 0413, 0438 and 0471 tests cover dimensions, placement and the needs-you edge. Screen drawing and eye colours are unchanged. The recorded run has 180 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The title dot turns grey when Auto-build is off and returns to red when it is on, in both themes. Browser tests confirm updates without a reload. Its placement, the frame's attention edge and the screen remain unchanged. No blocking concerns found."
  }
}
```

</details>
