---
id: "0086"
title: Report the facts setup needs as JSON                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:56:49.065Z"

---
# 0086 · Report the facts setup needs as JSON

**Status:** 🔍 reviewing

## Problem
To set speck up through a conversation, the agent needs to know what's already in place: Node, git, the repo's state, which coding agents are installed and how the project runs its tests. Today it would have to work each of these out with its own commands, differently every time, and speck's own checks only print ✓ and ✗ for a person to read.

## Outcome
`speck detect` prints everything setup needs to know as one JSON object, without changing anything, so the setup skill can decide what to ask.

## Acceptance criteria
1. `speck detect` prints one JSON object and exits 0 in any folder, a git repo or not, and changes nothing in the folder or in git. It also works before speck is installed, as `npx github:luroai/speck detect`.
2. The object reports the operating system and whether speck supports it (macOS and Linux do); the Node.js version and whether it's 20 or newer; whether git is installed; and, for the folder, whether it's a git repo, whether it has commits, whether its tracked files have uncommitted changes, the current branch, which of `main` or `master` exists, and whether a git name and email are set.
3. It reports whether speck is installed in the folder (`speck/config.yml` exists) and, if so, the installed version from `.speck/VERSION`.
4. It reports, for `claude`, `codex`, `cursor-agent` and `gemini`, whether each is on the PATH, and for `codex`, whether it's signed in (as `speck doctor` checks it).
5. It suggests a test command and a `worktree_setup` from the project's files, or `null` when it finds none: `npm test` when `package.json` has a real `test` script (not npm's default "no test specified"), an install command matching the lockfile (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --frozen-lockfile` or `bun install`), `pytest` for a Python project that uses pytest, and `make test` for a `Makefile` with a `test` target.

## Out of scope
- Asking questions or changing anything: that's the setup skill (0088).
- Checking whether Claude Code is signed in.

## Notes
- The CLI never asks questions; the agent does. Everything here is a fact, not a decision.
- Missing tools and unknown values are `false` or `null` in the JSON, never errors.
- Checked 2026-10-10: `npx github:<owner>/<repo>` runs the package's `speck` bin with the given arguments, and `#<tag>` pins a git ref (npm 10 `package-spec` docs).
- Outside the ticket: `test/luro-0082.test.mjs` read the setup idea note from `speck/ideas/`, but b455507 filed it in `speck/ideas/done/`, so it and the two 0084 tests that run it failed on main. The test now reads it from `done/` (a path change only, the assertion is unchanged), so the suite is green for ship.
- Self-check: git status ran with optional locks off so it can't refresh the index (a test makes the index stale to prove it); package.json that's malformed, not an object or has `__proto__` scripts suggests nothing; the CLI uses nothing newer than Node 16, so an old Node can still report itself.
- Answered 2026-10-10 (blocked question): option (b) couldn't work, because `speck ship` refuses when files outside `speck/` changed after the approval, and the merge brought in nine. The user agreed to (a): one more review round on the merge, with `max_review_rounds` raised to 4 on this branch only and put back to 3 before close. `main` was merged again first, to bring in 0087 and 0091 (conflicts in `scripts/speck.mjs` and `docs/brief.md`, where both sides added a line; kept both).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 usesPytest searches arbitrary pyproject.toml text for the word pytest.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 2,383,184
- Elapsed since build started: 17 min
- Changed lines: 171 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: suggest the test command for the package manager the lockfile shows (`pnpm test`, `yarn test`, `bun test`), not always `npm test` (speck/ideas/2026-10-10-suggest-the-test-command-for-the-project-s-package-manager.md).
- Known limit: with several lockfiles, the first in a fixed order wins (pnpm, yarn, bun, npm), and `packageManager` in package.json isn't read.
- Known limit: a pyproject.toml that lists only a pytest plugin (such as `pytest-cov`) without pytest itself doesn't count as using pytest; multi-line TOML strings aren't parsed.
- Known limit: `test/luro-0082.test.mjs` reads an idea note by path, so filing that note broke it (fixed here). A test that reads a note could find it in either `speck/ideas/` or `speck/ideas/done/`.

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
    "reviewed_sha": "1975cf100ebc50ea89d83f9ce46988a017363038",
    "thread_id": "01a12623-27ec-77e2-9e0c-016ab1eae25b",
    "seconds": 36,
    "usage": {
      "input_tokens": 351674,
      "cached_input_tokens": 258816,
      "cache_write_input_tokens": 0,
      "output_tokens": 977,
      "reasoning_output_tokens": 86
    },
    "saved_at": "2026-10-10T14:07:16.589Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs cmdDetect emits JSON without requiring installation. AC1 tests exercise non-repos, missing git, symlinked package bin and unchanged repo snapshots including a stale index. Tests inspected; not rerun because they write temporary files."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "osFacts, nodeFacts and gitFacts report the required fields. AC2 tests exercise supported platforms, Node versions, staged and unstaged changes, unborn branches, detached HEAD and local/global identity."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "speckFacts reads speck/config.yml and .speck/VERSION. AC3 tests cover absent installation, missing version and installed version."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "agentFacts uses onPath for all four agents and codex login status, matching doctor’s authentication check. AC4 tests exercise absent/present tools and successful/failed login status."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "suggestCommands covers npm, lockfiles, pytest and Makefile targets with behavioural tests. However, usesPytest treats comments mentioning pytest as evidence. A read-only, in-memory reproduction with pyproject.toml containing '# pytest is not used here' returned test_command: 'pytest'."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/detect.mjs",
        "issue": "usesPytest searches arbitrary pyproject.toml text for the word pytest. A comment such as '# pytest is not used here' incorrectly suggests pytest, potentially overriding a valid Makefile test command. Existing negative tests do not cover comments.",
        "suggested_fix": "Restrict detection to actual pytest configuration or dependency declarations, ignoring comments and unrelated text. Add regression tests for a comment-only mention, both without another test command and alongside a Makefile test target.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The command reports the requested machine and project facts, and the tests meaningfully cover most behaviour. One fix is needed: a comment mentioning pytest can cause setup to recommend the wrong test command. I verified this without changing files; I did not rerun tests that create temporary files."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d1f0086e4d9aa8d3c5b42192926f753ecc3dc77f",
    "thread_id": "01a12623-27ec-77e2-9e0c-016ab1eae25b",
    "seconds": 34,
    "usage": {
      "input_tokens": 803556,
      "cached_input_tokens": 650624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1794,
      "reasoning_output_tokens": 138
    },
    "saved_at": "2026-10-10T14:10:10.213Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdDetect and gitFacts remain unchanged. test/detect-0086.test.mjs AC1 tests cover JSON output, non-repos, missing git, package-bin execution and unchanged folder/git snapshots."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "osFacts, nodeFacts and gitFacts report all required fields. AC2 tests cover platform/version support, tracked changes, branches, commits and git identity."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "speckFacts reports installation and reads .speck/VERSION. Both AC3 tests exercise absent and installed speck, including a missing version."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "agentFacts checks all four executables and codex login status. AC4 tests exercise PATH presence and successful/failed authentication checks."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "AC5 tests meaningfully cover command suggestions and the new comment regressions. However, usesPytest still matches arbitrary quoted text. An independent in-memory check with description = \"pytest alternative using unittest\" and a Makefile test target returned pytest instead of make test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/detect.mjs",
        "issue": "The comment cases are fixed, but detection still treats unrelated TOML strings as pytest dependencies. The pattern [\"']pytest\\b matches description = \"pytest alternative using unittest\", incorrectly overriding a valid Makefile test command. This leaves the original requirement to ignore unrelated text incomplete.",
        "suggested_fix": "Match pytest within dependency declarations or pytest configuration tables, rather than arbitrary quoted strings. Add a regression test for a project description beginning with pytest, alongside a Makefile test target.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The comment handling fix works, and the other four criteria remain satisfied. One related issue remains: a project description mentioning pytest can still produce the wrong test command. I confirmed this without writing files. The supplied suite reports no failures; I did not rerun tests that create temporary files."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "df202d168ff386d7b371ccc4668c206c222e8bce",
    "thread_id": "01a12623-27ec-77e2-9e0c-016ab1eae25b",
    "seconds": 28,
    "usage": {
      "input_tokens": 1222500,
      "cached_input_tokens": 1010816,
      "cache_write_input_tokens": 0,
      "output_tokens": 2683,
      "reasoning_output_tokens": 138
    },
    "saved_at": "2026-10-10T14:13:24.252Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs cmdDetect emits one JSON object without requiring installation. AC1 tests in test/detect-0086.test.mjs cover non-repos, missing git, package-bin execution and unchanged folder/git snapshots, including a stale index. Supplied results show all passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "osFacts, nodeFacts and gitFacts report all required fields. AC2 tests cover platform and Node support, commits, tracked changes, main/master, unborn branches, detached HEAD and local/global git identity; all pass in supplied results."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "speckFacts checks speck/config.yml and reads .speck/VERSION. AC3 tests cover absent installation, missing version and installed version; both pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "agentFacts checks all four executables through onPath and uses codex login status for authentication, matching doctor. AC4 tests cover missing/present tools and successful/failed authentication; both pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "suggestCommands and its helpers cover npm scripts, lockfile install commands, pytest and Makefile targets. AC5 tests include meaningful positive/negative fixtures and F1 regressions; all pass. Five independent in-memory checks also passed, confirming comments and descriptions do not override make test while actual pytest dependencies are recognised."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/detect.mjs",
        "issue": "Previously, comments and unrelated project strings could incorrectly suggest pytest and override make test. pyprojectUsesPytest now checks dependency contexts and pytest configuration; regression tests cover both reported cases.",
        "suggested_fix": "Completed: dependency-aware detection and regression coverage are present.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. The command reports the requested setup facts as JSON without changing the project. The incorrect pytest suggestions are fixed and covered by meaningful tests. Independent read-only checks passed; the supplied full suite reports 707 passes, no failures and three skips. I did not rerun tests that write temporary files."
  }
}
```

</details>
