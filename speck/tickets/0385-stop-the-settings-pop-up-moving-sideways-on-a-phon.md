---
id: "0385"
title: "Stop the Settings pop-up moving sideways on a phone"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0382"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:51:47.077Z"

---
# 0385 · Stop the Settings pop-up moving sideways on a phone

**Status:** 🔍 reviewing

## Problem
Since 0368 opened Settings in a full-window pop-up, the pop-up can be dragged left and right on a phone. A sideways swipe while scrolling the settings shifts the whole view, which feels broken and makes the column wobble under your thumb.

## Outcome
On a phone, the Settings pop-up only scrolls up and down.

## Acceptance criteria
1. On a window 320 to 430 px wide, the Settings pop-up never scrolls or moves sideways. Its sideways scroll position stays at 0 whatever is done to it, including a sideways swipe or drag anywhere in it and an attempt to scroll it sideways from script. Scrolling up and down, and pinch-zoom, work as today.
2. At 320, 360, 390 and 430 px wide, in both looks, nothing in the Settings pop-up is wider than the window or cut off at its right edge. This holds with Settings at rest and with any one setting's explanation open: long text wraps inside the column.
3. At 900 px wide and over, the Settings pop-up looks and behaves as today.
4. No test that passed before this change fails.

## Out of scope
- The document and Foreman pop-ups, unless they turn out to move sideways the same way. If they do, that's a ticket of its own.
- Keeping Close in view while the settings scroll: 0379.

## Notes
- Checked 2026-10-22: `#settings` in `templates/panel.html` sets `overflow-y: auto` and no `overflow-x`, so the browser treats its `overflow-x` as `auto` too. That lets a phone pan the pop-up sideways when its contents are even a fraction of a pixel wider than it.
- Checked 2026-10-22: in desktop Chromium at 320, 360 and 390 px wide, the live panel's Settings had nothing wider than the window (its `scrollWidth` equalled its `clientWidth`), at rest and with each of the 18 explanations opened in turn. So the movement shows on a phone's touch scrolling, not as a visibly too-wide element in a desktop browser.
- Checked 2026-10-22: which phone and browser the user saw it on can't be checked from here, and no real device is to hand. The fix doesn't depend on it: it stops sideways scrolling in CSS that every mobile browser follows.
- A bug in 0368, which shipped in the run-up to 0.13.0. Waits for 0382 (which waits for 0381): all three change `templates/panel.html`.
- Failing before this build: none
- Self-check: no changes. Checked by hand that the tests catch the bug: with the old page all three fail, without the new CSS a real touch swipe still moved it 16 px sideways, and without the scroll guard a sideways scroll from script stayed. Round 1 replaced the scroll guard with clipping on the column, and without that clipping a scroll from script still moves it.
- Pictures: none, because nothing looks different: the pop-up only stops moving sideways. Its look at every width is unchanged.

## In plain words
On a phone, Settings now only scrolls up and down. A sideways swipe while you scroll through the settings no longer shifts the whole view, so the column stays put under your thumb. Pinch-zoom still works, and on a wider screen Settings looks and behaves as before.

To see it, open the panel on a phone, open Settings and swipe sideways anywhere in it: nothing moves.

Worth keeping an eye on: anything that ever turns out wider than the settings column is now cut off at its edge rather than letting the view slide, so a too-wide control would show as clipped instead.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: the 16 px clip margin that keeps focus rings and shadows visible beside the column relies on `overflow-clip-margin`. A browser without it clips them at the column's edge (the Save button's focus ring, for example). Not checked on a real phone.
- Follow-ups: none for the inbox.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8dbfbabc4bfaf29e724513c76577841d68b4f64f",
    "thread_id": "01a165d5-90ac-7570-83a9-781732a3d692",
    "seconds": 27,
    "usage": {
      "input_tokens": 92673,
      "cached_input_tokens": 54912,
      "cache_write_input_tokens": 0,
      "output_tokens": 826,
      "reasoning_output_tokens": 110
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T22:58:04.607Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html: #settings uses overflow-x: hidden, which permits scripted horizontal scrolling. Its scroll listener resets scrollLeft only after scrolling occurs. test/panel-0385.test.mjs waits for the position to return to zero, so it verifies recovery rather than the required position staying at zero. Touch scrolling and vertical scrolling have real-browser coverage."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing real-browser test in test/panel-0385.test.mjs measures visible elements and scroll widths at all four specified widths, in both themes, at rest and with each explanation opened."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing real-browser test checks the existing centred 760 px column and vertical scrolling at 900 and 1280 px. The implementation leaves the column layout unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded run includes panel-0385.test.mjs, panel-0368.test.mjs and configured checks: 126 passed, zero failed, three skipped. The implementation is confined to Settings."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:1973",
        "issue": "Scripted scrolling can still set a non-zero horizontal position until the asynchronous scroll event resets it. This does not meet the explicit requirement that the position stays at zero whatever is done from script. The browser test allows this deviation by waiting for recovery.",
        "suggested_fix": "Prevent horizontal scrolling structurally, for example by separating the horizontal clipping container from the vertical scrolling container. Add a browser assertion that reads scrollLeft immediately after each scripted scroll attempt, with overflowing content present.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change stops sideways touch gestures and preserves the tested phone and desktop layouts. Scripted scrolling can still move Settings sideways briefly before it is reset, so the strict requirement to keep its sideways position at zero is not yet met."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "151a8a7c3aa3a96df912bc2ccf50d10f96880c5a",
    "thread_id": "01a165d5-90ac-7570-83a9-781732a3d692",
    "seconds": 17,
    "usage": {
      "input_tokens": 179760,
      "cached_input_tokens": 134016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1407,
      "reasoning_output_tokens": 110
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T22:59:41.753Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html clips horizontal overflow on #settings > * and restricts touch panning to vertical movement while permitting pinch-zoom. The passing browser test in test/panel-0385.test.mjs immediately reads zero horizontal position after four scripted scroll attempts with oversized content present, tests sideways touch and mouse gestures, and verifies vertical touch scrolling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing browser test measures element boundaries and scroll widths at 320, 360, 390 and 430 px, in both themes, at rest and with each explanation opened."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing browser test verifies the centred 760 px column, vertical scrolling and absence of overflowing elements at 900 and 1280 px. Existing column dimensions remain unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded run covers panel-0385.test.mjs, panel-0368.test.mjs, panel-0371.test.mjs and configured checks: 135 passed, zero failed and three skipped. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The previous implementation allowed scripted horizontal movement before resetting it.",
        "suggested_fix": "Implemented: structural clipping removes horizontal scrollable overflow, and the browser test now checks the position immediately after each scripted attempt.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Settings now prevents sideways movement, including scripted scrolling, while preserving vertical scrolling and the tested phone and desktop layouts. The previous blocking issue is resolved and all acceptance criteria pass."
  }
}
```

</details>
