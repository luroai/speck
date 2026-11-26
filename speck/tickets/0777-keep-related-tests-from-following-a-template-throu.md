---
id: "0777"
title: "Keep related tests from following a template through the panel's test support"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-26-keep-related-tests-from-following-a-template-through-panel-support.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:48:45.628Z"
approved: "2026-11-26T23:57:33.441Z"

---
# 0777 · Keep related tests from following a template through the panel's test support

**Status:** 👍 approved

## Problem
`speck test --related` brings in every test that imports `test/support/panel.mjs` whenever any template that file can read changes. A change to the factory floor chose 533 test files, and 0766's build 625, so a build's related run outlasts the builder's 10-minute shell limit.

## Outcome
A changed template brings in only the tests that load that template.

## Acceptance criteria
1. A change to `templates/floor.html` alone brings in the tests that load the factory floor, and not the panel tests that never load it.
2. A change to a file the panel's page loads still brings in the tests that load the panel (0696).
3. A change to `test/support/panel.mjs` itself still brings in every test that imports it.
4. No test that passed before this change fails.

## Out of scope
- How related tests are found for code that isn't a template.

## Notes
- From 0767's build. The earlier fix (`speck/ideas/done/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md`) didn't cover a support file that reads any page by name.
- Failing before this build: none
- Self-check: a quote inside a regex literal (as in `/(['"])x/`) hid the comment after it, so regex literals are now kept whole; added a test for comment stripping.

## In plain words
A build that changes the factory floor's page now runs only the handful of tests that use the floor before review, not nearly every panel test as well. Before, it picked around 485 test files and could run past the builder's 10-minute limit; now it picks 8. Changes to the panel's own page, script and styles still run every panel test. To see it, change the floor's page on a branch and run `speck test --related`: the list it prints is short. Worth watching: this only ignores mentions in notes in the shared test helpers, and only for page files, so a helper that really loads a page must still name it in its code.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 ownOf strips comments when matching every changed file, including non-template code.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 330,833
- Elapsed since build started: 9 min
- Changed lines: 43 (limit 5000)
- Follow-ups:
  - To the inbox: `speck/ideas/2026-11-26-bring-in-panel-tests-for-speck-face-and-mood-changes.md`. A change to `templates/speck-mood.js` or `templates/speck-face.js` doesn't bring in the panel tests, and 0696's in-repo test passes only because untracked changes carry over between its branches in the measured repo.
  - Not saved: the comment stripping in `code()` is a heuristic; a regex literal holding an unescaped `/*` inside a [class], or a backtick, could hide the code after it. Only templates' matching uses it.

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
    "reviewed_sha": "51598eb67f759148886e11d00d59a659b587fb9a",
    "session": "fresh",
    "thread_id": "01a21a48-71f2-7423-83ed-e67a831dc499",
    "builder_response": "- Tests run: `speck test --related test/related-0777.test.mjs` (151 files: the ticket's own, the other related-* tests and every test naming docs/brief.md or scripts/related.mjs); 1697 pass, 0 fail.\n- Cause: test/support/panel.mjs names `floor.html` only in a comment (fakePage's doc), so a floor.html change counted it as loading the floor and brought in every test importing panel.mjs (485 picked). With comments stripped from support modules (`code()` in scripts/related.mjs), a floor.html change picks 8 tests: those that import test/support/floor.mjs or name floor.html themselves.\n- AC4 is checked by the related run above; `speck ship` runs the full suite.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 186579,
      "cached_input_tokens": 135040,
      "cache_write_input_tokens": 0,
      "output_tokens": 824,
      "reasoning_output_tokens": 37
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51539,
      "cached": 135040,
      "write": 0,
      "output": 824
    },
    "cost_usd": 0.124822,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T23:55:12.183Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/related-0777.test.mjs AC1 tests exercise both a fixture and this repository: floor.html selects floor tests without unrelated panel tests. Both passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "AC2 tests exercise panel HTML, JavaScript and styles, checking that panel support importers remain selected. Both passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "AC3 checks changes to the support module itself in a fixture and this repository; all direct importers remain selected. Passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Recorded related run: 1697 passed, 0 failed, 3 skipped. Existing tests were not weakened. The whole suite remains the shipping check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/related.mjs:118",
        "issue": "ownOf strips comments when matching every changed file, including non-template code. This violates the explicit exclusion of changes to related-test discovery for non-template code. For example, test/support/serve-front.mjs names scripts/serve-front.mjs only in its opening comment; that association is now removed.",
        "suggested_fix": "Use comment-stripped support text only for changed templates, preserving the previous matching behaviour for other files. Add a regression test for a non-template file named only in a support module's comment, and narrow the documentation accordingly.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change successfully limits factory-floor template changes to the relevant tests, while retaining panel coverage. The reported tests pass. Before approval, narrow the implementation: it also changes test selection for non-template code, which this ticket explicitly excludes."
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
    "reviewed_sha": "078d6fa8debdf68e95308066d92bdc136f540f3b",
    "session": "continued",
    "thread_id": "01a21a48-71f2-7423-83ed-e67a831dc499",
    "builder_response": "- Tests run: test/related-0777.test.mjs test/related-0437.test.mjs test/related-0447.test.mjs test/related-0482.test.mjs test/related-0676.test.mjs test/related-0696.test.mjs (189 pass, 0 fail).\n- F1: fixed. `ownOf` in scripts/related.mjs now matches comment-stripped text only for a changed file under `templates/`; every other file is matched against the module's whole text as before. Added `0777 F1` in test/related-0777.test.mjs: a support module that names scripts/serve.mjs only in its opening comment still brings in the test that imports it. Narrowed the comments in scripts/related.mjs and the sentence in docs/brief.md to files under `templates/`.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 329556,
      "cached_input_tokens": 256128,
      "cache_write_input_tokens": 0,
      "output_tokens": 1277,
      "reasoning_output_tokens": 37
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 21889,
      "cached": 121088,
      "write": 0,
      "output": 453
    },
    "cost_usd": 0.0604168,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T23:57:01.132Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/related-0777.test.mjs: both AC1 tests passed, checking fixture and repository selection for floor.html, including exclusion of unrelated panel tests."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/related-0777.test.mjs: both AC2 tests passed, verifying panel HTML, script and style changes still select panel support importers."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/related-0777.test.mjs: AC3 passed, checking that changes to the support module itself retain every direct importer in both fixture and repository tests."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Latest recorded run: 189 passed, 0 failed, 3 skipped, covering the ticket and existing related-test regression files. The earlier broader related run also had no failures; existing tests remain unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/related.mjs:119",
        "issue": "Previously, comment stripping changed matching for non-template files. Resolved: ownOf now uses stripped text only for files under templates/, preserving whole-text matching elsewhere.",
        "suggested_fix": "Implemented and covered by the passing '0777 F1' regression test for a non-template file named only in a support comment.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Factory-floor template changes now select the relevant tests without pulling in unrelated panel tests. Panel coverage and non-template matching are preserved. The scope issue is fixed, all reviewed criteria pass, and no blocking concerns remain."
  }
}
```

</details>
