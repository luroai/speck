---
id: "0371"
title: "Float a setting's explanation over its row"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high-fast       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0370"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T21:33:36.430Z"
approved: "2026-10-22T21:50:19.201Z"
finished: "2026-10-22T21:53:04.202Z"

---
# 0371 · Float a setting's explanation over its row

**Status:** ✅ done

## Problem
The "i" beside a setting shows its explanation under the row as soon as the pointer is over it, which pushes every setting below it down.

## Outcome
The explanation floats over the top of its setting, after the pointer has rested on the "i" or the "i" is clicked, and the rows don't move.

## Acceptance criteria
1. Showing a setting's explanation doesn't move any setting. It floats above that setting's row, over whatever is behind it, and stays inside the Settings view.
2. The explanation appears once the pointer has stayed on the info button for half a second, and not before. Moving the pointer off before that shows nothing. Moving it off afterwards hides the explanation, unless a click is keeping it open.
3. Clicking the info button shows the explanation at once and keeps it until that button is clicked again or another setting's explanation is opened. Keyboard focus on the info button still shows it at once, as 0268 does. Escape hides an open explanation and leaves Settings open.
4. A screen reader still reads the explanation with the info button. The explanation stays inside the Settings view at the panel's narrowest width.
5. No test that passed before this change fails, except checks that the explanation sits under the setting or appears the moment the pointer enters, which are changed to check criteria 1 and 2.

## Out of scope
- The wording of the explanations.
- Tag tooltips elsewhere on the panel (0165).
- Opening Settings as a pop-up, the model lists, and keeping the view still: 0368, 0369 and 0370.

## Notes
- Checked 2026-10-22: `#settings .setting p.explain` sits in the flow under the row (`templates/panel.html`), and `settingInfo` shows it on pointer entry with no pause (0268).
- Half a second is the pause asked for as "a while". Keyboard focus still shows the explanation at once, so 0268's keyboard behaviour stays.
- Failing before this build: none
- Self-check: a pause cut short by moving off, or by moving on to another info button, shows nothing when it ends (tested); Escape or closing Settings during a pause shows nothing later, as closing clears the hovered setting.

## In plain words
A setting's explanation in Settings now floats in a box just above its setting instead of opening underneath it, so the other settings stay where they are. Resting the pointer on the "i" for half a second shows it; clicking the "i", or reaching it with the keyboard, shows it straight away, and Escape hides it. To see it, open Settings and rest the pointer on any "i". A setting at the very top of the view shows its explanation just below it instead, so it isn't cut off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (cursor): changes requested: F1 Moving the pointer onto an info button starts a half-second timer.
Round 2 (cursor): approve.

