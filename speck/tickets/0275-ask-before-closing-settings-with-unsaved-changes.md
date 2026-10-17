---
id: "0275"
title: "Ask before closing Settings with unsaved changes"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0274"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T15:40:28.626Z"
approved: "2026-10-17T15:45:56.770Z"

---
# 0275 · Ask before closing Settings with unsaved changes

**Status:** 👍 approved

## Problem
Closing the Settings view throws away any change you haven't saved, without a word, so a change you meant to keep can be lost with one press of Close or Escape.

## Outcome
Closing the Settings view with unsaved changes asks what to do with them first.

## Acceptance criteria
1. With any setting changed and not saved, pressing Close, pressing Escape, or clicking outside the view opens a dialog saying there are unsaved changes, with three choices: Save, Discard and Keep editing.
2. Save saves the changes as the view's Save button does (0274), then closes the view once they're saved. If the save is refused or needs 0259's confirmation, the view stays open and shows that, as its Save button would.
3. Discard closes the view without saving, and the next time it opens it shows the saved values.
4. Keep editing, or Escape while the dialog is open, closes the dialog and leaves the view open with the changes in place.
5. With nothing changed, Close, Escape and clicking outside close the view at once, as today. When the view closes, focus returns to the Settings button, as today.

## Out of scope
- Keeping unsaved changes after the page is reloaded.

## Notes
- Escape already hides an open setting explanation first (0268). With an explanation open, Escape still does only that.
- Failing before this build: none
- Self-check: a Save pressed in a view opened again while the closed view's save was still being sent waited for that old save; it now waits only for one from the same view.

## In plain words
If you've changed a setting in the Settings view and not saved it, closing the view no longer throws the change away. Pressing Close, pressing Escape or clicking outside the view now asks what to do: Save, Discard or Keep editing. Save works just like the view's own Save button and closes the view once it's done. If the save is refused or needs your confirmation first, the view stays open so you can see why. With nothing changed, the view closes at once, as before.

To see it, open Settings, change any value, then press Escape. Worth a look: the question has only been checked in tests, not in a real browser, so check that it looks right on a phone.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 107,876
- Elapsed since build started: 5 min
- Changed lines: 82 (limit 5000)
Follow-ups (Delivery log only, none needing their own ticket):
- The question's look and keyboard focus have been checked only on the fake page, not in a real browser. Worth a quick look on a phone.

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
    "reviewed_sha": "15dd066b16017479268083dce2465ef2ce6c3a42",
    "thread_id": "01a14a8a-0471-7203-b9ab-e839a5ea565a",
    "seconds": 26,
    "usage": {
      "input_tokens": 107028,
      "cached_input_tokens": 65152,
      "cache_write_input_tokens": 0,
      "output_tokens": 848,
      "reasoning_output_tokens": 194
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T15:45:47.825Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: leaveSettings routes Close, Escape and backdrop clicks to renderLeaving, which offers Save, Discard and Keep editing. Passing AC1 tests exercise all three routes and clearing a machine override."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: saveAndLeave awaits the shared saveSettings path and closes only after success with no remaining changes. Passing AC2 tests cover successful saves, refusals, shipping confirmation, missing scope and saves from a previously closed view."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: Discard calls closeSettings, clearing pending edits; openSettings fetches saved values afresh. The passing AC3 test verifies no POST, reopening with saved values and restored focus."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: keepEditing dismisses the dialog without clearing edits; the Escape handler invokes it while the dialog is open. Passing AC4 tests verify both choices preserve edits and that Escape during saving prevents automatic closure."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel.html: leaveSettings closes immediately when settingChanges is empty; closeSettings returns focus to settings-open. Passing AC5 tests exercise all three close routes after reverting an edit. The explanation-first Escape regression test also passes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now asks before closing with unsaved changes. Save, Discard and Keep editing behave as requested, including save refusals and confirmation prompts. The tests exercise the actual page handlers; the recorded run has 180 passes, no failures and three skips. No blocking concerns found."
  }
}
```

</details>
