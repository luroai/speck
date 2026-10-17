---
id: "0281"
title: "Draw every Settings control's border on all four sides"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T19:17:47.054Z"
approved: "2026-10-17T19:25:11.961Z"

---
# 0281 · Draw every Settings control's border on all four sides

**Status:** 👍 approved

## Problem
On an iPhone, some of the Settings view's info buttons and controls are drawn without their left border. Their borders are half a pixel wide, and they sit half a pixel off a whole pixel (at 390 px wide, every info button's left edge is at 173.5 px and every list's at 199.5 px), so the phone can drop that edge when it draws them. The view's group boxes, with their own half-pixel borders, are the likely cause of the half-pixel shift.

## Outcome
Every info button and control in the Settings view is drawn with its border on all four sides, on a phone as on a computer.

## Acceptance criteria
1. At widths of 320, 390, 400 and 1280 px, the left and right edges of every info button, list, text box and number box in the Settings view fall on a whole CSS pixel.
2. At those widths, every border of those elements is drawn at least one device pixel wide at a device pixel ratio of 1, 2 and 3.
3. The rest of the panel looks as it does today: the change is limited to the Settings view.
4. The view keeps the layout 0273 and 0277 gave it: the boxes, the rows, and the info buttons and controls lined up. (checked by review)

## Out of scope
- Borders elsewhere in the panel.

## Notes
- Seen on an iPhone on 2026-10-17, and measured in Chromium at 390 px wide: `button.info` at left 173.5, `select.edit` at left 199.5, with `.5px` borders (`templates/panel.html`, `#settings .setting` rules).
- Failing before this build: none
- Cause, measured in Chromium: the row splits its width into two equal halves, so an odd width puts the right half, and the info buttons at the end of the left half, half a pixel off. On Safari the group box's .5px border adds another half pixel (Chromium draws it 1px wide). The text and number boxes, sized in `ch`, also had fractional right edges.
- AC2: Chromium draws any border under 1px as 1 CSS px at every pixel ratio, so its computed widths can't show what Safari, which draws half a pixel, is given. The test reads each border's width as the stylesheet sets it at each ratio instead. Under 2x, the info buttons' and boxes' borders are 1px; from 2x, .5px is at least one device pixel. No WebKit is installed here to test in.
- Lists: their width comes from their longest option, which both Chromium and WebKit round up to a whole pixel, so a list's right edge falls on a whole pixel once its left edge does.
- Self-check: no changes

## In plain words
On a phone, the Settings view's info buttons, lists and text and number boxes now show their border on all four sides. Before, an iPhone could leave the left edge off, because they sat half a pixel off the screen's pixel grid. To see it, open Settings on an iPhone and look at the "i" buttons and the boxes beside them: each should have a full outline. The view's layout is the same, and the rest of the panel is unchanged. Worth a look on your phone: the view's other buttons, such as Close and Save, weren't part of this change.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The minimum border thickness remains unverified for the browser implicated in the defect.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 297,396
- Elapsed since build started: 7 min
- Changed lines: 19 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The Settings view's other buttons (Close, Save, Save all) keep half-pixel borders and may lose a side on a phone: `speck/ideas/2026-10-17-keep-the-settings-buttons-borders-whole-on-a-phone.md`.
  - Not tested in WebKit: none is installed here. The AC2 test reads the borders' declared widths at each pixel ratio instead.

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
    "reviewed_sha": "384f87b5c09ea3ccebf9fce7e0e098133e040949",
    "thread_id": "01a14b50-028e-7893-b8d0-3f1c92ac2415",
    "seconds": 24,
    "usage": {
      "input_tokens": 97234,
      "cached_input_tokens": 52736,
      "cache_write_input_tokens": 0,
      "output_tokens": 993,
      "reasoning_output_tokens": 152
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T19:22:00.543Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing 0281 AC1 AC2 browser test measures both edges at all four widths and three pixel ratios. panel.html rounds the grid column and input widths to whole pixels."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The test passes in Chromium, but .edit and .info still specify .5px borders. The ticket acknowledges that Chromium rounds these up; the test therefore does not establish the minimum border width in WebKit, where the reported defect occurs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Every changed CSS selector in templates/panel.html is scoped to #settings. No production changes affect other panel views."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Review of #settings .sgroup, .setting .row and .label confirms that group boxes, paired columns, shared control alignment and info-button alignment remain."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:355",
        "issue": "The minimum border thickness remains unverified for the browser implicated in the defect. Both controls and info buttons retain .5px borders, while the only test uses Chromium's acknowledged rounding to 1 CSS pixel. This leaves AC2, particularly at DPR 1, unresolved.",
        "suggested_fix": "Ensure these Settings borders are at least one device pixel at every required ratio, and add WebKit coverage for the required widths and ratios. Using 1px borders is a straightforward way to guarantee the minimum thickness; retain the edge-alignment checks.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "test/panel-0281.test.mjs:45",
        "issue": "The AC3 test inspects only rules with '0281' on the same line as '{'. Currently that selects the mobile gap rule and ignores the other changed rules, so its coverage is much narrower than its name suggests.",
        "suggested_fix": "Replace the comment-marker filter with a meaningful scope check or an assertion that representative elements outside Settings retain their styles.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change aligns Settings controls to whole pixels and preserves the existing layout. Chromium tests pass, but they do not establish that borders meet the required thickness in Safari. That gap needs resolving before approval."
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
    "reviewed_sha": "bcce6e2a417fb7c29de74c6e8274479d74824cd5",
    "thread_id": "01a14b50-028e-7893-b8d0-3f1c92ac2415",
    "seconds": 16,
    "usage": {
      "input_tokens": 197525,
      "cached_input_tokens": 144640,
      "cache_write_input_tokens": 0,
      "output_tokens": 1644,
      "reasoning_output_tokens": 152
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T19:24:52.274Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing 0281 AC1 AC2 browser test measures whole-pixel left and right edges at widths 320, 390, 400 and 1280, at DPR 1, 2 and 3."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.html now sets .edit and .info borders to 1px below 2x and .5px at the required 2x and 3x ratios. The passing test checks active stylesheet declarations, avoiding Chromium's computed-width rounding."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All production changes remain scoped to #settings. The revised passing tests check the affected selectors and verify the Plan section retains its border and has no outline at every required width and ratio."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "CSS review confirms group boxes, rows and shared alignment remain. The fresh test output also confirms the 0273 layout and 0277 info-button alignment browser tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The original half-pixel declarations did not establish the required minimum border thickness at DPR 1.",
        "suggested_fix": "Addressed by the resolution-dependent 1px border override and tests of active declared widths. Dedicated WebKit coverage is not required to establish this thickness calculation.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "test/panel-0281.test.mjs",
        "issue": "The original AC3 test selected only rules carrying a ticket comment on the same line.",
        "suggested_fix": "Addressed by checking the affected rule selectors and measuring an outside section's unchanged styles.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Settings controls now align to whole pixels and have borders at least one device pixel thick at all required ratios. The existing layout is preserved, and all relevant tests pass. Safari was not run directly, but the revised border rules resolve the thickness concern."
  }
}
```

</details>
