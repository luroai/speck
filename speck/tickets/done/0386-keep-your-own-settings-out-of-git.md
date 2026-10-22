---
id: "0386"
title: "Keep your own settings out of git"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-change-your-own-settings-without-a-commit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:58:32.613Z"
approved: "2026-10-22T23:08:43.919Z"
finished: "2026-10-22T23:11:28.597Z"

---
# 0386 · Keep your own settings out of git

**Status:** ✅ done

## Problem
Every setting lives in speck/config.yml, which is committed. Choosing which agent builds or reviews, or turning auto-ship on, means a commit to `main` that then goes out with the next ship's push. Running builds don't see the change, because they read the copy in their own worktree.

## Outcome
Your own settings are kept for this machine in a file git ignores, and speck/config.yml keeps only the project's own settings and defaults.

## Acceptance criteria
1. Your own settings are builder, builder_model, build_command, resume_command, reviewer, reviewer_model, reviewer_effort, allow_same_model_review, auto_ship, auto_ship_risk, foreman, foreman_model, foreman_effort, foreman_fixing, max_parallel_builds and max_parallel_tests. `speck config set <key> <value>` for one of them saves it for this machine. It leaves speck/config.yml unchanged and commits nothing. Switching the builder this way also saves the new build_command for this machine, as it's set in speck/config.yml today (0293).
2. Every speck command, in the main checkout and in every worktree, uses this machine's value over speck/config.yml's. That includes a build or review round already running, from the next time it reads its settings. A setting with no value for this machine uses speck/config.yml's, as today.
3. Each value is checked and refused with the same message as `speck config set` gives today. It reads back exactly as given, including text with spaces or quotes and a list such as `auto_ship_risk: [low, high]`. `speck config set --repo <key> <value>` changes speck/config.yml's value instead, as `speck config set` does today. `--machine` still works, and `--machine <key> ""` removes this machine's value.
4. Every other setting, such as commands, limits, base_branch and ship_mode, is set in speck/config.yml as today, and `--machine` still refuses it. `speck config show` marks each value that comes from this machine.
5. The README's and the brief's description of settings says which are your own, where they're kept, and how to change speck/config.yml's defaults (checked by review). No test that passed before this change fails.

## Out of scope
- The panel's Settings view: 0387.
- Tickets copying the builder and reviewer: 0388.
- Moving values out of speck/config.yml. Its values stay as the project's defaults, and nothing is migrated.

## Notes
- Checked 2026-10-22: `MACHINE_SETTINGS` in `scripts/machine.mjs` holds only max_parallel_builds and max_parallel_tests (0260). Their values are kept in the main checkout's `speck/.cache/machine/config.yml`, which every worktree reads, and `loadConfig` in `scripts/core.mjs` puts them over speck/config.yml's. `saveMachineValue` writes `key: value` unquoted, and `applyMachineConfig` accepts only whole numbers, so both need to handle text, true/false and lists.
- Checked 2026-10-22: `speck config set builder <name>` sets build_command in the same change (0293), in `scripts/config.mjs`.
- Assumption: review_timeout_minutes, test_stall_minutes and ship_wait_minutes stay project settings.
- From the user's request on 2026-10-22, for 0.13.0. 0375 waits for it.
- Failing before this build: none
- Existing tests that ran `speck config set` for one of the sixteen settings and expected speck/config.yml to change (0087, 0109, 0260, 0293, 0311) now pass `--repo`, as criterion 1 makes the plain command save for this machine. Their checks are otherwise unchanged. 0260 AC4's refused key `reviewer` is now `base_branch`, since `reviewer` is one of your own settings.
- The panel keeps 0261's two machine settings until 0387 moves it to all of them.
- Self-check: removing this machine's builder with `--machine builder ""` now also removes the build_command switching to it saved, so speck/config.yml's pair applies again.

