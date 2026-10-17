---
id: "0274"
title: "Save every changed setting with one Save button"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0273"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T13:44:09.209Z"

---
# 0274 · Save every changed setting with one Save button

**Status:** 🔍 reviewing

## Problem
Every editable setting in the Settings view has its own Save button, so the view is cluttered with them, and changing several settings means saving, and committing, each one separately.

## Outcome
The Settings view has one Save button that saves every setting you've changed at once.

## Acceptance criteria
1. The Settings view has no Save button on each setting. It has one Save button, always in view at the bottom of the view however far it's scrolled, which is disabled until a setting's value differs from the saved one, and disabled again once every changed value is put back.
2. Pressing Save saves every changed setting. The changed settings that are shared go into one commit to the base branch, and those for this machine only are saved for this machine, as each is today. Settings you didn't change are left as they are.
3. When the changes include one that lets more tickets ship by themselves, the confirmation 0259 asks for is shown first, and nothing is saved unless you confirm it.
4. When any change is refused, nothing is saved, and the view says which setting was refused and why, keeping your changes in place so you can fix them.
5. After a save, the view shows the values as speck now reads them, with Save disabled.

## Out of scope
- Asking before closing with unsaved changes: 0275.
- The view's layout: 0273.

## Notes
- Today each Save sends `POST /api/settings/<key>/<value>` (`panelSettingRequest` in `scripts/settings.mjs`), with 0259's `?confirm=` and 0261's `?scope=`.
- Failing before this build: none
- 0258's, 0259's and 0261's page tests pressed each setting's own Save, which this ticket removes: they now change the control and press the view's one Save, checking the same things. Their server tests are unchanged: `panelSetSetting` and `POST /api/settings/<key>/<value>` still work, as one change saved the new way.
- 0259's cancelled dialog still puts `auto_ship` and `auto_ship_risk` back as they were, and keeps your other changes to save.
- 0261's question is now asked beside the setting as soon as it's changed, rather than on Save, and the Cancel button is gone: putting the value back stops asking. Clearing this machine's value waits for Save too.
- Self-check: no changes
- Criterion 2's single commit and criterion 4's nothing-saved need the server to take the changes together, not one request per setting.

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
    "reviewed_sha": "bb7ca12a3a41d795e301e408c8d3ebc814f46ae9",
    "thread_id": "01a14a22-8979-7092-9f0a-a4746ae90c26",
    "seconds": 28,
    "usage": {
      "input_tokens": 212918,
      "cached_input_tokens": 165504,
      "cache_write_input_tokens": 0,
      "output_tokens": 958,
      "reasoning_output_tokens": 99
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T13:52:47.450Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "settingChanges(), refreshSettings() and .savebar implement one sticky Save with dirty tracking. Both 0274 AC1 tests passed, including real-browser scrolling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSaveSettings() batches shared changes into one commit and saves machine values separately. The three 0274 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "saveSettings() and panelSaveSettings() check the combined shipping changes before saving. Both 0274 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Validation refusals are covered by passing AC4 tests, but scripts/settings.mjs:185 can throw after machine values have been saved, bypassing rollback and leaving a partially saved batch."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "saveSettings() reloads settings after success and clears dirty state. The 0274 AC5 test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs:180",
        "issue": "A mixed batch saves machine values before writing config.yml. If fs.writeFileSync() throws, for example because config.yml is not writable, panelSaveRequest() returns 500 but the machine changes remain saved. Exceptions from commitTicketOnly() likewise bypass undo(). This breaks the promised all-or-nothing save.",
        "suggested_fix": "Handle exceptions throughout the write and commit phase, restoring machine values and any modified repo file before returning failure. Add a mixed-batch test that forces the repo write to fail and verifies both stores remain unchanged.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:1938",
        "issue": "Controls remain editable while Save awaits its response. Any edits made during that wait are recorded in settingTyped, but success unconditionally clears the entire map and reloads. Those new edits were never sent and silently disappear.",
        "suggested_fix": "Disable editing and scope/clear actions during saving, or preserve edits made after the submitted snapshot. Add a test with a delayed save response and an intervening edit.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The single Save button works in the tested flows, including confirmation and one shared commit. Two gaps need fixing: a failed save can leave machine settings partially saved, and edits made while saving can disappear."
  }
}
```

</details>
