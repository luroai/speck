---
id: "0722"
title: "Test the README's terminal install command"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-test-the-readme-s-terminal-install-command.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:40:52.880Z"
approved: "2026-11-24T15:14:15.218Z"
finished: "2026-11-24T16:27:27.967Z"

---
# 0722 · Test the README's terminal install command

**Status:** ✅ done

## Problem
The README's command to run in a terminal (under Without an agent) isn't tested, since 0491 kept only four README facts under test. A wrong command there breaks installs for anyone who skips the setup prompt.

## Outcome
The README's terminal install command is one of the tested README facts.

## Acceptance criteria
1. A test fails if any `npx` command for speck in the README, the terminal one under Without an agent included, differs from the one in the README's setup prompt.
2. The brief's "Criteria about documents", the speck-ticket skill and the reviewer prompt each list the README's terminal install command among the README facts that are tested.
3. No test that passed before this change fails.

## Out of scope
- Testing other README facts.

## Notes
- The rule text is in `docs/brief.md` (Criteria about documents), `skills/speck-ticket/SKILL.md`, `templates/reviewer-prompt.md`, and `test/docs-0491.test.mjs` (`TESTED`, `ALLOWED`). The setup prompt's command is tested in `test/install-0253.test.mjs`.
- Failing before this build: none
- Self-check: no changes
- Note: commands.checks' tmp-cleanup AC1 AC2 fails on this Node: the fixture spawn's default reporter prints ℹ fail 2, not # fail 2. Not caused by this ticket; leave for a fix ticket.

