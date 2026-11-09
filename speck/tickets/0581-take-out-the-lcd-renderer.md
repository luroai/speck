---
id: "0581"
title: "Take out the LCD renderer"                # one outcome, no "and"
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
after: ["0580"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T20:00:43.274Z"
approved: "2026-11-09T20:15:53.268Z"

---
# 0581 · Take out the LCD renderer

**Status:** 👍 approved

## Problem
Once the black bar replaces the LCD screen (0580), the LCD's renderer, its poses and pastimes, its font and its tests are dead weight that every later change has to step round.

## Outcome
The LCD screen's code, font and tests are gone from the panel.

## Acceptance criteria
1. `templates/lcd.js` and the LCD's code in `templates/panel-header.js` (the screen's frame, speck's poses, pastimes and naps) are removed, the page no longer loads them, and the server no longer serves `lcd.js`.
2. The Doto font and its licence file are removed from `templates/fonts/`, and nothing refers to them.
3. Tests that checked only the LCD screen are removed, and the Delivery log lists each one and why. Tests of anything the bar still does are kept and pass.
4. The design record in `docs/design/lcd/` stays as it is.
5. No test that passed before this change fails.

## Out of scope
- The black bar itself (0580).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- LCD tests to look at include `test/panel-0413`, `panel-0414` (with `test/support/screen-speck.mjs`), `panel-0416`, `panel-0474`, `panel-0513`, `panel-0302` to `panel-0304`, `pipeline-0470`, `pipeline-0458` and `logo-0320`; keep any part that checks behaviour the bar keeps.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: found no further problems; `--lcd-red` became `--speck-red` so that nothing named after the LCD is left in the panel's styles. `docs/brief.md` still mentions the LCD screen: ticket 0597 updates the docs.

## In plain words
Nothing looks different: the black bar took the old LCD screen's place in an earlier change, and this clears away what was left behind. The panel now loads less, as the screen's drawing code, speck's old animations and the dot-matrix font are gone.

To see it, open the panel: the bar, its status, the Pipeline log's red dot and the lane swipes all work as before.

Worth keeping an eye on: one timing test failed once on a very busy run and passed when run alone. It's unrelated to this change, and it's in the inbox as a follow-up. The design record of the LCD screen is kept as it was.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 526,810
- Elapsed since build started: 15 min
- Changed lines: 1471 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- To the inbox: `speck/ideas/2026-11-09-steady-0517-s-slide-timing-under-a-busy-run.md`, the one timing test that failed once under load.
- Tidy-up, not sent to the inbox: `foremanOf` in `templates/panel.js` still passes on the Foreman's `why` and `base`, which only the screen's captions read. `foremanView` and its tests still give them.

Tests removed because they checked only the LCD screen (AC3):

| Removed | Why |
|---|---|
| `panel-0302.test.mjs` | Serving the renderer and the screen's colour tokens. |
| `panel-0303.test.mjs` | The renderer's tile and mini builder, through a stand-in renderer; with no renderer they could only pass. That the header shows without it is in `panel-0581.test.mjs` AC5. |
| `panel-0304.test.mjs` | Serving Doto and its licence. Its check that no font comes from Google Fonts moved to `panel-0581.test.mjs` AC2. |
| `panel-0308.test.mjs` | The screen's shade and the renderer's hash. |
| `panel-0414.test.mjs` | speck's poses and captions on the screen. |
| `panel-0436.test.mjs` | speck's pastimes and naps. |
| `panel-0502.test.mjs` | The TVs speck watched on the screen. |
| `panel-0503.test.mjs` | speck's habits on the screen. |
| `panel-0504.test.mjs` | speck's comic moments on the screen. |
| `panel-0505.test.mjs` | speck's TV tricks on the screen. |
| `panel-0512.test.mjs` | The rhythm of those beats on the screen. |
| `support/screen.mjs`, `support/screen-speck.mjs`, `support/watch-rhythm.mjs` | Helpers for those tests. The two that the bar's tests still use, `foreman` and `state`, moved to `support/bar.mjs`. |

Tests removed from files that keep the rest:

| File | Removed | Kept |
|---|---|---|
| `panel-0413` | The word in the dot font, a long word scrolling, watch fix's word on the screen, and the screen's resize. | The bar's frame, needs-you edge, Settings, opening the log, Reload page, tooltip and the 320 px browser check. |
| `panel-0416` | The counts of what the renderer drew. | Every card check. |
| `panel-0446` | speck's events while the page was hidden (15 tests). | What the Foreman agent's board says. |
| `panel-0451` | The screen's clock and its blinking colon. | The button not mentioning fixing, and the brief's check. |
| `panel-0495` | speck's captions. | What the Foreman gives for the base branch and a wait. |
| `logo-0320` | The check on `templates/lcd.js` and the check that `panel-0302` and `panel-0308` pin the renderer. | The design record's pin. |
| `panel-0474`, `panel-0473`, `panel-0433`, `panel-0432`, `panel-0426`, `panel-0543`, `panel-0147`, `panel-0364`, `pipeline-0470`, `pipeline-0479` | Only the mentions of `lcd.js`, Doto, `--lcd-red` and the stand-in renderer. | All their tests. |

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
    "reviewed_sha": "4f8083fdf402b8e2852ddae0bad8cfd259117576",
    "session": "fresh",
    "thread_id": "01a1c1f3-0c27-7993-959f-08ba2d702044",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0581.test.mjs and every existing test file this change edits: 366 files chosen, 3323 tests, 3319 pass, 3 skipped, 1 failed.\n- The one failure, 0517 AC3 (test/panel-0517.test.mjs), is a 50 ms timing check in a real browser: \"58, 19, 22, 23, 21, 23 ms\" while 366 files ran together. It is not related to this change: run alone, the file passed 3 times out of 3 (11 tests each).\n- Which tests went and why is in the ticket's Delivery log (AC3).\n- `--lcd-red` is renamed `--speck-red`, with the same two values, as the Pipeline log's dot still uses it. The other four `--lcd-*` colours were only the screen's.\n- `docs/brief.md` line 215 still mentions the LCD screen: ticket 0597 updates the docs for the new panel, so it's left alone here.\n- No pictures: nothing anyone sees changes, as 0580 already took the screen off the page.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 526051,
      "cached_input_tokens": 385920,
      "cache_write_input_tokens": 0,
      "output_tokens": 759,
      "reasoning_output_tokens": 37
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 140131,
      "cached": 385920,
      "write": 0,
      "output": 759
    },
    "cost_usd": 0.326444,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-09T20:15:30.695Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/lcd.js is deleted; panel-header.js removes the screen, poses and pastime machinery; panel.html and scripts/panel.mjs remove loading and serving it. Four corresponding AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Doto.ttf and OFL.txt are deleted; panel-base.css removes the font face and scripts/panel.mjs removes its route. AC2's file and live-reference checks pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Delivery log records removed LCD tests and reasons. Retained card, bar, Settings, log and server checks remain; the reported run passes those tests. Removed assertions concern the retired renderer."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "git diff main...HEAD -- docs/design/lcd is empty. The passing AC4 test also verifies the design files remain and have no uncommitted changes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The run reports 3319 passes and one browser timing failure. Inspection of panel-0517.test.mjs shows that failure measures machine-dependent frame latency; the slide implementation is unchanged. The builder reports three successful isolated reruns. No functional regression is evident."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The obsolete LCD code, font and dedicated tests are removed, while the black bar and its retained checks remain intact. The design archive is unchanged. One timing test failed under concurrent load; the unchanged slide code and reported successful reruns support treating it as intermittent. No blocking issues found."
  }
}
```

</details>
