---
id: "0570"
title: "Have doctor say whether the commit check is on"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-have-doctor-say-whether-the-commit-check-is-on.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:08:44.446Z"
approved: "2026-11-08T23:14:47.554Z"

---
# 0570 · Have doctor say whether the commit check is on

**Status:** 👍 approved

## Problem
`speck init` says only once, as it runs, whether it installed the private-words check for commits (0550). A project set up before 0.21.0, or one whose pre-commit hook was later replaced, silently has no check, and you may think commits are protected when they aren't.

## Outcome
`speck doctor` says whether the commit check is installed, and if not, why and what to do.

## Acceptance criteria
1. `speck doctor` has a line saying the commit check is on when the repository's pre-commit hook is speck's (the one `speck init` writes).
2. When there's no pre-commit hook, the line says the check is off and to run `speck init` again to add it.
3. When the pre-commit hook isn't speck's, or `core.hooksPath` points git at another hooks folder, the line says the check is off and which of those is why, without telling you to replace your own hook.
4. The line is a warning (`!`), never a failure (`✗`), so it doesn't change `speck doctor`'s exit code.
5. No test that passed before this change fails.

## Out of scope
- Installing or repairing the hook from `speck doctor`.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- From 0550's builder note. Open question there, decided here: a warning, not a failure, as a user with their own hook chose that.
- Today: the hook and its marker are in `scripts/commit-check.mjs` (`HOOK`, `MARKER`, `installCommitHook`); `speck doctor`'s checks are `doctorChecks` in `scripts/install.mjs`.
- Relies on git's `core.hooksPath` setting and the default `.git/hooks/pre-commit` location, as 0550 already does.
- Failing before this build: none
- Self-check: a hook git can't run (not executable) isn't reported as on; a pre-commit path that can't be read says off instead of throwing; no line outside a git repository, as the repository check already fails there.

## In plain words
`speck doctor` now tells you whether commits are being checked for your private words. If they aren't, it warns you, says why and what to do, and speck doesn't count that as a failure. If you have your own commit hook, speck leaves it alone and tells you how to add the check to it. To see it, run `speck doctor` in any project and look for the line starting "Commit check". Worth knowing: a project that points git at its own hooks folder always shows as off, the same rule setup uses.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 94,334
- Elapsed since build started: 6 min
- Changed lines: 51 (limit 5000)
Known limit: any `core.hooksPath` counts as off, as in `speck init`, even one pointing at the repository's own hooks folder. No follow-ups went to the inbox.

<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "636a93510bd451bb910e3d703e556b1c21e98243",
    "session": "fresh",
    "thread_id": "01a1bd70-d58c-7842-968e-e97a23024dc8",
    "builder_response": "- Tests run: test/doctor-commit-check-0570.test.mjs and, via `speck test --related`, every existing test file naming scripts/install.mjs or scripts/commit-check.mjs (test/commit-check-0550.test.mjs and the others it listed), plus the commands.checks files.\n- First round. No test changed outside this ticket's new file.\n- `core.hooksPath` being set at all counts as off, the same rule `speck init` uses (shared `findHook`), so doctor and init agree.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 93627,
      "cached_input_tokens": 55808,
      "cache_write_input_tokens": 0,
      "output_tokens": 707,
      "reasoning_output_tokens": 68
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37819,
      "cached": 55808,
      "write": 0,
      "output": 707
    },
    "cost_usd": 0.0882888,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:14:38.094Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/commit-check.mjs commitCheckState recognises speck's marker and checks executability. Passing AC1 tests cover installed hooks, older copies and linked worktrees."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "commitCheckState reports a missing hook as off and recommends running speck init again. The AC2 test exercises this case and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "findHook distinguishes an existing custom hook from core.hooksPath and provides advice to call the check without replacing the hook. Three passing AC3 tests cover these states and precedence."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/install.mjs marks off states with warn; printChecks prints ! and excludes warnings from failure status. The passing AC4 test checks printed output and unchanged exit codes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded test output confirms 260 passed, 3 skipped and no failures across 263 tests. Existing tests were not weakened, and the implementation change is limited to hook detection and doctor reporting."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Doctor now reports whether the commit check is on and explains how to address an off state while respecting custom hooks. Warnings leave its exit code unchanged. Tests cover the requested behaviour and relevant edge cases; no blocking concerns found."
  }
}
```

</details>
