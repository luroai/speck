---
id: "0368"
title: "Open Settings in a pop-up over the whole panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T19:39:59.696Z"
waited_seconds: 2034

---
# 0368 · Open Settings in a pop-up over the whole panel

**Status:** 🔍 reviewing

## Problem
Settings opens in a pane down the right, at most 480 px wide. With every group and control in that strip, the view is cluttered and hard to scan.

## Outcome
Settings opens in a pop-up over the whole panel, in the same look as a document's pop-up.

## Acceptance criteria
1. Pressing Settings opens a pop-up that covers the whole panel window at every width, in both looks, in the same look as a document's pop-up (0362): a Close button, and the settings in a centred column at most 760 px wide. Settings no longer opens in the pane on the right.
2. While the pop-up is open, nothing behind it can be clicked, scrolled or reached with Tab, and the focus moves into it. A long view scrolls inside the pop-up.
3. Close, Escape and a click on the backdrop close it, as they close Settings today, including the question when there are unsaved changes (0275). The focus returns to the Settings button.
4. The groups, controls, Save, this-machine choices and messages are the ones the side pane shows today.
5. No test that passed before this change fails, except checks that Settings opens in the right-hand pane, which are changed to check criterion 1.

## Out of scope
- Filling a model list when the builder, reviewer or Foreman agent changes: 0369.
- Keeping the view still when a setting changes: 0370.
- Floating an explanation over its row: 0371.
- The document pop-up and the Foreman's pop-up.

## Notes
- Settings is `#settings` in `templates/panel.html`, a fixed pane `min(480px, 100vw)` wide. A document's pop-up is `#doc-view`: fixed over the window, content at most 760 px wide.
- Checked 2026-10-22: the document pop-up covers the window and scrolls inside itself (0362, `templates/panel.html`).
- 0369, 0370 and 0371 wait for this: they change `templates/panel.html` too.
- Failing before this build: none
- Self-check: a drag from the column ending beside it (such as selecting text) no longer closes Settings: a click closes it only when the pointer also went down beside the column. The column's left edge is rounded to a whole pixel, which 0281's test caught.

