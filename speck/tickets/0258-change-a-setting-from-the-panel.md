---
id: "0258"
title: "Change a setting from the panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0257"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T08:53:20.250Z"
approved: "2026-10-17T09:05:11.747Z"

---
# 0258 · Change a setting from the panel

**Status:** 👍 approved

## Problem
Changing a setting today means finding the line in `speck/config.yml`, knowing which values speck accepts, editing it and committing it so `speck run` sees it. That's a lot to ask of someone who just wants two builds at once or a more thorough reviewer.

## Outcome
The settings in the Settings view that are safe to change can be changed there, with only values speck accepts, and the change is committed for the whole repo.

## Acceptance criteria
1. In the Settings view, `reviewer`, `reviewer_model`, `reviewer_effort`, `max_parallel_builds`, `max_parallel_tests`, `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds` can each be changed in place. `reviewer_effort` offers only blank (the reviewer's default) and the effort levels speck accepts. `reviewer` offers only `codex`, `claude-subagent` and the names under `reviewer_options`. Every other setting in the view stays read-only.
2. Saving a change rewrites only that setting's line in `speck/config.yml`, keeping every other line, comment and the order of settings, then commits only `speck/config.yml` on the base branch as `speck: config <key> <value>`. The view then shows the new value. Saving the value a setting already has writes and commits nothing.
3. A value speck wouldn't accept is refused with a message saying what's allowed, leaving the file and git unchanged. Examples: a `max_parallel_builds` of 0, or a `reviewer` that makes the builder and reviewer the same agent while `allow_same_model_review` is false.
4. A change is refused, with a message saying why, leaving the file and git unchanged, when the panel's checkout isn't on the base branch or `speck/config.yml` has uncommitted changes.
5. A change request without the panel's token or from another origin is refused with 403, as the panel's other writes are. A request to change a setting not listed in criterion 1 (for example `build_command` or `auto_ship`) is refused. Neither changes anything.

## Out of scope
- `auto_ship` and `auto_ship_risk`: 0259, which asks before loosening who ships.
- `builder`, which needs a matching `build_command`, and `allow_same_model_review`, which weakens the independent review. Both stay read-only.
- Settings for this machine only: 0260 and 0261.

## Notes
- `risk: high` because the panel has no login and this lets it change how builds are reviewed. Writes use the same origin and token check as the panel's other writes.
- Reuse `checkConfigValue` and `setConfigText` in `scripts/config.mjs` (what `speck config set` uses), and commit as `panelSetPriority` in `scripts/panel.mjs` does. The same-agent check is in `scripts/core.mjs` (`modelFamily`).
- Failing before this build: none
- Self-check: a value badly written in the address is refused with 400 and a plain message, a reviewer_model with a line break or control character is refused, and the brief's panel entry no longer says the Settings view changes nothing (a test checks it names the eight settings).

## In plain words
The Settings view in the panel now lets you change eight settings in place: which reviewer checks the work, its model and effort, how many builds and test runs go at once, and the three ticket size limits. Each has a box or a list and a Save button. Saving checks the value first, refuses anything speck wouldn't accept with a message saying what's allowed, and otherwise changes just that line of the settings file and records it for everyone using the project. The other settings, such as auto-ship and the builder, still show but can't be changed there.

To see it, open the panel, press Settings, change "max_parallel_builds" to 2 and press Save: the view shows 2, and the project's history has a new entry for it. Saving is refused while the panel's folder is on another branch or the settings file has unsaved edits of your own, so those are never swept up with it. Worth a look: the controls were checked by tests rather than in a real browser, so glance at how they sit in the view.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 650,324
- Elapsed since build started: 12 min
- Changed lines: 164 (limit 5000)
- Follow-ups: none for the inbox. Known limit: the new controls' look was checked only by the existing layout tests, not in a real browser.

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
    "reviewed_sha": "704235214d5cc72bfa83ecd0a5a26b4cecac18cf",
    "thread_id": "01a14915-2e3e-7c31-9492-69984079cb19",
    "seconds": 28,
    "usage": {
      "input_tokens": 259716,
      "cached_input_tokens": 209280,
      "cache_write_input_tokens": 0,
      "output_tokens": 774,
      "reasoning_output_tokens": 67
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T08:58:35.481Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs defines the eight editable settings and permitted picker choices; templates/panel.html renders their controls. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSetSetting uses setConfigText and commitTicketOnly, with a no-change check. Three passing AC2 tests cover line/comment preservation, config-only commits, no-op saves and refreshed displayed values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetSetting validates counts, choices, same-agent review and reviewer_model control characters before writing. Both AC3 tests passed, checking unchanged file/git state and visible refusal messages."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelSetSetting checks the current branch and config's git status before writing. The passing AC4 test covers another branch and both unstaged and staged config edits."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/panel.mjs checks origin and token before handling settings writes; panelSetSetting rejects keys outside EDITABLE. The passing AC5 integration test verifies 403 refusals and unchanged file/git state."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The eight permitted settings can be edited and saved as config-only commits. Validation, branch checks and request protection meet the ticket's requirements. All 22 tests in the supplied run passed; no blocking issues found."
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
    "reviewed_sha": "356a17ee83f48dff89e109fed52ba99493492b10",
    "merge": true,
    "thread_id": "01a14915-2e3e-7c31-9492-69984079cb19",
    "seconds": 14,
    "usage": {
      "input_tokens": 388572,
      "cached_input_tokens": 321280,
      "cache_write_input_tokens": 0,
      "output_tokens": 1262,
      "reasoning_output_tokens": 67
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:05:07.172Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs restricts editing to the eight listed settings and supplies the permitted reviewer and effort choices. templates/panel.html renders controls accordingly. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSetSetting uses setConfigText and commitTicketOnly, preserves no-op saves, and refreshes the view after success. All three AC2 tests passed, covering line preservation, config-only commits and displayed values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetSetting validates values and same-agent review before writing. Both AC3 tests passed, verifying refusal messages, preserved input and unchanged file/git state."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelSetSetting refuses saves off the base branch or with staged or unstaged config edits. The AC4 test passed and checks unchanged file/git state."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/panel.mjs checks origin and token before panelSettingRequest decodes or processes the request. The editable-key restriction remains enforced. The AC5 integration test passed, including forbidden requests and malformed encoding."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still meets all five criteria. Moving request handling preserves validation and security checks, and both test-suite failures found during shipping are fixed without weakening tests. The recorded run has 34 passes, three skips and no failures. No blocking issues found."
  }
}
```

</details>
