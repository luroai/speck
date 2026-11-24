---
id: "0717"
title: "Warn when a saved test password is a common word"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-warn-when-a-saved-test-password-is-a-common-word.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:23:11.729Z"

---
# 0717 · Warn when a saved test password is a common word

**Status:** 🔍 reviewing

## Problem
Every saved test password counts as a private word in every commit, in any case. A simple password like `test` would then refuse almost every commit that touches a test file, and you wouldn't know why until a commit fails.

## Outcome
`speck logins set` warns when a password is short or already appears in the project's files.

## Acceptance criteria
1. When `speck logins set <name>` saves a password shorter than 8 characters, or one that appears, in any case, in a file tracked by git, it warns that any commit holding that word anywhere, in any case, will be refused, and says how to remove the login with `speck logins remove <name>`.
2. The warning never shows the password.
3. The login is still saved, with no question asked, so piped input works as today.
4. A password of 8 or more characters that appears in no tracked file is saved without the warning.
5. No test that passed before this change fails.

## Out of scope
- Refusing short passwords.

## Notes
- `saveLogin` (`scripts/logins.mjs`) checks only for an empty password and line breaks. `privateHit` (`scripts/private-words.mjs`) matches lower-cased lines with `includes`.
- Decision: warn only, since real test apps often use simple passwords and there may be nobody to answer a prompt.

- Failing before this build: none
- Self-check: no changes

## In plain words
Saving a test login with a short password, or one that already appears in the project's files, now prints a warning. The warning says speck will refuse any commit holding that word, and how to remove the login. It never shows the password, and the login is still saved with no question asked. To see it, run the login save with a three-letter password. Longer, unusual passwords save as before.

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
    "reviewed_sha": "1e029694354bf3445d2af5040a8e3fc3ccbc60d2",
    "session": "fresh",
    "thread_id": "01a20df2-4cb9-7d73-be8b-30ebb99341db",
    "builder_response": "Tests run: test/logins-0717.test.mjs plus related (related run)\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 123105,
      "cached_input_tokens": 86272,
      "cache_write_input_tokens": 0,
      "output_tokens": 949,
      "reasoning_output_tokens": 130
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 36833,
      "cached": 86272,
      "write": 0,
      "output": 949
    },
    "cost_usd": 0.0917832,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:25:44.209Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/logins.mjs: weakPasswordReason and cmdLogins implement both warning triggers and the removal command. The two AC1 tests exercise short passwords and case-insensitive tracked-file matches; both passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdLogins constructs the warning without interpolating the password. The AC2 test checks stdout and stderr for both warning paths and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdLogins saves before checking the warning condition. The AC3 test pipes input, checks successful exit and verifies the saved password; it passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test verifies that an unusual long password is saved without a warning; it passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0717-tests.txt records 162 passed, zero failed and three skipped, including the existing related login tests. No existing tests were changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/logins.mjs:104",
        "issue": "weakPasswordReason passes the plaintext password as a git command-line argument on every save. This exposes it to process listings and process-monitoring tools, despite the existing login module's explicit guarantee that passwords never go on a command line. Ignoring subprocess output does not protect its arguments.",
        "suggested_fix": "Supply the search pattern through standard input, for example git grep -f - with spawnSync's input option, or search tracked files within Node. Add a regression check that subprocess arguments never contain the password.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The warnings work and the reported tests pass. However, saving a login now exposes its password through a subprocess command line. Fix that security regression before merge."
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
    "reviewed_sha": "a1b7c14b63bea54bd68129a07bb241827f565e11",
    "session": "continued",
    "thread_id": "01a20df2-4cb9-7d73-be8b-30ebb99341db",
    "builder_response": "F1 fixed: the password goes to git grep on stdin (-f -); added a test that no git argument holds it. Ran test/logins-0717.test.mjs and test/logins-0635.test.mjs.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 201754,
      "cached_input_tokens": 160896,
      "cache_write_input_tokens": 0,
      "output_tokens": 1494,
      "reasoning_output_tokens": 130
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4025,
      "cached": 74624,
      "write": 0,
      "output": 545
    },
    "cost_usd": 0.0209624,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:26:51.767Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/logins.mjs: weakPasswordReason checks length and searches tracked files case-insensitively; cmdLogins explains commit refusal and gives the removal command. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdLogins does not interpolate the password into its warning. Both AC2 tests passed, checking output and subprocess arguments."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdLogins saves before warning without adding a prompt. The passing AC3 test pipes input and verifies the saved password."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test verifies that an unusual long password is saved without a warning."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded run includes the ticket tests and existing login tests: 162 passed, zero failed and three skipped. Existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/logins.mjs:104",
        "issue": "The previous implementation exposed the plaintext password in git's command-line arguments.",
        "suggested_fix": "Fixed: git grep now receives the password through standard input using -f -. The new passing regression test records actual git arguments while forwarding to real git and confirms the password is absent.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The warning works, preserves piped input and saves the login without prompting. The password exposure is fixed, and all recorded tests pass. Ready for the owner's merge decision."
  }
}
```

</details>
