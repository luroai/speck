---
id: "0273"
title: "Lay out the Settings view like the rest of the panel"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T13:33:13.371Z"
approved: "2026-10-17T13:41:52.217Z"

---
# 0273 · Lay out the Settings view like the rest of the panel

**Status:** 👍 approved

## Problem
The Settings view is a long column of rows with little between them: the groups run into each other, individual settings are hard to pick out, and it doesn't look like the rest of the panel, whose sections sit in bordered boxes with a heading bar.

## Outcome
The Settings view is laid out like the rest of the panel: each group is a box of its own, and each setting is a clear row with its name on one side and its value on the other.

## Acceptance criteria
1. Each group ("Shipping", "Building and reviewing", "How much runs at once", "Ticket size limits") is drawn as a bordered box with a heading bar, the way the panel's Plan, Build and Shipped sections are, with space between the boxes. (checked by review)
2. Within a group, each setting is a row with its name and info button on the left and its value or control on the right, and the controls of a group line up in one column. Rows are divided from each other by a line. (checked by review)
3. A setting that applies to this machine only, or that can only be changed in the file, still shows which it is, as today.
4. At the panel's narrowest width, each row's name and control still fit without the view scrolling sideways.
5. In both the light and dark looks, the view uses the panel's own colours, type and borders, and no text is smaller than 12 px or lighter than weight 400 (0161).

## Out of scope
- The Save buttons: 0274.
- What the settings are, their explanations and how they're saved.

## Notes
- The view is in `templates/panel.html` (search for "0257"). The panel's section boxes are the model.
- Failing before this build: none
- Self-check: names now break only after a dot or underscore, not mid-word, and the info button keeps its size beside a long name (screenshots at 1200 and 320 px, light and dark).

## In plain words
The Settings view now looks like the rest of the panel. Each group of settings sits in its own bordered box with a heading at the top, and each setting is a row with its name on the left and its value or control on the right, lined up down the box. Open Settings from the gear button in the header to see it. On a phone, long setting names wrap onto a second line at a natural break, such as after an underscore, so the view never scrolls sideways.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 132,849
- Elapsed since build started: 9 min
- Changed lines: 33 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "0f51a877f2cd0f5a048d4291bacc97358e7eb6d6",
    "thread_id": "01a14a18-9054-7d71-b539-b3c4a7e13501",
    "seconds": 19,
    "usage": {
      "input_tokens": 132172,
      "cached_input_tokens": 90752,
      "cache_write_input_tokens": 0,
      "output_tokens": 677,
      "reasoning_output_tokens": 13
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T13:41:45.377Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: renderSettings wraps each group in section.sgroup with a .sh heading bar. The existing section and .sh rules supply panel colours and borders; .sgroup adds 16px between boxes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: renderSettings places each name and info button in .label and controls in .control. The .row rule gives every row the same two-column grid; .setting supplies dividing lines."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passed test '0273 AC3: a setting for this machine only, or one changed only in the file, still shows which it is' exercises machine/repo badges, the repo value, clearing a machine override, and read-only versus editable settings."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passed real-browser test '0273 AC4, AC5' checks the populated Settings view at 320px: no horizontal scrolling, all row contents inside the pane, and labels beside controls."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passed real-browser test '0273 AC4, AC5' checks both light and dark themes for panel colour tokens, font families, borders, text sizes of at least 12px and weights of at least 400. The new CSS uses the existing panel tokens."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now appear in separate bordered groups, with names on the left and aligned controls on the right. Machine-specific labels and editing behaviour are preserved. The reported tests passed, including narrow-screen and light/dark checks. No blocking concerns found."
  }
}
```

</details>
