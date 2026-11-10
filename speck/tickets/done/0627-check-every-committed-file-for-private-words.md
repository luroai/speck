---
id: "0627"
title: "Check every committed file for private words"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-10T20:55:55.786Z"
finished: "2026-11-10T21:00:04.171Z"

---
# 0627 · Check every committed file for private words

**Status:** ✅ done

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
speck's check on commits used to look only at tickets and notes. Now it looks at every file a commit changes (code, tests, docs and all), and at the commit message too, and refuses the commit if any new line holds one of your private words or your home folder's path. It says which file and line, or which line of the message, without repeating the word. The price list speck copies from LiteLLM is left out, because its model names can match a private word by chance.

To see it, run `speck init` again in a project (this one included) so the new message check is added, then `speck doctor`, which now shows one line for each check. Try committing a file or a message with one of your private words: it's refused. `git commit --no-verify` still skips both for one commit.

Worth knowing: `git commit --verbose` puts the diff into the message file, so a private word on a line the commit only removes or keeps can get the message refused. Take it out of the message, or commit without `--verbose`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 messagePrivateLines stops at any scissors-like line.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 253,488
- Elapsed since build started: 7 min
- Changed lines: 167 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes):
  - Known limit: with `git commit --verbose`, the diff below the scissors line is in the message file, so a private word on a removed or kept line gets the message refused (round 1 F1 chose checking every line over missing text git keeps with -m).
  - Known limit: the commit check runs one `git diff` per staged file, so a very large commit (thousands of files) is checked more slowly than one under speck/ was.
  - speck's own repository has no pre-commit or commit-msg hook installed: run `speck init` here to turn both checks on.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "3d75fe7d4e0158e5081eb665471f6c9ef83cb049",
    "session": "continued",
    "thread_id": "01a1c73d-6040-75d3-bb06-85cbd1d16c46",
    "builder_response": "- Tests run: test/commit-check-0627.test.mjs test/commit-check-0550.test.mjs (plus the commands.checks files speck test runs itself): 129 pass, 0 fail.\n- F1: fixed. `messagePrivateLines` in scripts/commit-check.mjs no longer stops at a scissors line: it checks every line of the message, since git keeps text below the marker in a message given with -m. The unit test that assumed git drops it is replaced by \"0627 AC3 F1\", which runs `git commit -m` through the real hooks with a private word, then the home folder's path, below a scissors line, and checks each is refused at message line 3.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 251981,
      "cached_input_tokens": 202496,
      "cache_write_input_tokens": 0,
      "output_tokens": 1507,
      "reasoning_output_tokens": 199
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6261,
      "cached": 88704,
      "write": 0,
      "output": 533
    },
    "cost_usd": 0.0267224,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T20:55:36.116Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/commit-check.mjs: stagedPrivateLines checks added lines across staged files and reports file and line. Passing 0627 AC1 tests cover private words, home paths, and unchanged or removed lines."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "COPIED_FILES excludes scripts/prices.json and .speck/scripts/prices.json. Passing AC2 tests exercise these exclusions; docs/brief.md explains their LiteLLM origin."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "messagePrivateLines now scans every line. Passing AC3 integration tests cover message rejection, the scissors-marker regression, hook installation, preservation of foreign hooks and unreadable message files."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify --no-verify skips both hooks and doctorChecks reports both checks as on or off with reasons."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified current recorded output: 129 passed, zero failed, three skipped. Round 1's broader related-test run also had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/commit-check.mjs",
        "issue": "The message check previously skipped private text below a scissors marker even when Git retained it. It now scans every line, and a real-hook regression test verifies rejection of both private words and home paths below the marker.",
        "suggested_fix": "Completed; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change checks added lines throughout the project and commit messages, while excluding the documented copied price lists. The message-check gap is fixed and covered by an integration test. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
