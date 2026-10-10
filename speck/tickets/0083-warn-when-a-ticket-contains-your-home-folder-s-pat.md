---
id: "0083"
title: "Warn when a ticket contains your home folder's path"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:55:01.787Z"

---
# 0083 · Warn when a ticket contains your home folder's path

**Status:** 👍 approved

## Problem
Tickets are committed and often published, and an absolute path from the writer's machine can slip into one. That path usually contains their username. It happened in 0053, and nobody noticed until much later.

## Outcome
`speck lint` warns when a ticket contains the absolute path of the current user's home folder, so it can be removed before the ticket is committed or shared.

## Acceptance criteria
1. `speck lint <id>` prints a `!` warning when the ticket's text contains the current user's home folder path (as the operating system reports it), either followed by `/` or on its own (followed by a space, punctuation or the end of the line). The warning gives the line number and suggests a `~/` path instead.
2. A ticket without that path gets no such warning. A path that only starts the same way (for example `/home/ann2` when the home folder is `/home/ann`) gets no warning either.
3. As with lint's other warnings, this one doesn't make `speck lint` fail, and it doesn't stop `speck set <id> status ready`.
4. When the home folder can't be found, or is `/`, lint checks nothing for it and prints no error.

## Out of scope
- Checking files other than tickets, such as idea notes or code.
- Changing existing tickets. 0082 removes the one known case.
- Other personal details, such as names or email addresses.

## Notes
- Lint already separates errors (✗, which block `ready`) from warnings (!, which don't), in `lintTicket` in `scripts/core.mjs`.
- Checked 2026-10-10: on Linux and macOS, Node's `os.homedir()` returns `$HOME` when it is set (Node.js `os` docs).
- Tests should set `HOME` (and so the home folder) to a temporary path, so they don't depend on the machine running them.
- Self-check: added a test that a home folder with regex characters (`a.b+c`) is matched literally; also skips a relative home folder, and a path inside a longer one (`/mnt/home/ann`) or followed by `-`, `_` or `.name`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 homePathWarnings treats non-ASCII letters as delimiters.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 911,413
- Elapsed since build started: 8 min
- Changed lines: 18 (limit 5000)
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
    "reviewed_sha": "b222442dce590523b08bbe76220aeee06200ea6e",
    "thread_id": "01a125e6-418e-7cf0-86a4-298c9d1277a8",
    "seconds": 44,
    "usage": {
      "input_tokens": 317840,
      "cached_input_tokens": 234112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1177,
      "reasoning_output_tokens": 49
    },
    "saved_at": "2026-10-10T13:00:52.833Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs homePathWarnings supplies line numbers and ~/ suggestions; cmdLint prints ! warnings. test/lint-0083.test.mjs exercises descendants, standalone paths, punctuation, multiple lines and literal regex characters."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The ASCII \\w boundary in homePathWarnings incorrectly matches /home/anné/x when home is /home/ann, reproduced with an in-memory call to lintTicket. Existing AC2 tests cover ASCII suffixes only."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdLint fails only for errors, and checkSetTicket checks only errors before ready. The AC3 CLI test exercises successful lint and set status ready with a home-path warning."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "homePathWarnings catches homedir failures and skips empty or root paths. AC4 tests exercise root and empty homes; an independent in-memory check with os.homedir throwing returned no home warning."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "homePathWarnings treats non-ASCII letters as delimiters. With home /home/ann, a ticket containing /home/anné/x gets a warning even though it refers to a different folder, violating AC2.",
        "suggested_fix": "Use boundaries that recognise Unicode folder-name continuations and add a regression test for /home/anné with home /home/ann.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The warning includes useful line numbers and replacement advice, and does not block lint or readiness. One matching bug needs fixing: other folder names containing non-ASCII letters can trigger false warnings. The change otherwise stays within scope."
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
    "reviewed_sha": "cd0133670a33fb14c8d2a56e11c4d015e5b0af64",
    "thread_id": "01a125e6-418e-7cf0-86a4-298c9d1277a8",
    "seconds": 27,
    "usage": {
      "input_tokens": 590352,
      "cached_input_tokens": 452480,
      "cache_write_input_tokens": 0,
      "output_tokens": 2044,
      "reasoning_output_tokens": 49
    },
    "saved_at": "2026-10-10T13:03:08.421Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs homePathWarnings generates line numbers and ~/ advice; scripts/speck.mjs cmdLint prints ! warnings. AC1 tests in test/lint-0083.test.mjs cover descendants, standalone paths, punctuation and multiple lines; supplied results pass. Independent read-only matching checks also pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "homePathWarnings now uses Unicode-aware boundaries. AC2 tests cover absent paths, similar names and embedded paths, including the new non-ASCII regression test; supplied results pass. Independent checks confirm accented letters, Chinese characters and combining marks do not trigger false warnings."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdLint fails only for errors; checkSetTicket checks only errors before ready. The AC3 test exercises successful lint and set status ready with a home-path warning and passes in the supplied results."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "homePathWarnings catches os.homedir failures and skips empty, root and relative paths. AC4 tests pass in the supplied results; independent read-only checks confirm empty, root and throwing homedir cases return no home warnings."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "The previous ASCII boundary incorrectly warned about different folder names containing non-ASCII letters. Unicode-aware boundaries now fix this, with a CLI regression test.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Tickets containing your home folder path receive a warning with a line number and replacement advice, without blocking readiness. The false warning for non-ASCII folder names is fixed. All four criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
