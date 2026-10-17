---
id: "0274"
title: "Save every changed setting with one Save button"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
