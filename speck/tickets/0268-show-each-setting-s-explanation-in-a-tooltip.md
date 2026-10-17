---
id: "0268"
title: "Show each setting's explanation in a tooltip"                # one outcome, no "and"
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
after: ["0258"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T09:22:08.221Z"
approved: "2026-10-17T09:30:08.772Z"

---
# 0268 · Show each setting's explanation in a tooltip

**Status:** 👍 approved

## Problem
The panel's Settings view (0257) shows a one- or two-sentence explanation under every setting, so the view is long and the values are hard to scan.

## Outcome
Each setting's explanation sits behind a small info button beside its name, so the view shows names and values at a glance and the explanation is one hover, focus or tap away.

## Acceptance criteria
1. In the Settings view, no setting's explanation shows until it's asked for. Each setting has an info button beside its name, whose accessible name includes the setting's name (for example "About auto_ship").
2. The explanation shows while the pointer is over the info button, and while the info button has keyboard focus. Tapping or clicking it shows it until it's tapped or clicked again, or another setting's explanation is opened.
3. Escape hides an open explanation and leaves the Settings view open. With no explanation open, Escape closes the view, as it does today.
4. The info button is linked to its explanation (`aria-describedby`), so a screen reader reads the explanation with the button. The explanation stays inside the Settings view at the panel's narrowest width.

## Out of scope
- Changing the explanations' wording.
- Changing settings from the panel: 0258.

## Notes
- The view is in `templates/panel.html` (search for "0257"). The explanations come from `scripts/settings.mjs`.
- Failing before this build: none
- Self-check: a redrawn view (after a save) forgot hover and focus on its replaced buttons and kept only a clicked explanation; closing the view clears a kept one; the info button draws its "i" in CSS so it adds no text beside the setting's name and value; square like the rest of the panel.

## In plain words
The Settings view is shorter now: each setting shows its name and value, with a small "i" button beside the name. Hover over it, move to it with the keyboard, or tap it to read what the setting does; tap or click it again to hide it, or press Escape. A second Escape closes the view as before.

To see it, open Settings from the panel's header and try the "i" beside any setting. Worth keeping an eye on: on a phone the "i" is a smaller target than the panel's other buttons.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 293,858
- Elapsed since build started: 8 min
- Changed lines: 45 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: on narrow screens the info button is 28 px, below the 44 px tap area the panel's tags have (0165).

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
    "reviewed_sha": "22d64ad619678b7e58c54c7f33d18748b99dcc60",
    "thread_id": "01a1492d-cc9a-7792-918e-74385777e4b3",
    "seconds": 19,
    "usage": {
      "input_tokens": 96605,
      "cached_input_tokens": 55296,
      "cache_write_input_tokens": 0,
      "output_tokens": 630,
      "reasoning_output_tokens": 73
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:25:19.615Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: settingInfo() adds an info button immediately after each name, labelled 'About <setting>'; showSettingTip() initially hides all explanations. The 0268 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "settingInfo() handles hover, focus, blur and click; showSettingTip() displays one explanation and tracks whether a click keeps it open. Both 0268 AC2 tests passed, including combined hover/focus and switching settings."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: the Escape handler hides the current explanation before closing Settings. Both 0268 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "settingInfo() links each button to its explanation through a unique aria-describedby target. Both 0268 AC4 tests passed, including real-browser checks of every explanation at 320 px with no sideways overflow."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings explanations are hidden until requested through an info button. Hover, keyboard focus, clicking and Escape behave as specified, and explanations fit the narrow view. All 29 reported tests passed, including the browser layout check. No blocking concerns found."
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
    "reviewed_sha": "47c7bb077e7064f03611da0f14c6dbca34f73a53",
    "merge": true,
    "thread_id": "01a1492d-cc9a-7792-918e-74385777e4b3",
    "seconds": 14,
    "usage": {
      "input_tokens": 195521,
      "cached_input_tokens": 143616,
      "cache_write_input_tokens": 0,
      "output_tokens": 1102,
      "reasoning_output_tokens": 73
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:30:06.326Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: renderSettings() places an info button beside each setting name; settingInfo() labels it 'About <setting>'; showSettingTip() initially hides explanations. The 0268 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: settingInfo() handles hover, focus and click, with showSettingTip() retaining clicked explanations and replacing them when another opens. Both 0268 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: the Escape handler hides an open explanation before closing Settings; closeSettings() clears tooltip state. Both 0268 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "settingInfo() assigns unique explanation IDs and aria-describedby links. Both 0268 AC4 tests passed, including the real-browser check at 320 px for containment and no sideways scrolling."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still meets all four criteria. The info text now meets the panel's minimum font size, and the browser test is correctly registered for test scheduling. All 48 tests in the supplied run passed, with none skipped. No blocking concerns remain."
  }
}
```

</details>