## In plain words
Choosing who builds and reviews, their models, auto-ship, the Foreman and how many builds and test runs go at once are now your own settings. Changing one with `speck config set` keeps it on this computer only: nothing is committed, and nothing goes out with the next ship. Builds already running pick up the change the next time they read their settings. The project's file still holds the defaults everyone else gets, and `speck config set --repo` changes those. To see it, run `speck config set reviewer claude`, then `git status` (nothing changed) and `speck config show`, which marks the value as this machine's own. Worth knowing: the panel's Settings view still only saves the two parallel limits for this machine; 0387 brings it in line.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 config show omits build_command and resume_command entirely, even when they have machine overrides.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 594,182
- Elapsed since build started: 10 min
- Changed lines: 154 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-22-decide-where-setup-saves-the-agents-it-picks.md (setup's `speck config set` calls now save its agent choices for this machine only).
- speck/ideas/2026-10-17-show-this-machine-s-values-in-speck-config-show.md looks covered by this ticket's AC4; worth checking when triaging.
- Known limit: a machine value edited by hand is checked only for its kind (text, true/false, whole number, risks), not against every rule `speck config set` applies.

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
    "reviewed_sha": "df700b655229aee4410fb17a60b6ed090201599e",
    "thread_id": "01a165dd-ee9d-7942-af16-cfae1dabf357",
    "seconds": 32,
    "usage": {
      "input_tokens": 235996,
      "cached_input_tokens": 179712,
      "cache_write_input_tokens": 0,
      "output_tokens": 913,
      "reasoning_output_tokens": 30
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:07:17.796Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs routes all sixteen own settings to setMachine; setBuilder saves its associated build_command. Reported AC1 tests exercise persistence, unchanged repo config and no commits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/core.mjs loadConfig calls applyMachineConfig on each read. The passing AC2 test checks main checkout, worktree, fallback and subsequent updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "setMachine uses checkConfigValue; saveMachineValues uses yamlValue and verifies round trips. Passing AC3 tests cover refusal messages, quotes, spaces, lists, --repo and removal."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "cmdConfigShow maps only panelSettings groups. SETTING_GROUPS omits build_command and resume_command, so neither machine value is displayed or marked. The passing show test covers only reviewer and auto_ship."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README's 'Your own settings' passage and the brief's config command entry explain the sixteen settings, ignored shared file and --repo defaults. Reported tests: 241 passed, zero failed, three skipped; existing test changes preserve their assertions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs",
        "issue": "config show omits build_command and resume_command entirely, even when they have machine overrides. Criterion 4 requires each machine-sourced value to be marked. These omissions also hide the build_command saved automatically when switching builder.",
        "suggested_fix": "Include both settings in CLI text and JSON output, with their effective values and machine-source markers. Add coverage checking all sixteen machine settings. Keep the panel changes within the stated scope.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Personal settings are saved outside git and shared across worktrees, with validation and repository defaults preserved. One required detail is missing: config show hides the personal build and resume commands. Fix that visibility gap before merge."
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
    "reviewed_sha": "2c105aa539770190ec66a382048385f618301099",
    "thread_id": "01a165dd-ee9d-7942-af16-cfae1dabf357",
    "seconds": 17,
    "usage": {
      "input_tokens": 355855,
      "cached_input_tokens": 292992,
      "cache_write_input_tokens": 0,
      "output_tokens": 1418,
      "reasoning_output_tokens": 30
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:08:25.343Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "config.mjs routes the sixteen own settings to machine storage; setBuilder saves the associated build_command. Passing AC1 tests check persistence, unchanged repository config and no commits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "core.mjs loadConfig applies machine overrides on each read. The passing AC2 test checks main checkout, worktree, fallback and subsequent updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "setMachine uses checkConfigValue; saveMachineValues verifies serialisation round trips. Passing AC3 tests cover validation messages, spaces, quotes, lists, --repo, --machine and removal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdConfigShow now includes machine-held build_command and resume_command in text and JSON. The new passing AC4 test checks values and machine markers for all sixteen settings. Existing tests cover repository settings and --machine refusals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README's 'Your own settings' passage and the brief's config command entry explain personal settings, their ignored storage and --repo defaults. Reported checks: 242 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs",
        "issue": "config show previously omitted machine-held build_command and resume_command.",
        "suggested_fix": "Completed: both commands are included with effective values and machine-source markers; the new test covers all sixteen settings.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Personal settings stay out of git and apply across worktrees, while project defaults remain available. The missing commands now appear in config show, with coverage for all sixteen settings. All criteria pass; no blocking concerns remain."
  }
}
```

</details>
