---
id: "0395"
title: "Close a setting's explanation on a click outside it"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-rehash-the-settings-screen.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:00:15.940Z"

---
# 0395 · Close a setting's explanation on a click outside it

**Status:** 🔍 reviewing

## Problem
An open explanation in Settings stays until you press its info button again or press Escape. On a phone there's no Escape, so a tap elsewhere leaves it covering the rows under it.

## Outcome
An open explanation closes when you click or tap anywhere outside it.

## Acceptance criteria
1. With a setting's explanation open, a click or tap anywhere outside the explanation and its info button closes it. That includes elsewhere in Settings, another setting's control and the space beside the column.
2. A click or tap on another control also works on that control, as it would with no explanation open. A click beside the column while an explanation is open closes only the explanation, not Settings.
3. A click or tap inside the explanation, such as one that selects its text, leaves it open. Its info button still opens and closes it, and Escape still closes it without closing Settings (0275).
4. An explanation opened by resting the pointer still closes when the pointer leaves, as 0371 made it.
5. No test that passed before this change fails.

## Out of scope
- What the explanations say: 0397.

## Notes
- Checked 2026-10-23: `settingInfo`, `showSettingTip` and `settingTip` in `templates/panel.html` (0268, 0371) open an explanation on a click, on focus or after the pointer rests on the info button for half a second. A second click, Escape or the pointer leaving closes it. `besideColumn` closes Settings on a click beside the column (0368).
- Failing before this build: none
- Self-check: no changes. A missing explanation or button for the open key closes it, and a partial redraw replaces its entry. A touch that starts a scroll also counts as a tap outside and closes it.
- Pictures: none, because nothing looks different: only when an explanation closes changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "1bb3f37a72c5cea2e1b3ea97039ddeb82ce861b1",
    "session": "fresh",
    "thread_id": "01a16835-e310-7d60-a11b-bc5b2bc925c4",
    "builder_response": "- Tests run: test/panel-0395.test.mjs test/panel-0268.test.mjs test/panel-0371.test.mjs test/panel-0368.test.mjs test/panel-0275.test.mjs (and the commands.checks files)\n- Round 1. A document-level pointerdown listener (bubble phase, after #settings' own) closes the open explanation unless the press is inside it or its info button, and takes back settingsDownBeside so a press beside the column closes only the explanation. Info buttons are kept in settingInfos beside settingTips. No visual change, so no pictures.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 123324,
      "cached_input_tokens": 86400,
      "cache_write_input_tokens": 0,
      "output_tokens": 917,
      "reasoning_output_tokens": 107
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T10:02:43.712Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The document pointerdown listener closes outside explanations; the two AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The listener preserves event propagation and clears settingsDownBeside. Both AC2 tests passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "redrawSettings preserves the changed row's original info button but settingInfo replaces its settingInfos entry with a detached button. After changing reviewer, builder or foreman, clicking its open explanation's info button closes it on pointerdown and reopens it on click. The AC3 tests omit this redraw path."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "settingInfo's mouseleave handling remains intact; the AC4 hover dismissal test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test log reports 159 passed, zero failed and three skipped across 162 tests; existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "After changing reviewer, builder or foreman, its info button can no longer toggle its explanation closed. redrawSettings calls settingRow, which registers a new info button, then preserves the original row's first child containing the actual button. The outside listener therefore treats the visible button as outside: pointerdown closes the explanation and click immediately opens it again.",
        "suggested_fix": "Preserve or restore the actual retained info button in settingInfos in redrawSettings' kept-row branch. Add a regression test that changes an agent control, opens its explanation and clicks the same info button again to close it.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Outside clicks dismiss explanations while preserving control clicks and keeping Settings open beside the column. One regression blocks approval: after changing an agent setting, its info button cannot close its explanation. The tests miss that sequence."
  }
}
```

</details>
