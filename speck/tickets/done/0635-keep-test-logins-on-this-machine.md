---
id: "0635"
title: "Keep test logins on this machine"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-virgil-checks-the-work-in-the-running-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0633","0634"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:23:26.280Z"
approved: "2026-11-11T11:34:26.377Z"
finished: "2026-11-11T11:36:41.212Z"

---
# 0635 · Keep test logins on this machine

**Status:** ✅ done

## Problem
Checking a change in an app often means signing in, and the logins for that must never end up in a ticket, a review round or a commit, which are often published.

## Outcome
Test logins for a project are kept on this machine only, where speck's agents can read them, and speck refuses to commit one.

## Acceptance criteria
1. `speck logins set <name>` asks for a username and a password, reading the password without showing it (or both piped in), never from the command line, which it refuses, and saves them in `speck/.cache/machine/logins.json` in the main checkout, which git ignores and only you can read or write.
2. `speck logins` lists each saved login's name and username, never its password; `speck logins show <name>` prints its username and password; `speck logins remove <name>` deletes it. Each names the logins it knows when given one it doesn't.
3. Each saved password counts as a private word: the pre-commit hook and `speck ship` refuse a commit or ship that adds one under `speck/`, as they do the words in `~/.config/speck/private-words`, naming the file and line without the password.
4. A review round speck saves has each saved password replaced by `[private]`.
5. With no logins saved, `speck logins` says so in one line, and nothing else changes.

## Out of scope
- Using the logins: 0636.
- Encrypting the file: it's protected as API keys are, by its permissions.

## Notes
- Decided 2026-11-11: logins live on this machine, as API keys do (`scripts/keys.mjs`, 0389).
- Private-word checks are in `scripts/private-words.mjs` and `scripts/commit-check.mjs`; 0633 adds them to saved rounds.
- Risk high: it handles secrets.
- Failing before this build: none
- Self-check: a logins file that can't be read (not just a missing one) now gives a plain error rather than a stack trace, and a bad login name isn't echoed back, as it may be a password typed in the wrong place.

## In plain words
You can now save logins for testing an app on this machine with `speck logins set <name>`: it asks for the username, then the password without showing it. `speck logins` lists them by name and username, `speck logins show <name>` prints one, and `speck logins remove <name>` deletes it. They're never stored anywhere git would commit.

Each saved password is treated like your private words: a commit or ship that would publish one is refused, naming the file and line without the password, and speck writes it as `[private]` in review rounds it saves.

