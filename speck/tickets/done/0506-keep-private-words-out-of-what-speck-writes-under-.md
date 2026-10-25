---
id: "0506"
title: "Keep private words out of what speck writes under speck/"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T13:44:12.901Z"
approved: "2026-10-25T13:53:06.251Z"
finished: "2026-10-25T13:56:33.859Z"

---
# 0506 · Keep private words out of what speck writes under speck/

**Status:** ✅ done

## Problem
A shipped ticket published the user's machine username: a reviewer quoted an absolute path under the user's home folder as its evidence, and speck wrote that into the ticket's review rounds. Nothing caught it. The private-words test skips `speck/`, so a test result can be reused while only `speck/` changes (0112), and `speck lint` checks a ticket for private words and the home folder's path (0083, 0121) only when it's linted, before the build, not the review rounds, notes and logs written into it afterwards. The user had to rewrite the repo's public history on 2026-10-25 to remove it.

## Outcome
Nothing speck commits under `speck/` publishes a private word or the user's home folder path.

## Acceptance criteria
1. When speck writes text into a ticket (a review round's verdict, findings and evidence, the self-check, notes, the review and delivery logs), it writes any path under the user's home folder as a `~/` path, for example `~/projects/app/outputs/tests/README.md` for the same file under the home folder.
2. `speck ship <id>` refuses, changing nothing, when any file under `speck/` that the ticket's branch adds or changes contains one of the words in `~/.config/speck/private-words` (case-insensitive) or the user's home folder path. Its message names each file and line, without repeating the word, and says to take it out. Without a private-words file, it checks only the home folder path.
3. The ship queue in `speck run` treats that refusal as one the build can fix, handing the ticket back to its build's session with the message, as it does for a ship refused for a failing test.
4. A ship whose `speck/` files contain neither ships as before, and `test/support/private-words.mjs` still skips `speck/` (0112). No test that passed before this change fails.

## Out of scope
- Rewriting history or files already committed.
- Idea notes committed by `/speck-capture` or triage on the base branch, outside a ship.

## Notes
- Asked for by the user on 2026-10-25, before posting speck on Reddit: "fix the private words check". The leak was in `speck/tickets/done/0358-…`, in a review round's evidence.
- Today: `homePathWarnings` and the private-words check in `scripts/lint.mjs` (0083, 0121), which this can reuse; review rounds are written by `scripts/review.mjs`; ship's checks are in `scripts/ship.mjs`; the ship queue's hand-backs in `scripts/ship-queue.mjs`.
- Failing before this build: none
- Self-check: added a test for the facts in the brief and the build skill (exit 17, the private-words file, the "Private words" steps); a third private-words hand-back blocks as "Handed back again" does.

## In plain words
speck now keeps your username and private words out of what it publishes about a ticket. When it saves a reviewer's verdict, records changes you asked for, or closes a build, any path in your home folder is written as a short `~/` path. And before shipping, it checks every file under `speck/` that the ticket adds or changes: if one still holds a word from your private-words list or your home folder's path, it refuses to ship, changing nothing, and says which file and line without repeating the word. When `speck run` ships it for you, the ticket goes back to its build to take them out, then ships once that's done.

To see it, add a word to `~/.config/speck/private-words`, put it in an approved ticket's notes and try to ship it: the ship refuses and names the line. Worth keeping an eye on: in pull request mode the refusal isn't handed back to the build yet, so it waits for you.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 askForChanges commits a user's note directly into the Review log.; F2 The ship guard silently skips an entire file when it contains a NUL byte or git show fails.; F3 The privacy check runs after remoteBaseCatchUp.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 454,374
- Elapsed since build started: 9 min
- Changed lines: 135 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): pull request mode's queue hands back only conflicts, not exit 17 (speck/ideas/2026-10-25-hand-back-a-pull-request-refused-for-private-words.md).
- Known limit: other places that write into a ticket (the Foreman's notes, go-with, paused time) don't rewrite home paths; ship's check still catches any they leave.

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
    "reviewed_sha": "014a384af507cbed2a37f433956272bb554b28a0",
    "session": "fresh",
    "thread_id": "01a17353-0f70-7cc0-b180-e92a3221bb33",
    "builder_response": "- Tests run: `speck test --related test/private-words-0506.test.mjs` (the ticket's own file plus every existing test file naming a changed file: 1262 tests, 0 failing).\n- New module scripts/private-words.mjs shares the home-path pattern and private-words list with scripts/lint.mjs (lint's messages unchanged).\n- AC1: saveRound and speck close run the whole ticket text through tildePaths, so rounds, notes, self-check and logs get `~/` paths.\n- AC2: shipChecks (used by speck ship and pull-request ship) refuses with exit 17 before anything changes.\n- AC3: exit 17 maps to hand-back kind `private`, with new \"Private words\" steps in the build skill.\n- Known limit, not in scope: pr-queue.mjs (pull request mode) still hands back only conflicts.\n",
    "seconds": 51,
    "usage": {
      "input_tokens": 166431,
      "cached_input_tokens": 114432,
      "cache_write_input_tokens": 0,
      "output_tokens": 1429,
      "reasoning_output_tokens": 302
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T13:50:36.437Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "saveRound in scripts/review.mjs and cmdClose in scripts/close.mjs normalise paths, covered by the passing AC1 tests. However, askForChanges in scripts/changes.mjs writes and commits user text to the Review log without normalising home paths."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing AC2 tests cover ordinary text files. privateLinesInSpeck in scripts/private-words.mjs skips files containing NUL bytes and failed git show calls. Also, shipTicket calls remoteBaseCatchUp before shipChecks; that catch-up can permanently merge commits into the base branch before the privacy refusal."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship-queue.mjs maps exit 17 to the private hand-back; scripts/hand-back.mjs supplies the repair instructions. The passing AC3 queue test exercises the callback and message."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 tests exercise a successful clean ship and confirm filesNaming still skips speck/. The reported related test run has 1259 passes, three skips and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/changes.mjs",
        "issue": "askForChanges commits a user's note directly into the Review log. A note containing an absolute home path therefore publishes that path in a commit, even if a later review normalises the current ticket.",
        "suggested_fix": "Apply tildePaths before writing the updated ticket and add a test passing a home path through speck changes.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/private-words.mjs:57",
        "issue": "The ship guard silently skips an entire file when it contains a NUL byte or git show fails. A changed file containing a private word alongside a NUL byte can ship, contrary to the requirement to check any changed file under speck/.",
        "suggested_fix": "Scan files containing NUL bytes for the prohibited text, and refuse safely when a file cannot be read. Add regression coverage for both cases.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/ship.mjs:227",
        "issue": "The privacy check runs after remoteBaseCatchUp. When local and remote base branches have diverged, that function commits and retains their merge before the privacy guard refuses, so the refusal does not leave everything unchanged.",
        "suggested_fix": "Run the privacy guard before any branch-changing catch-up operation. Test a privacy refusal with diverged local and remote base branches and verify their refs and checkouts remain unchanged.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main review and shipping paths work in the reported tests, but privacy gaps remain: change-request notes can commit home paths, some files bypass scanning, and a refused ship can still change the base branch. These need fixing before merge."
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
    "reviewed_sha": "921a8f4d9706c064f03272b89f49204a82ecd614",
    "session": "continued",
    "thread_id": "01a17353-0f70-7cc0-b180-e92a3221bb33",
    "builder_response": "- Tests run: test/private-words-0506.test.mjs test/changes-0356.test.mjs test/ship-0046.test.mjs test/lint-0121.test.mjs test/lint-0083.test.mjs test/run-0194.test.mjs test/pr-ship-0296.test.mjs\n- F1: fixed. askForChanges in scripts/changes.mjs runs the updated ticket through tildePaths before writing and committing. New test \"0506 AC1: changes the user asks for are written into the Review log with ~/ paths\".\n- F2: fixed. privateLinesInSpeck no longer skips files with a NUL byte (it reads them as text), and a failed `git show` now throws a plain SpeckError, so ship refuses rather than skipping. New test \"0506 AC2: a file under speck/ holding a NUL byte is still checked\".\n- F3: fixed. shipTicket runs the private-words check (now privateWordsCheck in scripts/ship.mjs) right after the clean-tree checks and before remoteBaseCatchUp; shipChecks still runs it for the pull-request paths. New test \"0506 AC2: the refusal comes before ship catches up with a remote that has moved on\", with diverged local and remote main, checks both refs and checkouts are unchanged.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 284292,
      "cached_input_tokens": 222976,
      "cache_write_input_tokens": 0,
      "output_tokens": 2222,
      "reasoning_output_tokens": 351
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T13:52:42.410Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound, cmdClose and askForChanges normalise ticket text with tildePaths before writing. Passing AC1 tests exercise review evidence, notes, self-check, logs and change-request notes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "privateLinesInSpeck scans changed speck/ files, including files containing NUL bytes, and refuses on read errors. shipTicket checks before remoteBaseCatchUp. Passing AC2 tests cover case-insensitive matching, file and line reporting without repeating private words, missing configuration, NUL bytes and unchanged refs and checkouts with diverged base branches."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ship-queue.mjs maps exit 17 to the private hand-back, and handBackMessage supplies the repair instructions. The passing AC3 test exercises the queue callback and message."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise successful shipping and verify that test/support/private-words.mjs still skips speck/. The round's reported results contain 215 passes, three skips and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/changes.mjs",
        "issue": "Change-request notes previously committed home paths directly into the Review log.",
        "suggested_fix": "Implemented: askForChanges normalises the updated ticket before committing; a passing regression test exercises this path.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/private-words.mjs",
        "issue": "Files containing NUL bytes and failed reads previously bypassed scanning.",
        "suggested_fix": "Implemented: NUL-containing files are scanned and failed reads throw an error. The new NUL-byte regression test passes.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "Remote catch-up could change the base branch before a privacy refusal.",
        "suggested_fix": "Implemented: the privacy check precedes remote catch-up. A passing regression test verifies unchanged refs and checkouts when local and remote base branches have diverged.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The three privacy gaps are fixed. Ticket paths are shortened before being saved, shipping checks changed speck files for private text, and refusals return to the build for repair. The reported tests pass, with no blocking findings remaining."
  }
}
```

</details>
