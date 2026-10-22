---
id: "0370"
title: "Keep Settings still when a setting changes"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0369"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T21:17:44.497Z"
approved: "2026-10-22T21:30:36.371Z"

---
# 0370 · Keep Settings still when a setting changes

**Status:** 👍 approved

## Problem
Changing the builder, the reviewer, the reviewer's model or the Foreman agent replaces the whole Settings view, so it looks as if the page reloaded. That's confusing when you're only picking one value.

## Outcome
Changing a setting updates what that change affects and leaves the rest of the open Settings view where it was.

## Acceptance criteria
1. Changing any setting's list, text box, number box or tick in the open Settings view leaves the view's scroll position where it was, and the control you changed keeps the keyboard focus. A setting the change doesn't affect stays as it was, in the same place.
2. What that change must show still updates: Save, a line under the builder, where a this-machine change goes, and the model list from 0369 when the builder, reviewer or Foreman agent changes.
3. Saving, a refusal, and the question when you close with unsaved changes still work as they do today.
4. No test that passed before this change fails, except a check that the whole Settings view is drawn again when a setting changes, which is changed to check criterion 1.

## Out of scope
- Which models a list offers: 0369.
- Where an explanation sits: 0371.
- Opening Settings as a pop-up: 0368.

## Notes
- Checked 2026-10-22: `typing` in `templates/panel.html` calls `renderSettings`, which replaces the whole pane, for `reviewer`, `builder`, `foreman` and a listed `reviewer_model`. Other controls call `refreshSettings`, which only updates Save and the this-machine question.
- 0371 waits for this: it changes `templates/panel.html` too.
- Failing before this build: none
- Self-check: the changed list now takes its new options in place (0369's "not offered" entry goes once you pick another), reading its value before its options move; models read after a change redraw only the settings that show them.
- Checked in a real browser (headless Chromium, panel from this worktree): with the pane scrolled to 400, changing the reviewer, the builder and reviewer_effort left it at 400, with the focus on the list changed.
- Pictures: none, because nothing looks different in a still picture: the change is that the view stays put.

## In plain words
Changing a setting in the Settings view no longer makes the whole view flash and jump back to the top. The page stays where you scrolled it, the list or box you changed keeps the keyboard focus, and only the lines that change with it update: the note under the builder, the model lists and the Save button. To see it, open Settings, scroll down, and pick another reviewer or builder: the view stays put while the model list underneath updates. Worth a look: the buttons for where a change is saved, and for clearing this machine's own value, still redraw the whole view, which is saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (cursor): approve.

## Delivery log
- Review rounds: 1
- Reviewer: cursor, model grok-4.7-high-fast, effort default
- Reviewer tokens: 0
- Elapsed since build started: 13 min
- Changed lines: 91 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: the place buttons ("This machine only", "The repo, for everyone"), clearing or keeping this machine's value, and a Save refused before sending still redraw the whole view. Saved to the inbox as speck/ideas/2026-10-22-keep-settings-still-when-a-setting-s-button-is-pressed.md.
- Known limit: which rows a change redraws is a fixed list in SETTING_AFFECTS; a new setting that depends on another needs adding there.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · cursor · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "cursor",
    "reviewer_model": "grok-4.7-high-fast",
    "reviewer_effort": "default",
    "reviewed_sha": "8199c148b158fc4b6a47690f31f8b7d711693444",
    "session": "fresh",
    "thread_id": "8c207fbe-7abd-4e1f-aaf7-33393634184f",
    "builder_response": "- Tests run: test/settings-0370.test.mjs test/agents-0288.test.mjs test/builder-switch-0293.test.mjs test/builder-model-0311.test.mjs test/foreman-0285.test.mjs test/panel-0150.test.mjs test/build-model-0279.test.mjs test/panel-0281.test.mjs test/foreman-fix-0286.test.mjs test/panel-0368.test.mjs test/panel-0259.test.mjs test/panel-0273.test.mjs test/panel-0309.test.mjs test/panel-0261.test.mjs test/panel-0258.test.mjs test/panel-0257.test.mjs test/panel-0268.test.mjs test/settings-0278.test.mjs test/settings-models-0369.test.mjs test/panel-0277.test.mjs test/settings-0276.test.mjs test/panel-0274.test.mjs test/panel-0364.test.mjs test/panel-0365.test.mjs test/panel-0275.test.mjs test/run-builder-0324.test.mjs test/review-claude-0292.test.mjs test/settings-cursor-0347.test.mjs test/settings-0370.test.mjs test/settings-foreman-0348.test.mjs  (every test file that opens Settings), plus the commands.checks files that speck test --files adds.\n- Also checked by hand in headless Chromium against a panel started from this worktree: with the Settings pane scrolled to 400, changing reviewer, builder and reviewer_effort left scrollTop at 400 and document.activeElement on the changed list.\n- No test that passed before needed changing: none of the existing tests checked that the whole view was drawn again (AC4).\n",
    "seconds": 402,
    "usage": {
      "inputTokens": 84209,
      "outputTokens": 41616,
      "cacheReadTokens": 585344,
      "cacheWriteTokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T21:30:16.798Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html redrawSettings keeps the changed control in the open row (so the browser keeps keyboard focus) and never calls the pane's replaceChildren; other controls only hit refreshSettings. Test '0370 AC1: changing a list, a text box, a number box or a tick leaves the view, its scroll and the changed control where they were' checks scrollTop, the same control node, and that unaffected rows are not rebuilt. Test '0370 AC1: models read after a change redraw only the settings that show them, and leave the focus where it was' checks a later model refresh leaves the changed builder list focused."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html SETTING_AFFECTS plus redrawSettings rebuilds the builder note, the model lists and the effort list; refreshSettings updates Save and the this-machine question. Test '0370 AC2: what a change must show still updates' checks each of those. The 0369 model-list tests were in the run and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Save, a refusal and the unsaved-changes question still go through saveSettings, renderSettings and leaveSettings in templates/panel.html. Test '0370 AC3: saving, a refusal and the question on closing with unsaved changes work after a change redraws rows' posts the save, shows the refusal beside the setting, and checks Keep editing leaves the change in place."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported run of the Settings test files was 383 passed, 0 failed, including the pre-existing Settings files. The diff does not edit those tests. The behaviour change is confined to how an open Settings pane updates a row, which those files cover."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Changing a setting in Settings now updates only the rows that change affects, so the page stays where you scrolled it and the control you changed keeps the keyboard focus. Save, the note under the builder, the question about saving for this machine, and the model lists still update. Saving, a refused save, and the question when you close with unsaved changes still work. The new tests cover those cases, and the existing Settings tests passed. This is ready to ship."
  }
}
```

</details>