Worth keeping an eye on: a very simple password, such as `test`, will refuse any commit holding that word anywhere, because of how it's protected.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Saved passwords containing the literal text [private] bypass commit and ship protection.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 213,081
- Elapsed since build started: 11 min
- Changed lines: 213 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - A short or common saved password refuses every commit holding it: speck/ideas/2026-11-11-warn-when-a-saved-test-password-is-a-common-word.md
  - Tidy-up: `speck check` (lint) still reads only `~/.config/speck/private-words`, not saved passwords, so a ticket holding one passes the ready check and is caught later by the commit hook.

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
    "reviewed_sha": "e6f31eaf86f8b4a08f4f8bec56a2dd0b7e5fc207",
    "session": "fresh",
    "thread_id": "01a1ca61-9064-7d23-8435-48f286fb2e7d",
    "builder_response": "- Tests run: test/logins-0635.test.mjs, plus every related test file `speck test --related` chose (2936 tests, all passing).\n- New: scripts/logins.mjs (`speck logins`, `set`, `show`, `remove`), modelled on scripts/keys.mjs (0389): same machine folder, 0600 file written via a temp file, permissions fixed on read.\n- Saved passwords join the private-word checks through `privateWordList(repo).logins` and a new `'login'` answer from `privateHit`, shared by the pre-commit and commit-msg hooks, `speck ship` and `saveRound` (review.mjs). Refusals name the file and line via the shared `privateSaid`.\n- `speck.mjs` is at its 600-line limit, so two import lines were joined.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 115078,
      "cached_input_tokens": 71552,
      "cache_write_input_tokens": 0,
      "output_tokens": 1052,
      "reasoning_output_tokens": 228
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43526,
      "cached": 71552,
      "write": 0,
      "output": 1052
    },
    "cost_usd": 0.1047272,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:33:21.628Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/logins.mjs implements input-only credentials, shared main-checkout storage and atomic 0600 writes. Passing AC1 tests cover piping, argument refusal, permissions and worktree sharing; terminal input reuses keys.mjs READ_SILENTLY."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdLogins and loginOf implement listing, showing, removal and unknown-name messages. The passing AC2 test exercises these commands across worktrees."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Passing AC3 tests cover ordinary passwords, but privateHit in scripts/private-words.mjs removes literal [private] markers before matching passwords. A saved password containing that text escapes both commit and ship checks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "saveRound combines private words and saved passwords for redaction. The passing AC4 test exercises saved reviewer text and the builder response."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 test verifies a one-line empty message, no cache creation and a clean git status. The reported related tests have no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/private-words.mjs",
        "issue": "Saved passwords containing the literal text [private] bypass commit and ship protection. saveLogin accepts abc[private]def, but privateHit replaces the marker with a null character before searching. A read-only reproduction returned null for privateHit('password abc[private]def', [], null, ['abc[private]def']). Both stagedPrivateLines and privateLinesInSpeck use this function, so they allow that password to be published.",
        "suggested_fix": "Match saved passwords against the original line before excluding redaction markers from private-word matching. Add regression tests showing that commit and ship checks reject a saved password containing [private], without printing it.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The login commands and storage work for the tested cases, and saved review text is redacted. One secret-protection gap must be fixed: passwords containing “[private]” can pass the commit and ship checks unchanged."
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
    "reviewed_sha": "b66333869ac9136df17998df46e056a630229f9f",
    "session": "continued",
    "thread_id": "01a1ca61-9064-7d23-8435-48f286fb2e7d",
    "builder_response": "- Tests run: test/logins-0635.test.mjs test/private-words-0633.test.mjs test/commit-check-0550.test.mjs test/commit-check-0627.test.mjs test/private-words-0506.test.mjs\n- F1: fixed. `privateHit` in scripts/private-words.mjs now matches saved passwords against the whole lower-cased line, `[private]` markers included; private words keep 0633's marker skipping. New test `0635 AC3 F1` checks the commit hook and `privateLinesInSpeck` refuse `abc[private]def` without printing it.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 211387,
      "cached_input_tokens": 160896,
      "cache_write_input_tokens": 0,
      "output_tokens": 1694,
      "reasoning_output_tokens": 228
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6965,
      "cached": 89344,
      "write": 0,
      "output": 642
    },
    "cost_usd": 0.0292844,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:34:09.900Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/logins.mjs reads credentials from input, refuses extra command-line arguments and writes a shared main-checkout file atomically with 0600 permissions. Passing AC1 tests cover piped input, argument refusal, permissions and worktree sharing. Terminal password input reuses READ_SILENTLY."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdLogins implements list, show and remove; loginOf names known logins on an unknown-name error. The passing AC2 test exercises these behaviours."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Commit checks and ship checks obtain saved passwords through privateWordList(repo). privateHit now matches passwords against the complete line. Passing AC3 tests include the F1 regression exercising the commit hook and ship scanner; an independent read-only check also confirmed detection."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/review.mjs saveRound includes saved passwords in redaction. The passing AC4 test verifies replacement in reviewer text and the builder response."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 test verifies a one-line empty message, no cache creation and no git changes. The current test output records 161 passes, three skips and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/private-words.mjs",
        "issue": "Passwords containing [private] previously bypassed commit and ship protection. Matching now uses the complete line, closing the bypass.",
        "suggested_fix": "Implemented, with a passing regression test covering the commit hook and ship scanner.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The login commands keep credentials in protected machine-local storage, block saved passwords from commits and shipping, and redact them from saved reviews. The previously identified bypass is fixed and covered by a regression test. Ready for the product owner's merge decision."
  }
}
```

</details>