## Delivery log
- Review rounds: 2
- Reviewer: cursor, model grok-4.7-high-fast, effort default
- Reviewer tokens: 0
- Elapsed since build started: 17 min
- Changed lines: 34 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: whether an explanation goes above or below its row is decided when it opens, not again if Settings is scrolled while it's open.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · cursor · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "cursor",
    "reviewer_model": "grok-4.7-high-fast",
    "reviewer_effort": "default",
    "reviewed_sha": "a5e294dc6835bd56361742702ed35a6c861d6875",
    "session": "fresh",
    "thread_id": "6206b8e6-c638-48df-9c6e-57831449411d",
    "builder_response": "- Tests run: test/panel-0371.test.mjs test/panel-0268.test.mjs (plus the commands.checks files, which speck test --files runs itself)\n- AC5: 0268's tests that hovered and expected the explanation at once now rest the pointer for the half-second pause first (a `hover` helper); nothing else in them changed. The 0268 narrow-width browser test still passes unchanged.\n- Pictures of the Settings view with an explanation open, wide and narrowest width, light and dark, are kept with the review pack.\n",
    "seconds": 417,
    "usage": {
      "inputTokens": 85840,
      "outputTokens": 37762,
      "cacheReadTokens": 537472,
      "cacheWriteTokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T21:47:52.869Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: `#settings .setting` is position:relative and `p.explain` is position:absolute, z-index 2, placed with bottom:calc(100% - 4px); `placeSettingTip` adds `.below` when the note would stick out above `#settings`. The browser test `0371 AC1, AC4: at the narrowest width...` clicks every real setting at 320px, including rows scrolled to the top of the view, and checks that no row moves, the note is the topmost element, and it stays inside the pane (above the row, or below it when the row is at the top)."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "`settingInfo` in templates/panel.html starts a 500ms timeout on mouseenter and only calls `showSettingTip` if that pause was not superseded and the pointer is still on that button; mouseleave bumps `settingHoverWait` and hides an unpinned note. Tests `0371 AC2: the pointer must rest on the info button for half a second...` and `0371 AC2: moving off before the half second...` cover no show before 500ms, hide after leaving, a pause cut short, and moving on to another button."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Click and focus in `settingInfo` do call `showSettingTip` immediately, and the document Escape handler hides an open note without closing Settings. A click is preceded by mouseenter, which leaves that 500ms timeout running. Clicking the same button again, or pressing Escape, before it fires sets `settingTip` back to null but does not bump `settingHoverWait` or clear `settingHover`, so the timeout calls `showSettingTip(key, false)` and the note returns. In a real browser the click also focuses the button, so the later mouseleave will not hide it (`settingFocus` is still that key). `0371 AC3` rests the clock while the note is still pinned, and `0268 AC2` only clicks again after `hover()` has already let the pause finish, so neither test catches this."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "`settingInfo` still sets the button's aria-describedby to the explanation's id, and the explanation stays a child of that setting's row (`0371 AC4: each info button is still described...`, same association as 0268). The narrow-width browser test checks the note stays inside the view at 320px, the width 0268 already treats as the panel's narrowest."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "test/panel-0268.test.mjs only changes hover checks so they wait out the half-second pause (`hover`), which AC5 allows. Other settings tests that open a note, such as `0275: with an explanation open, Escape still only hides it`, click the button and do not listen for mouseenter, so they do not depend on the old instant hover. No unrelated failure listed before the build was fixed. Judged from the diff and the files that were run; the full suite is for ship."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Moving the pointer onto an info button starts a half-second timer. A click shows the note at once and leaves that timer running. If the person clicks that button again, or presses Escape, before the half-second is up, the note closes and then opens again by itself when the timer ends. Because the click focused the button, moving the pointer away afterwards does not close it either. A double-click, or click then Escape straight away, is enough. The new tests let the pause finish before they dismiss the note, so they stay green.",
        "suggested_fix": "Invalidate the pending hover pause whenever the note is opened or closed by a click, by focus, or by Escape (bump the same counter mouseleave already bumps, inside `showSettingTip`, or clear the timeout). Add a test that fires mouseenter, clicks twice or clicks and presses Escape, then lets the 500ms pause end, and asserts the note stays hidden.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "A setting's explanation now floats over its row instead of pushing the rows below it down. It appears after the pointer has rested on the \"i\" for half a second, and a click or the keyboard still opens it straight away. At the panel's narrowest width the rows stay still and the note stays inside Settings, dropping under the row only when the row is at the very top so it is not cut off. It is not ready to merge. If you move onto the \"i\" and then click it shut, or press Escape, before that half-second is up, the note comes back on its own and can stay open after you move the pointer away."
  }
}
```

</details>

<details><summary>Round 2 · cursor · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "cursor",
    "reviewer_model": "grok-4.7-high-fast",
    "reviewer_effort": "default",
    "reviewed_sha": "b6eda8a8be81bb5566544e63302ededa2c5fdb3c",
    "session": "continued",
    "thread_id": "6206b8e6-c638-48df-9c6e-57831449411d",
    "builder_response": "- Tests run: test/panel-0371.test.mjs test/panel-0268.test.mjs (plus the commands.checks files)\n- F1: fixed. In templates/panel.html, the info button's click and focus listeners and the Escape branch that hides an explanation now bump `settingHoverWait`, so a pause still running from the pointer shows nothing when it ends. New test `0371 AC3: closing it with a second click or Escape before the pointer's pause ends keeps it closed` fires mouseenter, click, focus, click, then ends the pause and checks it stays hidden; then mouseenter, click, Escape, pause ends, still hidden and Settings open.\n",
    "seconds": 109,
    "usage": {
      "inputTokens": 114032,
      "outputTokens": 10040,
      "cacheReadTokens": 96640,
      "cacheWriteTokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T21:50:10.116Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Unchanged from round 1. templates/panel.html places `#settings .setting p.explain` absolutely above the row (z-index 2), and `placeSettingTip` adds `.below` when it would stick out of the top of `#settings`. Browser test `0371 AC1, AC4: at the narrowest width...` passed: rows do not move, the note is on top, and it stays inside the view at 320px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "`settingInfo` still shows on mouseenter only after `SETTING_TIP_PAUSE` (500) and only if `settingHoverWait` and `settingHover` are unchanged. mouseleave still bumps the counter and hides an unpinned note. Click, focus and Escape also bump that counter, which only cancels a pause already in flight; a plain hover still waits. Tests `0371 AC2: the pointer must rest...` and `0371 AC2: moving off before the half second...` passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Click and focus in `settingInfo` still call `showSettingTip` immediately, and both now bump `settingHoverWait` first. The Escape branch bumps it before `showSettingTip(null)`. A pause started by mouseenter then cannot show the note again. Test `0371 AC3: closing it with a second click or Escape before the pointer's pause ends keeps it closed` hovers, clicks twice, lets the pause end, and checks it stays hidden; then hovers, clicks, presses Escape, lets the pause end, and checks it stays hidden with Settings still open. Focus still shows at once (`0371 AC3: a click shows it at once...`). In a real click, focus runs before click: focus opens it, click pins it, and the earlier pause no longer matches."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Unchanged. `settingInfo` still sets aria-describedby to the explanation in that row (`0371 AC4: each info button is still described...`). The narrow-width browser test passed, so the note stays inside Settings at 320px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "This round only bumps the hover-pause counter on click, focus and Escape, and adds the AC3 test. panel-0268.test.mjs was not changed again. The run was 125 passed, 0 failed. No unrelated failure was fixed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Moving the pointer onto an info button started a half-second timer. A click showed the note at once and left that timer running, so a second click or Escape before it fired closed the note and the timer opened it again.",
        "suggested_fix": "Invalidate the pending hover pause on click, focus and Escape.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "A setting's explanation floats over its row, so the rows below it no longer jump down. It appears after the pointer has rested on the i for half a second. A click or the keyboard still opens it straight away, and at the narrowest width it stays inside Settings. The problem from the last review is fixed: clicking the i shut, or pressing Escape, during that half-second no longer makes the note come back on its own. This is ready for you to merge."
  }
}
```

</details>
