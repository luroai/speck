---
id: "0372"
title: "Move the light/dark control into Settings"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-give-the-header-s-notice-board-more-room.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0371"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T21:53:21.042Z"
approved: "2026-10-22T22:12:50.742Z"
finished: "2026-10-22T22:15:10.088Z"

---
# 0372 · Move the light/dark control into Settings

**Status:** ✅ done

## Problem
The header carries a light/dark button beside Settings. On a narrow pane that button takes space the Foreman's notice board needs.

## Outcome
Light and dark are chosen from a row in Settings, and the header no longer has that button.

## Acceptance criteria
1. The header has no light/dark button at any width. Settings and the notice board stay.
2. The Settings view has a row for the look, offering light and dark. Choosing one switches the panel the way the header button does today, in both looks, and the choice is the one the page shows.
3. The choice is remembered in this browser and applied the next time the page loads, as the header button's choice is today. It is not written to `speck/config.yml`, and Save neither commits it nor treats it as an unsaved change.
4. With the button gone, the notice board is wider by the space the button used. The header stays one row, nothing in it overlaps, and under 700 px every header button is still at least 44 px tall.
5. No test that passed before this change fails, except checks that the header has a light/dark button, which are changed to check criteria 1 and 2.

## Out of scope
- The speck word and the base branch in the header: 0373.
- How fast the notice board scrolls: 0374.
- Opening Settings as a pop-up: 0368.

## Notes
- Checked 2026-10-22: the button is `.theme` in the header of `templates/panel.html`. It toggles `data-theme` and stores `speck-theme` in `localStorage`. It is not one of the settings in `scripts/settings.mjs`.
- 0373 waits for this: it changes `templates/panel.html` too, as do 0368 to 0371. 0374 does not: it only changes the notice board's speed.
- Failing before this build: none
- The Look row is a row of its own (like speck run's in the Foreman group), not one of the file's `.setting` rows, so tests that list the file's settings still see only those. One existing check had to change beyond the header-button ones: 0257 AC5 ("the view has no control that changes a setting") now also exempts the look list, as it already exempted 0268's info buttons and 0285's speck run switch, since the look isn't a setting in speck/config.yml.
- AC4: the board takes the button's room wherever it was cut short; where it already shows in full (above 700 px it never shrinks), it has nothing more to show, and the extra room goes to the project's name.
- The build skill's note on taking pictures pointed at the panel's theme button; it now points at the look in Settings.
- Self-check: no changes

## In plain words
The moon and sun button has gone from the top of the panel. Light and dark are now chosen in Settings, in a new Look group at the bottom, and the panel switches as soon as you pick one. As before, the choice is remembered in this browser only: it isn't saved to the project and Save doesn't ask about it.

To see it, open Settings, scroll to Look and pick dark or light. On a phone or a narrow window, the Foreman's notice board at the top now has the button's room, so more of its message shows.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 532,794
- Elapsed since build started: 19 min
- Changed lines: 71 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups only, none to the inbox):
  - test/panel-0168.test.mjs still clicks `.theme` when it exists, falling back to setLook; the fallback is all that runs now, so the check for `.theme` could go.

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
    "reviewed_sha": "2f68d00d735d25a1274a86ba2f97bef7795197df",
    "thread_id": "01a165a7-d60a-7393-aaa2-4713e06189cd",
    "seconds": 23,
    "usage": {
      "input_tokens": 201272,
      "cached_input_tokens": 141184,
      "cache_write_input_tokens": 0,
      "output_tokens": 664,
      "reasoning_output_tokens": 76
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T22:08:03.041Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html removes the theme button and its CSS, retaining Settings and the notice board. Passing 0372 AC1 tests check this."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "lookGroup() offers light and dark; chooseLook() applies the selection. theme-start synchronises the list with the page. Passing 0372 and 0136 browser tests exercise switching both ways."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "chooseLook() stores speck-theme locally; theme-start restores it. The look is outside settingChanges() and Save's payload. Passing 0372 AC3 tests cover persistence, refused storage, no server request and no unsaved-change prompt."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0372 AC4 browser tests measure layout at 320, 375, 500, 699, 700 and 1200 px, checking gained board space, no overlap, one row and 44 px button heights below 700 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified recorded output: 456 passed, zero failed, three skipped. Changed existing checks accommodate the removed button. The 0257 exemption is appropriate because the browser-local look does not change a configuration setting."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Light and dark are now chosen in Settings and remembered in this browser without needing Save. Removing the header button gives the notice board more room on narrow screens. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f64a95885966dff41efeda9be0900a829864c76a",
    "merge": true,
    "thread_id": "01a165a7-d60a-7393-aaa2-4713e06189cd",
    "seconds": 16,
    "usage": {
      "input_tokens": 329692,
      "cached_input_tokens": 263680,
      "cache_write_input_tokens": 0,
      "output_tokens": 1166,
      "reasoning_output_tokens": 76
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T22:12:47.321Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains Settings and the notice board while removing the theme button and its CSS. The 0372 AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "lookGroup() displays light and dark and chooseLook() applies the selection. Passing 0372 and 0136 tests cover both directions and synchronisation with the page. The new regression test exercises opening Settings when the fake root lacks dataset."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "chooseLook() stores speck-theme in localStorage; theme-start restores it on load. Passing 0372 AC3 tests verify persistence and that the choice causes neither server requests nor unsaved configuration changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0372 AC4 browser tests cover widths from 320 to 1200 px, measuring recovered board space, one-row layout, no overlap and button heights of at least 44 px below 700 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0372-tests.txt: 515 passed, zero failed, three skipped. Previously failing 0368 tests now pass without being weakened; the production change safely handles a missing dataset."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change still meets all five criteria. The follow-up fixes a compatibility problem with existing Settings tests without changing normal browser behaviour. The expanded test run passes, and there are no blocking concerns."
  }
}
```

</details>
