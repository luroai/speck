---
id: "0277"
title: "Line up the Settings view's info buttons"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-17T18:28:45.257Z"

---
# 0277 · Line up the Settings view's info buttons

**Status:** 🔍 reviewing

## Problem
In the Settings view, each setting's info button sits straight after its name, so the buttons start at a different place on every row. When a long name wraps, as `allow_same_model_review` and `max_parallel_builds` do on a phone, its button is pushed up against the setting's value with no gap. The buttons are also taller than the controls beside them, so the rows look uneven.

## Outcome
The Settings view's info buttons line up, sit clear of the values, and match the size of the controls, at every width.

## Acceptance criteria
1. In every group, each setting's info button starts at the same distance from the group's left edge as the other info buttons in that group, whatever the length of the setting's name, and on a wrapped name too.
2. There's at least 8 px between each info button and the setting's value or control, at every width down to the panel's narrowest.
3. Each info button is no taller than the controls in its group, and keeps a target of at least 24 by 24 px.
4. A setting's name wraps only after an underscore or a dot, never in the middle of a word.
5. Every setting's value or control still starts at the same distance from the group's left edge as the others in its group, as 0273 made them.

## Out of scope
- What the info button shows, and how it opens: 0268.

## Notes
- The view is in `templates/panel.html` (search for "0257" and "0273"). Seen at 400 px wide, and on an iPhone on 2026-10-17.
- Failing before this build: none
- AC4 already held at 320, 400 and 1200 px before this build (no part of any name split), because the parts are short; the build removes the name's `overflow-wrap: anywhere`, so nothing but the breaks after `_` and `.` is allowed.
- Self-check: no changes

## In plain words
In the Settings view, each setting's little "i" button now sits at the right-hand end of the name, so the buttons form one neat column in every group, with a clear gap before the value. They're now the same height as the boxes and buttons beside them, but still easy to tap. To see it, open Settings, on a phone or a narrow window too: long names such as allow_same_model_review wrap onto a second line, but their buttons stay in line with the rest. On a phone the buttons look smaller than before, though the area you can tap is about as big, so it's worth checking they still feel easy to hit.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none.

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
    "reviewed_sha": "d153728a548045de6cd326ef8547466a180bdc2c",
    "thread_id": "01a14b24-e359-7931-80f7-c8d6b57d7a70",
    "seconds": 19,
    "usage": {
      "input_tokens": 135041,
      "cached_input_tokens": 91904,
      "cache_write_input_tokens": 0,
      "output_tokens": 649,
      "reasoning_output_tokens": 32
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T18:34:50.002Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html uses a grid for .label with a fixed info-button column. The passing browser test in test/panel-0277.test.mjs checks alignment in every group at 320, 400 and 1200 px, including wrapped names."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The row grid preserves an 8 px gap on phones and 12 px elsewhere. The passing 0277 browser test measures at least 8 px between every button and control column."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Info buttons are 18 px tall; ::after expands their click targets. The passing 0277 browser test compares heights with group controls and verifies hit detection across a 24 by 24 px target."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "settingName() inserts breaks after underscores and dots; .name no longer permits overflow-wrap:anywhere. The passing 0277 browser test verifies that name parts remain unbroken."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The existing equal-width row columns remain unchanged. The passing 0277 browser test verifies control-column alignment within every group at all three widths."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The info buttons line up consistently, keep clear of values, and fit beside the controls while retaining usable tap targets. Browser tests cover narrow and wide layouts, and the existing settings tests pass. No blocking issues found."
  }
}
```

</details>
