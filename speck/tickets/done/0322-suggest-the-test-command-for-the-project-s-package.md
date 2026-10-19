---
id: "0322"
title: "Suggest the test command for the project's package manager"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-suggest-the-test-command-for-the-project-s-package-manager.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:27:12.678Z"
approved: "2026-10-19T07:29:46.358Z"
finished: "2026-10-19T07:32:13.597Z"

---
# 0322 · Suggest the test command for the project's package manager

**Status:** ✅ done

## Problem
`speck detect` suggests `npm test` for any project whose `package.json` has a real test script, even when the project uses pnpm, yarn or bun. Setup then offers a test command the project doesn't normally use, and the user has to correct it: Carbon, which uses pnpm, is one.

## Outcome
`speck detect` suggests the test command for the package manager the project uses.

## Acceptance criteria
1. With a real test script in `package.json`, `speck detect` suggests `pnpm test` when the project uses pnpm, `yarn test` when it uses yarn, `bun run test` when it uses bun (`bun test` would run Bun's own test runner, not the project's script), and `npm test` otherwise.
2. The package manager is the one `package.json`'s `packageManager` field names (for example `pnpm@9.1.0`), and when there's no such field, the one its lockfile shows, as the install command speck already suggests is chosen.
3. The suggested install command and test command always name the same package manager.
4. Projects without a real test script get the same suggestion as today.

## Out of scope
- Test runners other than a `package.json` test script.

## Notes
- From `speck/ideas/2026-10-10-suggest-the-test-command-for-the-project-s-package-manager.md`. Decided: `packageManager` wins over the lockfile when they disagree, as it's what the project says it uses.
- The suggestion is in `suggestCommands` in `scripts/detect.mjs`, which picks the install command from the first lockfile it finds.
- The Foreman (2026-10-19 07:09 UTC) asked you: For bun projects, should speck detect suggest 'bun run test' (recommended, as 'bun test' starts Bun's own test runner instead of the project's test script) rather than 'bun test' as criterion 1 says?. Why: The build found that criterion 1's 'bun test' would run the wrong tests for bun projects, and changing a criterion is the user's call, so it stopped without starting.
- Checked 2026-10-19: `bun test` runs Bun's built-in test runner, while `bun run test` runs `package.json`'s `test` script; `pnpm test` and `yarn test` run the script (found by the 0322 build).
- You dismissed the Foreman's question (2026-10-19 07:26 UTC): For bun projects, should speck detect suggest 'bun run test' (recommended, as 'bun test' starts Bun's own test runner instead of the project's test script) rather than 'bun test' as criterion 1 says?
- Failing before this build: none
- Criterion 4 is read as the test suggestion: with a packageManager that disagrees with the lockfile, the install command now follows packageManager too, so criterion 3 holds (a plain `<manager> install` when that manager has no lockfile).
- Self-check: made the packageManager match strict (`name@version` or a bare name, as Corepack writes it) instead of allowing spaces.

## In plain words
When you set speck up in a project that uses pnpm, yarn or bun, setup now offers that tool's test command (`pnpm test`, `yarn test` or `bun run test`) instead of always offering `npm test`. If the project says in its package file which tool it uses, speck goes by that, even when an older lock file from another tool is lying around. The install command it offers always names the same tool as the test command. Projects without a test script in their package file get the same suggestion as before. To see it, run speck's detect step in a pnpm project, such as Carbon, and look at the suggested test command. Worth watching: when the package file names one tool but only another tool's lock file is there, the install suggestion is a plain install, which may update the lock file the first time.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 91,872
- Elapsed since build started: 3 min
- Changed lines: 44 (limit 5000)
- Follow-ups:
  - Inbox: suggest `yarn install --immutable` for Yarn 2 and later (speck/ideas/2026-10-19-suggest-yarn-s-own-install-command-for-yarn-2-and-later.md).
  - Known limit: a `packageManager` speck doesn't know (such as `deno@2`) is ignored, and the lockfile decides.

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
    "reviewed_sha": "6de198267549ed6e03cee93e0a689336a24c6f90",
    "thread_id": "01a15310-74f3-7c63-bcac-33f75c654c70",
    "seconds": 17,
    "usage": {
      "input_tokens": 91363,
      "cached_input_tokens": 54272,
      "cache_write_input_tokens": 0,
      "output_tokens": 509,
      "reasoning_output_tokens": 22
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T07:29:26.865Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs: suggestCommands uses TEST_COMMANDS for all four managers. Passing 0322 AC1 tests cover every lockfile, the npm default and the pnpm CLI result."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "namedManager and suggestCommands prioritise packageManager, then the existing lockfile order. Both passing 0322 AC2 tests cover explicit names, conflicts, absent fields and unusable values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "suggestCommands selects both commands from the same manager and uses a plain install when only another manager's lockfile exists. Passing 0322 AC3 tests exercise manager and lockfile combinations."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "npmTest retains the existing real-script checks and suggestCommands retains pytest, Makefile and null fallbacks. Passing 0322 AC4 and existing detect-0086 tests cover these behaviours."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change suggests the project's package manager for test scripts, including the correct Bun script command. Explicit package manager declarations take priority over lockfiles, and install suggestions stay consistent. Existing test fallbacks are preserved. The recorded checks passed; no blocking issues found."
  }
}
```

</details>
