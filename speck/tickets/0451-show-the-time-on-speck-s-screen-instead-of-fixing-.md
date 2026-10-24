---
id: "0451"
title: "Show the time on speck's screen instead of Fixing on"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0446"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:22:50.644Z"
approved: "2026-10-24T08:31:34.554Z"

---
# 0451 · Show the time on speck's screen instead of Fixing on

**Status:** 👍 approved

## Problem
The top right of speck's screen shows `FIXING ON` while `foreman_fixing` is `fix`. It's a setting's name rather than anything happening, and it confuses more than it tells.

## Outcome
The top right of speck's screen shows the time, like a handheld's clock.

## Acceptance criteria
1. The top right of speck's screen shows the time on this computer as `HH:MM` in the 24-hour clock, in the screen's dot font, with its colon blinking once a second. `FIXING ON` no longer shows anywhere on the screen.
2. With reduced motion on, the colon doesn't blink.
3. The screen's accessible name no longer mentions fixing. Whether fixing is on still shows in Settings and in the pipeline log's Right now, as today.

## Out of scope
- What speck does on the screen (0414, 0436, 0446).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- The user asked on 2026-10-24 for that space to show something else. The clock follows the design's handheld (`handheld()` in `templates/lcd.js`).
- Today: `drawScreen(word, fixing)` in `templates/panel.js`.
- Waits for 0446: both change speck's screen in `templates/panel.js`.
- Failing before this build: none
- "Blinking once a second": the colon shows for the first half of each second and is off for the second half, so it blinks every second. The design's handheld swaps it every other second instead.
- The top row's word now has room up to 6 dots left of the clock, so a long word is cut and scrolls there rather than at the screen's edge.
- Self-check: a docs test pinned the brief's wording of the clock, which the docs rule (0267) refuses; it now checks only that "Fixing on" is gone from the README and the brief.

## In plain words
The top right of speck's screen now shows the time, like a handheld's clock, instead of "FIXING ON". The colon between the hours and minutes blinks every second, or stays still if your computer is set to reduce motion. Whether the Foreman is fixing things itself still shows in Settings and in the pipeline's Right now.

To see it, open the panel and look at the top right of the screen. Worth a look: a long status word now has a little less room before it is cut short and starts scrolling.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 169,429
- Elapsed since build started: 9 min
- Changed lines: 27 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. The inbox idea `speck/ideas/2026-10-22-fit-the-foreman-s-button-on-a-phone-with-fixing-on.md` no longer applies now that "Fixing on" has left the screen, and could be dropped at triage.

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
    "reviewed_sha": "bfa1b84970a674d053509fd7952f8497ae007943",
    "session": "fresh",
    "thread_id": "01a16d08-954e-7761-b562-38d8b4f38db0",
    "builder_response": "- Tests run: test/panel-0451.test.mjs test/panel-0413.test.mjs test/foreman-0317.test.mjs test/foreman-0285.test.mjs test/docs-0267.test.mjs, with --related (every test file naming a changed file, and the checks)\n- Changed existing tests: 0413's long-word test now cuts the word before the clock, 0413's \"FIXING ON\" test is now the inverse, 0317 AC1 and 0285's label helper no longer expect \", fixing on\" in the screen's name. test/support/screen.mjs splits the top row into the word's dots and the clock's.\n- Pictures of the screen in the light and dark looks are in the review pack.\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 168756,
      "cached_input_tokens": 132608,
      "cache_write_input_tokens": 0,
      "output_tokens": 673,
      "reasoning_output_tokens": 40
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:31:26.246Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js screenFrame() draws local hours and minutes using the LCD F5 dot font, right aligned, with the colon visible for milliseconds 0–499. It reserves space before the clock for scrolling status text and removes FIXING ON. Passing tests in test/panel-0451.test.mjs check time formatting, blink boundaries, fixing settings and scrolling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "screenFrame() keeps the colon visible when reduced motion applies. The passing '0451 AC2' test exercises the page's reduced-motion preference across both halves of a second. The real LCD Screen continues drawing frames, so the time still updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.js render() sets the accessible name to the Foreman's status alone. The passing '0451 AC3' test checks that name across fixing settings, opens the pipeline detail and verifies its fixing information, and checks that Settings retains foreman_fixing. Existing fixing behaviour remains unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The screen now shows the computer's local time with a blinking colon, which stays steady with reduced motion. Fixing information remains available in Settings and the pipeline detail. The tests exercise the clock's actual rendered dots, and the reported run has no failures. No blocking concerns found."
  }
}
```

</details>
