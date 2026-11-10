---
id: "0627"
title: "Check every committed file for private words"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0626"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T20:48:40.484Z"

---
# 0627 · Check every committed file for private words

**Status:** 🔍 reviewing

## Problem
speck's commit check (0550) refuses a commit that adds a private word or the home folder's path, but only to files under `speck/`. A private name was committed in a test file and in several tickets before it was on the list, and code, tests, docs and commit messages are still unchecked.

## Outcome
speck refuses any commit that adds a private word or the home folder's path, in any file or in its message.

## Acceptance criteria
1. The commit check looks at every line the commit adds, in every file, not only those under `speck/`, and refuses the commit, saying which file and line, when one holds a private word or the home folder's path.
2. Files that hold data copied from outside the project, starting with `scripts/prices.json` (model names from LiteLLM's price list), are left out, and the brief says which and why.
3. A commit message that holds a private word or the home folder's path is refused too, saying so; `speck init` installs that check beside the existing one, and leaves a hook that isn't speck's alone, as it does today.
4. `git commit --no-verify` still skips both, as today, and `speck doctor` (0570) reports both checks.
5. No test that passed before this change fails.

## Out of scope
- Rewriting history that's already been committed.
- What counts as a private word: the user's own list.

## Notes
- Asked for 2026-11-10: remove a private name from everything and "make sure it doesn't happen again … I don't even want a mention of the user's other projects." The name itself is in the user's private words, so it isn't written here.
- Today: `scripts/commit-check.mjs` lists staged files with `git diff --cached … -- speck/` (about line 40), its hook is installed by `installCommitHook`, and `speck doctor`'s line for it is 0570's.
- Waits for 0626, so the test's names are gone before every file is checked.
- Relies on git's pre-commit and commit-msg hooks.
- Failing before this build: none
- Self-check: added a plain error, with a test, when the commit message file can't be read; kept one `git diff` per staged file, as one diff for all of them can split a file whose type changed into two patches and misname lines.

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
    "reviewed_sha": "89aca96ccc2950eddd2f6047e3fb3da2b76b0d6f",
    "session": "fresh",
    "thread_id": "01a1c73d-6040-75d3-bb06-85cbd1d16c46",
    "builder_response": "- Tests run: `speck test --related test/commit-check-0627.test.mjs test/commit-check-0550.test.mjs` (the ticket's own file, the existing 0550 file it changed, and every test file naming docs/brief.md, scripts/install.mjs or scripts/commit-check.mjs, plus the commands.checks files): 1286 pass, 0 fail.\n- Notes:\n  - The pre-commit check now lists every staged file (pathspec `.` with `:(exclude,literal)` for each of `COPIED_FILES`), not only `speck/`. The pre-commit hook keeps 0550's marker line, so hooks written by an older speck still count as speck's, and adds a comment line saying it now checks every file.\n  - AC2: `COPIED_FILES` is `scripts/prices.json` and `.speck/scripts/prices.json` (the copy `speck init` puts in other projects). The brief names it and why.\n  - AC3: a new commit-msg hook (own marker, `--message \"$1\"`) is installed beside the pre-commit one by `installCommitHook`, each on its own: a foreign or unreadable hook of one kind is left alone while the other is still installed. Lines below git's scissors line (`git commit --verbose`) are skipped, as git drops them.\n  - AC4: `speck doctor` now has two lines, \"Commit check\" and \"Commit message check\"; the 0570 tests, which want exactly one line matching /commit check/i, still pass because the second says \"Commit message check\".\n  - Two 0550 assertions contradicted this ticket's outcome and were changed, not weakened: the AC2 test no longer expects a private word outside speck/ to commit (0627 AC1 now tests that it's refused), and the self-check test's last line now commits with --no-verify instead of expecting a commit outside speck/ to pass with an unreadable word list. The 0550 helpers moved to test/support/commit-check.mjs, shared with the new file.\n",
    "seconds": 42,
    "usage": {
      "input_tokens": 157016,
      "cached_input_tokens": 113792,
      "cache_write_input_tokens": 0,
      "output_tokens": 974,
      "reasoning_output_tokens": 199
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43224,
      "cached": 113792,
      "write": 0,
      "output": 974
    },
    "cost_usd": 0.1075672,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T20:54:52.972Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "stagedPrivateLines in scripts/commit-check.mjs scans all staged files with literal exclusions. Passing 0627 AC1 tests cover private words, home paths, file/line reporting and unchanged or removed lines."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "COPIED_FILES excludes both price-list copies; passing AC2 tests exercise exclusions. docs/brief.md names the files and explains their LiteLLM origin."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Hook installation and ordinary message rejection have passing tests, but messagePrivateLines unconditionally skips everything after a scissors line, even when Git retains that text."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0627 AC4 tests exercise --no-verify with both violations and doctorChecks reporting both hooks."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified recorded test output: 1286 passed, zero failed, three skipped. Changes to existing assertions match the expanded scope."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/commit-check.mjs",
        "issue": "messagePrivateLines stops at any scissors-like line. A message supplied through git commit -m with a clean first line, the scissors marker and then a private word or home path passes this check, although Git's default cleanup for -m retains that text. A read-only probe with a home path below the marker returned no violations. The existing scissors test assumes Git always discards the remainder without exercising Git.",
        "suggested_fix": "Ensure text is skipped only when Git will actually discard it, or conservatively scan the whole message. Add an integration test using git commit -m with a private word or home path below a scissors marker and verify rejection.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change checks files throughout the project, excludes the copied price lists, and installs and reports both hooks. The recorded tests pass, but the message check can miss private text after a scissors marker even when Git saves it. Fix that gap before merge."
  }
}
```

</details>
