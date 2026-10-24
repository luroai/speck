---
id: "0491"
title: "Test documents' facts in the brief, not the README"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0488"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T20:02:16.837Z"

---
# 0491 · Test documents' facts in the brief, not the README

**Status:** 🔍 reviewing

## Problem
speck's rule that a fact in a document gets a test has left 58 test files reading the README. Each release ticket checks the README names that release's settings, and those checks never retire, so the README's structure is pinned: cutting or rewording it means moving dozens of tests. The README is speck's pitch, not its reference; `docs/brief.md` is the reference.

## Outcome
Facts are tested in the brief, and the README is checked by review, apart from the few things in it that break installs or the page if they're wrong.

## Acceptance criteria
1. The ticket skill, `docs/brief.md`'s "Criteria about documents" and the reviewer prompt say: a criterion about a fact in the README ends with `(checked by review)`, except the setup prompt, the status line's version, the demo pictures and whether its links resolve, which are tested. A fact in any other document, such as the brief, `docs/` or the changelog, is still tested.
2. No test file reads `README.md` except those that check the setup prompt, the status line's version, the `<picture>` block and its images, and that the README's links and anchors resolve. Checked by a test that lists every test file reading `README.md` against that allowed list.
3. Every setting name and command a removed README check looked for is checked in `docs/brief.md` instead, and the brief is given any it doesn't name yet. Checks that looked only for README wording, such as which section names a clever bit, are dropped.
4. No test that passed before this change fails.

## Out of scope
- The README's text (0489, 0490).
- Tests of facts in the brief, the changelog or `docs/releases/`, which stay.

## Notes
- Asked for by the user on 2026-10-24, after finding that 0490's cuts would mean moving dozens of README tests: "can you clean this mess up?"
- Today: the rule is in `skills/speck-ticket/SKILL.md` (step 4, Acceptance criteria), `docs/brief.md` ("Criteria about documents") and `templates/reviewer-prompt.md` (point 2). `skills/speck-build/SKILL.md` names only `(checked by review)` criteria.
- Measured on 2026-10-24: 58 test files read `README.md`, most of them `release-*.test.mjs` (settings each release added) and `readme-0250.test.mjs` (a command or setting for each step and clever bit). Keep `readme-0089` (setup prompt), `readme-0249` and `readme-0306` (pictures), and the status-line checks in the release tests.
- Waits for 0488, which changes the README's and the brief's Foreman wording and the tests that check it.
- Failing before this build: none
- Self-check: the brief's own AC1 check pinned its wording, which 0267's rewording caught: it now checks only the names the brief's paragraph gives, and the skill's and the prompt's wording, which are instructions.
- Also changed, beyond the three files AC1 names: the build skill's two lines on testing a document's facts, so a build doesn't add README tests the ticket skill now marks `(checked by review)`.
- docs-0267 now rewords and breaks the brief and the release notes rather than the README.

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
    "reviewed_sha": "56970cf398f6789a183d0a8232f152ae63b68f53",
    "session": "fresh",
    "thread_id": "01a16f8d-6d44-7f52-8b9d-be5de2fb227b",
    "builder_response": "- Tests run: speck test --related test/docs-0491.test.mjs test/readme-links-0491.test.mjs test/agents-0398.test.mjs test/build-0116.test.mjs test/builder-model-0311.test.mjs test/builder-switch-0293.test.mjs test/config-0386.test.mjs test/core.test.mjs test/docs-0267.test.mjs test/docs-0488.test.mjs test/foreman-answer-0318.test.mjs test/foreman-fix-0286.test.mjs test/foreman-provider-0392.test.mjs test/keys-0389.test.mjs test/licence-0090.test.mjs test/lint-0121.test.mjs test/luro-0082.test.mjs test/panel-0133.test.mjs test/panel-0451.test.mjs test/pr-ship-0296.test.mjs test/private-words-0084.test.mjs test/product-0068.test.mjs test/providers-0401.test.mjs test/readme-0089.test.mjs test/readme-0250.test.mjs test/release-0226.test.mjs test/release-0282.test.mjs test/release-0297.test.mjs test/release-0298.test.mjs test/release-0394.test.mjs test/repo-speck-0122.test.mjs test/review-0280.test.mjs test/review-cursor-0332.test.mjs test/review-provider-0390.test.mjs test/run-0194.test.mjs test/run-provider-0391.test.mjs test/settings-agents-0399.test.mjs test/settings-builder-effort-0402.test.mjs test/settings-roles-0400.test.mjs test/setup-0088.test.mjs \n  (the ticket's own test files, every existing test file it changed, and every test file that names a file this branch changed: 1241 tests, 0 failing)\n- Notes for the reviewer:\n  - AC2's check (test/docs-0491.test.mjs) finds README.md named in a string at the repo's root in any test or support module, leaving out comments, object keys (files written into a made-up repo) and lines marked \"a made-up repo's README\". It compares the result both ways with an allowed list that gives each file's reason.\n  - Allowed files: the setup prompt (readme-0089, readme-0250 AC1, setup-0107, install-0253), the pictures (readme-0249), the new link check (readme-links-0491), and the release tests, which keep only their status-line version and setup-prompt checks. install-0253 and the release tests also keep their checks that no README install command names a fixed release, since a wrong one breaks installs.\n  - docs-0267 used to reword and break the README. It now does the same to the brief and the release notes: once a heading is reworded, a link to it rightly breaks, and the README's tests no longer check wording.\n  - readme-0256 is deleted: its commands are now checked in the brief, and its links by the new link check.\n  - The build skill's two lines on testing a document's facts were changed to match the new rule, so a build doesn't add README tests that the ticket skill now marks (checked by review).\n  - review-wait-0384 failed once (a timing check) in an earlier related run and passed 3 times out of 3 on its own. The run attached here is clean.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 205577,
      "cached_input_tokens": 132864,
      "cache_write_input_tokens": 0,
      "output_tokens": 705,
      "reasoning_output_tokens": 74
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T20:15:25.889Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The ticket skill, brief's 'Criteria about documents' paragraph and reviewer prompt state the four README exceptions and retain testing for other documents. The two 0491 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "test/install-0253.test.mjs still checks the separate terminal install command and scans all README install commands. Release tests such as release-0282 also scan the whole README for fixed-release commands. These exceed AC2's four exceptions, despite being admitted by docs-0491's allowed list."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/docs-0491.test.mjs MOVED checks migrated commands and settings in the brief; existing mixed-document tests retain their brief checks. The AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied related-test run reports 1241 tests, zero failures and three skips. No production code changed; the whole-suite check remains with shipping."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/docs-0491.test.mjs",
        "issue": "The allowed list explicitly permits checks beyond AC2's exceptions. install-0253 still pins a separate terminal command, and release tests scan the entire README for fixed-release commands. The ticket's Notes acknowledge this expansion, but its acceptance criteria and the new instructions allow only the setup prompt, status version, pictures and resolving links.",
        "suggested_fix": "Remove the README terminal-command check and restrict whole-README install checks to the extracted setup prompt. Tighten the allowed-list descriptions accordingly, retaining checks of install commands in the brief and other reference documents.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The migration largely works, and the reported tests pass. However, some remaining tests still constrain README content beyond the four exceptions the ticket permits. Restrict those checks before approval."
  }
}
```

</details>
