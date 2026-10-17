---
id: "0274"
title: "Save every changed setting with one Save button"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-17T13:54:16.241Z"

---
# 0274 · Save every changed setting with one Save button

**Status:** 👍 approved

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
The Settings view no longer has a Save button beside each setting. Instead there's one Save button at the bottom of the view, always visible as you scroll, which lights up once you've changed something and greys out again if you put everything back. Pressing it saves all your changes together: the shared ones in a single commit, and any you chose to keep for this machine only on this machine.

To see it, open Settings in the panel, change two settings and press Save once: both are saved, and the view shows the new values. If one of your changes isn't allowed, nothing is saved, the refused setting says why, and your changes stay so you can fix them. Changing a setting that lets more tickets ship by themselves still asks you to confirm first.

Worth knowing: the question "this machine only or the repo?" now appears beside the setting as soon as you change it, and clearing this machine's own value also waits for Save.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A mixed batch saves machine values before writing config.yml.; F2 Controls remain editable while Save awaits its response.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 562,453
- Elapsed since build started: 10 min
- Changed lines: 369 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups, no inbox note):
  - The page no longer uses `POST /api/settings/<key>/<value>`. It's kept, saving one change through the new combined save, because 0258's, 0259's and 0261's server tests use it. It could go, with those tests moved to `/api/settings/save`.
  - Asking before closing the view with unsaved changes is 0275.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ce7f046f7a36eee038ff94ba8ba382171031b597",
    "thread_id": "01a14a22-8979-7092-9f0a-a4746ae90c26",
    "seconds": 17,
    "usage": {
      "input_tokens": 346880,
      "cached_input_tokens": 289536,
      "cache_write_input_tokens": 0,
      "output_tokens": 1697,
      "reasoning_output_tokens": 141
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T13:54:06.032Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "settingChanges() and refreshSettings() track differences and disable the single Save when values are restored. Both 0274 AC1 tests passed, including real-browser scrolling of the sticky save bar."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSaveSettings() commits changed shared settings together and saves machine settings separately. All three AC2 tests passed; the new deferred-response F2 test also verifies that subsequent edits remain pending."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "saveSettings() asks for confirmation before sending increased auto-shipping permissions; panelSaveSettings() independently checks the combined changes. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Validation precedes writes, refusals identify settings, and the view retains edits. The new AC4 F1 test passed for a read-only config file and a refused commit, verifying unchanged repo and machine settings."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "After success, saveSettings() clears submitted values and calls loadSettings(). The AC5 test passed, verifying refreshed values and disabled Save when no further edits remain."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs",
        "issue": "Repo write exceptions previously bypassed rollback after machine settings had been saved.",
        "suggested_fix": "Implemented: the write and commit phase now catches exceptions and restores prior values; the new failure-path test passed.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Successful saves previously discarded edits made while awaiting the response.",
        "suggested_fix": "Implemented: success clears only submitted values that still match, preserving later edits. The deferred-response regression test passed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The single Save button meets all five criteria. Both previous issues are fixed and covered by passing tests. The reported run had 171 passes, no failures and three skips."
  }
}
```

</details>
