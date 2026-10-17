---
id: "0259"
title: Let the panel change auto-ship only after you confirm                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T09:22:21.680Z"

---
# 0259 · Let the panel change auto-ship only after you confirm

**Status:** 🔍 reviewing

## Problem
`auto_ship` and `auto_ship_risk` decide which approved tickets merge and push to the base branch without you. Turning that on by a slip of the finger, from a page with no login, would let work ship that nobody looked at.

## Outcome
`auto_ship` and `auto_ship_risk` can be changed from the Settings view, and any change that lets more tickets ship by themselves happens only after you confirm it.

## Acceptance criteria
1. In the Settings view, `auto_ship` (on or off) and `auto_ship_risk` (low, high or both) can be changed. A change is saved, committed and refused in the same ways as 0258's settings.
2. Turning `auto_ship` on, or adding `high` to `auto_ship_risk` while `auto_ship` is on, first opens a dialog. It says which tickets would then merge and push to the base branch, named, without waiting for you (for example "approved low-risk tickets"). Nothing is written until you confirm, and cancelling leaves the setting and the view as they were.
3. Turning `auto_ship` off, or removing a risk from `auto_ship_risk`, is saved without a dialog.
4. `auto_ship_risk` can't be left with no risk ticked: the view says to turn `auto_ship` off instead, and nothing is written.

## Out of scope
- Every other setting: 0258.
- Changing what auto-ship does.

## Notes
- `risk: high`: it changes whether work ships without the user.
- `checkConfigValue` in `scripts/config.mjs` already refuses an empty `auto_ship_risk`.
- Failing before this build: none
- 0258's tests changed with the scope: auto_ship and auto_ship_risk are now editable, so its read-only check and its "refused setting" example (now `worktrees`) were updated. Its shared page helpers moved to `test/support/settings.mjs`.
- Self-check: no changes

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
    "reviewed_sha": "d8cd77f74a26aefa0b74573bd1547d262d9faa65",
    "thread_id": "01a1492f-cc16-7950-ab79-57bdf8b6b999",
    "seconds": 24,
    "usage": {
      "input_tokens": 116119,
      "cached_input_tokens": 71168,
      "cache_write_input_tokens": 0,
      "output_tokens": 769,
      "reasoning_output_tokens": 156
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:27:35.099Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs exposes both settings and uses the existing validation, branch, clean-config and commit checks. Passing 0259 AC1 tests cover controls, saving, commits and refusals."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "templates/panel.html shipsMore() describes cached settings, while scripts/settings.mjs panelSetSetting() accepts confirmed=true against current settings without checking that their shipping scope matches the dialog. Existing passing AC2 tests cover unchanged settings only."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipsMore() and loosens() allow disabling auto-ship and removing risks without confirmation. The passing 0259 AC3 test exercises both page requests and persisted changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "saveSetting() rejects empty risk selection with guidance to turn auto_ship off; server validation also rejects empty risks. The passing 0259 AC4 test checks both and verifies nothing is written."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs",
        "issue": "Confirmation is not tied to the scope shown to the user. Open Settings with auto_ship off and risks low. In another tab, add high while auto_ship remains off, which requires no dialog. The first tab still asks only about approved low-risk tickets when enabling auto-ship. Its request carries confirm=1, so the server enables shipping for both low and high. High-risk tickets can therefore ship without the user confirming that consequence.",
        "suggested_fix": "Bind confirmation to the shipping settings or resulting scope displayed in the dialog. Refuse a stale confirmation before writing, refresh the settings and ask again with the current scope. Add a regression test covering two views with an intervening risk change.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The controls, saving and empty-selection checks work in the covered cases. However, an older Settings tab can enable automatic shipping of high-risk tickets after asking permission only for low-risk tickets. Confirmation must match what will actually be enabled before this is ready to merge."
  }
}
```

</details>
