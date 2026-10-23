---
id: "0409"
title: "Drop the full-view Settings loading state"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-drop-the-full-view-settings-loading-state.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0408"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T13:14:24.426Z"
approved: "2026-10-23T13:19:08.908Z"
finished: "2026-10-23T13:22:07.558Z"

---
# 0409 · Drop the full-view Settings loading state

**Status:** ✅ done

## Problem
Opening Settings still shows "Loading the settings…" over the whole view, then "Loading your agents…" once the config has arrived. 0407 was meant to end the first wait; two loading phases are left.

## Outcome
Settings never shows the full-view "Loading the settings…" message. Only the in-place agent and model loading remains.

## Acceptance criteria
1. Opening Settings never shows the words "Loading the settings…" (or any other full-view loading line that replaces the groups). The settings groups and their values from config appear as the first paint of the open view.
2. While agent checks and model lists are still loading, Your agents and each role's model list still say so in place, as 0407 does ("Loading your agents…", and loading on the role lists). When those arrive, they fill in without closing Settings, clearing edits, or jumping scroll or focus.
3. After a Save that reloads Settings, the groups stay visible with the last catalogues while they refresh; the full-view loading line does not return. No test that passed before this change fails, except a check that opens Settings into a full-view loading state, which is changed to check criterion 1.

## Out of scope
- Making the agent CLIs faster.
- Changing what Your agents or the role lists show once loaded.

## Notes
- Asked for 2026-10-23 after 0407: the quick config path works, but `openSettings` in `templates/panel.html` still sets `settingsView = { state: 'loading' }` and `renderSettings` draws "Loading the settings…" before `/api/settings?quick=1` returns.
- Prefetching the quick answer when the panel starts is fine as how, so long as criterion 1 holds.
- Waits for 0408: both change Settings in `templates/panel.html`.
- Failing before this build: none
- How: a press on Settings now opens it once the quick config answer is back (the button is `aria-busy` meanwhile), so its first paint has the groups; a second press while it's opening is ignored. The `loading` state and its line are gone. Three older checks opened Settings into that state (0257's self-check, 0285 AC3, 0396 AC1) and are changed to check the new opening, as criterion 3 allows.
- Self-check: no changes (Escape and clicks outside are already ignored while Settings is opening; a failed read opens onto why).
- Pictures: none, because the open view looks as before: only the loading frame before it is gone, which a picture can't show.

## In plain words
Settings no longer flashes a "Loading the settings…" screen. When you press Settings, it opens straight onto all its groups with your values filled in. Your agents and each role's model list still say they're loading in place, and fill in when the agents answer, without moving anything. To see it, press Settings in the panel: the first thing you see is the settings themselves. Worth knowing: the view now opens a moment after the press, once the config has been read, which is usually too quick to notice. If the panel couldn't answer at all, pressing Settings would seem to do nothing until it does.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 139,328
- Elapsed since build started: 5 min
- Changed lines: 21 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. Known limit: while the quick config read is out, the only sign of the press is `aria-busy` on the Settings button; a slow or hung panel would make the press look ignored.

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
    "reviewed_sha": "5f661511ae0dac60b9dddc4a530fb6b11cd8fbc5",
    "session": "fresh",
    "thread_id": "01a168e9-c10a-75b0-a832-99adc9eee79e",
    "builder_response": "- Tests run: test/settings-0409.test.mjs test/settings-0407.test.mjs test/panel-0257.test.mjs test/settings-0396.test.mjs test/foreman-0285.test.mjs\n- Round 1. Settings now opens once GET /api/settings?quick=1 has answered, so the first paint is the groups (or the read's error), never \"Loading the settings…\". The button is aria-busy meanwhile, and a second press while opening is ignored.\n- Three existing checks opened Settings into the removed full-view loading state, so criterion 3 lets them change: 0257's self-check (now: a press while opening reads once, and the answer is drawn as it came), 0285 AC3 (the settings answer is given rather than left pending) and 0396 AC1 (the rows first when the settings fail to load; while loading the view isn't open yet).\n- I also ran every test file that opens Settings (56 files) before this change to the three checks: only those three failed.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 138748,
      "cached_input_tokens": 96512,
      "cache_write_input_tokens": 0,
      "output_tokens": 580,
      "reasoning_output_tokens": 35
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T13:18:57.755Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: openSettings waits for the quick response before loadSettings opens and renders the view. The full-view loading branch is removed. Passing 0409 AC1 tests cover the first paint, repeated presses and read errors."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0409 AC2 and existing 0407 AC2 tests exercise in-place loading for Your agents and all three role lists, then verify that catalogue updates preserve edits, scroll, controls and keyboard focus."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "loadSettings retains the current view during refresh and copies the last catalogues into the quick response. Passing 0409 AC3 tests cover Save refreshes. The recorded run has 161 passes, zero failures and three skips; the three adjusted older checks depended on the removed loading state."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now opens directly onto its groups and config values. Agent and model loading stays within the view, and saving keeps the previous lists visible during refresh. The tests support the requested behaviour, with no blocking concerns found."
  }
}
```

</details>