## In plain words
Settings now opens over the whole panel, like a document does, instead of in a narrow strip down the right. The settings sit in a centred column, so on a wide screen there's far more room to read them. To see it, press the gear button in the header: Close, Escape or a click in the empty space either side of the column closes it, and it still asks first if you have unsaved changes. If Auto-build refuses to start or stop, the reason now shows right next to its switch in Settings, since the pop-up covers the strip under the header where it used to appear. Worth a look: on a long Settings view, the outline of the group behind the sticky Save bar shows through at its left and right edges.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Idea `speck/ideas/2026-10-22-hide-the-group-edges-beside-the-sticky-save-bar.md`: the groups' outline shows beside the sticky Save bar on a long view (seen in the pictures; it was there in the side pane too).
- Tidy-up: `#settings-backdrop` is now fully covered by the pop-up. It's kept, with its click handler, so 0275's tests pass unchanged; a later change could remove it.
- The first review round ran past the 30-minute reviewer time limit once and recorded nothing; the second attempt finished.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · cursor · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "cursor",
    "reviewer_model": "grok-4.7-high",
    "reviewer_effort": "default",
    "reviewed_sha": "f302898639ad8958c738709e20a8df6eb70da351",
    "session": "fresh",
    "thread_id": "26a5320f-a30b-4bb0-916e-fad038f2ffa7",
    "builder_response": "- Tests run: test/panel-0368.test.mjs test/builder-model-0311.test.mjs test/foreman-0285.test.mjs test/foreman-fix-0286.test.mjs test/panel-0150.test.mjs test/panel-0273.test.mjs test/panel-0274.test.mjs test/panel-0281.test.mjs test/panel-0257.test.mjs test/panel-0275.test.mjs test/panel-0268.test.mjs test/panel-0277.test.mjs test/panel-0364.test.mjs test/panel-0366.test.mjs test/panel-0309.test.mjs test/panel-0365.test.mjs test/settings-0278.test.mjs test/settings-0276.test.mjs test/pack-0362.test.mjs test/pack-0363.test.mjs\n- Round 1. Settings is now a full-window pop-up (`#settings`, fixed, inset 0, scrolls inside itself), its direct children in a centred column at most 760 px wide, its top bar and Close sharing the document pop-up's rules. The column's left edge is rounded down to a whole pixel so 0281's whole-pixel check still holds with a scroll bar.\n- While it's open, the ticket pane and its backdrop are inert too (`holdPane`, shared with the document pop-up), as well as the page (`holdPage`).\n- The backdrop: the pop-up covers the old backdrop, so a click on the pop-up itself beside its column closes it via `leaveSettings` (asking first with unsaved changes, 0275). A click inside the column (between groups) or a drag that started in the column doesn't. The old `#settings-backdrop` element and handler stay, so 0275's tests pass unchanged.\n- No existing test needed changing: none checked the right-hand pane's geometry.\n- Pictures: wide and phone, light and dark.\n",
    "seconds": 620,
    "usage": {
      "inputTokens": 109267,
      "outputTokens": 40960,
      "cacheReadTokens": 1467264,
      "cacheWriteTokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T20:47:39.316Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: #settings is position:fixed; inset:0; background:var(--panel), with the 480px right-hand pane and its dark box-shadow removed, so both looks use the theme tokens and the pop-up fills the window at every width. #settings > * caps each direct child at max-width 760px and centres it (rounded margin-left, margin-right:auto). Close and the top bar share the #doc-view rules. test/panel-0368.test.mjs both '0368 AC1' tests passed; panel-0273's light and dark colour check passed in this run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "openSettings focuses #settings. renderSettings calls holdPage (html.held { overflow:hidden }, and header, #offline, #restart and main set inert) and holdPane (full-ticket and full-backdrop inert while settingsView is set). #settings has overflow-y:auto and overscroll-behavior:contain. test '0368 AC2' passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Close button, the Escape branch in the keydown handler, and a click on #settings beside the column (besideColumn) all call leaveSettings. That closes at once, or opens the unsaved-changes question (renderLeaving, 0275) when settingChanges() is non-empty. closeSettings then focuses #settings-open. The six '0368 AC3' tests passed, and panel-0275.test.mjs passed in this run."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "renderSettings still builds the same groups, editors, this-machine lines, Save bar and in-pane messages; the only addition there is holdPane(). test '0368 AC4' passed, and panel-0273, panel-0274 and panel-0275 passed in this run."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The diff touches templates/panel.html, the new test/panel-0368.test.mjs and the ticket status. No existing test was rewritten. This round's speck test --files run reported 316 pass, 0 fail and 3 skipped, including the settings and pop-up files. Failing before this build: none."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "A click on the pop-up's scrollbar closes Settings. #settings is both the scroll container and the backdrop target. besideColumn treats any x outside the first child's box as beside the column, and a classic scrollbar sits in that gutter (on a wide window and on a narrow one). pointerdown and click on the scrollbar therefore call leaveSettings, so paging the scrollbar shuts the view, or raises the unsaved-changes question if a setting was edited. Wheel scrolling still works.",
        "suggested_fix": "In besideColumn, ignore a point in the scrollbar gutter (for example clientX past the pane's left plus clientWidth, or offsetX greater than clientWidth) so that click scrolls and does not call leaveSettings. Add a test that a click in that gutter leaves Settings open.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "If Auto-build refuses to start or stop, the reason is invisible while Settings is open. switchRun still writes it to #run-error, the strip under the header (0150, checked by foreman-0285 and panel-0150). Those tests only check that the text is set. The new pop-up is an opaque full-window layer at z-index 10, so it covers that strip. The switch lives in the Foreman group inside the pop-up, so the person who clicked it cannot read why it failed until they close Settings.",
        "suggested_fix": "Show that same refusal inside the pop-up, in the Foreman group next to the switch, for as long as Settings is open. Keep writing #run-error so the existing checks still pass.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "minor",
        "file": "test/panel-0368.test.mjs",
        "issue": "The centred-column assertion looks for margin-left:auto in #settings > *. That declaration is in the rule, but the next margin-left in the same rule replaces it. The margin that actually centres the column is the rounded one. The test would still pass if that winning margin stopped centring the column.",
        "suggested_fix": "Assert the winning margin: max-width 760px, margin-right auto, and margin-left's round(down, calc((100% - 760px) / 2), 1px).",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Settings now opens over the whole panel, in the same full-window style as a document, with the controls in a centred column and a Close button. Close, Escape and a click on the empty area beside the column still close it, and unsaved changes still ask first. While it is open the rest of the panel cannot be used, and the focus returns to the Settings button.\n\nTwo things should be fixed before this is merged. Clicking the scrollbar on a long Settings view is treated as a click beside the column, so the view closes, or asks about unsaved changes, when the person was trying to scroll. And if Auto-build refuses to start or stop, the reason is still written in the strip under the header, which this pop-up now covers, so the reason stays hidden until Settings is closed."
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
    "reviewer_model": "grok-4.7-high",
    "reviewer_effort": "default",
    "reviewed_sha": "bf4380a6000f20d0edaca4ac6303a467d4709399",
    "session": "continued",
    "thread_id": "26a5320f-a30b-4bb0-916e-fad038f2ffa7",
    "builder_response": "- Tests run: test/panel-0368.test.mjs test/builder-model-0311.test.mjs test/foreman-0285.test.mjs test/foreman-fix-0286.test.mjs test/panel-0150.test.mjs test/panel-0273.test.mjs test/panel-0274.test.mjs test/panel-0281.test.mjs test/panel-0257.test.mjs test/panel-0275.test.mjs test/panel-0268.test.mjs test/panel-0277.test.mjs test/panel-0364.test.mjs test/panel-0366.test.mjs test/panel-0309.test.mjs test/panel-0365.test.mjs test/settings-0278.test.mjs test/settings-0276.test.mjs test/pack-0362.test.mjs test/pack-0363.test.mjs\n- F1: fixed. besideColumn (templates/panel.html) now returns false for a point outside the pop-up's padding box, that is its border or scroll bar (clientX at or past its left + clientLeft + clientWidth), so a click on the scroll bar scrolls. New test '0368 AC3: a click on the pop-up's scroll bar, beside the column, scrolls rather than closing it' (fails without the fix).\n- F2: fixed. showRunError also writes the refusal to a paragraph kept beside the switch in the Foreman group (runSwitchSaid, kept between redraws like the switch), shown while it has text and cleared on the next press, as #run-error is. #run-error is still written. New test '0368 AC4: a refused Auto-build switch shows speck run's message beside the switch…' (fails without the fix).\n- F3: fixed. The AC1 test now checks the winning margin-left, the rounded one, as the rule's last declaration, with max-width 760px and margin-right auto.\n",
    "seconds": 175,
    "usage": {
      "inputTokens": 25060,
      "outputTokens": 12362,
      "cacheReadTokens": 545536,
      "cacheWriteTokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T20:51:50.441Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: #settings is position:fixed; inset:0; background:var(--panel), with the 480px right-hand pane gone, so both looks use the theme tokens and the pop-up fills the window. #settings > * ends with margin-left: max(0px, round(down, calc((100% - 760px) / 2), 1px)) and margin-right:auto, max-width 760px. Close and the top bar share the #doc-view rules. Both '0368 AC1' tests passed, including the winning-margin check; panel-0273's light and dark colour check passed in this run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "openSettings focuses #settings. renderSettings calls holdPage (html.held { overflow:hidden }, and header, #offline, #restart and main set inert) and holdPane (full-ticket and full-backdrop inert while settingsView is set). #settings has overflow-y:auto and overscroll-behavior:contain. test '0368 AC2' passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Close, Escape and besideColumn all call leaveSettings, which closes or asks first when there are unsaved changes (0275); closeSettings focuses #settings-open. besideColumn now returns false when clientX is outside the padding box (border or scrollbar). The six original '0368 AC3' tests passed, as did the new scrollbar test and the inside-column and drag tests, and panel-0275."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "renderSettings still draws the same groups, editors, this-machine lines, Save bar and in-pane messages. A refused Auto-build switch also writes the reason onto runSwitchSaid, the paragraph kept in the Foreman group's run-row, while #run-error is still set. test '0368 AC4' and the new refusal test passed; panel-0273, panel-0274, panel-0275, panel-0150 and foreman-0285 passed in this run."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Since the last review the diff only changes templates/panel.html and test/panel-0368.test.mjs. No existing test was rewritten. This round's speck test --files run reported 318 pass, 0 fail and 3 skipped. Failing before this build: none."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "A click on the pop-up's scrollbar closes Settings. #settings is both the scroll container and the backdrop target. besideColumn treats any x outside the first child's box as beside the column, and a classic scrollbar sits in that gutter.",
        "suggested_fix": "In besideColumn, ignore a point in the scrollbar gutter so that click scrolls and does not call leaveSettings.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "If Auto-build refuses to start or stop, the reason is invisible while Settings is open, because it was written only to #run-error under the header, which the pop-up covers.",
        "suggested_fix": "Show that same refusal inside the pop-up, in the Foreman group next to the switch, and keep writing #run-error.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "minor",
        "file": "test/panel-0368.test.mjs",
        "issue": "The centred-column assertion looked for margin-left:auto, which the next margin-left in the same rule replaces.",
        "suggested_fix": "Assert the winning margin-left, the rounded one, together with max-width 760px and margin-right auto.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Settings opens over the whole panel, in the same full-window style as a document, with the controls in a centred column and a Close button. Close, Escape and a click on the empty area beside the column still close it, and unsaved changes still ask first. The two problems from the last review are fixed. Clicking the scrollbar no longer closes Settings, and if Auto-build is refused the reason now shows in the pop-up next to that switch, as well as in the strip under the header. This is ready for the product owner to merge."
  }
}
```

</details>
