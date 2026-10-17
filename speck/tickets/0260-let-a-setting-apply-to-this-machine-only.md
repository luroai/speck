---
id: "0260"
title: "Let a setting apply to this machine only"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T09:22:07.848Z"
approved: "2026-10-17T09:32:55.745Z"

---
# 0260 · Let a setting apply to this machine only

**Status:** 👍 approved

## Problem
Some settings suit a machine rather than a project. `max_parallel_builds` of 4 suits a 16-core Linux box, but an 8 GB laptop needs 1 or 2, and today whatever is committed in `speck/config.yml` applies to every machine that checks the repo out.

## Outcome
`max_parallel_builds` and `max_parallel_tests` can be set for this machine only, kept out of git, and speck uses that value over the committed one on this machine.

## Acceptance criteria
1. `speck config set --machine max_parallel_builds 3` records 3 for this machine in a file git ignores, leaves `speck/config.yml` unchanged, commits nothing and prints `max_parallel_builds (this machine): 1 → 3`, giving the value speck used before.
2. With a machine value set, everything speck reads that setting for uses it instead of `speck/config.yml`'s value, from the main checkout and from every worktree of the repo. For example, `speck run` keeps up to 3 builds going.
3. `speck config set --machine max_parallel_builds ""` removes this machine's value, after which speck uses `speck/config.yml`'s value again.
4. `--machine` with any other setting is refused, naming the settings it can set, and changes nothing. A machine value is checked as `speck config set` checks the same setting.

## Out of scope
- The panel: 0261.
- Other settings for this machine only. Add them later if a case comes up.

## Notes
- `speck/.cache/` is git-ignored. Worktrees must read the main checkout's machine file, as the flaky log in `speck/.cache/flaky/` is shared.
- Config is read by `loadConfig` in `scripts/core.mjs`, and `speck config set` is in `scripts/config.mjs`. Update `speck config set`'s description in `docs/brief.md`.
- Failing before this build: none
- Self-check: kept the usage line `speck config set <key> <value>` as 0087's test reads it, adding `--machine` after it; `speck config set` of a shared value now says when this machine keeps its own value over it; a hand-edited bad machine value gives a plain error naming the fix, which `--machine` can still apply. The panel's Settings view still reads `speck/config.yml` alone (0261).

## In plain words
You can now tell speck how many builds and test runs to keep going at once on this computer alone, without changing the project's shared settings. A small laptop can run one build at a time while a bigger machine runs four, from the same project. To try it, set the number of builds for this machine, check that the shared settings file is unchanged and nothing new needs saving to git, then start speck run and watch it keep that many builds going. Clearing the value goes back to the shared setting. Worth knowing: the panel's Settings view still shows the shared values only, until the follow-up ticket adds this machine's values there.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 398,098
- Elapsed since build started: 11 min
- Changed lines: 96 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none new. The panel's Settings view reads `speck/config.yml` alone, so it doesn't show a machine value yet: that's 0261.

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
    "reviewed_sha": "8333a1232f12873704014b4b86ee79db34782edc",
    "thread_id": "01a1492e-0604-7a52-90ef-567d97f7e728",
    "seconds": 21,
    "usage": {
      "input_tokens": 144154,
      "cached_input_tokens": 111232,
      "cache_write_input_tokens": 0,
      "output_tokens": 728,
      "reasoning_output_tokens": 62
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:25:36.437Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs setMachine writes through sharedCacheDir without changing or committing shared config. Passing test '0260 AC1' checks ignored storage, unchanged config and HEAD, and exact old/new output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/core.mjs loadConfig overlays machine values using the main checkout identified by worktreeList. runOn uses this config through maxParallelBuilds; the test queue uses maxParallelTests. Passing test '0260 AC2' verifies both values from the main checkout and a worktree."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/config.mjs setMachine deletes a blank setting and removes the file when empty. Passing test '0260 AC3' verifies fallback, preservation of the other override and repeated removal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "setMachine restricts keys to MACHINE_SETTINGS and validates through checkConfigValue. Three passing '0260 AC4' tests cover rejected keys, unchanged files, matching validation errors and recovery from an invalid hand-edited value."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The two parallelism settings can now apply only to this machine, with values shared across its worktrees and kept out of git. Clearing a value restores the project setting. All 56 reported tests passed; the code and tests support all four criteria. No blocking issues found."
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
    "reviewed_sha": "1d965cbb6e0dd1f56e63c10eed586745fa303aab",
    "merge": true,
    "thread_id": "01a1492e-0604-7a52-90ef-567d97f7e728",
    "seconds": 13,
    "usage": {
      "input_tokens": 252048,
      "cached_input_tokens": 208768,
      "cache_write_input_tokens": 0,
      "output_tokens": 1168,
      "reasoning_output_tokens": 62
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:32:53.418Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs setMachine still writes ignored machine storage without modifying shared config or committing. Passing test '0260 AC1' verifies storage, git status, HEAD and old/new output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/core.mjs loadConfig calls machine.mjs applyMachineConfig; machineConfigFile resolves the main checkout. run.mjs uses the extracted maxParallelBuilds. Passing test '0260 AC2' checks both parallelism settings from the main checkout and a worktree."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "setMachine removes blank overrides and deletes the empty machine file. Passing test '0260 AC3' checks fallback to shared values, preservation of the other override and repeated removal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "setMachine restricts keys to MACHINE_SETTINGS and uses checkConfigValue. All three '0260 AC4' tests pass, covering unsupported settings, validation without changes and repair of invalid machine values."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The extraction preserves the machine settings behaviour and fixes the file-size failure without weakening tests. The merge retains both machine-setting commands and config show. The reported checks passed: 76 tests passed, three skipped and none failed. No blocking issues found."
  }
}
```

</details>
