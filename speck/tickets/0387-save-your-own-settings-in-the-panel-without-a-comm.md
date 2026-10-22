---
id: "0387"
title: "Save your own settings in the panel without a commit"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-change-your-own-settings-without-a-commit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0386","0385"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:11:40.614Z"
approved: "2026-10-22T23:29:04.766Z"

---
# 0387 · Save your own settings in the panel without a commit

**Status:** 👍 approved

## Problem
The panel's Save commits speck/config.yml to `main` for every setting except the two this machine can hold. It refuses to save while that file has uncommitted changes, so a change made with `speck config set` blocks the panel until someone commits it.

## Outcome
Saving your own settings in the panel makes no commit.

## Acceptance criteria
1. In Settings, saving a change to one of your own settings (0386's list) saves it for this machine. It changes nothing in speck/config.yml, makes no commit, and doesn't ask where the change should go.
2. Saving only your own settings works while speck/config.yml has uncommitted changes, and leaves those changes as they are.
3. A change to any other setting is saved to speck/config.yml and committed as today, and is still refused while that file has uncommitted changes. A Save with both kinds saves each where it belongs, or saves nothing if either is refused.
4. Each of your own settings shows whether its value is this machine's or speck/config.yml's. One this machine holds can be cleared back to speck/config.yml's, as 0261 does for the parallel limits. The line at the top of Settings says which settings saving commits.
5. No test that passed before this change fails, except checks that your own settings are committed, or that you're asked where they go, which are changed to check criteria 1 and 4.

## Out of scope
- Which settings are your own, and how speck reads them: 0386.
- Editing speck/config.yml's defaults for your own settings from the panel.

## Notes
- Checked 2026-10-22: `panelSaveSettings` in `scripts/settings.mjs` commits speck/config.yml for every change not marked for this machine, and refuses with 409 while `git status` shows the file changed. In `templates/panel.html`, `settingScope` (0261) asks where a change to a setting this machine can hold goes.
- Waits for 0386, and for 0385, which also changes `templates/panel.html`.
- Failing before this build: none
- The panel now saves every one of your own settings (0386's list) for this machine, whatever the Save says for it, so a cached page sending `repo:` for one saves it for this machine too. `machine:<key>=` with a blank value still clears this machine's value (0261, as `speck config set --machine <key> ""`), so a blank value for this machine, such as reviewer_model left at the reviewer's default while speck/config.yml names one, is sent as `blank:<key>=`.
- Switching the builder now saves its build_command for this machine with it, as `speck config set builder` does (0386), and clearing this machine's builder clears that build_command too. The auto_ship confirmation (0259), the same-model check (0280) and the hand-set build_command confirmation (0293) all apply to your own settings, checked against the values speck uses.
- Existing tests changed under criterion 5, each because it checked that one of your own settings is committed or that you're asked where it goes: 0258 AC2, AC4 and AC5, 0259 AC1 (both) and AC2, 0261 AC1, AC2 (both) and AC4, 0274 AC2 (three), AC4 (three), 0275 AC2, 0276 AC2, 0293 AC1 and AC3, 0311 AC1 and AC1/3/4 (whose `setCfg` now also removes this machine's values, so the file's apply), and 0370 AC2. Where a test used one of your own settings only as an example of a committed setting, it now uses `ship_mode` or a `limits.` setting, keeping its checks; where it checked the commit itself, it now checks this machine's value and that git is unchanged.
- The brief's and README's description of the panel's Save now say your own settings are saved for this machine without a commit; they described the old question.
- Self-check: no changes.

## In plain words
Saving in the panel's Settings no longer makes a commit for your own settings: who builds and reviews, their models and effort, auto-ship, the Foreman and how many builds and test runs go at once. They're kept on this computer only, just as `speck config set` keeps them, and the panel no longer asks whether a change is for this machine or the repo. Only the project's settings, such as the ticket size limits and how tickets ship, are still committed, and the line at the top of Settings names them. Because your own settings make no commit, saving them works even when the project's settings file has changes that aren't committed yet. Each of your own settings is marked "this machine" or "repo", and one this machine holds can be cleared back to the project's value. To see it, open Settings, change the reviewer's effort and save: nothing new appears in git, and the setting is marked "this machine". Worth knowing: the panel can't change the project's defaults for your own settings any more; `speck config set --repo` does that.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Clearing auto_ship_risk never saves: settingChanges represents clearing with value='', and sendSettings treats it as an invalid empty risk selection.; F2 shipsMore uses the blank clear payload instead of the resulting repo value.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,417,825
- Elapsed since build started: 17 min
- Changed lines: 205 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: the panel can no longer change speck/config.yml's defaults for your own settings (out of scope here); `speck config set --repo` still does.
- Tidy-up: every one of your own settings now carries a "repo" mark when it uses speck/config.yml's value, which with "default" reads "REPO DEFAULT"; the marks could be merged if it feels busy.
- No inbox notes: neither needs its own ticket.

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
    "reviewed_sha": "edc33985c7809417fe8e0c56928deb1de355435d",
    "thread_id": "01a165eb-de55-7dc1-b1e8-1b20925ebb94",
    "seconds": 37,
    "usage": {
      "input_tokens": 315905,
      "cached_input_tokens": 244864,
      "cache_write_input_tokens": 0,
      "output_tokens": 1175,
      "reasoning_output_tokens": 123
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:22:36.186Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelSaveSettings routes own settings to saveMachineValues; passing 0387 AC1 tests cover unchanged config and HEAD, automatic machine scope, and blank values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0387 AC2 test verifies saves with uncommitted config changes and off the base branch leave git unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0387 AC3 tests cover mixed saves, config-only commits, dirty-config refusal and validation refusing the whole Save."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The source labels and clear controls are covered, but sendSettings rejects clearing auto_ship_risk, and shipsMore interprets clearing auto_ship as false instead of using repo_value. These prevent some machine values being cleared through Settings."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified supplied output: 202 passed, zero failed, three skipped. Existing test changes replace the old commit and scope expectations consistently with the ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clearing auto_ship_risk never saves: settingChanges represents clearing with value='', and sendSettings treats it as an invalid empty risk selection. A read-only fake-page reproduction produced no POST and the 'Tick at least one risk' error.",
        "suggested_fix": "Exclude clear operations from empty-selection validation and add a page test that clears this machine's auto_ship_risk back to the repo value.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "shipsMore uses the blank clear payload instead of the resulting repo value. Clearing machine auto_ship=false when config.yml has true therefore sends no confirmation. The server correctly refuses it, but repeated Saves cannot produce the required confirmation, so the user cannot clear the override.",
        "suggested_fix": "Calculate shipping changes using repo_value for clear operations, including auto_ship_risk. Test clearing overrides when that enables shipping or expands the covered risks, with confirmation and cancellation.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Personal settings now save locally without commits, and mixed saves retain the existing protections. The reported tests pass, but clearing shipping overrides is broken in the panel. Fix those clear paths before merging."
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
    "reviewed_sha": "b20b8caf9abdd3b4af0302803c6f11cd9694d75d",
    "thread_id": "01a165eb-de55-7dc1-b1e8-1b20925ebb94",
    "seconds": 17,
    "usage": {
      "input_tokens": 466703,
      "cached_input_tokens": 388864,
      "cache_write_input_tokens": 0,
      "output_tokens": 1756,
      "reasoning_output_tokens": 123
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:23:46.895Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSaveSettings saves own settings through saveMachineValues. Passing 0387 AC1 tests verify unchanged config and HEAD, automatic machine scope, no scope question, and blank values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0387 AC2 test verifies own-settings saves work with uncommitted config changes and off the base branch, leaving git unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSaveSettings validates before writing and retains branch and dirty-config checks for repo changes. Passing 0387 AC3 tests cover mixed saves, config-only commits, and refusing all changes when either kind is invalid."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0387 AC4 tests cover source labels, clearing overrides, and the line naming committed settings. New regression tests exercise clearing shipping risks and confirming or cancelling a clear that enables shipping. shipsMore now uses repo_value for clears."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified current test output: 204 passed, zero failed, three skipped. Existing test changes retain their checks while updating the former commit and scope expectations."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clearing auto_ship_risk was incorrectly rejected as an empty risk selection.",
        "suggested_fix": "Implemented: sendSettings excludes clear operations from empty-selection validation; a passing page regression test verifies the clear request is sent.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clearing a shipping override used the blank request value when deciding whether confirmation was needed.",
        "suggested_fix": "Implemented: shipsMore uses repo_value for clear operations, and cancellation clears the pending operation. Passing tests cover confirmation, cancellation and server enforcement.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Personal settings save for this machine without commits, while shared settings retain the existing commit and refusal rules. Both problems with clearing shipping overrides are fixed. All five criteria pass, with no blocking findings remaining."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "db33dfd286a01b751f4fc5897690e20019244e3c",
    "merge": true,
    "thread_id": "01a165eb-de55-7dc1-b1e8-1b20925ebb94",
    "seconds": 15,
    "usage": {
      "input_tokens": 629968,
      "cached_input_tokens": 544896,
      "cache_write_input_tokens": 0,
      "output_tokens": 2318,
      "reasoning_output_tokens": 123
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:29:01.793Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelSaveSettings still routes own settings to saveMachineValues. Passing 0387 AC1 tests verify no config change or commit, automatic machine scope, and blank-value handling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0387 AC2 test verifies saves with uncommitted config changes and off the base branch leave git unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0387 AC3 tests cover config-only commits, mixed saves, dirty-config refusal and saving nothing when validation fails. This round changes only label rendering."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0387 AC4 tests cover source labels, clearing overrides, the commit explanation, and shipping confirmation or cancellation. settingMark preserves label text while rounding its width."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified current output: 227 passed, zero failed, three skipped. The previously failing 0281 browser layout test now passes across its tested widths and pixel ratios; no tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clearing auto_ship_risk was incorrectly rejected as an empty risk selection.",
        "suggested_fix": "Fixed: clear operations bypass empty-selection validation, with a passing page regression test.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clearing a shipping override used the blank request value when deciding whether confirmation was needed.",
        "suggested_fix": "Fixed: confirmation uses repo_value for clears, with passing confirmation, cancellation and server-enforcement tests.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Personal settings save locally without commits, and shared settings retain their existing protections. The label alignment regression found during shipping is fixed without weakening tests. All criteria pass, with no blocking findings."
  }
}
```

</details>
