---
id: "0113"
title: "Run only the ticket's own tests until the final run"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:12:02.019Z"
finished: "2026-10-11T10:21:09.434Z"

---
# 0113 · Run only the ticket's own tests until the final run

**Status:** ✅ done

## Problem
While writing tests and fixing code, a build re-runs the whole suite each time, though only the ticket's own tests are changing. Each run costs about 100 seconds here, and the full suite only needs to run when the work is finished.

## Outcome
Builds run only the ticket's own test files while they work, and the whole suite only at the points where it counts.

## Acceptance criteria
1. A new setting, `commands.test_files`, holds a command that runs given test files, with `{files}` standing for them (for example `node --test {files}`). It's in the config template with a comment and blank by default, and `speck config set` accepts it.
2. `speck test --files <file>…` runs `commands.test_files` with those files and exits with its exit code. When `commands.test_files` is blank, it runs `commands.test` instead, saying so in one line.
3. The build skill runs only the ticket's own test files, through `speck test --files`, when it checks that the new tests fail and while fixing until they pass.
4. The build skill still runs the whole suite (`speck test`) before the build changes anything (the "failing before" step), once the ticket's own tests pass, before every review round and after merging the base branch in. Shipping still runs the whole suite.

## Out of scope
- Reusing earlier results (0112).
- Making the suite itself faster.

## Notes
- `/speck-setup` doesn't need to ask for `commands.test_files`: blank falls back to the whole suite.
- Failing before this build: none (speck test reused the passing result recorded for commit dabe9cd, the same code outside speck/).
- `speck test --files` runs without a test turn and records no result: `max_parallel_tests` counts full runs, and a few files' result isn't the suite's. This repo's own `speck/config.yml` now sets `commands.test_files: node --test {files}`.
- Self-check: a file name starting with `-` is now passed as `./-…` so it isn't read as an option, and `{files}` is replaced with a function so `$&` in a name isn't expanded (test added for both).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 442,202
- Elapsed since build started: 9 min
- Changed lines: 39 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none. Known limit: `speck test --files` doesn't take a `max_parallel_tests` turn, so several builds' partial runs can overlap with a full run.

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
    "reviewed_sha": "21074fcd5bea119b9a34f736277782cad04f65d8",
    "thread_id": "01a12a7a-7b56-7220-9e5d-a392444a7fca",
    "seconds": 30,
    "usage": {
      "input_tokens": 441480,
      "cached_input_tokens": 324992,
      "cache_write_input_tokens": 0,
      "output_tokens": 722,
      "reasoning_output_tokens": 53
    },
    "saved_at": "2026-10-11T10:21:02.614Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/config.yml defines test_files as blank with a {files} comment. scripts/config.mjs accepts and validates commands.test_files. The three AC1 tests in test/files-0113.test.mjs cover these behaviours and passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/turns.mjs cmdTest substitutes shell-quoted file paths, returns the command's exit code and announces the blank-setting fallback. AC2 CLI tests cover selection, exit codes, fallback, subfolder paths, special characters and missing arguments; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md sections 2 and 3 require speck test --files for the initial failing tests and implementation iterations. The AC3 skill test checks both instructions and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The build and review skills retain full-suite checks at every required point. scripts/ship.mjs continues using commands.test through testRun. AC4 tests verify the instructions and exercise shipping with test_files configured; all passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change lets builds run their own test files while retaining full-suite checks before review and shipping. File names are safely quoted, and partial results cannot replace a full-suite result. The supplied suite reports 997 passes, no failures and three skips. Repository inspection found no blocking issues; tests were not rerun in the read-only review."
  }
}
```

</details>
