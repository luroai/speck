---
id: "0487"
title: "Rename the Foreman's settings to watch"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0485", "0486"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T19:26:36.248Z"

---
# 0487 · Rename the Foreman's settings to watch

**Status:** 🔍 reviewing

## Problem
The settings for what speck does when work stops are named after the Foreman: `foreman_fixing`, `foreman`, `foreman_model` and `foreman_effort`. Settings shows those names, so the Foreman lives on there after the panel and the messages stop using it.

## Outcome
The settings are called `watch`, `watch_agent`, `watch_model` and `watch_effort`, and a config that still has the old names works as before.

## Acceptance criteria
1. speck reads `watch` (`off`, `tell` or `fix`), `watch_agent`, `watch_model` and `watch_effort` with the same values, defaults and meanings that `foreman_fixing`, `foreman`, `foreman_model` and `foreman_effort` have today, from `speck/config.yml` and from this machine's own settings.
2. A config that sets only an old name behaves exactly as if it set the new one, and where both are set the new name wins. `speck config set` with an old name saves the new name and leaves no line with the old name for that setting.
3. Settings shows and saves only the new names. Their explanations say speck where they said the Foreman, and the role's list, models and effort work as before (0400, 0402).
4. `speck status`, `speck config`, and every message that names one of these settings use the new name, and a new `speck/config.yml` from `templates/config.yml` has the new names with their comments. No test that passed before this change fails.

## Out of scope
- Rewriting existing config files: the old names are read, not changed, until `speck config set` or Settings saves one.
- The README, the brief and the setup skill (0488).

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: `SETTING_GROUPS` in `scripts/settings.mjs`, the kinds in `scripts/config.mjs`, `foremanAgentOf`, `FIXING` in `scripts/foreman.mjs`, `templates/config.yml`, and `AGENT_KEYS`, `SETTING_PAIRS`, `ROLE_PAIRS` and `ROLES` in `templates/panel-settings.js`. This repo's own `speck/config.yml` has no Foreman settings.
- Waits for 0485 (Settings' group title and the role's name in `templates/panel-settings.js`) and 0486 (messages that name `foreman_fixing`).
- Failing before this build: none
- Self-check: no changes. The readers of these settings (fixingOf, foremanAgentOf, foremanArgv) take a config object with either name, the new one winning, so a config read some other way than loadConfig keeps working.

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
    "reviewed_sha": "b14533809981a5750cbff3ff9094c846fdbd2740",
    "session": "fresh",
    "thread_id": "01a16f6f-febc-7ea2-83b2-bf94a6449e24",
    "builder_response": "- Tests run: test/watch-settings-0487.test.mjs, every existing test file this change edited, and (via --related) every test file naming a changed file. 1710 pass, 0 fail.\n- Approach: core.mjs has RENAMED (old → new) and parseConfig/renameOld, used by loadConfig and machineConfig, so each layer (speck/config.yml, this machine's file) reads an old name as the new one, the new name winning within a layer; this machine's value still goes over the project's as before. The readers (fixingOf, foremanAgentOf, foremanArgv) also take a raw config object with either name via setting(), new winning.\n- speck config set: an old name is mapped to the new one (settingName) for both --repo and this machine; setConfigText drops old-name lines for that setting, turning the last into the new name's line in place (keeping its comment) when the new name isn't there yet. A machine save rewrites the file from machineConfig, so old names go.\n- Settings: SETTING_GROUPS, EDITABLE, choices, MACHINE_SETTINGS and panel-settings.js's role keys use the new names; the old ones are refused by the panel's save (403, as any non-editable key).\n- Existing tests: many set the old names on top of a loaded config (where the file's own new name now wins), or name the settings' keys; these were moved to the new names. Tests that check the README, brief, changelog and setup skill were left on the old names: those documents are 0488's.\n- Left as is: internal identifiers such as `by: 'foreman'`, the settings API's `foreman_models` field, and the status line's \"Fixing on\" word, none of which is a setting's name.\n- Pictures: the Settings view's Watching group, light and dark, read from this repo's own config, which still uses the old names.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 299999,
      "cached_input_tokens": 217472,
      "cache_write_input_tokens": 0,
      "output_tokens": 939,
      "reasoning_output_tokens": 122
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:43:17.202Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "core.mjs parseConfig/loadConfig and machine.mjs machineConfig normalise both configuration layers. The passing 0487 AC1 tests cover values, defaults and agent arguments."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "core.mjs renameOld/setting prefer new names; config.mjs cmdConfig/dropOldNames translate writes and remove aliases. Passing 0487 AC2 tests exercise compatibility, precedence and repository/machine saves."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "settings.mjs and panel-settings.js use the new setting and role keys. Passing 0487 AC3, 0400 and 0405 tests cover display, saves, model lists and effort controls."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The config template and setting-related messages use watch names. Passing 0487 AC4 tests cover template facts and config output; the supplied test results report 1710 passes and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/settings-models-0369.test.mjs",
        "issue": "The migrated AC3 test no longer exercises switching speck's agent. Its fixture and changeTo call still use 'foreman', while production reads 'watch_agent'. Both the expected and actual watch_model lists therefore use the default Claude agent, so their equality passes without checking the selected Codex or Cursor models.",
        "suggested_fix": "Change the fixture's setting key and changeTo call to watch_agent, and assert the selected agent's actual model slugs or requested catalogue. Also update the stale 'foreman' setting fixture in settings-builder-effort-0402.test.mjs.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The rename and backwards compatibility appear to work, and the reported tests pass. One existing test was accidentally weakened during migration: it now compares default model lists instead of checking agent switching. Fix that test before merge."
  }
}
```

</details>
