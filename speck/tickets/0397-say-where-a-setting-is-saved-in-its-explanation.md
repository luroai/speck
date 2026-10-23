---
id: "0397"
title: "Say where a setting is saved in its explanation"                # one outcome, no "and"
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
after: ["0396"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:24:22.591Z"

---
# 0397 · Say where a setting is saved in its explanation

**Status:** 🔍 reviewing

## Problem
Settings marks rows "repo", "repo default", "default" and "this machine", and opens with a paragraph starting "What speck uses now…". The marks and the paragraph confuse more than they explain.

## Outcome
Each setting's explanation says where a change to it is saved, and the rows and the top of Settings carry no such marks.

## Acceptance criteria
1. No setting's row shows a "repo", "repo default", "default" or "this machine" mark.
2. Each setting's explanation ends by saying where a change to it is saved: for your machine only, without a commit, or for the project in speck/config.yml, with a commit. It also says what speck uses when the setting is left blank.
3. When a setting's value is this machine's own, over the project's, its explanation says so and offers to clear it back to the project's value, as the row does today (0261).
4. The paragraph starting "What speck uses now" is gone, and nothing replaces it.
5. No test that passed before this change fails, except checks of the marks and the paragraph, which are changed to check these criteria.

## Out of scope
- The agent and model lists: 0399 and 0400.

## Notes
- Checked 2026-10-23: the marks come from `span.default` in each row in `templates/panel.html` (0261, 0273), and the paragraph from the text beginning "What speck uses now" (0387).
- This covers `speck/ideas/2026-10-22-keep-settings-still-when-a-setting-s-button-is-pressed.md`, whose buttons go here, which the user dropped on 2026-10-23.
- Waits for 0396: both change Settings in `templates/panel.html`.
- Failing before this build: none
- Self-check: `speck config show` read its explanations from the panel's, so it would have printed the panel's "A change here is saved…" ending: it now keeps the plain explanation. The brief's Settings entry still described the "default" label, the per-row marks and the top line: updated.

## In plain words
Settings is quieter. The small "repo", "default" and "this machine" labels beside each value are gone, and so is the paragraph at the top. Instead, each setting's explanation (its "i" button) ends by saying what speck uses when it isn't set, and whether a change is saved just for your machine, with no commit, or for the whole project in speck/config.yml, with a commit. When your machine has its own value for a setting, the explanation says so, shows the project's value and has the button to clear yours. To see it, open Settings and press the "i" beside any setting. `speck config show` prints the explanations as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- Pressing Clear or Keep in an explanation redraws Settings, so the keyboard focus doesn't stay on the button. The explanation stays open to show the result.
- Auto-build's explanation doesn't say where it's saved, because it isn't a saved setting: it starts or stops speck run.

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
    "reviewed_sha": "effb6567c5481d2ab0ae42ffa59cb474a7cb4283",
    "session": "fresh",
    "thread_id": "01a16850-6cf9-7fe3-b419-5d6160530e40",
    "builder_response": "- Tests run: test/settings-0397.test.mjs test/panel-0257.test.mjs test/panel-0261.test.mjs test/panel-0273.test.mjs test/panel-0274.test.mjs test/panel-0368.test.mjs test/settings-0387.test.mjs test/config-show-0269.test.mjs (plus the repo checks speck adds). I also ran every test file that opens Settings (45 files, 545 passing, 3 skipped) before committing.\n- Round 1. Notes on the approach:\n  - AC2: the server appends the ending (`explainFully` in scripts/settings.mjs): \"When it isn't set, speck uses <default>.\" for settings whose default isn't blank (the blank-default ones already say what blank does), then where a change is saved. A machine setting gives \"for your machine only, without a commit\", any other editable one \"for the project in speck/config.yml, with a commit\", and allow_same_model_review, which can't be changed in the panel, says it's changed in speck/config.yml with a commit. `speck config show` keeps the plain explanation, because \"A change here\" only makes sense in the panel.\n  - AC3: the 0261 machine line and its Clear/Keep buttons now sit at the end of the explanation, not the row. The pointer gets SETTING_TIP_PAUSE to cross from the info button to it, and the focus can move into it without closing it. Pressing Clear or Keep keeps the explanation open to show the result.\n  - AC5: older tests that checked the marks or the top line (0257, 0261, 0273, 0274, 0368, 0387) now check that there are none, and that the explanation carries the machine value and its button. 0257 AC3 and 0269's test of config show compare against the right explanation.\n  - docs/brief.md's Settings entry no longer describes the \"default\" label, the marks or the top line.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 131254,
      "cached_input_tokens": 78976,
      "cache_write_input_tokens": 0,
      "output_tokens": 667,
      "reasoning_output_tokens": 72
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T10:31:20.918Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: settingRow no longer renders setting marks; their helper and CSS were removed. Passing test '0397 AC1' checks machine, project and default values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/settings.mjs: explainFully appends the saving location and non-blank defaults; SETTING_GROUPS already explains blank model, agent and effort values. Both '0397 AC2' tests passed, covering every configured setting and rendering the supplied explanation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: settingInfo includes machineLine or clearLine inside the explanation, retaining the project's value and Clear/Keep actions. Both '0397 AC3' tests passed, checking clearing on Save and pointer/focus movement into the explanation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: renderSettings no longer inserts the introductory paragraph, and settingsLine was deleted. Passing test '0397 AC4' checks its removal."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported round results: 180 passed, 3 skipped, no failures across the ticket tests, changed existing tests, config-show tests and repository checks. Updated assertions reflect the removed marks and relocated controls; no unrelated fixes were found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now explains where changes are saved and what applies when a value is unset. The confusing row labels and introductory paragraph are removed. Machine overrides can still be cleared from their explanations. The reviewed tests pass, and no blocking concerns were found."
  }
}
```

</details>
