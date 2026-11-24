---
id: "0715"
title: "Say when a sign-in check is left rather than asked"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-15-say-when-a-sign-in-check-is-left-rather-than-asked.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T13:52:52.125Z"
approved: "2026-11-24T14:03:55.511Z"
finished: "2026-11-24T15:08:30.649Z"

---
# 0715 · Say when a sign-in check is left rather than asked

**Status:** ✅ done

## Problem
The speck-watch skill says to ask the user when the agent can't sign in, while its leave action covers a check needing an account the agent can't use. The two overlap, so the agent may stop a build with a question where 0679 meant it to carry on, or the reverse.

## Outcome
The skill and the check's brief say plainly which sign-in troubles are left and which are asked.

## Acceptance criteria
1. The speck-watch skill says that with `watch: decide`, a check needing an account speck has no saved test login for is left with the leave action, and that a saved login that fails to sign in, or any other sign-in trouble, is asked about. (checked by review)
2. The brief speck gives the agent for a check in the app (`scripts/app-check.mjs`) says the same. (checked by review)
3. No test that passed before this change fails.

## Out of scope
- Changing what the leave action does.

## Notes
- Lines in `skills/speck-watch/SKILL.md` (ask on sign-in trouble; leave for an account you can't use) and the brief in `scripts/app-check.mjs`.
- Decision: a saved login that fails is asked about, not left, because with a working password the agent could make the check, and the user can fix it with `speck logins set`.

- Failing before this build: not checked
- Self-check: no changes
- Pictures: none, because nothing anyone sees changes

## In plain words
When a check in the app needs an account, the watching agent now knows what to do. With no saved test login for that account, it leaves the check for you. If a saved login exists but fails, or any other sign-in trouble comes up, it asks you, and you can fix the login with `speck logins set`. Nothing changes in what leaving a check does.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 129,930
- Elapsed since build started: 11 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none. Review F1 (minor) was about my test run passing non-test files; the real tests passed.

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
    "reviewed_sha": "f7d2ccb726096016c4768b4853bbfb0ea5d3d15a",
    "session": "fresh",
    "thread_id": "01a20dde-475e-7520-ab5d-cb9ebe8c651b",
    "builder_response": "- AC1/AC2 are checked by review; no tests. Ran related tests: all pass.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 129203,
      "cached_input_tokens": 88960,
      "cache_write_input_tokens": 0,
      "output_tokens": 727,
      "reasoning_output_tokens": 44
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 40243,
      "cached": 88960,
      "write": 0,
      "output": 727
    },
    "cost_usd": 0.096652,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:03:49.106Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-watch/SKILL.md, checking-in-the-app step 5: leave applies with watch: decide when no saved test login exists; failed saved logins and other sign-in trouble require asking. Checked by review."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/app-check.mjs, checkBrief(): the leave instruction names accounts without saved logins, excludes failed saved logins, and directs remaining cases to ask. Checked by review."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0715-tests.txt reports 266 passing tests and three skipped. Its sole failure comes from incorrectly passing SKILL.md to Node as a test file (ERR_UNKNOWN_FILE_EXTENSION), not a failing existing test. No tests or leave-action implementation changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "/tmp/speck-0715-tests.txt",
        "issue": "The builder says all related tests pass, but the submitted run exits with a failure because it tries to execute the Markdown skill as a test.",
        "suggested_fix": "Run speck test --files with the related test/*.test.mjs files rather than the changed source and skill paths, and report the resulting totals accurately.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The instructions now distinguish missing saved logins from sign-in failures: missing logins leave the check for the user, while failures prompt a question. The leave action itself is unchanged. Related tests passed; the reported failure was caused by trying to execute a Markdown file as a test."
  }
}
```

</details>