## In plain words
The command under Without an agent in the README is now checked so it stays the same install command as the setup prompt. If someone changes that terminal command — the package, `init`, or extra arguments — the tests fail. The rules that say which README facts are tested now include that terminal install command too.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The matcher compares package references rather than complete commands.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 322,933
- Elapsed since build started: 33 min
- Changed lines: 10 (limit 5000)
Follow-ups:
- Fix tmp-cleanup for Node's default reporter (`ℹ fail 2` vs `# fail 2`) → inbox `speck/ideas/2026-11-24-fix-tmp-cleanup-for-nodes-default-reporter.md`

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
    "reviewed_sha": "0f7835cedcd929850267a632f2b1dbf9adc0c425",
    "session": "fresh",
    "thread_id": "01a20e1b-655d-7fe2-8347-50cd0dcdda46",
    "builder_response": "- Tests run: test/readme-0722.test.mjs test/docs-0491.test.mjs (plus commands.checks)\n- Round 1: AC1 adds `readmeNpxProblems` in `test/support/release.mjs` and tests in `test/readme-0722.test.mjs` so any speck `npx` command in the README that differs from the setup prompt's fails. AC2 adds \"terminal install command\" to the brief's Criteria about documents, the ticket skill, the reviewer prompt, and docs-0491's `TESTED` / `ALLOWED` (and the build skill, so builders get the same list). AC3 is for ship.\n- The only failing test in this run is commands.checks' `tmp-cleanup` AC1 AC2: Node's default reporter now prints `ℹ fail 2`, and that check still looks for `# fail 2`. It fails the same way with this ticket's changes reverted; not caused by this change. All 0722 and 0491 tests pass.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 110608,
      "cached_input_tokens": 70400,
      "cache_write_input_tokens": 0,
      "output_tokens": 778,
      "reasoning_output_tokens": 11
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 40208,
      "cached": 70400,
      "write": 0,
      "output": 778
    },
    "cost_usd": 0.095236,
    "saved_at": "2026-11-24T15:10:32.909Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/support/release.mjs: speckNpx captures only through the package reference, excluding command arguments. Read-only mutation checks changing the terminal command's `init` to `detect`, or removing `init`, both returned no problems."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The brief's Criteria about documents, skills/speck-ticket/SKILL.md and templates/reviewer-prompt.md all list the terminal install command. Passing 0722 AC2 and updated 0491 tests cover these facts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The supplied run passes all 0722 and 0491 tests. The sole failure concerns the unchanged tmp-cleanup reporter assertion, unrelated to this change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/release.mjs",
        "issue": "The matcher compares package references rather than complete commands. The terminal instruction can change to `npx 'github:luroai/speck#semver:*' detect`, or lose `init` entirely, and the new check still passes. These commands differ from the setup prompt and no longer perform the documented installation.",
        "suggested_fix": "Compare the complete speck command, including its subcommand and arguments. Add mutation tests showing that changing or removing the terminal command's `init` is rejected.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The rules now correctly include the terminal install command among tested README facts. However, the new test checks only the package reference: it still passes when the terminal command stops installing speck. Fix that gap before merge."
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
    "reviewed_sha": "9581f6c5a1a85749ce24895ffad35e6d08701948",
    "session": "continued",
    "thread_id": "01a20e1b-655d-7fe2-8347-50cd0dcdda46",
    "builder_response": "- Tests run: test/readme-0722.test.mjs test/docs-0491.test.mjs (plus commands.checks)\n- F1: fixed. `speckNpx` in `test/support/release.mjs` now includes the subcommand (e.g. `init`). Added `0722 AC1: the check fails when the terminal command's init is changed or removed` covering `init` → `detect` and `init` removed.\n- The only failing test in this run remains commands.checks' tmp-cleanup AC1 AC2 (Node default reporter `ℹ fail 2` vs `# fail 2`); unrelated to this change. All 0722 and 0491 tests pass.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 207448,
      "cached_input_tokens": 158208,
      "cache_write_input_tokens": 0,
      "output_tokens": 1477,
      "reasoning_output_tokens": 11
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9032,
      "cached": 87808,
      "write": 0,
      "output": 699
    },
    "cost_usd": 0.0338348,
    "saved_at": "2026-11-24T15:12:23.052Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/support/release.mjs now captures the subcommand, but still ignores subsequent arguments. A read-only mutation changing the terminal command to `npx 'github:luroai/speck#semver:*' init --help` returned no problems."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "docs/brief.md's Criteria about documents, skills/speck-ticket/SKILL.md and templates/reviewer-prompt.md each name the terminal install command among tested README facts. Passing 0722 AC2 and 0491 tests cover this."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The supplied run passes all 0722 and 0491 tests. Its sole failure remains the unrelated, unchanged tmp-cleanup reporter assertion."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/release.mjs",
        "issue": "The fix catches changing or removing `init`, but still does not compare the complete command. Adding `--help` after `init` passes the check despite differing from the setup prompt and changing the command's behaviour.",
        "suggested_fix": "Capture and compare the complete command, including arguments after the subcommand, using Markdown command boundaries. Add a mutation test for an added argument such as `init --help`.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The fix catches a changed or missing install subcommand, but still overlooks added arguments. The documentation updates are correct and the relevant tests pass; the command comparison needs one further fix."
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
    "reviewed_sha": "f7f7a12e312e638e33537f7ce6e3fea61eab54a7",
    "session": "continued",
    "thread_id": "01a20e1b-655d-7fe2-8347-50cd0dcdda46",
    "builder_response": "- Tests run: test/readme-0722.test.mjs test/docs-0491.test.mjs (plus commands.checks)\n- F1: fixed. `speckNpx` now captures through the Markdown command boundary (backtick or newline), so subcommand and arguments are compared. The mutation test now also covers `init --help`.\n- The only failing test in this run remains commands.checks' tmp-cleanup AC1 AC2 (Node default reporter); unrelated to this change. All 0722 and 0491 tests pass.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 320823,
      "cached_input_tokens": 263808,
      "cache_write_input_tokens": 0,
      "output_tokens": 2110,
      "reasoning_output_tokens": 11
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7775,
      "cached": 105600,
      "write": 0,
      "output": 633
    },
    "cost_usd": 0.03244,
    "saved_at": "2026-11-24T15:13:43.826Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/release.mjs now compares commands through the backtick or newline, including subcommands and arguments. Passing 0722 AC1 tests cover mismatched versions, changed or missing init, and added arguments. Independent read-only checks confirmed the README passes and all three F1 mutations fail."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "docs/brief.md's Criteria about documents, skills/speck-ticket/SKILL.md and templates/reviewer-prompt.md list the terminal install command among tested README facts. Passing 0722 AC2 and updated 0491 tests cover these facts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All 0722 and 0491 tests pass in the supplied run. The sole failure remains the unrelated, unchanged tmp-cleanup reporter assertion; the change shows no regression."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/release.mjs",
        "issue": "The matcher previously omitted subcommands and subsequent arguments from command comparisons.",
        "suggested_fix": "Completed: compare through Markdown command boundaries and cover changed, removed and additional arguments with mutation tests.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The README's terminal install command is now checked against the setup prompt, including its arguments. The rules consistently permit this check, and the relevant tests pass. The previous blocking issue is resolved."
  }
}
```

</details>
